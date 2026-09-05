import type { Queue as BullQueue } from "bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import { BadRequestException, Injectable } from "@nestjs/common";
import type { CapacitorBankInputDto, GeneratorInputDto } from "@xennic/shared";
import {
  calculateVoltageDrop,
  CONDUCTIVITY,
  sizeCable,
  sizeCapacitorBank,
  sizeGenerator,
  QUEUES,
  type CableSizingInputDto,
  type PdfExportInputDto,
  type VoltageDropInputDto,
} from "@xennic/shared";
import { PrismaService } from "../../infra/prisma/prisma.service.js";

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
      data: { userId, tool, inputs, outputs },
    });
  }
}
