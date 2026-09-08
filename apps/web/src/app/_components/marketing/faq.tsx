import { ArrowUpLeft, Plus } from "lucide-react";
import Link from "next/link";
import { faqs } from "@/lib/marketing-content";
import styles from "./marketing.module.css";

/** HTML بومی: قابل استفاده بدون JS، با محتوای یکسان برای کاربر و موتور جستجو. */
export function Faq() {
  return (
    <section className={`${styles.container} ${styles.faqSection}`} id="faq" aria-labelledby="faq-title">
      <div className={styles.faqIntro}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          پرسش‌های متداول
        </p>
        <h2 className={styles.sectionTitle} id="faq-title">
          پاسخ چند سؤال،
          <br />
          پیش از شروع.
        </h2>
        <p className={styles.bodyCopy}>
          پرسش دیگری دارید؟ خوشحال می‌شویم درباره نیاز پروژه شما گفت‌وگو کنیم.
        </p>
        <Link prefetch={false} href="/contact" className={styles.textLink}>
          ارتباط با تیم مهندسی
          <ArrowUpLeft size={19} aria-hidden="true" />
        </Link>
      </div>
      <div className={styles.faqList}>
        {faqs.map((faq, index) => (
          <details className={styles.faqItem} key={faq.question} name="landing-faq" open={index === 0}>
            <summary>
              <h3>{faq.question}</h3>
              <Plus size={18} aria-hidden="true" />
            </summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
