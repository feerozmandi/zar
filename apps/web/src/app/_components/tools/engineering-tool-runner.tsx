"use client";

import { useState } from "react";
import { z } from "zod";
import { Badge, Button, Card, CardContent, Input, Label, Separator } from "@xennic/ui";
import { apiFetch } from "@/lib/api-client";

/** توضیح استاندارد (خروجی backend) */
interface StandardNote {
  code: string;
  origin: "iran" | "intl";
  titleFa: string;
  noteFa: string;
}

export interface FieldOption {
  value: string;
  label: string;
}

export type FieldSpec =
  | {
      name: string;
      label: string;
      type: "number";
      step?: string;
      min?: number;
      max?: number;
      required?: boolean;
      placeholder?: string;
    }
  | { name: string; label: string; type: "text"; required?: boolean; placeholder?: string }
  | { name: string; label: string; type: "select"; options: FieldOption[]; required?: boolean }
  | { name: string; label: string; type: "boolean" };

export interface RunnerProps {
  /** مسیر API بدون prefix — نمونه "engineering/transformer" */
  apiPath: string;
  fields: FieldSpec[];
  submitLabel?: string;
}

/** نتیجه را با پشتیبانی از استاندارد پیوست، صف متون و آرایه/شیء نمایش می‌دهد */
export function EngineeringToolRunner({ apiPath, fields, submitLabel = "محاسبه" }: RunnerProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function setField(name: string, value: unknown) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit() {
    setError(null);
    setResult(null);
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = values[f.name];
      if (f.type === "number") {
        if (raw === undefined || raw === null || raw === "") {
          if (f.required) {
            setError(`مقدار «${f.label}» الزامی است.`);
            return;
          }
          continue;
        }
        payload[f.name] = Number(raw);
      } else if (f.type === "boolean") {
        payload[f.name] = Boolean(raw);
      } else if (f.type === "text") {
        if (!raw && f.required) {
          setError(`مقدار «${f.label}» الزامی است.`);
          return;
        }
        payload[f.name] = raw;
      } else if (f.type === "select") {
        if (!raw && f.required) {
          setError(`مقدار «${f.label}» الزامی است.`);
          return;
        }
        if (raw) payload[f.name] = raw;
      }
    }
    setBusy(true);
    try {
      const data = await apiFetch(apiPath, z.unknown(), { method: "POST", body: payload });
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "خطا در محاسبه");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <Card>
        <CardContent className="grid gap-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <Field field={field} key={field.name} value={values[field.name]} onChange={setField} />
            ))}
          </div>
          <Button disabled={busy} onClick={() => void onSubmit()} type="button">
            {busy ? "در حال محاسبه..." : submitLabel}
          </Button>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card className="bg-card/60">
        <CardContent className="p-6">
          <p className="text-sm font-bold">نتیجه</p>
          {result !== null ? (
            <ResultView value={result} />
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              برای دیدن نتیجه مقادیر را وارد کنید و «{submitLabel}» را بزنید (نیازمند اجرای Core API).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
}) {
  const common = { dir: field.type === "number" ? "ltr" : undefined } as const;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={`f-${field.name}`}>
        {field.label}
        {field.type !== "boolean" && field.required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {field.type === "select" ? (
        <select
          className="h-10 w-full rounded-(--radius-button) border border-input bg-transparent px-3 text-sm"
          id={`f-${field.name}`}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.name, e.target.value)}
        >
          <option value="">— انتخاب —</option>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === "boolean" ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            checked={Boolean(value)}
            className="size-4 accent-primary"
            id={`f-${field.name}`}
            type="checkbox"
            onChange={(e) => onChange(field.name, e.target.checked)}
          />
          فعال
        </label>
      ) : (
        <Input
          {...common}
          id={`f-${field.name}`}
          min={field.type === "number" ? field.min : undefined}
          max={field.type === "number" ? field.max : undefined}
          placeholder={field.placeholder}
          step={field.type === "number" ? (field.step ?? "any") : undefined}
          type={field.type}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      )}
    </div>
  );
}

function ResultView({ value }: { value: unknown }) {
  const standards = extractStandards(value);
  return (
    <div className="mt-2">
      <Separator className="my-3" />
      <RenderNode label="" node={value} depth={0} />
      {standards.length > 0 ? <StandardsAppendix standards={standards} /> : null}
    </div>
  );
}

function extractStandards(root: unknown): StandardNote[] {
  if (!root || typeof root !== "object") return [];
  const found: StandardNote[] = [];
  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj.standards)) {
      for (const s of obj.standards as StandardNote[]) {
        if (s && typeof s === "object" && "code" in s) found.push(s);
      }
    }
    for (const key of Object.keys(obj)) {
      if (key !== "standards") walk(obj[key]);
    }
  };
  walk(root);
  return found;
}

