"use client";

import type { FeasibilityReport, ScenarioResult } from "@xennic/shared";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button, Card, CardContent } from "@xennic/ui";
import { MONTH_LABELS_SHORT, compactNumber, compactToman, percent, years } from "@/lib/solar/format";

const AXIS_STYLE = { fontSize: 11 } as const;

/**
 * نمایشِ گزارشِ امکان‌سنجی (طرح توجیهی).
 * تمام اعداد از خروجیِ موتورِ @xennic/shared می‌آیند؛ این کامپوننت فقط آن‌ها را
 * به زبانِ کاربر ترجمه می‌کند و قابلیت چاپ/PDF دارد.
 */
export function ReportView({ report }: { report: FeasibilityReport }) {
  const recommended =
    report.scenarios.find((scenario) => scenario.scenario.id === report.recommendedScenarioId) ??
    report.scenarios[0];

  const monthly = report.production.monthlyAcKwh.map((production, month) => ({
    month: MONTH_LABELS_SHORT[month] ?? String(month + 1),
    production: Math.round(production),
    load: Math.round(report.energyBalance.monthly[month]?.loadKwh ?? 0),
    self: Math.round(report.energyBalance.monthly[month]?.selfConsumedKwh ?? 0),
    export: Math.round(report.energyBalance.monthly[month]?.exportedKwh ?? 0),
  }));

  const billSeries = report.bills.baselineMonthly.map((baseline, month) => ({
    month: MONTH_LABELS_SHORT[month] ?? String(month + 1),
    before: Math.round(baseline.totalToman / 1_000_000),
    after: Math.round((report.bills.postSolarMonthly[month]?.totalToman ?? 0) / 1_000_000),
  }));

  const scenarioSeries = report.scenarios.map((scenario) => ({
    name: scenario.scenario.label,
    npv: Math.round(scenario.npvToman / 1_000_000),
    payback: scenario.paybackYears ?? 0,
  }));

  const cashflow = (recommended?.cashflow.years ?? []).map((row) => ({
    year: row.year,
    cumulative: Math.round(row.cumulativeToman / 1_000_000),
    discounted: Math.round(row.cumulativeDiscountedToman / 1_000_000),
  }));

  return (
    <div className="grid gap-6 print:gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">{report.site.name}</h2>
          <p className="text-sm text-muted-foreground">
            {report.site.provinceLabel} — {compactNumber(report.site.lat, 2)}°N,{" "}
            {compactNumber(report.site.lon, 2)}°E · ارتفاع {compactNumber(report.site.elevationM)} متر
          </p>
          <p className="text-xs text-muted-foreground">
            موتور محاسباتی نسخه {report.meta.engineVersion} ·{" "}
            {new Date(report.meta.generatedAtIso).toLocaleDateString("fa-IR")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button onClick={() => window.print()} size="sm" type="button" variant="outline">
            چاپ / ذخیره PDF
          </Button>
          <Button asChild size="sm" type="button" variant="outline">
            <Link href="/solar/marketplace">ارسال به پیمانکاران</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="ظرفیت نصبی" unit="kWp" value={compactNumber(report.design.capacityKwp, 1)} />
        <KpiCard label="تولید سال اول" unit="kWh" value={compactNumber(report.production.annualAcKwh)} />
        <KpiCard
          label="بازده ویژه"
          unit="kWh/kWp"
          value={compactNumber(report.production.specificYieldKwhPerKwp)}
        />
        <KpiCard
          label="ضریب عملکرد (PR)"
          unit=""
          value={compactNumber(report.design.system.performanceRatio, 3)}
        />
        <KpiCard label="سرمایه‌گذاری" unit="" value={compactToman(report.cost.capexTotalToman)} />
        <KpiCard label="صرفه‌جویی سالانه" unit="" value={compactToman(report.bills.annualSavingToman)} />
        <KpiCard
          hint={recommended ? recommended.scenario.label : undefined}
          label="دوره بازگشت"
          unit=""
          value={years(recommended?.paybackYears ?? null)}
        />
        <KpiCard
          hint={recommended && recommended.irr !== null ? `IRR ${percent(recommended.irr, 1)}` : undefined}
          label="ارزش فعلی خالص (NPV)"
          unit=""
          value={compactToman(recommended?.npvToman ?? 0)}
        />
      </section>

      <Card>
        <CardContent className="grid gap-2 p-5">
          <SectionTitle hint="تولید ماهانه، مصرف و سهمِ خودمصرفی/صادرات" title="تراز انرژی ماهانه" />
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer height="100%" width="100%">
              <ComposedChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={AXIS_STYLE} />
                <YAxis tick={AXIS_STYLE} width={60} />
                <Tooltip />
                <Legend />
                <Bar dataKey="production" fill="#F59E0B" name="تولید (kWh)" />
                <Bar dataKey="self" fill="#0EA5E9" name="خودمصرفی (kWh)" stackId="b" />
                <Bar dataKey="export" fill="#94A3B8" name="صادرات (kWh)" stackId="b" />
                <Line dataKey="load" name="مصرف (kWh)" stroke="#0F172A" strokeWidth={2} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground">
            سهم خودمصرفی {percent(report.energyBalance.selfConsumptionRate, 1)} · پوششِ مصرف{" "}
            {percent(report.energyBalance.selfSufficiencyRate, 1)} · {report.energyBalance.note}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="grid gap-2 p-5">
            <SectionTitle hint="مقایسه‌ی قبض قبل و بعد از احداث (میلیون تومان)" title="قبض برق" />
            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={billSeries}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={AXIS_STYLE} />
                  <YAxis tick={AXIS_STYLE} width={45} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="before" fill="#EF4444" name="قبل" />
                  <Bar dataKey="after" fill="#10B981" name="بعد" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <Stat label="قبض فعلی" value={compactToman(report.bills.baselineAnnualToman)} />
              <Stat label="قبض بعد" value={compactToman(report.bills.postSolarAnnualToman)} />
              <Stat label="صرفه‌جویی" value={compactToman(report.bills.annualSavingToman)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-2 p-5">
            <SectionTitle hint="از تابشِ رسیده تا انرژی تحویلی به شبکه" title="تراز تلفات" />
            <ul className="grid gap-1.5">
              {report.design.system.losses.map((loss) => (
                <li className="grid gap-1" key={loss.key}>
                  <div className="flex items-center justify-between text-xs">
                    <span>{loss.label}</span>
                    <span className="xennic-numeric">{percent(loss.lossFraction, 1)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${Math.min(100, loss.lossFraction * 100 * 3)}%` }}
                    />
                  </div>
                  {loss.note ? <p className="text-[11px] text-muted-foreground">{loss.note}</p> : null}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              ضریب عملکرد نهایی {compactNumber(report.design.system.performanceRatio, 3)} · تلفات قیچی‌شدن{" "}
              {percent(report.production.clippingLoss, 2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-5">
          <SectionTitle
            hint="خودتأمین (ماده ۱۶)، خرید تضمینی (ماده ۱۲)، بورس سبز و ترکیبی"
            title="مقایسه سناریوهای فروش برق"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="p-2 text-right">سناریو</th>
                  <th className="p-2 text-right">نرخ جایگزینی</th>
                  <th className="p-2 text-right">نرخ فروش</th>
                  <th className="p-2 text-right">خودمصرفی</th>
                  <th className="p-2 text-right">درآمد سالانه</th>
                  <th className="p-2 text-right">بازگشت</th>
                  <th className="p-2 text-right">NPV</th>
                  <th className="p-2 text-right">IRR</th>
                  <th className="p-2 text-right">LCOE</th>
                </tr>
              </thead>
              <tbody>
                {report.scenarios.map((scenario) => (
                  <ScenarioRow
                    isRecommended={scenario.scenario.id === report.recommendedScenarioId}
                    key={scenario.scenario.id}
                    scenario={scenario}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <p className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs leading-6">
            <span className="font-bold">پیشنهاد موتور: </span>
            {report.recommendedReason}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-56 w-full" dir="ltr">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={scenarioSeries}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={AXIS_STYLE} />
                  <YAxis tick={AXIS_STYLE} width={45} />
                  <Tooltip />
                  <Bar dataKey="npv" fill="#F59E0B" name="NPV (میلیون تومان)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-56 w-full" dir="ltr">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={cashflow}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tick={AXIS_STYLE} />
                  <YAxis tick={AXIS_STYLE} width={45} />
                  <Tooltip />
                  <Legend />
                  <Line
                    dataKey="cumulative"
                    name="جریان نقدی انباشته"
                    stroke="#0EA5E9"
                    strokeWidth={2}
                    type="monotone"
                  />
                  <Line
                    dataKey="discounted"
                    name="انباشته‌ی تنزیل‌شده"
                    stroke="#64748B"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="grid gap-2 p-5">
            <SectionTitle
              hint={`${compactToman(report.cost.capexPerKwpToman)} به ازای هر کیلووات`}
              title="هزینه احداث"
            />
            <ul className="grid gap-1.5">
              {report.cost.breakdown.map((item) => (
                <li className="flex items-center justify-between gap-2 text-xs" key={item.key}>
                  <span>{item.label}</span>
                  <span className="xennic-numeric">
                    {compactToman(item.amountToman)} · {percent(item.share, 0)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-muted-foreground">
              بهره‌برداری سالانه {compactToman(report.cost.annualOpexToman)} · تعویض اینورتر در سال{" "}
              {compactNumber(report.cost.inverterReplacementYear)} (
              {compactToman(report.cost.inverterReplacementCostToman)})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-2 p-5">
            <SectionTitle hint="اثرِ تغییرِ فرض‌های کلیدی بر NPV" title="تحلیل حساسیت" />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="p-1.5 text-right">عامل</th>
                    {report.sensitivity.axes[0]?.deltas.map((delta) => (
                      <th className="p-1.5 text-center" key={delta}>
                        {delta > 0 ? `+${Math.round(delta * 100)}٪` : `${Math.round(delta * 100)}٪`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.sensitivity.axes.map((axis) => (
                    <tr className="border-b border-border/50" key={axis.label}>
                      <td className="p-1.5">{axis.label}</td>
                      {axis.npvToman.map((value, index) => (
                        <td className="xennic-numeric p-1.5 text-center" key={index}>
                          {compactNumber(value / 1_000_000_000, 2)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-muted-foreground">
              اعداد به میلیارد تومان (NPV). ردیفِ وسط، سناریوی مبناست.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="grid gap-2 p-5">
            <SectionTitle hint="آنچه در محاسبه فرض شده است" title="مفروضات و هشدارها" />
            <ul className="grid gap-1 text-xs leading-6 text-muted-foreground">
              {report.meta.assumptions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
              {report.meta.warnings.map((item) => (
                <li className="text-amber-600" key={item}>
                  ! {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-2 p-5">
            <SectionTitle title="اثرات زیست‌محیطی" />
            <div className="grid gap-1.5 text-xs">
              <Stat
                label="کاهش CO₂ در سال"
                value={`${compactNumber(report.environment.co2AvoidedTonsPerYear, 1)} تن`}
              />
              <Stat
                label="کاهش CO₂ در عمر پروژه"
                value={`${compactNumber(report.environment.co2AvoidedTonsLifetime, 1)} تن`}
              />
              <Stat
                label="معادل کاشت درخت"
                value={`${compactNumber(report.environment.treesPlantedEquivalent)} اصله`}
              />
              <Stat
                label="معادل خودروی سواری"
                value={`${compactNumber(report.environment.carKmAvoided)} کیلومتر`}
              />
              <Stat
                label="معادل بشکه نفت"
                value={`${compactNumber(report.environment.barrelsOfOilAvoided, 1)} بشکه`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {report.risks.length ? (
        <Card>
          <CardContent className="grid gap-2 p-5">
            <SectionTitle title="ریسک‌ها و نکات اجرایی" />
            <ul className="grid gap-2">
              {report.risks.map((risk) => (
                <li
                  className={`rounded-lg border p-3 text-xs leading-6 ${
                    risk.level === "critical"
                      ? "border-destructive/40 bg-destructive/5"
                      : risk.level === "warning"
                        ? "border-amber-300/50 bg-amber-50/50"
                        : "border-border"
                  }`}
                  key={risk.code}
                >
                  <span className="font-bold">{risk.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <p className="text-[11px] leading-6 text-muted-foreground print:block">
        این گزارش بر اساس مدلِ مهندسیِ زننیک (نسخه {report.meta.engineVersion}) و داده‌های اقلیمیِ
        درون‌یابی‌شده تهیه شده است و جایگزینِ مطالعاتِ تفصیلیِ طراحی و برآوردِ قطعیِ پیمانکار نیست.
      </p>
    </div>
  );
}

function KpiCard({
  hint,
  label,
  unit,
  value,
}: {
  hint?: string;
  label: string;
  unit: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/70 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="xennic-numeric mt-1 text-lg font-black text-primary">
        {value}
        {unit ? <span className="mr-1 text-xs font-normal text-muted-foreground">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SectionTitle({ hint, title }: { hint?: string; title: string }) {
  return (
    <div className="grid gap-0.5">
      <h3 className="text-sm font-bold">{title}</h3>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/50 py-1 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="xennic-numeric text-xs font-bold">{value}</span>
    </div>
  );
}

function ScenarioRow({ isRecommended, scenario }: { isRecommended?: boolean; scenario: ScenarioResult }) {
  return (
    <tr className={`border-b border-border/50 ${isRecommended ? "bg-primary/5" : ""}`}>
      <td className="p-2">
        <span className="font-semibold">{scenario.scenario.label}</span>
        {isRecommended ? <span className="mr-2 text-[11px] text-primary">پیشنهادی</span> : null}
        <p className="text-[11px] text-muted-foreground">{scenario.scenario.legalReference}</p>
      </td>
      <td className="xennic-numeric p-2">{compactNumber(scenario.offsetPriceTomanPerKwh)}</td>
      <td className="xennic-numeric p-2">{compactNumber(scenario.exportPriceTomanPerKwh)}</td>
      <td className="xennic-numeric p-2">{percent(scenario.selfConsumptionShare, 0)}</td>
      <td className="xennic-numeric p-2">
        {compactToman(scenario.annualSavingToman + scenario.annualExportRevenueToman)}
      </td>
      <td className="xennic-numeric p-2">{years(scenario.paybackYears)}</td>
      <td className="xennic-numeric p-2">{compactToman(scenario.npvToman)}</td>
      <td className="xennic-numeric p-2">{scenario.irr === null ? "—" : percent(scenario.irr, 1)}</td>
      <td className="xennic-numeric p-2">{compactNumber(scenario.lcoeTomanPerKwh)}</td>
    </tr>
  );
}
