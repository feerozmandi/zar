import { ArrowDown, ArrowUpLeft, Check, Leaf, Sun } from "lucide-react";
import { MarketingImage } from "./marketing-image";
import Link from "next/link";
import styles from "./marketing.module.css";

/** هیرو استاتیک؛ تصویر اصلی preload می‌شود و به اجرای جاوااسکریپت وابسته نیست. */
export function Hero() {
  return (
    <section className={`${styles.container} ${styles.hero}`} aria-labelledby="hero-title">
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          زر نور نیرو یکتا؛ مهندسی برق و انرژی‌های نو
        </p>
        <h1 className={styles.heroTitle} id="hero-title">
          انرژیِ فردا،
          <br />
          <span>مهندسیِ امروز.</span>
        </h1>
        <p className={styles.heroDescription}>
          از طراحی شبکه‌های برق تا احداث نیروگاه‌های خورشیدی؛
          <br className={styles.desktopBreak} />
          <strong> زر نور نیرو یکتا</strong>، همراه شما در مسیر انرژی پایدار.
        </p>
        <div className={styles.heroActions}>
          <Link prefetch={false} className={styles.primaryButton} href="/contact">
            شروع یک همکاری
            <ArrowUpLeft size={19} aria-hidden="true" />
          </Link>
          <a className={styles.secondaryButton} href="#tools">
            ابزارهای هوشمند ما
            <ArrowDown size={17} aria-hidden="true" />
          </a>
        </div>
        <ul className={styles.heroPromises} aria-label="خدمات یکپارچه شرکت">
          {["مشاوره تخصصی", "طراحی مهندسی", "اجرای یکپارچه"].map((item) => (
            <li key={item}>
              <Check size={15} aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.heroVisual}>
        <figure className={styles.heroImage}>
          <MarketingImage
            src="/images/landing/solar-farm.webp"
            alt="تصویر مفهومی نیروگاه خورشیدی با ردیف‌های پنل آبی در نور طلایی و چشم‌انداز کوهستان"
            preload
            sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1023px) 48vw, 590px"
            className={styles.coverImage}
          />
          <div className={styles.imageShade} aria-hidden="true" />
          <span className={styles.imageLabel}>
            <Sun size={16} aria-hidden="true" />
            به سوی آینده‌ای پایدار
          </span>
          <figcaption className={styles.imageCaption} dir="ltr" lang="en">
            CLEAN ENERGY.
            <br />
            CLEAR VISION.
          </figcaption>
          <a className={styles.imageExplore} href="#services" aria-label="آشنایی با خدمات مهندسی">
            <ArrowDown size={22} aria-hidden="true" />
          </a>
        </figure>
        <div className={styles.heroNote}>
          <span className={styles.heroNoteIcon}>
            <Leaf size={25} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <div>
            <p>انرژی پاک، انتخاب هوشمند</p>
            <span>از اولین ایده تا بهره‌برداری</span>
          </div>
        </div>
        <span className={styles.visualFootnote} dir="ltr" lang="en" aria-hidden="true">
          ENGINEERED FOR A BETTER TOMORROW — 01
        </span>
      </div>
    </section>
  );
}
