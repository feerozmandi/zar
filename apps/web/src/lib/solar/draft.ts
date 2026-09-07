import { useSyncExternalStore } from "react";
import type { FeasibilityInput, FeasibilityReport } from "@xennic/shared";
import { buildFeasibilityReport } from "@xennic/shared";

/**
 * پیش‌نویسِ پروژه‌ی خورشیدی بین صفحات جابه‌جا می‌شود (امکان‌سنجی ← طراح سقف ←
 * طرح توجیهی ← مارکت‌پلیس). نگه‌داری در sessionStorage است تا:
 *  • کاربرِ ناشناس هم بتواند گزارش کامل ببیند (شبیه Google Project Sunroof)،
 *  • و تنها هنگامِ ذخیره/ارسال به EPC به سرور (و احراز هویت) نیاز باشد.
 *
 * دسترسی از طریق `useSyncExternalStore` انجام می‌شود (نه useEffect) تا
 *  • خواندن در زمانِ رندر انجام شود،
 *  • در SSR مقدارِ پیش‌فرض برگردد و پس از hydration بدون خطای تطبیق به‌روزرسانی شود.
 */
const STORAGE_KEY = "xennic:solar:draft:v1";
const ASSESSMENT_KEY = "xennic:solar:assessment-id:v1";

/** نمونه‌ی پیش‌فرض: یک واحد صنعتی در تهران با سقف ۵۰۰ مترمربع */
export const DEFAULT_DRAFT: FeasibilityInput = {
  site: { name: "سایت نمونه", province: "tehran" },
  roof: { areaM2: 500, tiltDeg: 25, azimuthDeg: 180 },
  consumption: {
    monthlyKwh: Array.from({ length: 12 }, () => 20_000),
    tariffKind: "industrial",
    monthlyPeakDemandKw: Array.from({ length: 12 }, () => 80),
    profile: "industrial",
  },
};

export interface DraftSnapshot {
  input: FeasibilityInput;
  /** شماره‌ی ویرایش — برای remount کردنِ ویرایشگرها هنگام تغییرِ پیش‌نویس */
  revision: number;
}

// ─────────────────────────── store ───────────────────────────

let cachedRaw: string | null = null;
let cachedInput: FeasibilityInput = DEFAULT_DRAFT;
let revision = 0;
let snapshot: DraftSnapshot = { input: DEFAULT_DRAFT, revision };
const listeners = new Set<() => void>();

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseDraft(raw: string | null): FeasibilityInput {
  if (!raw) return DEFAULT_DRAFT;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_DRAFT;
    const draft = parsed as FeasibilityInput;
    if (
      typeof draft.site?.province !== "string" ||
      !Array.isArray(draft.consumption?.monthlyKwh) ||
      draft.consumption.monthlyKwh.length !== 12
    ) {
      return DEFAULT_DRAFT;
    }
    return draft;
  } catch {
    return DEFAULT_DRAFT;
  }
}

function refresh(): void {
  const raw = readRaw();
  if (raw === cachedRaw) return;
  cachedRaw = raw;
  cachedInput = parseDraft(raw);
  revision += 1;
  snapshot = { input: cachedInput, revision };
  for (const listener of listeners) listener();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", refresh);
  refresh();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): DraftSnapshot {
  return snapshot;
}

function getServerSnapshot(): DraftSnapshot {
  return snapshot;
}

/** خواندن/نوشتنِ پیش‌نویس در کامپوننت‌ها */
export function useSolarDraft(): readonly [DraftSnapshot, (next: FeasibilityInput) => void] {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [value, updateDraft] as const;
}

export function updateDraft(next: FeasibilityInput): void {
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // نبودِ دسترسی به sessionStorage نباید تجربه‌ی کاربر را بشکند
    }
  }
  cachedRaw = JSON.stringify(next);
  cachedInput = next;
  revision += 1;
  snapshot = { input: next, revision };
  for (const listener of listeners) listener();
}

/** نوشتنِ پیش‌نویس بدون اشتراک (برای مسیرهای غیرِ کامپوننتی) */
export function saveDraft(input: FeasibilityInput): void {
  updateDraft(input);
}

/** خواندنِ یک‌باره (بدون اشتراک) — برای رویدادها و توابع کمکی */
export function loadDraft(): FeasibilityInput {
  refresh();
  return cachedInput;
}

export function clearDraft(): void {
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  updateDraft(DEFAULT_DRAFT);
}

/** شناسه‌ی ارزیابیِ ذخیره‌شده در سرور (برای ارجاع بعدی به پیمانکاران) */
export function saveAssessmentId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ASSESSMENT_KEY, id);
  } catch {
    // ignore
  }
}

export function loadAssessmentId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(ASSESSMENT_KEY);
  } catch {
    return null;
  }
}

/** اجرای ایمنِ موتور: خطاهای ورودی به‌جای خراب کردن صفحه، به کاربر گزارش می‌شود */
export function runFeasibility(
  input: FeasibilityInput,
): { ok: true; report: FeasibilityReport } | { ok: false; error: string } {
  try {
    return { ok: true, report: buildFeasibilityReport(input) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "ورودی نامعتبر است" };
  }
}
