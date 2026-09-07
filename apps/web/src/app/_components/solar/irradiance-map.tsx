"use client";

import { useEffect, useMemo, useState } from "react";
import { resourceForProvince } from "@xennic/shared";
import { compactNumber } from "@/lib/solar/format";

/**
 * نقشه‌ی تابش ایران — رویکردِ Google Project Sunroof:
 * مرزهای واقعی استان‌ها (GeoJSON ساده‌شده، منبع OpenStreetMap/ODbL) به‌صورت
 * SVG رسم می‌شوند و رنگِ هر استان بر اساس تابش سالانه (kWh/m²·روز) است.
 * کلیک روی استان، آن را به‌عنوان محل پروژه انتخاب می‌کند.
 */

interface ProvinceShape {
  code: string;
  nameFa: string;
  nameEn: string;
  centroid: [number, number];
  rings: Array<Array<[number, number]>>;
}

interface GeoFile {
  license?: string;
  provinces: ProvinceShape[];
}

const DATA_URL = "/data/iran-provinces.json";

/** مقیاسِ رنگ از کم‌تابش (کرم) تا پُرتابش (نارنجیِ تند) */
const STOPS: Array<[number, string]> = [
  [0, "#FDE68A"],
  [0.25, "#FCD34D"],
  [0.5, "#FBBF24"],
  [0.75, "#F59E0B"],
  [1, "#EA580C"],
];

function colorFor(ratio: number): string {
  const t = Math.min(1, Math.max(0, ratio));
  for (let index = 1; index < STOPS.length; index += 1) {
    const [stop, color] = STOPS[index]!;
    const [prevStop, prevColor] = STOPS[index - 1]!;
    if (t <= stop) {
      const local = (t - prevStop) / Math.max(1e-9, stop - prevStop);
      return mix(prevColor, color, local);
    }
  }
  return STOPS[STOPS.length - 1]![1];
}

function mix(from: string, to: string, ratio: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const r = Math.round(a[0] + (b[0] - a[0]) * ratio);
  const g = Math.round(a[1] + (b[1] - a[1]) * ratio);
  const bl = Math.round(a[2] + (b[2] - a[2]) * ratio);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export interface IrradianceMapProps {
  selected?: string;
  onSelect?: (provinceCode: string) => void;
  /** ارتفاعِ ناحیه‌ی نقشه (پیکسل) */
  height?: number;
}

export function IrradianceMap({ selected, onSelect, height = 560 }: IrradianceMapProps) {
  const [geo, setGeo] = useState<GeoFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(DATA_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<GeoFile>;
      })
      .then((data) => {
        if (!cancelled) setGeo(data);
      })
      .catch(() => {
        if (!cancelled) setError("داده‌ی مرز استان‌ها بارگیری نشد");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const view = useMemo(() => {
    if (!geo) return null;
    const provinces = geo.provinces;
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const province of provinces) {
      for (const ring of province.rings) {
        for (const [lon, lat] of ring) {
          if (lon < minX) minX = lon;
          if (lon > maxX) maxX = lon;
          if (lat < minY) minY = lat;
          if (lat > maxY) maxY = lat;
        }
      }
    }
    const lat0 = (minY + maxY) / 2;
    const kx = Math.cos((lat0 * Math.PI) / 180);
    const project = (lon: number, lat: number): [number, number] => [(lon - minX) * kx, maxY - lat];
    const width = (maxX - minX) * kx;
    const heightDeg = maxY - minY;
    return { project, width, heightDeg, provinces };
  }, [geo]);

  const resources = useMemo(() => {
    const map = new Map<string, number>();
    for (const province of view?.provinces ?? []) {
      map.set(province.code, resourceForProvince(province.code).annualGhiKwhM2Day);
    }
    return map;
  }, [view]);

  const scale = useMemo(() => {
    const values = [...resources.values()];
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [resources]);

  if (error) {
    return <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">{error}</p>;
  }

  if (!view) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-border bg-muted/20 text-sm text-muted-foreground"
        style={{ height }}
      >
        در حال بارگیری مرز استان‌ها…
      </div>
    );
  }

  const padding = 8;
  const viewBox = `${-padding} ${-padding} ${view.width + padding * 2} ${view.heightDeg + padding * 2}`;
  const active = hovered ?? selected ?? null;
  const activeProvince = view.provinces.find((province) => province.code === active) ?? null;
  const activeGhi = active ? (resources.get(active) ?? 0) : 0;

  return (
    <div className="grid gap-3">
      <div className="relative" dir="rtl">
        <svg
          aria-label="نقشه تابش سالانه ایران"
          className="w-full rounded-xl border border-border bg-sky-50/40 dark:bg-sky-950/20"
          role="img"
          style={{ height }}
          viewBox={viewBox}
        >
          {view.provinces.map((province) => {
            const ghi = resources.get(province.code) ?? 0;
            const ratio = (ghi - scale.min) / Math.max(0.001, scale.max - scale.min);
            const path = province.rings
              .map((ring) => {
                const points = ring
                  .map(([lon, lat]) => {
                    const [x, y] = view.project(lon, lat);
                    return `${x.toFixed(3)},${y.toFixed(3)}`;
                  })
                  .join(" ");
                return `M${points} Z`;
              })
              .join(" ");
            const isActive = active === province.code;
            const isSelected = selected === province.code;
            return (
              <path
                className="cursor-pointer transition-[fill-opacity,stroke-width]"
                d={path}
                fill={colorFor(ratio)}
                fillOpacity={isActive ? 1 : 0.92}
                key={province.code}
                onClick={() => onSelect?.(province.code)}
                onMouseEnter={() => setHovered(province.code)}
                onMouseLeave={() => setHovered(null)}
                stroke={isSelected ? "#0F172A" : "#FFFFFF"}
                strokeWidth={isSelected ? 1.4 : 0.5}
              >
                <title>{`${province.nameFa}: ${compactNumber(ghi, 2)} کیلووات‌ساعت بر مترمربع در روز`}</title>
              </path>
            );
          })}
          {view.provinces.map((province) => {
            const [cx, cy] = view.project(province.centroid[0], province.centroid[1]);
            return (
              <text
                className="pointer-events-none select-none fill-slate-900/80 dark:fill-slate-100/90"
                fontSize={Math.max(0.22, view.width * 0.014)}
                key={`label-${province.code}`}
                textAnchor="middle"
                x={cx}
                y={cy}
              >
                {province.nameFa}
              </text>
            );
          })}
        </svg>

        {activeProvince ? (
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg border border-border bg-background/95 px-3 py-2 text-xs shadow-sm">
            <p className="font-bold">{activeProvince.nameFa}</p>
            <p className="xennic-numeric text-muted-foreground">{compactNumber(activeGhi, 2)} kWh/m²·day</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          راهنما: {compactNumber(scale.min, 2)} ← تابش سالانه (کیلووات‌ساعت بر مترمربع در روز) →{" "}
          {compactNumber(scale.max, 2)}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-24 rounded-sm bg-gradient-to-l from-[#EA580C] via-[#FBBF24] to-[#FDE68A]" />
          <span>کم ← زیاد</span>
        </span>
      </div>
      {typeof geo?.license === "string" ? (
        <p className="text-[11px] leading-5 text-muted-foreground">
          مرزها: مشتق از OpenStreetMap — {geo.license}
        </p>
      ) : null}
      <p className="text-[11px] leading-5 text-muted-foreground">
        اعداد، تابش روی سطحِ افقی هستند؛ تولید واقعی در «طرح توجیهی» با توجه به شیب، سمت و سایه‌ی سقف شما
        محاسبه می‌شود.
      </p>
    </div>
  );
}
