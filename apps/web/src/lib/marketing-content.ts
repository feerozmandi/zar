/** محتوای عمومی لندینگ؛ وضعیت ابزارها مطابق قابلیت‌های پیاده‌سازی‌شده است. */
export const company = {
  name: "زر نور نیرو یکتا",
  brand: "Xennic",
  latinName: "Zar Noor Niroo Yekta",
  title: "زر نور نیرو یکتا | مشاوره، طراحی و اجرای برق و انرژی‌های نو",
  description:
    "شرکت زر نور نیرو یکتا؛ مشاور، طراح و مجری شبکه‌های برق، تأسیسات الکتریکی و نیروگاه‌های خورشیدی. با خدمات تخصصی و ابزارهای مهندسی Xennic، آگاهانه‌تر تصمیم بگیرید.",
} as const;

export const marketingNavigation = [
  { label: "خانه", href: "/" },
  { label: "خدمات ما", href: "/#services" },
  { label: "ابزارهای هوشمند", href: "/#tools" },
  { label: "درباره ما", href: "/about" },
  { label: "ارتباط با ما", href: "/contact" },
] as const;

export const services = [
  {
    id: "solar",
    number: "۰۱",
    title: "نیروگاه‌های خورشیدی",
    description:
      "از ارزیابی ظرفیت و امکان‌سنجی تا طراحی، تأمین تجهیزات و اجرای نیروگاه؛ مسیری روشن برای سرمایه‌گذاری در انرژی پاک.",
    image: "/images/landing/solar-farm.webp",
    imageAlt: "تصویر مفهومی ردیف پنل‌های یک نیروگاه خورشیدی در چشم‌انداز کوهستانی",
    imagePosition: "center 75%",
    tags: ["امکان‌سنجی", "طراحی و اجرا"],
    href: "/contact?topic=solar",
    cta: "مشاوره نیروگاه خورشیدی",
  },
  {
    id: "grid",
    number: "۰۲",
    title: "شبکه‌های برق و توزیع",
    description:
      "مشاوره و طراحی شبکه‌های برق، پست‌ها و سیستم‌های حفاظتی؛ با نگاه یکپارچه به ایمنی، قابلیت اطمینان و توسعه‌پذیری.",
    image: "/images/landing/power-grid.webp",
    imageAlt: "تصویر مفهومی دکل‌ها و خطوط انتقال برق در یک دشت سبز",
    imagePosition: "center 45%",
    tags: ["مطالعات شبکه", "نظارت و اجرا"],
    href: "/contact?topic=engineering",
    cta: "مشاوره شبکه‌های برق",
  },
  {
    id: "electrical",
    number: "۰۳",
    title: "برق صنعت و ساختمان",
    description:
      "طراحی و اجرای تأسیسات الکتریکی، برق اضطراری و راهکارهای مدیریت مصرف؛ متناسب با نیاز واقعی هر پروژه.",
    image: "/images/landing/electrical-engineering.webp",
    imageAlt: "تصویر مفهومی تجهیزات و عایق‌های یک پست برق صنعتی",
    imagePosition: "center",
    tags: ["تأسیسات الکتریکی", "مدیریت انرژی"],
    href: "/contact?topic=engineering",
    cta: "مشاوره تأسیسات الکتریکی",
  },
] as const;

export type ToolStatus = "available" | "beta" | "development";
export type ToolFilter = "all" | "available" | "development";

export interface MarketingTool {
  id: "audit" | "solar" | "engineering" | "wiki";
  title: string;
  description: string;
  status: ToolStatus;
  statusLabel: string;
  href: string;
  cta: string;
  requiresAccount: boolean;
}

export const marketingTools: readonly MarketingTool[] = [
  {
    id: "audit",
    title: "تحلیل هوشمند قبض برق",
    description: "بارگذاری قبض، استخراج اطلاعات و بررسی هزینه‌های مصرف، دیماند و انرژی راکتیو.",
    status: "beta",
    statusLabel: "نسخه آزمایشی",
    href: "/audit",
    cta: "بررسی قبض برق",
    requiresAccount: true,
  },
  {
    id: "solar",
    title: "امکان‌سنجی خورشیدی",
    description: "برآورد اولیه ظرفیت و تولید نیروگاه با توجه به موقعیت، مساحت و شرایط محل احداث.",
    status: "beta",
    statusLabel: "نسخه آزمایشی",
    href: "/solar",
    cta: "ارزیابی ظرفیت خورشیدی",
    requiresAccount: true,
  },
  {
    id: "engineering",
    title: "محاسبات مهندسی برق",
    description: "محاسبه افت ولتاژ در دسترس است؛ ابزارهای کابل، بانک خازنی و ژنراتور در حال تکمیل‌اند.",
    status: "available",
    statusLabel: "قابل استفاده",
    href: "/engineering/voltage-drop",
    cta: "محاسبه افت ولتاژ",
    requiresAccount: true,
  },
  {
    id: "wiki",
    title: "دانشنامه برق و انرژی",
    description: "مرجعی در حال شکل‌گیری برای دسترسی به مقررات، استانداردها و دانش کاربردی مهندسی برق.",
    status: "development",
    statusLabel: "در حال توسعه",
    href: "/wiki",
    cta: "پیش‌نمایش دانشنامه",
    requiresAccount: false,
  },
];

export function filterTools(filter: ToolFilter): readonly MarketingTool[] {
  if (filter === "all") return marketingTools;
  return marketingTools.filter((tool) =>
    filter === "development" ? tool.status === "development" : tool.status !== "development",
  );
}

export const faqs = [
  {
    question: "زر نور نیرو یکتا چه خدماتی ارائه می‌دهد؟",
    answer:
      "خدمات ما شامل مشاوره، مطالعات و طراحی مهندسی، نظارت و اجرای پروژه‌های شبکه برق، تأسیسات الکتریکی صنعت و ساختمان و نیروگاه‌های خورشیدی است. محدوده خدمات هر پروژه پس از بررسی نیاز و شرایط فنی آن مشخص می‌شود.",
  },
  {
    question: "برای احداث نیروگاه خورشیدی از کجا شروع کنیم؟",
    answer:
      "نقطه شروع، بررسی موقعیت و مساحت زمین یا بام، وضعیت اتصال به شبکه، الگوی مصرف و هدف سرمایه‌گذاری است. می‌توانید برای برآورد اولیه از ابزار خورشیدی استفاده کنید یا اطلاعات پروژه را از طریق فرم مشاوره برای تیم مهندسی بفرستید.",
  },
  {
    question: "کدام ابزارهای Xennic در دسترس هستند؟",
    answer:
      "محاسبه افت ولتاژ قابل استفاده است. تحلیل قبض و ارزیابی خورشیدی در نسخه آزمایشی ارائه می‌شوند و به حساب کاربری نیاز دارند. دانشنامه و سایر ابزارهای محاسباتی در حال تکمیل‌اند؛ وضعیت هر ابزار روی کارت آن مشخص است.",
  },
  {
    question: "آیا نتایج ابزارها جایگزین مشاوره مهندسی است؟",
    answer:
      "خیر. خروجی ابزارها برای ارزیابی اولیه و کمک به تصمیم‌گیری است. طراحی نهایی، برآورد اقتصادی، انتخاب تجهیزات و تأیید انطباق با مقررات باید با داده‌های واقعی پروژه و بررسی مهندس متخصص انجام شود.",
  },
] as const;
