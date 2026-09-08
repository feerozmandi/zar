import { contactRequestSchema } from "@xennic/shared";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { marketingMetadata } from "@/lib/marketing-seo";
import { ContactForm } from "../../_components/marketing/contact-form";
import styles from "../../_components/marketing/marketing.module.css";

export const metadata = marketingMetadata(
  "/contact",
  "درخواست مشاوره مهندسی برق و خورشیدی | زر نور نیرو یکتا",
  "برای مشاوره، طراحی و اجرای شبکه برق، تأسیسات الکتریکی یا نیروگاه خورشیدی، نیاز پروژه خود را با تیم مهندسی زر نور نیرو یکتا در میان بگذارید.",
);

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string | string[] }>;
}) {
  const params = await searchParams;
  const topic = contactRequestSchema.shape.topic.safeParse(params.topic ?? "engineering");

  return (
    <div className={`${styles.container} ${styles.innerPage}`}>
      <nav className={styles.breadcrumb} aria-label="مسیر صفحه">
        <Link href="/">خانه</Link>
        <ChevronLeft size={12} aria-hidden="true" />
        <span aria-current="page">درخواست مشاوره</span>
      </nav>
      <div className={styles.contactGrid}>
        <section className={styles.contactIntro} aria-labelledby="contact-page-title">
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" /> ارتباط با تیم مهندسی
          </p>
          <h1 className={styles.pageTitle} id="contact-page-title">
            هر پروژه خوب،
            <br />
            با یک گفت‌وگو
            <br />
            شروع می‌شود.
          </h1>
          <p className={styles.bodyCopy}>
            از ایده، نیاز یا چالش پروژه‌تان بگویید. تیم زر نور نیرو یکتا اطلاعات شما را بررسی می‌کند تا درباره
            مسیر مناسب همکاری گفت‌وگو کنیم.
          </p>
          <ol className={styles.contactSteps}>
            <li>
              <span>۱</span>
              <div>
                <strong>نیازتان را با ما در میان بگذارید</strong>
                <p>نوع پروژه، محل اجرا و هدف خود را توضیح دهید.</p>
              </div>
            </li>
            <li>
              <span>۲</span>
              <div>
                <strong>اطلاعات را بررسی می‌کنیم</strong>
                <p>تیم مرتبط با حوزه پروژه، درخواست شما را ارزیابی می‌کند.</p>
              </div>
            </li>
            <li>
              <span>۳</span>
              <div>
                <strong>قدم بعدی را مشخص می‌کنیم</strong>
                <p>برای تکمیل اطلاعات و هماهنگی مشاوره با شما در ارتباط خواهیم بود.</p>
              </div>
            </li>
          </ol>
        </section>
        <ContactForm
          key={topic.success ? topic.data : "engineering"}
          initialTopic={topic.success ? topic.data : "engineering"}
        />
      </div>
    </div>
  );
}
