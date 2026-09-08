import { Injectable, Logger } from "@nestjs/common";
import { PDFParse } from "pdf-parse";
import type { Prisma } from "@xennic/database";
import {
  BILL_FINDING_CODES,
  billIngestSchema,
  billLineItemSchema,
  billTextExtractSchema,
  type BillAnalysisResult,
  type BillIngestInput,
  type BillLineItem,
  type BillTextExtract,
} from "@xennic/shared";
import { PrismaService } from "../../infra/prisma/prisma.service.js";
import { AppConfigService } from "../../config/app-config.service.js";
import { AiService } from "../ai/ai.service.js";

const log = new Logger("BillService");

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const DIGIT_TABLE: Record<string, string> = {};
for (let i = 0; i < 10; i++) {
  DIGIT_TABLE[PERSIAN_DIGITS[i] ?? ""] = String(i);
  DIGIT_TABLE[ARABIC_DIGITS[i] ?? ""] = String(i);
}

function normalizeDigits(text: string): string {
  let out = "";
  for (const ch of text) {
    out += DIGIT_TABLE[ch] ?? ch;
  }
  return out.replace(/٫/g, ".").replace(/#/g, ",");
}

function parseNumericToken(raw: string): number | null {
  const normalized = normalizeDigits(raw.trim());
  const candidate = normalized
    .replace(/[ریالtomans?تومان,]+/gi, "")
    .replace(/[{}\\\\]/g, "")
    .replace(/[^\d.]/g, "")
    .replace(/^([^.]*\.[^.]*)[.].*/, "$1");
  const parts = candidate.split(".");
  if (parts.length > 2) return null;
  const joined = parts.join(".");
  const parsed = Number(joined);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function extractLineItems(text: string): BillLineItem[] {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 0);
  const items: BillLineItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;
    const line = normalizeDigits(rawLine);

    if (/^[\d\s,.]+$/.test(line)) continue;

    const tokens = line.split(/[;\s،,;]+/).map((t) => t.trim()).filter((t) => t.length > 0);
    const numbers: { raw: string; value: number }[] = [];
    for (const token of tokens) {
      if (!token) continue;
      const parsed = parseNumericToken(token);
      if (parsed !== null) {
        numbers.push({ raw: token, value: parsed });
      }
    }
    if (numbers.length === 0) continue;

    const hasCurrency = /\b(تومان|tomans?|ریال|rial|amount)\b/i.test(line);
    const amount = hasCurrency ? numbers.sort((a, b) => b.value - a.value)[0]?.value ?? null : null;

    let unit: string | null = null;
    if (/\b(kwh|kilowatt|kw)\b/i.test(line)) unit = "kWh";
    else if (/\b(kw|kilowatt)\b/i.test(line)) unit = "kW";
    else if (/\b(m3|م3|cubic|meter)\b/i.test(line)) unit = "m3";
    else if (/\b(ner|newton)?/i.test(line)) unit = "NER";

    let description = line.replace(/\d[\d,]*(?:\s?(?:تومان|tomans?|ریال|rial))?/gi, "").trim();
    if (!description && unit) description = `پیش‌فرض ${unit}`;

    const item = {
      description: description.slice(0, 200) || "آیتم کلی",
      unit: unit ?? "مبلغ",
      value: numbers[0]?.value ?? 0,
      amountToman: amount,
      sourceLine: i + 1,
      confidence: hasCurrency ? 0.85 : 0.55,
    };
    if (billLineItemSchema.safeParse(item).success) {
      items.push(item as BillLineItem);
    }
  }

  return items;
}

