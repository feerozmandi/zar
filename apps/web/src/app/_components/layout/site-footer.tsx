import { ArrowUp, ArrowUpLeft, Leaf } from "lucide-react";
import Link from "next/link";
import { company } from "@/lib/marketing-content";
import { BrandLogo } from "./brand-logo";
import styles from "./site-chrome.module.css";

export function SiteFooter() {
  return (
    <footer className={`site-chrome ${styles.footer}`}>
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          <div className={styles.footerAbout}>
            <Link prefetch={false} href="/" aria-label={`xennic. ${company.name} — صفحه اصلی`}>
              <BrandLogo />
            </Link>
            <p>
              مشاور، طراح و مجری خدمات مهندسی برق و انرژی‌های نو؛ همراه شما برای ساختن آینده‌ای روشن و پایدار.
            </p>
            <span className={styles.footerTag}>
              <Leaf size={14} aria-hidden="true" /> مهندسی مسئولانه، انرژی پایدار
            </span>
          </div>
          <nav aria-label="لینک‌های شرکت">
            <h2 className={styles.footerHeading}>شرکت ما</h2>
            <ul className={styles.footerLinks}>
              <li>
                <Link prefetch={false} href="/about">
                  درباره زر نور نیرو یکتا
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/#services">
                  خدمات مهندسی
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/contact?topic=partnership">
                  همکاری با ما
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/#faq">
                  پرسش‌های متداول
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="ابزارهای Xennic">
            <h2 className={styles.footerHeading}>ابزارهای Xennic</h2>
            <ul className={styles.footerLinks}>
              <li>
                <Link href="/audit" prefetch={false}>
                  تحلیل قبض برق
                </Link>
              </li>
              <li>
                <Link href="/solar" prefetch={false}>
                  امکان‌سنجی خورشیدی
                </Link>
              </li>
              <li>
                <Link href="/engineering" prefetch={false}>
                  محاسبات مهندسی
                </Link>
              </li>
              <li>
                <Link href="/wiki" prefetch={false}>
                  دانشنامه برق و انرژی
                </Link>
              </li>
            </ul>
          </nav>
          <div className={styles.footerContact}>
            <h2 className={styles.footerHeading}>در ارتباط باشیم</h2>
            <p>پروژه‌ای در ذهن دارید؟ از چالش‌ها و ایده‌های خود برای ما بنویسید.</p>
            <Link prefetch={false} className={styles.footerContactLink} href="/contact">
              شروع گفت‌وگو <ArrowUpLeft size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>تمامی حقوق این وب‌سایت متعلق به شرکت {company.name} است.</p>
          <span className={styles.footerMotto} dir="ltr" lang="en">
            <span aria-hidden="true" /> ENGINEERING A BRIGHTER TOMORROW
          </span>
          <a className={styles.backToTop} href="#top">
            بازگشت به بالا <ArrowUp size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
