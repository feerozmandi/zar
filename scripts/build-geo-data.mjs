#!/usr/bin/env node
/**
 * تولید دارایی‌های جغرافیایی ماژول خورشیدی (نقشه‌ی تابش شبیه Google Project Sunroof).
 *
 * منبع داده: بسته‌ی npm «iran-geojson@1.0.0» (MIT)
 *   مشتق از OpenStreetMap — پروانه‌ی داده: ODbL 1.0 (www.openstreetmap.org/copyright)
 *
 * خروجی‌ها (داخل apps/web/public/data — خارج از باندل جاوااسکریپت):
 *   iran-provinces.json  — چندضلعی‌های ساده‌شده‌ی ۳۱ استان (+ مرکز ثقل و bbox)
 *   iran-cities.json     — ۱۱۳۲ نقطه‌ی شهری (برای جست‌وجوی نام شهر)
 *
 * اجرا:  node scripts/build-geo-data.mjs [--source <path-to.geojson>] [--tolerance 0.02]
 *
 * نکته: فایل‌های خروجی در مخزن کامیت می‌شوند تا build به اینترنت وابسته نباشد؛
 *       این اسکریپت فقط برای به‌روزرسانیِ دوره‌ایِ داده‌ی مرزی است.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT_DIR = join(ROOT, "apps/web/public/data");

function argValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const SOURCE = argValue("--source");
const TOLERANCE = Number(argValue("--tolerance", "0.02")); // درجه ≈ ۲ کیلومتر
const DECIMALS = 3;

/** دریافت فایل منبع: مسیر محلی یا بسته‌ی npm */
function loadSource() {
  if (SOURCE) return JSON.parse(readFileSync(resolve(SOURCE), "utf8"));
  const dir = mkdtempSync(join(tmpdir(), "iran-geo-"));
  execFileSync("npm", ["pack", "iran-geojson@1.0.0", "--pack-destination", dir], { stdio: "ignore" });
  const tarball = readdirSync(dir).find((f) => f.endsWith(".tgz"));
  if (!tarball) throw new Error("دریافت بسته‌ی iran-geojson ناموفق بود");
  const extracted = join(dir, "package");
  mkdirSync(extracted, { recursive: true });
  execFileSync("tar", ["xzf", join(dir, tarball), "-C", dir], { stdio: "ignore" });
  return JSON.parse(readFileSync(join(extracted, "iran-provinces-cities.geojson"), "utf8"));
}

/** فایل tgz ممکن است gzip باشد؛ tar در بالا از عهده‌اش برمی‌آید، این فقط برای اطمینان است */
void gunzipSync;

// ───────────────────────── هندسه ─────────────────────────

function ringArea(ring) {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j] ?? [0, 0];
    const b = ring[i] ?? [0, 0];
    sum += (a[0] ?? 0) * (b[1] ?? 0) - (b[0] ?? 0) * (a[1] ?? 0);
  }
  return Math.abs(sum) / 2;
}

function ringCentroid(ring) {
  let cx = 0;
  let cy = 0;
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j] ?? [0, 0];
    const b = ring[i] ?? [0, 0];
    const cross = (a[0] ?? 0) * (b[1] ?? 0) - (b[0] ?? 0) * (a[1] ?? 0);
    area += cross;
    cx += ((a[0] ?? 0) + (b[0] ?? 0)) * cross;
    cy += ((a[1] ?? 0) + (b[1] ?? 0)) * cross;
  }
  if (area === 0) return [ring[0]?.[0] ?? 0, ring[0]?.[1] ?? 0];
  return [cx / (3 * area), cy / (3 * area)];
}