function applyInternalRules(result: BillAnalysisResult): BillAnalysisResult {
  const findings: BillAnalysisResult["internalFindings"] = [];
  const { lineItems, totalAmountToman, estimatedVatPercent, vatIncludedAmount } = result;

  if (estimatedVatPercent !== undefined && vatIncludedAmount !== undefined && totalAmountToman > 0) {
    const diff = Math.abs(estimatedVatPercent - 10);
    if (diff > 3) {
      findings.push({
        code: BILL_FINDING_CODES.VAT_10_PERCENT_MISMATCH,
        severity: estimatedVatPercent > 13 ? "CRITICAL" : "WARNING",
        titleFa: `نسبت VAT شبیه‌سازی‌شده (${estimatedVatPercent.toFixed(1)}%) با معیار استاندارد (۱۰%) متفاوت است`,
        descriptionFa: `بر اساس آیتم‌های استخراج‌شده، سهم VAT تخمین‌زده‌شده ${estimatedVatPercent.toFixed(1)}% است. برای تایید، بررسی دقیق تعرفه‌ها و یا ارسال به هوش مصنوعی پیشنهاد می‌شود.`,
        sourceLine: undefined,
      });
    }
  }

  const hasDemandPenalty = lineItems.some(
    (it) => /demand|band|بار연결/i.test(it.description) || /جریمه/i.test(it.description),
  );
  const hasReactivePenalty = lineItems.some(
    (it) => /reactive|cos phi|ضریب|واکنشی/i.test(it.description),
  );

  if (hasDemandPenalty) {
    findings.push({
      code: BILL_FINDING_CODES.DEMAND_PENALTY_PRESENT,
      severity: "INFO",
      titleFa: "جریمه‌ی دیماند (برد) در قبض مشاهده می‌شود",
      descriptionFa: "مشترک industrial/تجاری ممکن است با ردیف Band Penalty incur. برای بهینه‌سازی بار توصیه می‌شود.",
      sourceLine: undefined,
    });
  }

  if (hasReactivePenalty) {
    findings.push({
      code: BILL_FINDING_CODES.REACTIVE_PENALTY_PRESENT,
      severity: "INFO",
      titleFa: "جریمه‌ی واکنشی (reactive) در قبض مشاهده می‌شود",
      descriptionFa: "بر اساس استانداردها، وجود reactive penalty نشان‌دهنده‌ی ضریب قدرت پایین است؛ برای بهبود سخت‌افزار توصیه می‌شود.",
      sourceLine: undefined,
    });
  }

  if (lineItems.length > 1 && vatIncludedAmount !== undefined) {
    const sum = lineItems.reduce((acc, it) => acc + (it.amountToman ?? 0), 0);
    const diff = Math.abs(totalAmountToman - sum);
    if (diff > totalAmountToman * 0.02 && totalAmountToman > 0) {
      findings.push({
        code: BILL_FINDING_CODES.SUSPICIOUS_TOTAL_MATH,
        severity: "WARNING",
        titleFa: "تفاوت میان جمع آیتم‌ها و مبلغ نهایی قابل‌توجه است",
        descriptionFa: `جمع آیتم‌ها approx ${sum.toLocaleString("fa-IR")} تومان در حالی که مبلغ نهایی ${totalAmountToman.toLocaleString("fa-IR")} تومان است. بررسی ردیف‌های مخفی/تکمیل یا ارسال به هوش مصنوعی پیشنهاد می‌شود.`,
        sourceLine: undefined,
      });
    }
  }

  if (lineItems.length === 0) {
    findings.push({
      code: BILL_FINDING_CODES.NO_LINE_ITEMS_FOUND,
      severity: "CRITICAL",
      titleFa: "هیچ آیتم ساختاری قابل استخراج در متن یافت نشد",
      descriptionFa: "متن استخراج‌شده seems non‑structural، یا PDF encryption/antibot به extraction مچ داده است. OCR retry یا recombination پیشنهاد می‌شود.",
      sourceLine: undefined,
    });
  }

  return {
    ...result,
    internalFindings: findings,
    needsAiReview: findings.some((f) => f.severity === "CRITICAL" || f.severity === "WARNING"),
  };
}

function estimateVatPercent(result: BillAnalysisResult): number | undefined {
  const { lineItems, totalAmountToman } = result;
  if (lineItems.length === 0 || totalAmountToman <= 0) return undefined;

  const sumPreVat = lineItems.reduce((acc, it) => acc + (it.amountToman ?? 0), 0);
  if (sumPreVat <= 0) return undefined;
  const impliedVat = totalAmountToman - sumPreVat;
  if (impliedVat < 0) return undefined;
  return Number(((impliedVat / totalAmountToman) * 100).toFixed(2));
}

