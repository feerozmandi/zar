/**
 * مدل‌سازی سقف و چیدمان آرایه (Roof Modeling & Array Layout) — لایه‌ی دومِ Sunroof.
 *
 * ورودیِ کاربر یک چندضلعی در صفحه‌ی سقف (به متر) است؛ خروجی تعداد، محل و
 * دسترسی خورشیدیِ تک‌تک پنل‌ها. چیدمان با رویکردِ «شبکه‌ی اشغال + پر کردنِ حریصانه»
 * انجام می‌شود:
 *  ۱. صفحه با تفکیک ۰٫۲۵ متر شبکه‌بندی و سلول‌های مجاز (داخل چندضلعی، رعایت حریم،
 *     بیرون از موانع) مشخص می‌شوند.
 *  ۲. ردیف‌ها در راستای پهنای سقف چیده می‌شوند و گامِ عمودی آن‌ها طوری انتخاب
 *     می‌شود که در ساعت‌های تعیین‌کننده‌ی زمستان سایه‌ی ردیف جلو روی عقبی نیفتد.
 *  ۳. برای هر پنل، افق محلی از موانع (و در صورت نیاز ردیف جلو) ساخته و دسترسی
 *     خورشیدیِ سالانه محاسبه می‌شود — همان رنگ‌بندیِ پنل‌به‌پنل در Sunroof.
 */

import { buildHorizon, interRowObstacle, mergeHorizons, minimumRowPitchM, solarAccess, type ObstacleBox } from "./shading.js";
import type { SolarResource } from "./climate.js";

/** نقطه در صفحه‌ی سقف (متر) */
export type Point2 = readonly [number, number];

export interface RoofPlaneInput {
  /** شناسه‌ی اختیاری (برای نگه‌داری چند صفحه در پایگاه‌داده) */
  id?: string;
  /** چندضلعیِ صفحه در دستگاه محلی (رئوس پشت‌سرهم؛ جهت‌گیری مهم نیست) */
  polygon: Point2[];
  /** زاویه‌ی شیب (درجه) */
  tiltDeg: number;
  /** سمت‌الرأس (۱۸۰ = جنوب) */
  azimuthDeg: number;
  /** موانع روی سقف (دودکش، کانال، کلاهک…) */
  obstacles?: ObstacleBox[];
  /** موانع بیرونیِ محوطه (ساختمان مجاور، درخت) — فاصله/ارتفاع به متر */
  surroundings?: ObstacleBox[];
  /** حریم اجباری از لبه‌ی سقف (متر) — دسترسی و ایمنی حریق */
  setbackM?: number;
  /** فاصله‌ی آزادِ دورِ هر مانع (متر) */
  obstacleClearanceM?: number;
}

export interface PanelPlacement {
  /** شماره‌ی ردیف (۰ = بالاترین ردیف) */
  row: number;
  /** شماره‌ی ستون */
  column: number;
  /** مرکز پنل در صفحه (متر) */
  x: number;
  y: number;
  /** جهت‌گیری ماژول */
  orientation: "portrait" | "landscape";
  /** دسترسی خورشیدیِ سالانه (۰ تا ۱) */
  solarAccess: number;
  /** دسترسی خورشیدیِ ماهانه */
  monthlyAccess: number[];
  /** توان نصبیِ این پنل (kWp) */
  kwp: number;
}

export interface ArrayLayout {
  /** تعداد کل پنل‌ها */
  panelCount: number;
  /** ظرفیت نصبیِ آرایه (kWp) */
  capacityKwp: number;
  /** مساحت اشغال‌شده توسط پنل‌ها (m²) */
  panelAreaM2: number;
  /** مساحت مفیدِ قابل‌استفاده (m²) — پس از حریم و موانع */
  usableAreaM2: number;
  /** نسبت پوشش (Ground Coverage Ratio) */
  gcr: number;
  /** گام ردیف‌ها (متر) */
  rowPitchM: number;
  /** تعداد ردیف‌ها */
  rowCount: number;
  /** میانگینِ وزنیِ دسترسی خورشیدیِ آرایه */
  weightedSolarAccess: number;
  panels: PanelPlacement[];
  /** پیام‌های راهنما برای کاربر (مثلاً سایه‌ی زیاد یا مساحت کم) */
  notes: string[];
}

