import { ArrowUpLeft } from "lucide-react";
import Link from "next/link";
import styles from "./marketing.module.css";

export function ContactCta() {
  return (
    <section className={`${styles.container} ${styles.ctaSection}`} aria-labelledby="cta-title">
      <div className={styles.ctaCard}>
        <div className={styles.ctaOrbit} aria-hidden="true" />
        <div>
          <p className={styles.eyebrow}>از ایده تا اجرا، کنار شما هستیم</p>
          <h2 className={styles.sectionTitle} id="cta-title">
            آینده روشن، با یک گفت‌وگو شروع می‌شود.
          </h2>
          <p>از نیاز پروژه‌تان بگویید؛ مسیر را با هم پیدا می‌کنیم.</p>
        </div>
        <Link prefetch={false} href="/contact" className={styles.primaryButton}>
          درخواست مشاوره تخصصی
          <ArrowUpLeft size={20} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
