"use client";

import {
  MODULE_CATALOG,
  PROVINCES,
  estimateSolarResource,
  findModule,
  layoutArray,
  polygonArea,
  provinceMeta,
  type FeasibilityInput,
  type ModuleSpec,
  type ObstacleBox,
  type Point2,
  type RoofPlaneInput,
} from "@xennic/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Button, Card, CardContent, Input, Label } from "@xennic/ui";
import { compactNumber } from "@/lib/solar/format";
import { updateDraft, useSolarDraft } from "@/lib/solar/draft";

const GRID_M = 24; // ابعادِ بوم (متر)
const SNAP_M = 0.25;

type Mode = "plane" | "obstacle";

/**
 * طراح سقف (شبیه ویرایشگرِ سقف در Google Project Sunroof):
 * کاربر چندضلعی سقف و موانع را روی یک شبکه‌ی متری ترسیم می‌کند و چیدمانِ
 * پنل‌ها با احتسابِ حریم، موانع، سایه و گامِ ردیف همان لحظه محاسبه می‌شود.
 */
/**
 * لایه‌ی بیرونی فقط پیش‌نویس را می‌خواند؛ ویرایشگر با کلیدِ `revision` بازسازی
 * می‌شود تا مقداردهیِ اولیه خارج از useEffect انجام شود (قاعده‌ی React 19).
 */
export function RoofDesigner() {
  const [draftSnapshot] = useSolarDraft();
  return <RoofEditor initial={draftSnapshot.input} key={draftSnapshot.revision} />;
}

