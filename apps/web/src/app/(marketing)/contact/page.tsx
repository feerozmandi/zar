import type { Metadata } from "next";
import { ContactForm } from "../../_components/marketing/contact-form";

export const metadata: Metadata = {
  title: "درخواست مشاوره تخصصی",
  description: "فرم درخواست مشاوره در حوزه‌های ممیزی قبض، نیروگاه خورشیدی و محاسبات مهندسی برق.",
};

export default function ContactPage() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-16 lg:px-8">
      <h1 className="text-3xl font-black">ارتباط با ما و درخواست مشاوره</h1>
      <p className="mt-3 leading-8 text-muted-foreground">
        موضوع و شرح نیاز خود را بنویسید؛ کارشناسان{" "}
        <strong className="text-foreground">زر نور نیرو یکتا</strong> در اسرع وقت پاسخ می‌دهند.
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </section>
  );
}
