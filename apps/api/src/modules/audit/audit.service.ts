import type { Queue as BullQueue } from "bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { MAX_UPLOAD_MB, QUEUES } from "@xennic/shared";
import { AppConfigService } from "../../config/app-config.service.js";
import type { UploadBillDto } from "./dto/upload-bill.dto.js";
import { PrismaService } from "../../infra/prisma/prisma.service.js";

export interface UploadedBillFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  public constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    @InjectQueue(QUEUES.billOcr) private readonly ocrQueue: BullQueue,
    @InjectQueue(QUEUES.billAnalyze) private readonly analyzeQueue: BullQueue,
  ) {}

  /** POST /audit/upload — ذخیره‌ی فایل و ورود به صف OCR (نوت ۳ §۴) */
  public async upload(userId: string, file: UploadedBillFile | undefined, meta: UploadBillDto) {
    if (!file?.buffer) throw new BadRequestException("فایل قبض ارسال نشده است (فیلد `file` الزامی است)");
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      throw new BadRequestException(`حجم فایل نباید بیشتر از ${MAX_UPLOAD_MB} مگابایت باشد`);
    }
    if (!["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) {
      throw new BadRequestException("فرمت مجاز: PDF یا تصویر PNG/JPEG/WEBP");
    }

    // کلید فایل نسبت به UPLOAD_DIR ذخیره می‌شود تا انتقال به Object Storage بعدی آسان باشد
    const safeName = `${Date.now()}-${file.originalname.replace(/[^\w.-]+/gu, "_")}`;
    const storageKey = path.posix.join(userId, safeName);
    const absolutePath = path.resolve(this.config.uploadDir, storageKey);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, file.buffer);

    const bill = await this.prisma.client.bill.create({
      data: {
        userId,
        subscriptionId: meta.subscriptionId,
        periodLabel: meta.periodLabel,
        tariffType: meta.tariffType ?? "INDUSTRIAL",
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey,
        status: "QUEUED",
      },
      select: { id: true, status: true, fileName: true },
    });

    const job = await this.ocrQueue.add("extract", { billId: bill.id, storageKey });
    this.logger.log(`قبض ${bill.id} در صف OCR با job ${job.id}`);

    return { ...bill, jobId: job.id, queue: QUEUES.billOcr };
  }

  /** POST /audit/analyze — درخواست تحلیل (اگر متن OCR موجود باشد هم‌زمان محاسبه می‌شود) */
  public async analyze(userId: string, billId: string, withAi: boolean, model?: string) {
    const bill = await this.prisma.client.bill.findFirst({ where: { id: billId, userId } });
    if (!bill) throw new NotFoundException("قبض موردنظر یافت نشد");

    if (!bill.rawText) {
      const job = await this.analyzeQueue.add("analyze", { billId, withAi, model });
      return { status: "QUEUED" as const, jobId: job.id, billId };
    }

    const analysis = await this.prisma.client.billAnalysis.upsert({
      where: { billId },
      update: { status: "RUNNING" },
      create: { billId, status: "RUNNING" },
      select: { id: true, status: true },
    });

    if (withAi) {
      await this.analyzeQueue.add("recommend", { billId, analysisId: analysis.id, model });
    }
    return { ...analysis, billId };
  }

  /** GET /audit/history — آرشیو قبوض و گزارش‌ها */
  public async history(userId: string, page: number, pageSize: number) {
    const [rows, total] = await this.prisma.client.$transaction([
      this.prisma.client.bill.findMany({
        where: { userId },
        orderBy: { uploadedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          fileName: true,
          tariffType: true,
          status: true,
          periodLabel: true,
          uploadedAt: true,
          analysis: { select: { id: true, totalAmount: true, penaltyAmount: true } },
        },
      }),
      this.prisma.client.bill.count({ where: { userId } }),
    ]);

    return { items: rows, meta: { page, pageSize, total } };
  }
}
