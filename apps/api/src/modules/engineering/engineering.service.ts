import type { Queue as BullQueue } from "bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import { BadRequestException, Injectable } from "@nestjs/common";
import type {
  CapacitorBankInputDto,
  GeneratorInputDto,
  DemandInputDto,
  ShortCircuitInputDto,
  TransformerInputDto,
  SwitchgearInputDto,
  BusbarInputDto,
  VoltageClassInputDto,
  EarthingInputDto,
  LightingInputDto,
} from "@xennic/shared";
import {
  calculateDemand,
  calculateShortCircuit,
  calculateVoltageDrop,
  CONDUCTIVITY,
  earthElectrodeResistance,
  interiorLighting,
  sizeBusbar,
  sizeCable,
  sizeCapacitorBank,
  sizeGenerator,
  sizeTransformer,
  selectSwitchgear,
  voltageClassInfo,
  ENGINEERING_TOOLS,
  ENGINEERING_CATEGORY_LABEL,
  STANDARD_LIBRARY,
  QUEUES,
  type CableSizingInputDto,
  type PdfExportInputDto,
  type VoltageDropInputDto,
} from "@xennic/shared";
import { PrismaService } from "../../infra/prisma/prisma.service.js";
import type { Prisma } from "@xennic/database";

type Tool = "VOLTAGE_DROP" | "CABLE_SIZING" | "CAPACITOR_BANK" | "GENERATOR_SIZE";

/** ورودی API به قالب kebab است (مطابق سند نوت ۳) و اینجا به enum دیتابیس نگاشت می‌شود */
const TOOL_BY_SLUG: Record<string, Tool> = {
  "voltage-drop": "VOLTAGE_DROP",
  "cable-sizing": "CABLE_SIZING",
  "capacitor-bank": "CAPACITOR_BANK",
  "generator-size": "GENERATOR_SIZE",
  generator: "GENERATOR_SIZE",
};

/**
 * جعبه‌ابزار مهندسی برق (نوت ۳ §۴). هر محاسبه در همان لحظه در دیتابیس ثبت می‌شود
 * تا «دفترچه محاسبات» بعداً بتواند مستند و قابل استناد باشد.
 */
/**
 * ستون‌های `inputs`/`outputs` از نوع Json هستند و Prisma برای آن‌ها `InputJsonValue`
 * می‌خواهد؛ داده‌ی خروجی zod `unknown` است، پس با یک round-trip سریال‌سازی هم نوع
 * قطعی می‌شود هم مقادیر غیرقابل‌سریال‌سازی حذف می‌گردند.
 */
function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

