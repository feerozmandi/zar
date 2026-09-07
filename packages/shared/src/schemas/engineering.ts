import { z } from "zod";

export const voltageDropSchema = z.object({
  system: z.enum(["single", "three"]),
  voltage: z.number().positive(),
  current: z.number().positive(),
  length: z.number().positive(),
  conductor: z.enum(["copper", "aluminium"]).default("copper"),
  reactancePerKm: z.number().min(0).max(1).optional(),
  powerFactor: z.number().min(0.1).max(1).default(0.85),
});

export const cableSizingSchema = z.object({
  system: z.enum(["single", "three"]),
  voltage: z.number().positive(),
  current: z.number().positive(),
  length: z.number().positive(),
  conductor: z.enum(["copper", "aluminium"]).default("copper"),
  installationMethod: z.enum(["conduit", "tray", "buried", "clip"]).default("tray"),
  ambientTempC: z.number().min(-10).max(60).default(35),
  maxDropPercent: z.number().positive().default(4),
});

export const capacitorBankSchema = z.object({
  activePowerKw: z.number().positive(),
  cosPhiBefore: z.number().min(0.4).max(0.99),
  cosPhiTarget: z.number().min(0.9).max(0.99).default(0.95),
});

export const generatorSchema = z.object({
  connectedLoadKw: z.number().positive(),
  diversityFactor: z.number().min(0.4).max(1).default(0.8),
  efficiency: z.number().min(0.7).max(1).default(0.9),
  startingMargin: z.number().min(1).max(2).default(1.2),
  powerFactor: z.number().min(0.5).max(1).default(0.8),
});

export const pdfExportSchema = z.object({
  tool: z.enum(["voltage-drop", "cable-sizing", "capacitor-bank", "generator"]),
  calculationIds: z.array(z.string().min(1)).min(1),
  /** مشخصات پروژه در جلد دفترچه محاسبات */
  projectTitle: z.string().min(3),
  clientName: z.string().min(2),
  engineerName: z.string().min(2).optional(),
  includeCover: z.boolean().default(true),
});

export type VoltageDropInputDto = z.infer<typeof voltageDropSchema>;
export type CableSizingInputDto = z.infer<typeof cableSizingSchema>;
export type CapacitorBankInputDto = z.infer<typeof capacitorBankSchema>;
export type GeneratorInputDto = z.infer<typeof generatorSchema>;
export type PdfExportInputDto = z.infer<typeof pdfExportSchema>;
