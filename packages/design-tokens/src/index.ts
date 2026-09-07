/**
 * توکن‌های عددی/رنگی هویت بصری Xennic — نسخه‌ی TypeScript.
 * برای مواردی که CSS در دسترس نیست: PDF مهندسی، لوگوی ربات تلگرام، چارت‌ها و …
 * مرجع: «نوت ۴ — سیستم جامع طراحی و پلت رنگی سازمانی».
 */

export const XENNIC_BRAND = {
  name: "Xennic",
  legalName: "زر نور نیرو یکتا",
  legalNameLatin: "Zar Noor Niroo Yekta",
  tagline: "مهندسی، نوآوری برای آینده انرژی با قدرت هوش مصنوعی",
} as const;

export const palette = {
  dark: {
    background: "#061D24",
    surface: "#0A2830",
    primary: "#F3A812",
    action: "#E51923",
    tech: "#00A8B5",
    textPrimary: "#FFFFFF",
    textSecondary: "#A3C2C8",
  },
  light: {
    background: "#F4F8F9",
    surface: "#FFFFFF",
    primary: "#D98A00",
    action: "#D0121B",
    tech: "#0B303A",
    textPrimary: "#0A2128",
    textSecondary: "#4A6971",
  },
} as const;

export type PaletteTheme = keyof typeof palette;

/** ماژول‌های پلتفرم — برای ناوبری، کارت‌های لندینگ و رنگ‌بندی گزارش‌ها */
export const modules = [
  {
    key: "audit",
    route: "/audit",
    title: "تحلیل و ممیزی هوشمند قبض",
    accent: palette.dark.action,
  },
  {
    key: "solar",
    route: "/solar",
    title: "امکان‌سنجی نیروگاه خورشیدی",
    accent: palette.dark.primary,
  },
  {
    key: "engineering",
    route: "/engineering",
    title: "جعبه‌ابزار محاسبات مهندسی برق",
    accent: palette.dark.tech,
  },
  {
    key: "wiki",
    route: "/wiki",
    title: "دانشنامه و مرجع قوانین برق",
    accent: palette.dark.textSecondary,
  },
] as const;

export const radii = { card: "1rem", button: "0.75rem" } as const;

/** مسیرهای سطح‌اول app router — برای منو، footer و تست‌های e2e */
export const routes = {
  home: "/",
  about: "/about",
  contact: "/contact",
  login: "/login",
  register: "/register",
  audit: "/audit",
  solar: "/solar",
  engineering: "/engineering",
  wiki: "/wiki",
  ai: "/ai",
  admin: "/admin",
} as const;
