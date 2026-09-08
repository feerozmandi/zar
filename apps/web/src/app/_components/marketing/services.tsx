import { ClipboardCheck, DraftingCompass, FileSearch, Gauge, HardHat, Sun } from "lucide-react";
import Link from "next/link";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const services = [
  {
    icon: ClipboardCheck,
    title: "مشاوره و مطالعات پایه",
    description: "بازدید فنی، جمع‌آوری داده و مطالعات اولیه برای تصمیم‌سازی دقیق سرمایه‌گذاری انرژی.",
    href: "/contact",
    cta: "درخواست مشاوره",
  },
  {
    icon: DraftingCompass,
    title: "طراحی و مهندسی اجرایی",
    description: "طراحی شبکه‌های توزیع، روشنایی، تابلوها و سیستم‌های خورشیدی با مدارک قابل ارائه به ناظر.",
    href: "/contact",
    cta: "شروع طراحی",
  },
  {
    icon: HardHat,
    title: "اجرا و مدیریت EPC",
    description: "اجرای پروژه‌های برق صنعتی و نیروگاه‌های خورشیدی از تأمین تجهیزات تا راه‌اندازی نهایی.",
    href: "/contact",
    cta: "اجرای پروژه",
  },
  {
    icon: Gauge,
    title: "بهره‌برداری و نگهداشت",
    description: "پایش عملکرد، سرویس‌های دوره‌ای و بهینه‌سازی مستمر تأسیسات برق و نیروگاه‌ها.",
    href: "/contact",
    cta: "پایش تأسیسات",
  },
  {
    icon: FileSearch,
    title: "ممیزی انرژی و تحلیل قبض",
    description: "کشف خطاهای تعرفه‌ای، جریمه‌های دیماند و راکتیو با تحلیل هوش مصنوعی و گزارش PDF مدیریتی.",
    href: "/audit",
    cta: "تحلیل رایگان قبض",
  },
  {
    icon: Sun,
    title: "امکان‌سنجی نیروگاه خورشیدی",
    description: "ارزیابی تابش، ظرفیت بهینه و بازگشت سرمایه مطابق ماده ۱۲ و ۱۶ و نرخ‌های بورس سبز.",
    href: "/solar",
    cta: "محاسبه توجیه اقتصادی",
  },
];

/** بخش خدمات مهندسی — معرفی شرکت به‌عنوان مشاور، طراح و مجری (نوت ۴ §۳ بازطراحی‌شده) */
export function Services() {
  return (
    <section id="services" className="mx-auto w-full max-w-7xl px-4 py-20 lg:px-8 lg:py-28">
      <SectionHeading
        kicker="خدمات مهندسی"
        title="از ایده تا بهره‌برداری، کنار شما هستیم"
        description="چرخه‌ی کامل خدمات مهندسی برق و انرژی‌های نو؛ با پشتوانه‌ی بیش از سه دهه تجربه در شبکه‌های توزیع، صنایع و پروژه‌های تجدیدپذیر."
      />

      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-6">
        {services.map((service, index) => (
          <Reveal as="li" key={service.title} delay={(index % 3) * 90}>
            <Link
              href={service.href}
              className="group relative flex h-full flex-col rounded-(--radius-card) border border-border/60 bg-card/40 p-6 backdrop-blur-sm transition-[transform,border-color,background-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/70 hover:shadow-xl hover:shadow-primary/5 lg:p-7"
            >
              <span
                aria-hidden
                className="absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <service.icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-bold">{service.title}</h3>
              <p className="mt-2.5 flex-1 text-sm leading-7 text-muted-foreground">{service.description}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                {service.cta}
                <span aria-hidden className="transition-transform duration-300 group-hover:-translate-x-1">
                  ←
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