@Injectable()
export class EngineeringService {
  public constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUES.pdfExport) private readonly pdfQueue: BullQueue,
  ) {}

  public async voltageDrop(userId: string, input: VoltageDropInputDto) {
    const result = calculateVoltageDrop({
      system: input.system,
      voltage: input.voltage,
      current: input.current,
      length: input.length,
      conductivity: CONDUCTIVITY[input.conductor],
      powerFactor: input.powerFactor,
      reactancePerKm: input.reactancePerKm,
    });
    await this.persist(userId, "VOLTAGE_DROP", input, result);
    return result;
  }

  public async cableSizing(userId: string, input: CableSizingInputDto) {
    const result = sizeCable({ ...input });
    await this.persist(userId, "CABLE_SIZING", input, result);
    return result;
  }

  public async capacitorBank(userId: string, input: CapacitorBankInputDto) {
    const result = sizeCapacitorBank(input);
    await this.persist(userId, "CAPACITOR_BANK", input, result);
    return result;
  }

  public async generator(userId: string, input: GeneratorInputDto) {
    const result = sizeGenerator(input);
    await this.persist(userId, "GENERATOR_SIZE", input, result);
    return result;
  }

  // ───────────────────────── ابزارهای گسترده (بدون ثبت دفترچه) ─────────────────────────
  // ابزارهای پایین هنوز عضو enum دیتابیس نیستند؛ پس «محاسبه‌ی بی‌وضعیت» هستند و نتیجه را
  // به‌همراه پیوست استاندارد برمی‌گردانند. ثبت در دفترچه پس از افزودن enum در مهاجرت بعدی فعال می‌شود.

  /** محاسبه‌ی بار و دیماند */
  public demand(input: DemandInputDto) {
    return calculateDemand(input);
  }

  /** جریان اتصال کوتاه و تعیین قدرت قطع (IEC 60909) */
  public shortCircuit(input: ShortCircuitInputDto) {
    return calculateShortCircuit(input);
  }

  /** انتخاب ترانسفورماتور توزیع */
  public transformer(input: TransformerInputDto) {
    return sizeTransformer(input);
  }

  /** انتخاب کلید/بریکر */
  public switchgear(input: SwitchgearInputDto) {
    return selectSwitchgear(input);
  }

  /** سایزینگ شینه */
  public busbar(input: BusbarInputDto) {
    return sizeBusbar(input);
  }

  /** طبقه‌بندی ولتاژ و رنج تجهیز */
  public voltageClass(input: VoltageClassInputDto) {
    return voltageClassInfo(input.nominalKv);
  }

  /** مقاومت الکترود زمین */
  public earthing(input: EarthingInputDto) {
    return earthElectrodeResistance({
      soil: { rhoOhmM: input.rhoOhmM, soilId: input.soilId },
      rodLengthM: input.rodLengthM,
      rodDiameterM: input.rodDiameterM,
      rodCount: input.rodCount,
      targetOhm: input.targetOhm,
    });
  }

  /** روشنایی داخلی */
  public lighting(input: LightingInputDto) {
    return interiorLighting(input);
  }

  /** فهرست ابزارهای جعبه‌ابزار (برای فرانت‌اند و مستندات) */
  public toolCatalog() {
    return {
      categories: ENGINEERING_TOOLS,
      categoryLabels: ENGINEERING_CATEGORY_LABEL,
    };
  }

  /** کتابخانه‌ی استانداردهای مرجع (ایرانی و بین‌المللی) */
  public standardLibrary() {
    return Object.values(STANDARD_LIBRARY);
  }

  /** POST /engineering/export-pdf — صدور دفترچه محاسبات (پردازش در صف) */
  public async exportPdf(userId: string, input: PdfExportInputDto) {
    if (input.calculationIds.length === 0)
      throw new BadRequestException("حداقل یک محاسبه برای صدور دفترچه لازم است");
    const tool = TOOL_BY_SLUG[input.tool] ?? "VOLTAGE_DROP";

    const exportRow = await this.prisma.client.engineeringPdfExport.create({
      data: {
        userId,
        status: "QUEUED",
        projectTitle: input.projectTitle,
        clientName: input.clientName,
        engineerName: input.engineerName,
        includeCover: input.includeCover,
        calculations: { connect: input.calculationIds.map((id) => ({ id })) },
      },
      select: { id: true, status: true },
    });

    const job = await this.pdfQueue.add("render", { ...input, tool, exportId: exportRow.id });
    return { ...exportRow, jobId: job.id, queue: QUEUES.pdfExport };
  }

  /** تاریخچه‌ی محاسبات یک کاربر */
  public async list(userId: string, tool?: Tool, take = 25) {
    return this.prisma.client.engineeringCalculation.findMany({
      where: { userId, ...(tool ? { tool } : {}) },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        tool: true,
        title: true,
        standardRef: true,
        inputs: true,
        outputs: true,
        createdAt: true,
      },
    });
  }

  private async persist(userId: string, tool: Tool, inputs: unknown, outputs: unknown): Promise<void> {
    await this.prisma.client.engineeringCalculation.create({
      data: { userId, tool, inputs: toJson(inputs), outputs: toJson(outputs) },
    });
  }
}
