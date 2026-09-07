"use client";

import { PROVINCES, monthlyFromAnnual, provinceLabel, type TariffKind } from "@xennic/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Card, CardContent, Input, Label } from "@xennic/ui";
import { apiFetch } from "@/lib/api-client";
import { z } from "zod";
import { MONTH_LABELS_SHORT, compactNumber, compactToman, years } from "@/lib/solar/format";
import { runFeasibility, saveAssessmentId, updateDraft, useSolarDraft } from "@/lib/solar/draft";
import { useAuthStore } from "@/store/auth-store";

const TARIFFS: Array<{ id: TariffKind; label: string; hint: string }> = [
  { id: "residential", label: "خانگی", hint: "الگوی مصرف عصر و شب" },
  { id: "commercial", label: "تجاری", hint: "پیکِ روزانه و تابستانه" },
  { id: "industrial", label: "صنعتی", hint: "بار یکنواخت + دیماند" },
  { id: "agricultural", label: "کشاورزی", hint: "پیکِ تابستانه" },
  { id: "governmental", label: "اداری", hint: "مشابه تجاری" },
];

const responseSchema = z.object({
  assessmentId: z.string(),
  siteId: z.string(),
});

/**
 * برآوردِ لحظه‌ای (Sunroof-style): با هر تغییر در ورودی، گزارش کامل دوباره
 * محاسبه می‌شود — همان موتوری که API استفاده می‌کند، اینجا در مرورگر اجرا می‌شود
 * تا کاربر بدون انتظار برای شبکه نتیجه را ببیند.
 */