@Injectable()
export class BillService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly ai: AiService,
  ) {}

  public async ingest(input: BillIngestInput) {
    const parsed = billIngestSchema.parse(input);
    log.debug(`ingest bill for userId=${parsed.userId} fileName=${parsed.fileName}`);

    const dataUri = parsed.fileBase64.trim();
    const dataParts = dataUri.match(/^data:[^;]+;base64,(.*)$/);
    const base64 = dataParts?.[1];
    if (!base64) {
      throw new Error("پارامتر fileBase64 باید یک data URI base64 معتبر باشد");
    }
    const binary = Buffer.from(base64, "base64");

    const storageKey = this.storageKey(parsed.userId, parsed.fileName);

    const bill = await this.prisma.client.bill.create({
      data: {
        userId: parsed.userId,
        subscriptionId: parsed.subscriptionId,
        fileName: parsed.fileName,
        mimeType: this.detectMimeType(parsed.fileName),
        sizeBytes: binary.byteLength,
        storageKey,
        status: "QUEUED",
        ocrEngine: "TESSERACT",
      },
    });

    try {
      const textExtract = await this.extractText(binary);
      if (!textExtract.text.trim()) {
        throw new Error("استخراج متن PDF حاصل نکرد. فایل ممکن است تصویری باشد یا امضاف رکاب داده است.");
      }

      await this.prisma.client.bill.update({
        where: { id: bill.id },
        data: { rawText: textExtract.text, status: "RUNNING" },
      });

      const lineItems = extractLineItems(textExtract.text);
      const totalAmountToman = lineItems.reduce((acc, it) => acc + (it.amountToman ?? 0), 0);
      const vatIncludedAmount = totalAmountToman;

      const partial = { lineItems, totalAmountToman, vatIncludedAmount };
      const estimatedVatPercentResult = estimateVatPercent({ ...partial, estimatedVatPercent: undefined, needsAiReview: false, internalFindings: [], aiReviewReason: undefined });

      const result: BillAnalysisResult = {
        ...partial,
        estimatedVatPercent: estimatedVatPercentResult,
        needsAiReview: false,
        internalFindings: [],
        aiReviewReason: undefined,
      };

      const analyzed = applyInternalRules(result);

let aiModel: string | undefined;
      if (analyzed.needsAiReview) {
        try {
          await this.ai.generate(parsed.userId, {
            prompt: this.buildAiPrompt(parsed, analyzed),
            system: "شما متخصص تحلیل قبض برق ایران (تعرفه‌ها، VAT، جریمه‌ها، استانداردهای بین‌المللی) هستید. پاسخ را به فارسی مختصر و ساختاریافته می‌دهید.",
            maxTokens: 1024,
            temperature: 0.2,
            useOwnKey: false,
          });
          aiModel = "gpt-4o";
        } catch (error) {
          log.warn("AI review unavailable; analysis proceeding without AI", error);
          analyzed.needsAiReview = false;
          analyzed.internalFindings.push({
            code: BILL_FINDING_CODES.AI_REVIEW_REQUESTED,
            severity: "WARNING",
            titleFa: "بررسی هوش مصنوعی انجام نشد (خطای سرویس)",
            descriptionFa: "تحلیل به‌صورت داخلی کامل شد اما برخی نکات بدون تایید AI باقی ماند.",
            sourceLine: undefined,
          });
        }
      }

      const analysis = await this.prisma.client.billAnalysis.create({
        data: {
          billId: bill.id,
          status: "SUCCEEDED",
          summaryFa: this.summaryFa(analyzed),
          reportJson: this.toJson(analyzed),
          aiModel: aiModel,
          totalAmount: analyzed.totalAmountToman,
          penaltyAmount: this.penaltyAmount(analyzed),
          demandPenalty: this.demandPenalty(analyzed),
          reactivePenalty: this.reactivePenalty(analyzed),
        },
      });

      for (const finding of analyzed.internalFindings) {
        await this.prisma.client.billFinding.create({
          data: {
            analysisId: analysis.id,
            code: finding.code,
            severity: finding.severity,
            titleFa: finding.titleFa,
            descriptionFa: finding.descriptionFa,
            sourceRef: finding.sourceLine ? String(finding.sourceLine) : undefined,
          },
        });
      }

      await this.prisma.client.bill.update({
        where: { id: bill.id },
        data: { status: "SUCCEEDED", processedAt: new Date() },
      });

      return {
        billId: bill.id,
        analysisId: analysis.id,
        summaryFa: analyzed.internalFindings.length > 0 ? this.summaryFa(analyzed) : "تحلیل داخلی بدون یافته‌ی مهم تکمیل شد.",
        report: analyzed,
      };
    } catch (error) {
      log.error(`bill analysis failed for billId=${bill.id}`, error);
      await this.prisma.client.bill.update({
        where: { id: bill.id },
        data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "internal error" },
      });
      throw error;
    }
  }

  private async extractText(file: Buffer): Promise<BillTextExtract> {
    try {
      const data = await new PDFParse({ data: file }).getText();
      const text = (data.text ?? "").trim();
      const pageCount = data.pages.length;
      return billTextExtractSchema.parse({ text, pageCount });
    } catch (error) {
      const message = error instanceof Error ? error.message : "extraction failed";
      throw new Error(`استخراج متن PDF ناموفق: ${message}`);
    }
  }

  private detectMimeType(fileName: string): string {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf")) return "application/pdf";
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    return "application/octet-stream";
  }

  private storageKey(userId: string, fileName: string): string {
    return `${userId}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
  }

  private summaryFa(result: BillAnalysisResult): string {
    const parts = [];
    if (result.internalFindings.some((f) => f.severity === "CRITICAL")) parts.push("یافته‌های انتقادی مشاهده شد");
    if (result.internalFindings.some((f) => f.severity === "WARNING")) parts.push("نکات Review نیاز به توجه");
    if (result.needsAiReview) parts.push("ارسال به هوش مصنوعی توصیه شد");
    if (!parts.length) parts.push("تحلیل داخلی بدون یافته‌ی مهم");
    return parts.join("؛ ") + ".";
  }

  private penaltyAmount(_result: BillAnalysisResult): number | undefined {
    return undefined;
  }

  private demandPenalty(result: BillAnalysisResult): number | undefined {
    return result.internalFindings.find((f) => f.code === BILL_FINDING_CODES.DEMAND_PENALTY_PRESENT)?.severity === "INFO" ? 0 : undefined;
  }

  private reactivePenalty(result: BillAnalysisResult): number | undefined {
    return result.internalFindings.find((f) => f.code === BILL_FINDING_CODES.REACTIVE_PENALTY_PRESENT)?.severity === "INFO" ? 0 : undefined;
  }

  private toJson(result: BillAnalysisResult): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue;
  }

  private buildAiPrompt(parsed: { userId?: string; subscriptionId?: string; contactEmail?: string }, result: BillAnalysisResult): string {
    const lines = result.lineItems.slice(0, 25).map((it) => `${it.sourceLine ?? "?"}: ${it.description} | unit=${it.unit} | value=${it.value}${it.amountToman !== undefined ? ` Toman=${it.amountToman}` : ""}`).join("\n");
    return [
      "تحلیل هوشمند قبض برق:",
      "",
      "متن استخراج‌شده از قبض:",
      result.lineItems.length > 0 ? lines : "عدم توانایی در استخراج آیتم‌های ساختاری — تحلیل بر اساس متن خالص انجام شود.",
      "",
      "جمع کل به تومان: " + result.totalAmountToman.toLocaleString("fa-IR"),
      result.estimatedVatPercent !== undefined ? "شبیه‌سازی VAT: " + result.estimatedVatPercent.toFixed(2) + "%" : "",
      "",
      "نکات داخلی تاکنون:",
      result.internalFindings.map((f) => `[${f.severity}] ${f.titleFa}`).join("\n"),
      "",
      "سوال: آیا مورد بالا با استانداردهای تایید شده‌ی تعرفه Iranian, VAT ۱۰%, جریمه‌های demand/reactive، و استانداردهای بین‌المللی (IEC, IEEE) سازگاری دارد؟",
      "لطفاً تنها نکات نادرست/موجه را لیست کنید و در صورت وجود، توضیح کوتاه به فارسی.",
    ].filter((s) => s && s.trim()).join("\n");
  }

  public async status(userId: string, query: { page: number; pageSize: number }) {
    return this.prisma.client.billAnalysis.findMany({
      where: { bill: { userId } },
      orderBy: { createdAt: "desc" },
      take: query.pageSize,
      skip: (query.page - 1) * query.pageSize,
      select: {
        id: true,
        billId: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        summaryFa: true,
        _count: { select: { findings: true } },
      },
    });
  }

  public async findings(userId: string, analysisId?: string) {
    return this.prisma.client.billFinding.findMany({
      where: analysisId
        ? { analysis: { bill: { userId }, id: analysisId } }
        : { analysis: { bill: { userId } } },
      include: { analysis: { select: { billId: true, status: true } } },
      orderBy: { id: "desc" },
    });
  }
}