function perpendicularDistance(point, start, end) {
  const [px, py] = point;
  const [sx, sy] = start;
  const [ex, ey] = end;
  const dx = ex - sx;
  const dy = ey - sy;
  if (dx === 0 && dy === 0) return Math.hypot(px - sx, py - sy);
  const t = Math.max(0, Math.min(1, ((px - sx) * dx + (py - sy) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (sx + t * dx), py - (sy + t * dy));
}

/** ساده‌سازی داگلاس-پیکر (غیربازگشتی برای پرهیز از سرریز پشته روی چندضلعی‌های بزرگ) */
function simplify(points, tolerance) {
  if (points.length <= 4) return points;
  const keep = new Array(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length > 0) {
    const range = stack.pop();
    if (!range) continue;
    const [first, last] = range;
    let maxDistance = 0;
    let index = -1;
    for (let i = first + 1; i < last; i += 1) {
      const distance = perpendicularDistance(
        points[i] ?? [0, 0],
        points[first] ?? [0, 0],
        points[last] ?? [0, 0],
      );
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }
    if (index !== -1 && maxDistance > tolerance) {
      keep[index] = true;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i] === true);
}

function round(value) {
  const factor = 10 ** DECIMALS;
  return Math.round(value * factor) / factor;
}

// ───────────────────────── نگاشت استان‌ها ─────────────────────────

/** نام انگلیسیِ منبع → کلید canonical پروژه (هم‌راستا با packages/shared/src/solar/provinces.ts) */
const SLUG_BY_SOURCE_NAME = {
  Semnan: "semnan",
  "Razavi Khorasan": "khorasan-razavi",
  Yazd: "yazd",
  "Sistan and Baluchestan": "sistan-va-baluchestan",
  "West Azarbaijan": "azarbayjan-gharbi",
  "East Azarbaijan": "azarbayjan-sharqi",
  Ardebil: "ardabil",
  Gilan: "gilan",
  Kordestan: "kordestan",
  Kermanshah: "kermanshah",
  Ilam: "ilam",
  Khuzestan: "khuzestan",
  "North Khorasan": "khorasan-shomali",
  Bushehr: "bushehr",
  Hormozgan: "hormozgan",
  Mazandaran: "mazandaran",
  Zanjan: "zanjan",
  Qazvin: "qazvin",
  Markazi: "markazi",
  Esfahan: "esfahan",
  "Chahar Mahall and Bakhtiari": "chaharmahal-va-bakhtiari",
  "Kohgiluyeh and Buyer Ahmad": "kohgiluyeh-va-boyerahmad",
  Fars: "fars",
  Kerman: "kerman",
  Hamadan: "hamadan",
  Lorestan: "lorestan",
  Qom: "qom",
  Tehran: "tehran",
  Alborz: "alborz",
  Golestan: "golestan",
};

/**
 * خطای شناخته‌شده‌ی منبع: چندضلعیِ دومِ «Sistan and Baluchestan» در واقع
 * **خراسان جنوبی** است (بازه‌ی lat ۳۰٫۵–۳۵ و طول ۵۵–۶۱ با مرکز بیرجند).
 * منبع آن را با همان id (IR13) و نام تکراری ثبت کرده؛ اینجا تصحیح می‌شود.
 */
const DUPLICATE_NAME_FIX = {
  "Sistan and Baluchestan": "khorasan-jonubi",
};

const PERSIAN_BY_SLUG = {
  tehran: "تهران",
  alborz: "البرز",
  esfahan: "اصفهان",
  kerman: "کرمان",
  "khorasan-razavi": "خراسان رضوی",
  "khorasan-shomali": "خراسان شمالی",
  "khorasan-jonubi": "خراسان جنوبی",
  fars: "فارس",
  khuzestan: "خوزستان",
  kermanshah: "کرمانشاه",
  kordestan: "کردستان",
  gilan: "گیلان",
  mazandaran: "مازندران",
  golestan: "گلستان",
  markazi: "مرکزی",
  qom: "قم",
  qazvin: "قزوین",
  semnan: "سمنان",
  yazd: "یزد",
  hormozgan: "هرمزگان",
  bushehr: "بوشهر",
  "sistan-va-baluchestan": "سیستان و بلوچستان",
  ardabil: "اردبیل",
  "azarbayjan-sharqi": "آذربایجان شرقی",
  "azarbayjan-gharbi": "آذربایجان غربی",
  zanjan: "زنجان",
  hamadan: "همدان",
  lorestan: "لرستان",
  ilam: "ایلام",
  "kohgiluyeh-va-boyerahmad": "کهگیلویه و بویراحمد",
  "chaharmahal-va-bakhtiari": "چهارمحال و بختیاری",
};

// ───────────────────────── اجرا ─────────────────────────

const geojson = loadSource();
const provinces = geojson.features.filter((f) => f.properties?.type === "province");
const cities = geojson.features.filter((f) => f.properties?.type !== "province");

if (provinces.length !== 31) {
  console.warn(`⚠️  تعداد استان‌ها ${provinces.length} است (انتظار: ۳۱) — بررسی منبع`);
}

const outProvinces = [];
const seen = new Set();

for (const feature of provinces) {
  const sourceName = feature.properties?.name;
  const baseSlug = SLUG_BY_SOURCE_NAME[sourceName];
  if (!baseSlug) continue;
  // برچسب تکراریِ منبع: نوبت دوم همان نام، استانِ تصحیح‌شده است (نگاشت بالا)
  const slug = seen.has(baseSlug) ? (DUPLICATE_NAME_FIX[sourceName] ?? baseSlug) : baseSlug;
  if (seen.has(slug)) continue; // چندضلعی تکراری واقعی (جزایر) نادیده گرفته می‌شود
  seen.add(slug);

  const polygons =
    feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  const rings = polygons
    .map((polygon) => polygon[0] ?? [])
    .map((ring) => ({ ring, area: ringArea(ring) }))
    .sort((a, b) => b.area - a.area);

  const largestArea = rings[0]?.area ?? 0;
  const kept = rings
    .filter((entry, index) => index === 0 || entry.area > largestArea * 0.02) // حذف جزایر خیلی کوچک
    .map((entry) => simplify(entry.ring, TOLERANCE).map(([lon, lat]) => [round(lon), round(lat)]))
    .filter((ring) => ring.length >= 4);

  const main = kept[0] ?? [];
  const [clon, clat] = ringCentroid(main);
  const lons = kept.flat().map((p) => p[0]);
  const lats = kept.flat().map((p) => p[1]);

  outProvinces.push({
    code: slug,
    nameFa: PERSIAN_BY_SLUG[slug] ?? sourceName,
    nameEn: sourceName,
    centroid: [round(clon), round(clat)],
    bbox: [
      round(Math.min(...lons)),
      round(Math.min(...lats)),
      round(Math.max(...lons)),
      round(Math.max(...lats)),
    ],
    rings: kept,
  });
}

outProvinces.sort((a, b) => a.code.localeCompare(b.code));

const outCities = cities
  .filter((f) => Array.isArray(f.geometry?.coordinates))
  .map((f) => ({
    name: f.properties?.city ?? "",
    province: SLUG_BY_SOURCE_NAME[f.properties?.state] ?? null,
    lon: round(f.geometry.coordinates[0]),
    lat: round(f.geometry.coordinates[1]),
  }))
  .filter((c) => c.name.length > 0 && c.province !== null);

mkdirSync(OUT_DIR, { recursive: true });
const provincesPath = join(OUT_DIR, "iran-provinces.json");
const citiesPath = join(OUT_DIR, "iran-cities.json");

writeFileSync(
  provincesPath,
  `${JSON.stringify({
    license: "ODbL-1.0 (OpenStreetMap contributors) — بسته‌ی npm iran-geojson@1.0.0 (MIT)",
    generatedBy: "scripts/build-geo-data.mjs",
    toleranceDeg: TOLERANCE,
    provinces: outProvinces,
  })}\n`,
);
writeFileSync(
  citiesPath,
  `${JSON.stringify({
    license: "ODbL-1.0 (OpenStreetMap contributors) — بسته‌ی npm iran-geojson@1.0.0 (MIT)",
    generatedBy: "scripts/build-geo-data.mjs",
    cities: outCities,
  })}\n`,
);

const kb = (path) => `${(readFileSync(path).length / 1024).toFixed(1)} KB`;
console.log(`✅ ${outProvinces.length} استان → ${provincesPath} (${kb(provincesPath)})`);
console.log(`✅ ${outCities.length} شهر → ${citiesPath} (${kb(citiesPath)})`);