export interface ModuleSpec {
  /** توان نامی STC (W) */
  wattPmp: number;
  /** طولِ ماژول در راستای شیب در حالت portrait (متر) */
  lengthM: number;
  /** عرض ماژول (متر) */
  widthM: number;
  /** بازده ماژول (۰ تا ۱) */
  efficiency: number;
}

const GRID_RESOLUTION_M = 0.25;

/** مساحت چندضلعی با رابطه‌ی Shoelace (متر مربع) */
export function polygonArea(polygon: readonly Point2[]): number {
  let sum = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j] ?? [0, 0];
    const b = polygon[i] ?? [0, 0];
    sum += (a[0] ?? 0) * (b[1] ?? 0) - (b[0] ?? 0) * (a[1] ?? 0);
  }
  return Math.abs(sum) / 2;
}

/** مرکز ثقلِ مساحتیِ چندضلعی */
export function polygonCentroid(polygon: readonly Point2[]): [number, number] {
  let cx = 0;
  let cy = 0;
  let area = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j] ?? [0, 0];
    const b = polygon[i] ?? [0, 0];
    const cross = (a[0] ?? 0) * (b[1] ?? 0) - (b[0] ?? 0) * (a[1] ?? 0);
    area += cross;
    cx += ((a[0] ?? 0) + (b[0] ?? 0)) * cross;
    cy += ((a[1] ?? 0) + (b[1] ?? 0)) * cross;
  }
  if (Math.abs(area) < 1e-9) return [polygon[0]?.[0] ?? 0, polygon[0]?.[1] ?? 0];
  return [cx / (3 * area), cy / (3 * area)];
}

/** آزمون نقطه داخل چندضلعی (ray casting) */
export function pointInPolygon(point: Point2, polygon: readonly Point2[]): boolean {
  let inside = false;
  const [px, py] = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j] ?? [0, 0];
    const b = polygon[i] ?? [0, 0];
    const xi = a[0] ?? 0;
    const yi = a[1] ?? 0;
    const xj = b[0] ?? 0;
    const yj = b[1] ?? 0;
    const intersects = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-12) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** کمینه فاصله‌ی نقطه تا پاره‌خط */
function distanceToSegment(point: Point2, a: Point2, b: Point2): number {
  const [px, py] = point;
  const dx = (b[0] ?? 0) - (a[0] ?? 0);
  const dy = (b[1] ?? 0) - (a[1] ?? 0);
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(px - (a[0] ?? 0), py - (a[1] ?? 0));
  const t = Math.max(
    0,
    Math.min(1, ((px - (a[0] ?? 0)) * dx + (py - (a[1] ?? 0)) * dy) / lengthSquared),
  );
  return Math.hypot(px - ((a[0] ?? 0) + t * dx), py - ((a[1] ?? 0) + t * dy));
}

/** کمینه فاصله‌ی نقطه تا مرز چندضلعی */
export function distanceToPolygonEdge(point: Point2, polygon: readonly Point2[]): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    minimum = Math.min(minimum, distanceToSegment(point, polygon[j] ?? [0, 0], polygon[i] ?? [0, 0]));
  }
  return minimum;
}

export interface LayoutOptions {
  latDeg: number;
  resource: SolarResource;
  /** فاصله‌ی بین پنل‌ها در یک ردیف (متر) */
  columnGapM?: number;
  /** جهت‌گیری ترجیحی؛ در غیر این صورت هر دو امتحان می‌شود */
  orientation?: "portrait" | "landscape";
  /** سایه‌اندازیِ ردیف روی ردیف لحاظ شود؟ (پیش‌فرض true) */
  includeInterRowShading?: boolean;
  /** بیشینه‌ی تعداد پنل (محدودیت بودجه/ظرفیت) */
  maxPanels?: number;
}

/**
 * چیدمان آرایه روی یک صفحه‌ی سقف.
 */
