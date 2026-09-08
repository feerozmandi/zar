import { ArrowUpLeft, ChevronLeft } from "lucide-react";
import { MarketingImage } from "../../_components/marketing/marketing-image";
import Link from "next/link";
import { marketingMetadata } from "@/lib/marketing-seo";
import { ContactCta } from "../../_components/marketing/contact-cta";
import styles from "../../_components/marketing/marketing.module.css";

export const metadata = marketingMetadata(
  "/about",
  "درباره زر نور نیرو یکتا | مهندسی برق و انرژی‌های نو",
  "با رویکرد شرکت زر نور نیرو یکتا در مشاوره، طراحی و اجرای شبکه‌های برق، تأسیسات الکتریکی و نیروگاه‌های خورشیدی و توسعه ابزارهای Xennic آشنا شوید.",
);

const steps = [
  {
    number: "۰۱",
    title: "شناخت و مشاوره",
    description:
      "از شنیدن نیاز شما و بررسی شرایط فنی شروع می‌کنیم؛ هدف، محدودیت‌ها و اولویت‌ها را پیش از تصمیم‌گیری روشن می‌کنیم.",
  },
  {
    number: "۰۲",
    title: "مطالعه و طراحی",
    description:
      "راهکارها را ارزیابی می‌کنیم و طرح مهندسی را با توجه به ایمنی، کیفیت، الزامات پروژه و بهره‌وری انرژی توسعه می‌دهیم.",
  },
  {
    number: "۰۳",
    title: "اجرا و همراهی",
    description:
      "از هماهنگی تأمین و اجرا تا راه‌اندازی و بهره‌برداری، محدوده همکاری و مسئولیت‌ها را شفاف و متناسب با قرارداد پروژه پیش می‌بریم.",
  },
];

export default function AboutPage() {
  return (
    <>
      <div className={`${styles.container} ${styles.innerPage}`}>
        <nav className={styles.breadcrumb} aria-label="مسیر صفحه">
          <Link href="/">خانه</Link>
          <ChevronLeft size={12} aria-hidden="true" />
          <span aria-current="page">درباره ما</span>
        </nav>
        <section className={styles.aboutLead} aria-labelledby="about-page-title">
          <div>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden="true" /> درباره شرکت زر نور نیرو یکتا
            </p>
            <h1 className={styles.pageTitle} id="about-page-title">
              مهندسی مسئولانه،
              <br />
              برای آینده‌ای پایدار.
            </h1>
            <p className={styles.bodyCopy}>
              زر نور نیرو یکتا، مشاور، طراح و مجری خدمات مهندسی برق و انرژی‌های نو است. حوزه فعالیت ما از
              شبکه‌های برق و تأسیسات صنعت و ساختمان تا نیروگاه‌های خورشیدی و راهکارهای مدیریت انرژی امتداد
              دارد.
            </p>
            <p className={styles.bodyCopy}>
              در کنار خدمات مهندسی، پلتفرم <bdi lang="en">Xennic</bdi> را توسعه می‌دهیم؛ مجموعه‌ای از ابزارهای
              تحلیل و محاسبه که به شناخت بهتر مسئله و تصمیم‌گیری آگاهانه‌تر کمک می‌کنند. فناوری برای ما مکمل
              دانش متخصصان است، نه جایگزین آن.
            </p>
            <Link href="/#services" className={styles.textLink}>
              آشنایی با خدمات ما <ArrowUpLeft size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.aboutLeadImage}>
            <MarketingImage
              src="/images/landing/power-grid.webp"
              alt="تصویر مفهومی خطوط انتقال برق در چشم‌انداز طبیعی"
              preload
              sizes="(max-width: 700px) calc(100vw - 40px), 530px"
              className={styles.coverImage}
            />
          </div>
        </section>
        <section className={styles.processSection} aria-labelledby="process-title">
          <p className={styles.eyebrow}>رویکرد همکاری ما</p>
          <h2 className={styles.sectionTitle} id="process-title">
            مسیر روشن، از اولین گفت‌وگو.
          </h2>
          <div className={styles.processGrid}>
            {steps.map((step) => (
              <article key={step.number}>
                <span aria-hidden="true">{step.number}</span>
                <h3>{step.title}</h3>
                <p className={styles.bodyCopy}>{step.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
      <ContactCta />
    </>
  );
}
