import { ArrowUpLeft, Check, Compass } from "lucide-react";
import { MarketingImage } from "./marketing-image";
import Link from "next/link";
import styles from "./marketing.module.css";

export function CompanyIntro() {
  return (
    <section
      className={`${styles.container} ${styles.companySection}`}
      id="about"
      aria-labelledby="company-title"
    >
      <div className={styles.companyVisual}>
        <MarketingImage
          src="/images/landing/power-grid.webp"
          alt="تصویر مفهومی شبکه انتقال برق؛ دکل‌ها در امتداد تپه‌های سرسبز"
          sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1023px) 46vw, 560px"
          className={styles.coverImage}
        />
        <div className={styles.imageShade} aria-hidden="true" />
        <div className={styles.companyImageCaption}>
          <Compass size={32} strokeWidth={1.2} aria-hidden="true" />
          <span>نگاه مهندسی، از جزئیات تا افق‌های دور.</span>
        </div>
      </div>
      <div className={styles.companyCopy}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          درباره زر نور نیرو یکتا
        </p>
        <h2 className={styles.sectionTitle} id="company-title">
          یک همراه فنی،
          <br />
          در تمام مسیر پروژه.
        </h2>
        <p className={styles.bodyCopy}>
          ما به برق، فراتر از یک زیرساخت نگاه می‌کنیم؛ به فرصتی برای ساختن آینده‌ای ایمن‌تر، کارآمدتر و
          پایدارتر. در زر نور نیرو یکتا، خدمات مشاوره، طراحی و اجرا در کنار هم قرار می‌گیرند تا فاصله ایده تا
          بهره‌برداری کوتاه‌تر شود.
        </p>
        <ul className={styles.companyValues}>
          {[
            "طراحی متناسب با نیاز واقعی هر پروژه",
            "توجه به ایمنی، کیفیت و الزامات فنی",
            "پیوند تجربه مهندسی با ابزارهای دیجیتال",
          ].map((value) => (
            <li key={value}>
              <Check size={17} aria-hidden="true" />
              {value}
            </li>
          ))}
        </ul>
        <Link prefetch={false} href="/about" className={styles.textLink}>
          بیشتر با ما آشنا شوید
          <ArrowUpLeft size={19} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
