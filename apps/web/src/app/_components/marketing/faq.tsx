import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@xennic/ui";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const faqs = [
  {
    question: "آیا تحلیل اولیه قبض برق در Xennic رایگان است؟",
    answer:
      "بله، تحلیل اولیه و شناسایی جریمه‌های قبض از طریق مدل‌های پایه هوش مصنوعی به صورت رایگان ارائه می‌شود؛ کافی است تصویر یا PDF قبض را آپلود کنید.",
  },
  {
    question: "ارزیابی نیروگاه خورشیدی بر اساس چه قوانینی انجام می‌شود؟",
    answer:
      "محاسبات مالی و بازگشت سرمایه دقیقاً مطابق آخرین مصوبات ماده ۱۲، ماده ۱۶ (تأمین برق صنایع) و نرخ‌های بورس سبز انرژی انجام می‌گیرد.",
  },
  {
    question: "آیا خروجی محاسبات مهندسی قابل ارائه به ناظران و سازمان‌ها است؟",
    answer:
      "بله، دفترچه محاسبات خروجی از پنل مهندسی مطابق استانداردهای IEC و نشریه ۱۱۰ تدوین شده و به صورت فایل PDF رسمی قابل چاپ است.",
  },
  {
    question: "خدمات اجرایی (EPC) شرکت چگونه ارائه می‌شود؟",
    answer:
      "پس از مشاوره و مطالعات امکان‌سنجی، طراحی اجرایی انجام و پروژه از تأمین تجهیزات تا تست و راه‌اندازی به‌صورت کلید در دست (EPC) مدیریت می‌شود؛ جزئیات از طریق فرم درخواست مشاوره اعلام می‌گردد.",
  },
  {
    question: "قابلیت API Key اختصاصی (BYOK) چه مزیتی دارد؟",
    answer:
      "شرکت‌ها و کاربران حرفه‌ای می‌توانند برای پردازش‌های سنگین و حفظ حریم خصوصی، کلید API خود را وارد کرده و بدون محدودیت از تمام امکانات هوش مصنوعی استفاده کنند.",
  },
  {
    question: "چطور کار خود را با زر نور نیرو یکتا شروع کنم؟",
    answer:
      "همین حالا ابزارهای رایگان پلتفرم را امتحان کنید یا از طریق فرم «درخواست مشاوره» شرح نیاز خود را بنویسید؛ کارشناسان ما در سریع‌ترین زمان پاسخ می‌دهند.",
  },
];

/** بخش سؤالات متداول — مگنت سئوی ارگانیک (نوت ۴ §۵) + داده‌ی ساخت‌یافته FAQPage */
export function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <section id="faq" className="mx-auto w-full max-w-3xl px-4 py-20 lg:px-8 lg:py-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SectionHeading
        kicker="سؤالات متداول"
        title="پاسخ سریع به پرسش‌های رایج"
        description="اگر پاسخ سؤال خود را پیدا نکردید، از طریق فرم درخواست مشاوره بپرسید."
      />
      <Reveal delay={220}>
        <Accordion className="mt-12" collapsible type="single">
          {faqs.map((faq, index) => (
            <AccordionItem className="border-b border-border/60" key={faq.question} value={`item-${index}`}>
              <AccordionTrigger className="text-right text-base font-semibold hover:text-primary hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-8 text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}
