import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@xennic/ui";

const faqs = [
  {
    question: "آیا تحلیل اولیه قبض برق در Xennic رایگان است؟",
    answer:
      "بله، تحلیل اولیه و شناسایی جریمه‌های قبض از طریق مدل‌های پایه هوش مصنوعی به صورت رایگان ارائه می‌شود.",
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
    question: "قابلیت API Key اختصاصی (BYOK) چه مزیتی دارد؟",
    answer:
      "شرکت‌ها و کاربران حرفه‌ای می‌توانند برای پردازش‌های سنگین و حفظ حریم خصوصی، کلید API خود را وارد کرده و بدون محدودیت از تمام امکانات هوش مصنوعی استفاده کنند.",
  },
];

/** بخش سؤالات متداول — مگنت سئوی ارگانیک (نوت ۴ §۵) */
export function Faq() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-16 lg:px-8">
      <h2 className="text-2xl font-black sm:text-3xl">سؤالات متداول</h2>
      <Accordion className="mt-6" collapsible type="single">
        {faqs.map((faq, index) => (
          <AccordionItem className="border-b border-border/60" key={faq.question} value={`item-${index}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