const UNIT_LABEL: Record<string, string> = {
  dropVolt: "V",
  dropPercent: "٪",
  limitPercent: "٪",
  voltage: "V",
  current: "A",
  faultLevelKA: "kA",
  breakingCapacityKA: "kA",
  ratedCurrentA: "A",
  requiredBreakingKA: "kA",
  peakKA: "kA",
  iKKA: "kA",
  faultMva: "MVA",
  secondaryFaultKA: "kA",
  selectedKva: "kVA",
  requiredKva: "kVA",
  apparentKva: "kVA",
  recommendedKva: "kVA",
  demandKw: "kW",
  coincidentDemandKw: "kW",
  requiredKvar: "kVAr",
  selectedKvar: "kVAr",
  resistanceOhm: "Ω",
  reactanceOhm: "Ω",
  singleRodOhm: "Ω",
  totalOhm: "Ω",
  rhoOhmM: "Ω·m",
  targetOhm: "Ω",
  luminaireCount: "عد",
  requiredLumens: "lumen",
  estimatedWattageW: "W",
  fuelEstimateLPerHour: "L/h",
  primaryCurrentA: "A",
  secondaryCurrentA: "A",
  loadFactor: "",
  actualLoading: "٪",
  demandCurrentA: "A",
  umKv: "kV",
  lightningImpulseKv: "kV",
  nominalKv: "kV",
};

/** تبدیل نام کلید انگلیسی به برچسب فارسی ساده */
function faKey(key: string): string {
  const known: Record<string, string> = {
    withinLimit: "در محدوده مجاز",
    abovePenaltyThreshold: "عبور از آستانه",
    sufficient: "ظرفیت کافی",
    withinCapacity: "قدرت قطع کافی",
    withinTarget: "در محدوده هدف",
    requiredKvar: "خازن موردنیاز",
    selectedKvar: "خازن انتخابی",
    cosPhiAfter: "ضریب قدرت نهایی",
    dropVolt: "افت ولتاژ",
    dropPercent: "درصد افت",
    limitPercent: "حد مجاز افت",
    voltageDropPercent: "افت ولتاژ",
    selectedCrossSectionMm2: "مقطع انتخابی (mm²)",
    recommendedSizeLabel: "ظرفیت پیشنهادی",
    recommendedKva: "ظرفیت پیشنهادی (kVA)",
    selectedKva: "ظرفیت نامی",
    secondaryCurrentA: "جریان ثانویه",
    primaryCurrentA: "جریان اولیه",
    selectedRatingA: "ظرفیت جریان شینه",
    faultMva: "سطح اتصال کوتاه",
    breakingCapacityKA: "قدرت قطع",
    ratedCurrentA: "جریان نامی کلید",
    targetLux: "سطح روشنایی هدف (lux)",
  };
  return known[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function renderPrimitive(v: unknown): string {
  if (typeof v === "boolean") return v ? "بله" : "خیر";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(v);
  return String(v);
}

function RenderNode({ node, depth }: { node: unknown; depth: number; label?: string }) {
  if (node === null || node === undefined) return <div className="text-sm text-muted-foreground">—</div>;
  if (Array.isArray(node)) {
    const arr = node as unknown[];
    if (arr.every((v) => typeof v !== "object")) {
      return <div className="text-sm">{arr.map((v) => renderPrimitive(v)).join("، ")}</div>;
    }
    return (
      <div className="space-y-2">
        {arr.map((item, i) => (
          <div key={i} className="rounded border border-border/50 p-2">
            <RenderNode node={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const entries = Object.entries(obj).filter(
      ([k]) => k !== "standards" && k !== "notesFa" && k !== "adviceFa",
    );
    return (
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {entries.map(([key, val]) => (
          <ResultRow key={key} label={faKey(key)} unit={UNIT_LABEL[key] ?? ""} value={val} />
        ))}
        {Array.isArray(obj.notesFa) ? (
          <div className="col-span-2">
            {(obj.notesFa as string[]).map((n) => (
              <p className="mt-1 text-xs leading-6 text-muted-foreground" key={n}>
                • {n}
              </p>
            ))}
          </div>
        ) : null}
        {typeof obj.adviceFa === "string" ? (
          <p className="col-span-2 mt-2 rounded bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">
            {obj.adviceFa}
          </p>
        ) : null}
      </dl>
    );
  }
  return <div className="text-sm">{renderPrimitive(node)}</div>;
}

function ResultRow({ label, unit, value }: { label: string; unit: string; value: unknown }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="xennic-numeric mt-0.5 text-base font-bold">
        {typeof value === "object" ? (
          <RenderNode node={value} depth={1} />
        ) : (
          <>
            {renderPrimitive(value)}
            {unit ? ` ${unit}` : ""}
          </>
        )}
      </dd>
    </div>
  );
}

/** پیوست استاندارد — انتهای هر محاسبه */
function StandardsAppendix({ standards }: { standards: StandardNote[] }) {
  return (
    <div className="mt-5">
      <Separator className="my-3" />
      <p className="text-sm font-bold">پیوست استانداردها</p>
      <ul className="mt-3 space-y-3">
        {standards.map((s) => (
          <li className="rounded border border-border/50 p-3 text-sm" key={s.code}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={s.origin === "iran" ? "success" : "default"}>
                {s.origin === "iran" ? "ایران" : "بین‌المللی"}
              </Badge>
              <span className="font-bold">{s.code}</span>
              <span className="text-muted-foreground">— {s.titleFa}</span>
            </div>
            {s.noteFa ? <p className="mt-1 text-xs leading-6 text-muted-foreground">{s.noteFa}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
