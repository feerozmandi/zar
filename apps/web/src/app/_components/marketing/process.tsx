import { Activity, DraftingCompass, HardHat, MessagesSquare } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const steps = [
  {
    icon: MessagesSquare,
    title: "مشاوره و شناخت نیاز",
    description: "جلسه‌ی فنی رایگان، بازدید از سایت و تحلیل اولیه‌ی وضعیت موجود انرژی.",
  },
  {
    icon: DraftingCompass,
    title: "مطالعه و طراحی",
    description: "محاسبات، نقشه‌ها و مدارک مهندسی مطابق استانداردها با گزارش توجیهی اقتصادی.",
  },
  {
    icon: HardHat,
    title: "اجرا و راه‌اندازی",
    description: "تأمین تجهیزات، نصب، تست و تحویل پروژه با مدیریت اجرایی حرفه‌ای.",
  },
  {
    icon: Activity,
    title: "پایش و بهینه‌سازی",
    description: "پایش عملکرد، نگهداشت دوره‌ای و گزارش‌دهی شفاف برای تضمین بازگشت سرمایه.",
  },
];

/** فرآیند همکاری — چهار گام از اولین جلسه تا بهره‌برداری پایدار */
export function Process() {
  return (
    <section id="process" className="border-y border-border/60 bg-card/20">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 lg:px-8 lg:py-28">
        <SectionHeading
          kicker="فرآیند همکاری"
          title="چهار گام شفاف تا نتیجه‌ی ملموس"
          description="مسیر پروژه از اولین تماس تا بهره‌برداری، مرحله‌به‌مرحله و با گزارش‌دهی دقیق پیش می‌رود."
        />

        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-8">
          {steps.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 110} className="relative">
              {/* خط اتصال افقی بین گام‌ها (دسکتاپ) */}
              {index < steps.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-7 left-[-14%] hidden h-px w-[calc(100%+2rem)] border-t border-dashed border-border lg:block"
                />
              )}
              <div className="relative">
                <span className="grid size-14 place-items-center rounded-2xl border border-primary/30 bg-card text-primary shadow-lg shadow-primary/5">
                  <step.icon className="size-6" aria-hidden />
                </span>
                <span
                  aria-hidden
                  className="xennic-numeric absolute -top-2 right-0 text-4xl font-black text-primary/15"
                >
                  {new Intl.NumberFormat("fa-IR").format(index + 1)}
                </span>
              </div>
              <h3 className="mt-5 font-bold">{step.title}</h3>
              <p className="mt-2 max-w-60 text-sm leading-7 text-muted-foreground">{step.description}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