export function layoutArray(plane: RoofPlaneInput, module: ModuleSpec, options: LayoutOptions): ArrayLayout {
  const notes: string[] = [];
  const polygon = plane.polygon;
  if (polygon.length < 3) {
    return {
      panelCount: 0,
      capacityKwp: 0,
      panelAreaM2: 0,
      usableAreaM2: 0,
      gcr: 0,
      rowPitchM: 0,
      rowCount: 0,
      weightedSolarAccess: 0,
      panels: [],
      notes: ["چندضلعی سقف باید دست‌کم ۳ رأس داشته باشد."],
    };
  }

  const setback = plane.setbackM ?? 0.5;
  const clearance = plane.obstacleClearanceM ?? 0.4;
  const obstacles = [...(plane.obstacles ?? []), ...(plane.surroundings ?? [])];

  // ── ۱. شبکه‌ی اشغال ───────────────────────────────────────────────
  const xs = polygon.map((p) => p[0] ?? 0);
  const ys = polygon.map((p) => p[1] ?? 0);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const columns = Math.floor((maxX - minX) / GRID_RESOLUTION_M) + 1;
  const rows = Math.floor((maxY - minY) / GRID_RESOLUTION_M) + 1;
  const cellX = (column: number) => minX + column * GRID_RESOLUTION_M;
  const cellY = (row: number) => minY + row * GRID_RESOLUTION_M;

  const free: boolean[][] = [];
  let usableCells = 0;
  for (let r = 0; r < rows; r += 1) {
    const line: boolean[] = [];
    for (let c = 0; c < columns; c += 1) {
      const point: Point2 = [cellX(c), cellY(r)];
      const inside = pointInPolygon(point, polygon);
      const farFromEdge = distanceToPolygonEdge(point, polygon) >= setback;
      const clearOfObstacles = obstacles.every((box) => {
        const dx = Math.abs((point[0] ?? 0) - box.x) - box.widthM / 2;
        const dy = Math.abs((point[1] ?? 0) - box.y) - box.depthM / 2;
        return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) > clearance;
      });
      const ok = inside && farFromEdge && clearOfObstacles;
      line.push(ok);
      if (ok) usableCells += 1;
    }
    free.push(line);
  }

  const usableAreaM2 = Math.round(usableCells * GRID_RESOLUTION_M ** 2 * 100) / 100;
  if (usableAreaM2 <= 0) {
    notes.push("با این حریم و موانع، فضای قابل‌استفاده‌ای روی سقف باقی نمی‌ماند.");
  }

  // ── ۲. چیدمان ردیفی ──────────────────────────────────────────────
  const pitch = options.orientation === "landscape"
    ? minimumRowPitchM({ moduleLengthM: module.widthM, tiltDeg: plane.tiltDeg, latDeg: options.latDeg })
    : minimumRowPitchM({ moduleLengthM: module.lengthM, tiltDeg: plane.tiltDeg, latDeg: options.latDeg });

  const panelWidth = options.orientation === "landscape" ? module.lengthM : module.widthM;
  const panelDepth = options.orientation === "landscape" ? module.widthM : module.lengthM;
  const columnGap = options.columnGapM ?? 0.03;
  const rowPitch = Math.max(pitch, panelDepth);

  const widthCells = Math.max(1, Math.ceil(panelWidth / GRID_RESOLUTION_M));
  const depthCells = Math.max(1, Math.ceil(panelDepth / GRID_RESOLUTION_M));
  const gapCells = Math.max(1, Math.ceil(columnGap / GRID_RESOLUTION_M));
  const pitchCells = Math.max(depthCells + 1, Math.ceil(rowPitch / GRID_RESOLUTION_M));

  const occupied = free.map((line) => line.map((value) => !value)); // true = مسدود
  const panels: PanelPlacement[] = [];
  let panelRow = 0;

  /** آیا در این باندِ افقی دست‌کم یک پنل جا می‌گیرد؟ */
  const rowHasRoom = (startRow: number): boolean => {
    for (let c = 0; c + widthCells <= columns; c += 1) {
      let freeWindow = true;
      for (let rr = startRow; rr < startRow + depthCells && freeWindow; rr += 1) {
        for (let cc = c; cc < c + widthCells; cc += 1) {
          if (occupied[rr]?.[cc] === true) {
            freeWindow = false;
            break;
          }
        }
      }
      if (freeWindow) return true;
    }
    return false;
  };

  // ردیفِ آغازین را از نخستین باندِ خالی شروع می‌کنیم تا ردیفِ اول هدر نرود
  let startRow = 0;
  while (startRow + depthCells <= rows && !rowHasRoom(startRow)) startRow += 1;

  for (let r = startRow; r + depthCells <= rows; r += pitchCells) {
    let c = 0;
    let columnIndex = 0;
    while (c + widthCells <= columns) {
      let fits = true;
      for (let rr = r; rr < r + depthCells && fits; rr += 1) {
        for (let cc = c; cc < c + widthCells; cc += 1) {
          if (occupied[rr]?.[cc] === true) {
            fits = false;
            break;
          }
        }
      }
      if (fits) {
        for (let rr = r; rr < r + depthCells; rr += 1) {
          for (let cc = c; cc < c + widthCells; cc += 1) {
            const line = occupied[rr];
            if (line) line[cc] = true;
          }
        }
        panels.push({
          row: panelRow,
          column: columnIndex,
          x: Math.round((cellX(c) + panelWidth / 2) * 100) / 100,
          y: Math.round((cellY(r) + panelDepth / 2) * 100) / 100,
          orientation: options.orientation ?? "portrait",
          solarAccess: 1,
          monthlyAccess: [],
          kwp: Math.round((module.wattPmp / 1000) * 1000) / 1000,
        });
        columnIndex += 1;
        c += widthCells + gapCells;
      } else {
        c += 1;
      }
    }
    panelRow += 1;
  }

  const limited = options.maxPanels ? panels.slice(0, options.maxPanels) : panels;

  // ── ۳. دسترسی خورشیدیِ هر پنل ────────────────────────────────────
  const interRow = options.includeInterRowShading === false ? null : interRowObstacle({
    pitchM: rowPitch,
    moduleLengthM: panelDepth,
    tiltDeg: plane.tiltDeg,
  });

  let accessSum = 0;
  for (const panel of limited) {
    const localObstacles: ObstacleBox[] = obstacles.map((box) => ({
      ...box,
      // موانع نسبت به مرکز پنل: فقط جابه‌جاییِ دستگاه مختصات
      x: box.x - panel.x,
      y: box.y - panel.y,
    }));
    // ردیفِ بالاتر (y کمتر) روی این پنل سایه می‌اندازد
    if (interRow) localObstacles.push({ ...interRow, x: 0, y: interRow.y });

    const horizon = mergeHorizons(
      buildHorizon({ x: 0, y: 0 }, localObstacles),
      buildHorizon({ x: 0, y: 0 }, (plane.surroundings ?? []).map((box) => ({
        ...box,
        x: box.x - panel.x,
        y: box.y - panel.y,
      }))),
    );
    const access = solarAccess({
      latDeg: options.latDeg,
      monthlyGhiKwhM2Day: options.resource.monthlyGhiKwhM2Day,
      horizon,
      tiltDeg: plane.tiltDeg,
      surfaceAzimuthDeg: plane.azimuthDeg,
    });
    panel.solarAccess = access.annual;
    panel.monthlyAccess = access.monthly;
    accessSum += access.annual;
  }

  const panelCount = limited.length;
  const weightedSolarAccess = panelCount > 0 ? Math.round((accessSum / panelCount) * 1000) / 1000 : 0;
  const panelAreaM2 = Math.round(panelCount * module.lengthM * module.widthM * 100) / 100;

  if (panelCount > 0 && weightedSolarAccess < 0.75) {
    notes.push(
      `میانگین دسترسی خورشیدی ${Math.round(weightedSolarAccess * 100)}٪ است؛ اصلاح جانمایی یا حذف موانع توصیه می‌شود.`,
    );
  }
  if (panelCount === 0) {
    notes.push("هیچ پنلی در این صفحه جای نمی‌گیرد؛ مساحت یا حریم را بازنگری کنید.");
  }

  return {
    panelCount,
    capacityKwp: Math.round(panelCount * (module.wattPmp / 1000) * 100) / 100,
    panelAreaM2,
    usableAreaM2,
    gcr: usableAreaM2 > 0 ? Math.round((panelAreaM2 / usableAreaM2) * 1000) / 1000 : 0,
    rowPitchM: Math.round(rowPitch * 100) / 100,
    rowCount: panelRow,
    weightedSolarAccess,
    panels: limited,
    notes,
  };
}

/**
 * برآورد سریعِ ظرفیت از روی مساحت (برای حالت «فقط مساحت سقف»).
 * فرض: ۶٫۵ m² به ازای هر kWp با احتساب فضاهای دسترسی (سازگار با AREA_PER_KWP_M2).
 */
export function capacityFromRoofArea(roofAreaM2: number, shadingFactor = 0.08): number {
  const usable = roofAreaM2 * (1 - Math.min(Math.max(shadingFactor, 0), 0.9));
  return Math.round((usable / 6.5) * 10) / 10;
}