function RoofEditor({ initial }: { initial: FeasibilityInput }) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement | null>(null);
  // اگر کاربر از طرح توجیهی برگشته باشد، صفحه‌ی ترسیم‌شده‌ی قبلی بازیابی می‌شود
  const plane0 = initial.roof.planes?.[0];

  const [province, setProvince] = useState(initial.site.province);
  const [mode, setMode] = useState<Mode>("plane");
  const [vertices, setVertices] = useState<Point2[]>(plane0 ? [...plane0.polygon] : []);
  const [obstacles, setObstacles] = useState<ObstacleBox[]>(plane0 ? [...(plane0.obstacles ?? [])] : []);
  const [tiltDeg, setTiltDeg] = useState(plane0?.tiltDeg ?? 25);
  const [azimuthDeg, setAzimuthDeg] = useState(plane0?.azimuthDeg ?? 180);
  const [setbackM, setSetbackM] = useState(plane0?.setbackM ?? 0.5);
  const [obstacleSize, setObstacleSize] = useState({ widthM: 2, depthM: 2, heightM: 3 });
  const [moduleModel, setModuleModel] = useState(initial.design?.moduleModel ?? "mono-perc-550");

  const meta = provinceMeta(province);
  const resource = useMemo(
    () =>
      estimateSolarResource({
        lat: meta?.lat ?? 35.7,
        lon: meta?.lon ?? 51.42,
        elevationM: meta?.elevationM,
      }),
    [meta],
  );

  const pvModule: ModuleSpec = useMemo(() => findModule(moduleModel), [moduleModel]);

  const plane: RoofPlaneInput | null = useMemo(() => {
    if (vertices.length < 3) return null;
    return { id: "main", polygon: vertices, tiltDeg, azimuthDeg, obstacles, setbackM };
  }, [azimuthDeg, obstacles, setbackM, tiltDeg, vertices]);

  const layout = useMemo(() => {
    if (!plane) return null;
    try {
      return layoutArray(plane, pvModule, { latDeg: meta?.lat ?? 35.7, resource });
    } catch {
      return null;
    }
  }, [meta, plane, pvModule, resource]);

  const area = useMemo(() => (vertices.length >= 3 ? polygonArea(vertices) : 0), [vertices]);

  function toMeters(event: React.MouseEvent<SVGSVGElement>): Point2 {
    const svg = svgRef.current;
    if (!svg) return [0, 0];
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * GRID_M;
    const y = ((event.clientY - rect.top) / rect.height) * GRID_M;
    const snap = (value: number): number =>
      Math.min(GRID_M, Math.max(0, Math.round(value / SNAP_M) * SNAP_M));
    return [snap(x), snap(y)];
  }

  function handleClick(event: React.MouseEvent<SVGSVGElement>): void {
    const [x, y] = toMeters(event);
    if (mode === "obstacle") {
      setObstacles((current) => [...current, { x, y, ...obstacleSize, label: `مانع ${current.length + 1}` }]);
      return;
    }
    // بستنِ چندضلعی با کلیک نزدیکِ نقطه‌ی اول
    const first = vertices[0];
    if (first && vertices.length >= 3 && Math.hypot(first[0] - x, first[1] - y) < 0.6) return;
    setVertices((current) => [...current, [x, y]]);
  }

  function undo(): void {
    if (mode === "obstacle") setObstacles((current) => current.slice(0, -1));
    else setVertices((current) => current.slice(0, -1));
  }

  function reset(): void {
    setVertices([]);
    setObstacles([]);
  }

  function useDesign(): void {
    if (!plane || !layout) return;
    updateDraft({
      ...initial,
      site: { ...initial.site, province },
      roof: { planes: [plane], tiltDeg, azimuthDeg, setbackM },
      design: { ...initial.design, moduleModel },
    });
    router.push("/solar/feasibility-report");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ModeButton active={mode === "plane"} label="ترسیم سقف" onClick={() => setMode("plane")} />
          <ModeButton active={mode === "obstacle"} label="افزودن مانع" onClick={() => setMode("obstacle")} />
          <Button onClick={undo} size="sm" type="button" variant="outline">
            بازگشت
          </Button>
          <Button onClick={reset} size="sm" type="button" variant="outline">
            پاک‌کردن
          </Button>
          <Button disabled={!layout} onClick={useDesign} size="sm" type="button">
            ادامه در طرح توجیهی
          </Button>
        </div>

        <svg
          aria-label="بوم ترسیم سقف"
          className="w-full touch-none rounded-xl border border-border bg-slate-50 dark:bg-slate-950/40"
          onClick={handleClick}
          ref={svgRef}
          viewBox={`0 0 ${GRID_M} ${GRID_M}`}
        >
          {Array.from({ length: GRID_M + 1 }, (_, index) => (
            <g
              key={`grid-${index}`}
              stroke={index % 5 === 0 ? "#94A3B8" : "#E2E8F0"}
              strokeWidth={index % 5 === 0 ? 0.04 : 0.02}
            >
              <line x1={index} x2={index} y1={0} y2={GRID_M} />
              <line x1={0} x2={GRID_M} y1={index} y2={index} />
            </g>
          ))}

          {plane ? (
            <polygon
              className="cursor-pointer"
              fill="rgba(16,185,129,0.08)"
              points={vertices.map(([x, y]) => `${x},${y}`).join(" ")}
              stroke="#047857"
              strokeWidth={0.08}
            />
          ) : null}

          {vertices.map(([x, y], index) => (
            <g key={`vertex-${index}`}>
              <circle cx={x} cy={y} fill={index === 0 ? "#F59E0B" : "#0F172A"} r={0.22} />
              <text className="fill-slate-500" fontSize={0.5} x={x + 0.3} y={y - 0.3}>
                {index + 1}
              </text>
            </g>
          ))}

          {obstacles.map((obstacle, index) => (
            <g key={`obstacle-${index}`}>
              <rect
                fill="rgba(239,68,68,0.25)"
                height={obstacle.depthM}
                stroke="#B91C1C"
                strokeWidth={0.06}
                width={obstacle.widthM}
                x={obstacle.x - obstacle.widthM / 2}
                y={obstacle.y - obstacle.depthM / 2}
              />
              <text
                className="fill-red-700"
                fontSize={0.45}
                textAnchor="middle"
                x={obstacle.x}
                y={obstacle.y}
              >
                {obstacle.heightM}m
              </text>
            </g>
          ))}

          {layout?.panels.map((panel, index) => {
            const length = panel.orientation === "portrait" ? pvModule.lengthM : pvModule.widthM;
            const width = panel.orientation === "portrait" ? pvModule.widthM : pvModule.lengthM;
            const fill =
              panel.solarAccess > 0.95 ? "#0EA5E9" : panel.solarAccess > 0.85 ? "#38BDF8" : "#FBBF24";
            return (
              <rect
                className="pointer-events-none"
                fill={fill}
                fillOpacity={0.75}
                height={width}
                key={`panel-${index}`}
                rx={0.05}
                stroke="#0369A1"
                strokeWidth={0.02}
                width={length}
                x={panel.x - length / 2}
                y={panel.y - width / 2}
              />
            );
          })}
        </svg>

        <p className="text-xs leading-6 text-muted-foreground">
          {mode === "plane"
            ? "روی بوم کلیک کنید تا گوشه‌های سقف را مشخص کنید (حداقل ۳ گوشه). نقطه‌ی نارنجی نقطه‌ی شروع است."
            : "روی بوم کلیک کنید تا مانع (دودکش، کانال، کلاهک…) قرار گیرد. اندازه را در پنلِ سمت چپ تنظیم کنید."}{" "}
          هر خانه‌ی کوچک ۱ متر است.
        </p>
      </div>

      <Card className="bg-card/60">
        <CardContent className="grid gap-4 p-6">
          <div className="grid gap-1.5">
            <Label htmlFor="province">استان</Label>
            <select
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
              id="province"
              onChange={(event) => setProvince(event.target.value)}
              value={province}
            >
              {PROVINCES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.nameFa}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumberField id="tilt" label="شیب (درجه)" onChange={setTiltDeg} step={5} value={tiltDeg} />
            <NumberField
              id="azimuth"
              label="سمت (۱۸۰=جنوب)"
              onChange={setAzimuthDeg}
              step={10}
              value={azimuthDeg}
            />
            <NumberField
              id="setback"
              label="حریم از لبه (m)"
              onChange={setSetbackM}
              step={0.1}
              value={setbackM}
            />
            <NumberField
              id="height"
              label="ارتفاع مانع (m)"
              onChange={(value) => setObstacleSize((current) => ({ ...current, heightM: value }))}
              step={0.5}
              value={obstacleSize.heightM}
            />
            <NumberField
              id="obstacle-w"
              label="پهنای مانع (m)"
              onChange={(value) => setObstacleSize((current) => ({ ...current, widthM: value }))}
              step={0.5}
              value={obstacleSize.widthM}
            />
            <NumberField
              id="obstacle-d"
              label="عمق مانع (m)"
              onChange={(value) => setObstacleSize((current) => ({ ...current, depthM: value }))}
              step={0.5}
              value={obstacleSize.depthM}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="module">ماژول</Label>
            <select
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
              id="module"
              onChange={(event) => setModuleModel(event.target.value)}
              value={moduleModel}
            >
              {MODULE_CATALOG.map((item) => (
                <option key={item.model} value={item.model}>
                  {item.technology.toUpperCase()} — {item.wattPmp}W
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2 rounded-lg border border-border p-3 text-sm">
            <Metric label="مساحت سقف" value={`${compactNumber(area, 1)} m²`} />
            <Metric label="مساحت مفید" value={`${compactNumber(layout?.usableAreaM2 ?? 0, 1)} m²`} />
            <Metric label="تعداد پنل" value={compactNumber(layout?.panelCount ?? 0)} />
            <Metric label="ظرفیت" value={`${compactNumber(layout?.capacityKwp ?? 0, 2)} kWp`} />
            <Metric label="نسبت پوشش (GCR)" value={compactNumber(layout?.gcr ?? 0, 2)} />
            <Metric
              label="میانگین دسترسی خورشیدی"
              value={compactNumber(layout?.weightedSolarAccess ?? 0, 3)}
            />
            <Metric label="گام ردیف" value={`${compactNumber(layout?.rowPitchM ?? 0, 2)} m`} />
          </div>

          {layout?.notes.length ? (
            <ul className="grid gap-1 rounded-lg border border-amber-300/40 bg-amber-50/60 p-3 text-xs leading-6 dark:bg-amber-950/20">
              {layout.notes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          ) : null}

          <p className="text-xs text-muted-foreground">
            بعد از تأیید، بقیه‌ی مراحل (رشته‌بندی، اینورتر، سناریوهای فروش برق) در{" "}
            <Link className="text-primary underline" href="/solar/feasibility-report">
              طرح توجیهی
            </Link>{" "}
            محاسبه می‌شود.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ModeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/50"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/50 py-1 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="xennic-numeric text-xs font-bold">{value}</span>
    </div>
  );
}