export function SolarWizard() {
  const router = useRouter();
  const [draftSnapshot, setDraft] = useSolarDraft();
  const draft = draftSnapshot.input;
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const authStatus = useAuthStore((state) => state.status);
  const setPostLoginRedirect = useAuthStore((state) => state.setPostLoginRedirect);

  // مصرفِ سالانه از پیش‌نویس استخراج می‌شود (تنها منبعِ حقیقت همان پیش‌نویس است)
  const annualKwh = useMemo(
    () => draft.consumption.monthlyKwh.reduce((sum, value) => sum + value, 0),
    [draft.consumption.monthlyKwh],
  );
  const setAnnualKwh = (value: number): void =>
    setDraft({
      ...draft,
      consumption: {
        ...draft.consumption,
        monthlyKwh: monthlyFromAnnual(value, tariffKind === "governmental" ? "commercial" : tariffKind),
      },
    });

  const tariffKind = draft.consumption.tariffKind;
  const profile = draft.consumption.profile ?? (tariffKind === "governmental" ? "commercial" : tariffKind);

  const input = useMemo(
    () => ({
      ...draft,
      consumption: { ...draft.consumption, monthlyKwh: monthlyFromAnnual(annualKwh, profile), profile },
    }),
    [annualKwh, draft, profile],
  );

  const result = useMemo(() => runFeasibility(input), [input]);
  const report = result.ok ? result.report : null;
  const best = report?.scenarios.find((scenario) => scenario.scenario.id === report.recommendedScenarioId);

  function patchRoof(patch: Partial<typeof draft.roof>): void {
    setDraft({ ...draft, roof: { ...draft.roof, ...patch } });
  }

  async function persist(): Promise<void> {
    if (authStatus !== "authenticated") {
      setPostLoginRedirect("/solar");
      router.push("/login?next=/solar");
      return;
    }
    setSaveState("saving");
    setSaveMessage(null);
    try {
      updateDraft(input);
      const saved = await apiFetch("solar/feasibility", responseSchema, { method: "POST", body: input });
      saveAssessmentId(saved.assessmentId);
      setSaveState("saved");
      setSaveMessage("پروژه در حساب شما ذخیره شد.");
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "ذخیره ناموفق بود");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardContent className="grid gap-5 p-6">
          <section className="grid gap-3">
            <h3 className="text-sm font-bold">۱. موقعیت پروژه</h3>
            <div className="grid gap-1.5">
              <Label htmlFor="province">استان</Label>
              <select
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                id="province"
                onChange={(event) =>
                  setDraft({ ...draft, site: { ...draft.site, province: event.target.value } })
                }
                value={draft.site.province}
              >
                {PROVINCES.map((province) => (
                  <option key={province.code} value={province.code}>
                    {province.nameFa}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="site-name">نام سایت (اختیاری)</Label>
              <Input
                id="site-name"
                onChange={(event) =>
                  setDraft({ ...draft, site: { ...draft.site, name: event.target.value } })
                }
                placeholder="مثال: کارخانه فولاد غرب"
                value={draft.site.name ?? ""}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              برای انتخاب روی نقشه و دیدن تابش استان‌ها، به{" "}
              <Link className="text-primary underline" href="/solar/map">
                نقشه تابش
              </Link>{" "}
              بروید.
            </p>
          </section>

          <section className="grid gap-3">
            <h3 className="text-sm font-bold">۲. سقف یا زمین</h3>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                id="area"
                label="مساحت در دسترس (m²)"
                onChange={(value) => patchRoof({ areaM2: value, planes: undefined })}
                step={10}
                value={draft.roof.areaM2 ?? 500}
              />
              <NumberField
                id="tilt"
                label="شیب (درجه)"
                onChange={(value) => patchRoof({ tiltDeg: value })}
                step={5}
                value={draft.roof.tiltDeg ?? 25}
              />
              <NumberField
                id="azimuth"
                label="سمت (۱۸۰ = جنوب)"
                onChange={(value) => patchRoof({ azimuthDeg: value })}
                step={10}
                value={draft.roof.azimuthDeg ?? 180}
              />
              <NumberField
                id="shading"
                label="ضریب سایه (۰ تا ۱)"
                onChange={(value) => patchRoof({ shadingFactor: value })}
                step={0.05}
                value={draft.roof.shadingFactor ?? 0.08}
              />
            </div>
            {draft.roof.planes?.length ? (
              <p className="rounded-lg border border-primary/30 bg-primary/5 p-2 text-xs">
                سقف ترسیم‌شده با {compactNumber(draft.roof.planes.length)} صفحه از طراح سقف بارگذاری شده است.
                برای ویرایش به{" "}
                <Link className="text-primary underline" href="/solar/roof-designer">
                  طراح سقف
                </Link>{" "}
                بروید.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                سقفِ پیچیده دارید؟ در{" "}
                <Link className="text-primary underline" href="/solar/roof-designer">
                  طراح سقف
                </Link>{" "}
                چندضلعی و موانع را ترسیم کنید تا چیدمان دقیق‌تر شود.
              </p>
            )}
          </section>

          <section className="grid gap-3">
            <h3 className="text-sm font-bold">۳. اشتراک و مصرف</h3>
            <div className="grid gap-1.5">
              <Label htmlFor="tariff">نوع اشتراک</Label>
              <select
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                id="tariff"
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    consumption: { ...draft.consumption, tariffKind: event.target.value as TariffKind },
                  })
                }
                value={tariffKind}
              >
                {TARIFFS.map((tariff) => (
                  <option key={tariff.id} value={tariff.id}>
                    {tariff.label} — {tariff.hint}
                  </option>
                ))}
              </select>
            </div>
            <NumberField
              id="annual"
              label="مصرف سالانه (kWh)"
              onChange={setAnnualKwh}
              step={10_000}
              value={annualKwh}
            />
            <div className="grid grid-cols-6 gap-1 text-[10px] text-muted-foreground">
              {MONTH_LABELS_SHORT.map((label, index) => (
                <span className="rounded bg-muted/40 px-1 py-0.5 text-center" key={label}>
                  {label}
                  <br />
                  <span className="xennic-numeric">
                    {compactNumber((report?.energyBalance.monthly[index]?.loadKwh ?? 0) / 1000, 1)}
                  </span>
                </span>
              ))}
              <span className="col-span-6 text-[10px]">
                هزار کیلووات‌ساعت در ماه (توزیع بر اساس نوع اشتراک)
              </span>
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void persist()} type="button" variant="outline">
              {saveState === "saving" ? "در حال ذخیره…" : "ذخیره در حساب من"}
            </Button>
            <Button
              onClick={() => {
                updateDraft(input);
                router.push("/solar/feasibility-report");
              }}
              type="button"
            >
              مشاهده طرح توجیهی
            </Button>
          </div>
          {saveMessage ? (
            <p className={`text-xs ${saveState === "error" ? "text-destructive" : "text-emerald-600"}`}>
              {saveMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {!result.ok ? (
          <Card className="border-destructive/40">
            <CardContent className="p-6 text-sm text-destructive">{result.error}</CardContent>
          </Card>
        ) : null}

        {report ? (
          <>
            <Card className="bg-gradient-to-b from-amber-50/60 to-transparent dark:from-amber-950/20">
              <CardContent className="grid gap-3 p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    {provinceLabel(report.site.provinceCode)} — {report.design.module.model}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    نسخه موتور {report.meta.engineVersion}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">ظرفیت پیشنهادی</p>
                    <p className="xennic-numeric text-3xl font-black text-primary">
                      {compactNumber(report.design.capacityKwp, 1)}
                      <span className="mr-1 text-sm font-normal text-muted-foreground">kWp</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">تولید سالانه</p>
                    <p className="xennic-numeric text-3xl font-black">
                      {compactNumber(report.production.annualAcKwh)}
                      <span className="mr-1 text-sm font-normal text-muted-foreground">kWh</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {compactNumber(report.design.system.stringConfig.modulesPerString)} پنل در هر رشته ×{" "}
                  {compactNumber(report.design.system.stringConfig.stringCount)} رشته · اینورتر{" "}
                  {report.design.inverterModel} × {compactNumber(report.design.inverterCount)} · نسبت DC/AC{" "}
                  {compactNumber(report.design.system.dcAcRatio, 2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="grid gap-2 p-6">
                <Row
                  label="بازده ویژه"
                  value={`${compactNumber(report.production.specificYieldKwhPerKwp)} kWh/kWp`}
                />
                <Row
                  label="ضریب عملکرد (PR)"
                  value={compactNumber(report.design.system.performanceRatio, 3)}
                />
                <Row
                  label="سهم خودمصرفی"
                  value={`${compactNumber(report.energyBalance.selfConsumptionRate * 100, 1)}٪`}
                />
                <Row label="قبض سالانه قبل" value={compactToman(report.bills.baselineAnnualToman)} />
                <Row label="قبض سالانه بعد" value={compactToman(report.bills.postSolarAnnualToman)} />
                <Row
                  highlight
                  label="صرفه‌جویی سالانه"
                  value={compactToman(report.bills.annualSavingToman)}
                />
                <Row label="هزینه احداث" value={compactToman(report.cost.capexTotalToman)} />
                <Row label="دوره بازگشت" value={years(best?.paybackYears ?? null)} />
                <Row label="بهترین سناریو" value={best?.scenario.label ?? "—"} />
                <Row label="سناریوهای قابل مقایسه" value={compactNumber(report.scenarios.length)} />
              </CardContent>
            </Card>

            <Card className="bg-card/60">
              <CardContent className="grid gap-2 p-6 text-xs leading-6 text-muted-foreground">
                <p className="font-bold text-foreground">گام بعد</p>
                <p>
                  در «طرح توجیهی» جزئیاتِ رشته‌بندی، تلفات، جریان نقدی ۲۰ ساله، تحلیل حساسیت و مقایسه‌ی
                  سناریوهای خودتأمین، ماده ۱۲ و بورس سبز را می‌بینید و می‌توانید فایل را چاپ/ذخیره کنید.
                </p>
                <p>
                  سپس در «مارکت‌پلیس EPC» پروژه را برای پیمانکاران می‌فرستید و پیشنهادها را بر اساس قیمتِ هر
                  وات، رده‌ی پنل، گارانتی و زمان‌بندی مقایسه می‌کنید.
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
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

function Row({ highlight, label, value }: { highlight?: boolean; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 py-1.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`xennic-numeric text-sm ${highlight ? "font-bold text-primary" : "font-semibold"}`}>
        {value}
      </span>
    </div>
  );
}
