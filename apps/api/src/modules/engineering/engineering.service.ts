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
  VoltageDropInputDto,
  CableSizingInputDto,
  PdfExportInputDto,
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
} from "@xennic/shared";
import { PrismaService } from "../../infra/prisma/prisma.service.js";
import type { Prisma, EngineeringTool } from "@xennic/database";

/**
 * مقادیر enum دیتابیس برای ابزارها. این یک اتحادِ همسو با `EngineeringTool` در Prisma است؛
 * تا زمان بازتولید کلاینت (pnpm db:generate) به‌صورت دستی نگه‌داری می‌شود.
 */
type Tool = EngineeringTool;

/** نگاشت slug ورودی API (kebab) به enum دیتابیس */
const TOOL_BY_SLUG: Record<string, Tool> = {
  "voltage-drop": "VOLTAGE_DROP",
  "cable-sizing": "CABLE_SIZING",
  "capacitor-bank": "CAPACITOR_BANK",
  "generator-size": "GENERATOR_SIZE",
  generator: "GENERATOR_SIZE",
  demand: "DEMAND",
  "short-circuit": "SHORT_CIRCUIT",
  transformer: "TRANSFORMER",
  switchgear: "SWITCHGEAR",
  busbar: "BUSBAR",
  "voltage-class": "VOLTAGE_CLASS",
  earthing: "EARTHING",
  lighting: "LIGHTING",
};

/**
 * جعبه‌ابزار مهندسی برق (نوت ۳ §۴). هر محاسبه همان لحظه در دیتابیس ثبت می‌شود تا
 * «دفترچه محاسبات» مستند و قابل استناد باشد. خروجیِ هر ابزار شامل پیوست استاندارد
 * (`standards`) است که در `outputs` نیز ذخیره و در دفترچه/PDF نمایش داده می‌شود.
 */

/**
 * ستون‌های `inputs`/`outputs` از نوع Json هستند و Prisma برای آن‌ها `InputJsonValue`
 * می‌خواهد؛ با round-trip سریال‌سازی هم نوع قطعی می‌شود هم مقادیر غیرقابل‌سریال‌سازی حذف می‌گردند.
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
      crossSectionMm2: input.crossSectionMm2,
      conductivity: CONDUCTIVITY[input.conductor],
      powerFactor: input.powerFactor,
      reactancePerKm: input.reactancePerKm,
      lightingCircuit: input.lightingCircuit,
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

  public async demand(userId: string, input: DemandInputDto) {
    const result = calculateDemand(input);
    await this.persist(userId, "DEMAND", input, result);
    return result;
  }

  public async shortCircuit(userId: string, input: ShortCircuitInputDto) {
    const result = calculateShortCircuit(input);
    await this.persist(userId, "SHORT_CIRCUIT", input, result);
    return result;
  }

  public async transformer(userId: string, input: TransformerInputDto) {
    const result = sizeTransformer(input);
    await this.persist(userId, "TRANSFORMER", input, result);
    return result;
  }

  public async switchgear(userId: string, input: SwitchgearInputDto) {
    const result = selectSwitchgear(input);
    await this.persist(userId, "SWITCHGEAR", input, result);
    return result;
  }

  public async busbar(userId: string, input: BusbarInputDto) {
    const result = sizeBusbar(input);
    await this.persist(userId, "BUSBAR", input, result);
    return result;
  }

  public async voltageClass(userId: string, input: VoltageClassInputDto) {
    const result = voltageClassInfo(input.nominalKv);
    await this.persist(userId, "VOLTAGE_CLASS", input, result);
    return result;
  }

  public async earthing(userId: string, input: EarthingInputDto) {
    const result = earthElectrodeResistance({
      soil: { rhoOhmM: input.rhoOhmM, soilId: input.soilId },
      rodLengthM: input.rodLengthM,
      rodDiameterM: input.rodDiameterM,
      rodCount: input.rodCount,
      targetOhm: input.targetOhm,
    });
    await this.persist(userId, "EARTHING", input, result);
    return result;
  }

  public async lighting(userId: string, input: LightingInputDto) {
    const result = interiorLighting(input);
    await this.persist(userId, "LIGHTING", input, result);
    return result;
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

  /** تاریخچه‌ی محاسبات یک کاربر (فیلتر اختیاری بر اساس ابزار) */
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
