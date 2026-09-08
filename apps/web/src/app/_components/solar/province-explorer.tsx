"use client";

import {
  buildFeasibilityReport,
  monthlyFromAnnual,
  provinceLabel,
  resourceForProvince,
  type TariffKind,
} from "@xennic/shared";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Card, CardContent, Input, Label } from "@xennic/ui";
import { IrradianceMap } from "./irradiance-map";
import { compactNumber, compactToman, years } from "@/lib/solar/format";
import { saveDraft } from "@/lib/solar/draft";

export interface ProvinceLite {
  code: string;
  nameFa: string;
  lat: number;
  lon: number;
  elevationM: number;
}

const TARIFFS: Array<{ id: TariffKind; label: string }> = [
  { id: "residential", label: "خانگی" },
  { id: "commercial", label: "تجاری" },
  { id: "industrial", label: "صنعتی" },
  { id: "agricultural", label: "کشاورزی" },
  { id: "governmental", label: "اداری/دولتی" },
];

/**
 * کاوشگر استان: نقشه + برآوردِ زنده.
 * مشابه Google Project Sunroof — انتخاب روی نقشه، بلافاصله ظرفیت و تولید را نشان می‌دهد.
 */
export function ProvinceExplorer({ provinces }: { provinces: ProvinceLite[] }) {
  const router = useRouter();
  const [code, setCode] = useState("tehran");
  const [roofAreaM2, setRoofAreaM2] = useState(500);
  const [tiltDeg, setTiltDeg] = useState(25);
  const [azimuthDeg, setAzimuthDeg] = useState(180);
  const [tariffKind, setTariffKind] = useState<TariffKind>("industrial");
  const [annualKwh, setAnnualKwh] = useState(240_000);

  const resource = useMemo(() => resourceForProvince(code), [code]);
  const province = provinces.find((item) => item.code === code);

  const result = useMemo(
    () =>
      buildFeasibilityReport({
        site: { province: code, lat: province?.lat, lon: province?.lon, elevationM: province?.elevationM },
        roof: { areaM2: roofAreaM2, tiltDeg, azimuthDeg },
        consumption: {
          monthlyKwh: monthlyFromAnnual(annualKwh, tariffKind === "governmental" ? "commercial" : tariffKind),
          tariffKind,
          profile: tariffKind === "governmental" ? "commercial" : tariffKind,
        },
      }),
    [annualKwh, azimuthDeg, code, province, roofAreaM2, tariffKind, tiltDeg],
  );

  const best = result.scenarios.find((scenario) => scenario.scenario.id === result.recommendedScenarioId);

  function continueToReport(): void {
    saveDraft({
      site: {
        name: `سایت ${provinceLabel(code)}`,
        province: code,
        lat: province?.lat,
        lon: province?.lon,
        elevationM: province?.elevationM,
      },
      roof: { areaM2: roofAreaM2, tiltDeg, azimuthDeg },
      consumption: {
        monthlyKwh: monthlyFromAnnual(annualKwh, tariffKind === "governmental" ? "commercial" : tariffKind),
        tariffKind,
        profile: tariffKind === "governmental" ? "commercial" : tariffKind,
      },
    });
    router.push("/solar/feasibility-report");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <IrradianceMap onSelect={setCode} selected={code} />

      <div className="grid gap-4">
        <Card className="bg-card/60">
          <CardContent className="grid gap-4 p-5">
            <div className="grid gap-1.5">
              <Label htmlFor="province-select">استان انتخاب‌شده</Label>
              <select
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                id="province-select"
                onChange={(event) => setCode(event.target.value)}
                value={code}
              >
                {provinces.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.nameFa}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NumberField
                id="roof-area"
                label="مساحت سقف (m²)"
                onChange={setRoofAreaM2}
                step={10}
                value={roofAreaM2}
              />
              <NumberField
                id="annual-kwh"
                label="مصرف سالانه (kWh)"
                onChange={setAnnualKwh}
                step={10_000}
                value={annualKwh}
              />
              <NumberField id="tilt" label="شیب سقف (درجه)" onChange={setTiltDeg} step={5} value={tiltDeg} />
              <NumberField
                id="azimuth"
                label="سمت سقف (۱۸۰ = جنوب)"
                onChange={setAzimuthDeg}
                step={10}
                value={azimuthDeg}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="tariff-select">نوع اشتراک</Label>
              <select
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                id="tariff-select"
                onChange={(event) => setTariffKind(event.target.value as TariffKind)}
                value={tariffKind}
              >
                {TARIFFS.map((tariff) => (
                  <option key={tariff.id} value={tariff.id}>
                    {tariff.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-3 p-5">
            <Kpi
              hint={`ایستگاه مرجع: ${resource.nearestStation.name} — کیفیت ${confidenceLabel(resource.confidence)}`}
              label="تابش سالانه"
              value={`${compactNumber(resource.annualGhiKwhM2Day, 2)}`}
              unit="kWh/m²·day"
            />
            <Kpi label="ظرفیت پیشنهادی" unit="kWp" value={compactNumber(result.design.capacityKwp, 1)} />
            <Kpi label="تولید سالانه" unit="kWh" value={compactNumber(result.production.annualAcKwh)} />
            <Kpi label="صرفه‌جویی سالانه" unit="تومان" value={compactToman(result.bills.annualSavingToman)} />
            <Kpi
              hint={best ? `بهترین سناریو: ${best.scenario.label}` : undefined}
              label="دوره بازگشت سرمایه"
              unit=""
              value={years(best?.paybackYears ?? null)}
            />
            <Button className="mt-2 w-full" onClick={continueToReport} type="button">
              ادامه و دریافت طرح توجیهی کامل
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function confidenceLabel(confidence: "high" | "medium" | "low"): string {
  return confidence === "high" ? "بالا" : confidence === "medium" ? "متوسط" : "پایین";
}

function NumberField({
  id,
  label,
  onChange,
  step = 1,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        dir="ltr"
        id={id}
        inputMode="decimal"
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
        step={step}
        type="number"
        value={value}
      />
    </div>
  );
}

function Kpi({ hint, label, unit, value }: { hint?: string; label: string; unit: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2">
      <div className="grid gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        {hint ? <span className="text-[11px] text-muted-foreground/80">{hint}</span> : null}
      </div>
      <span className="xennic-numeric text-left text-sm font-bold">
        {value}
        {unit ? <span className="mr-1 text-xs font-normal text-muted-foreground">{unit}</span> : null}
      </span>
    </div>
  );
}
