import { z } from "zod";

export const voltageDropSchema = z.object({
  system: z.enum(["single", "three"]),
  voltage: z.number().positive(),
  current: z.number().positive(),
  length: z.number().positive(),
  conductor: z.enum(["copper", "aluminium"]).default("copper"),
  /** مقطع هادی (mm²)؛ اگر داده نشود خروجی به‌ازای مقطع ۱mm² است */
  crossSectionMm2: z.number().positive().optional(),
  reactancePerKm: z.number().min(0).max(1).optional(),
  powerFactor: z.number().min(0.1).max(1).default(0.85),
  /** مدار روشنایی → آستانه‌ی افت ۳٪ به‌جای ۴٪ */
  lightingCircuit: z.boolean().default(false),
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

export const demandSchema = z.object({
  loads: z
    .array(
      z.object({
        label: z.string().min(1),
        kw: z.number().positive(),
        category: z
          .enum(["lighting", "socket", "motor", "hvac", "elevator", "computer", "equipment"])
          .optional(),
        demandFactor: z.number().min(0.1).max(1).optional(),
      }),
    )
    .min(1),
  diversityFactor: z.number().min(0.6).max(1).default(0.8),
  voltage: z.number().positive().default(400),
});

export const shortCircuitSchema = z.object({
  voltageLevel: z.enum(["lv", "mv", "hv"]),
  nominalVoltageKv: z.number().positive(),
  iKKA: z.number().positive(),
  rxRatio: z.number().positive().optional(),
});

export const transformerSchema = z.object({
  demandKva: z.number().positive(),
  powerFactor: z.number().min(0.3).max(1).optional(),
  primaryKv: z.number().positive().default(20),
  secondaryKv: z.number().positive().default(0.4),
  loadingFactor: z.number().min(0.4).max(0.95).default(0.8),
});

export const switchgearSchema = z.object({
  voltageLevel: z.enum(["lv", "mv", "hv"]),
  nominalVoltageKv: z.number().positive(),
  loadCurrentA: z.number().positive(),
  faultLevelKA: z.number().positive(),
});

export const busbarSchema = z.object({
  currentA: z.number().positive(),
  material: z.enum(["copper", "aluminium"]).default("copper"),
  ambientTempC: z.number().min(-10).max(60).default(40),
});

export const voltageClassSchema = z.object({
  nominalKv: z.number().positive(),
});

export const earthingSchema = z.object({
  rhoOhmM: z.number().positive().optional(),
  soilId: z.enum(["swamp", "loam", "sand_wet", "gravel", "rock"]).optional(),
  rodLengthM: z.number().positive().default(2.5),
  rodDiameterM: z.number().positive().default(0.016),
  rodCount: z.number().int().min(1).max(24).default(1),
  targetOhm: z.number().positive().default(10),
});

export const lightingSchema = z.object({
  areaM2: z.number().positive(),
  space: z.string().optional(),
  customLux: z.number().positive().optional(),
  lumensPerLuminaire: z.number().positive(),
  utilizationFactor: z.number().min(0.3).max(0.9).default(0.6),
  maintenanceFactor: z.number().min(0.5).max(1).default(0.8),
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
export type DemandInputDto = z.infer<typeof demandSchema>;
export type ShortCircuitInputDto = z.infer<typeof shortCircuitSchema>;
export type TransformerInputDto = z.infer<typeof transformerSchema>;
export type SwitchgearInputDto = z.infer<typeof switchgearSchema>;
export type BusbarInputDto = z.infer<typeof busbarSchema>;
export type VoltageClassInputDto = z.infer<typeof voltageClassSchema>;
export type EarthingInputDto = z.infer<typeof earthingSchema>;
export type LightingInputDto = z.infer<typeof lightingSchema>;
