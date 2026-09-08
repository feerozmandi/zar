import { company } from "@/lib/marketing-content";
import styles from "./site-chrome.module.css";

/** نشان هندسی X؛ هم‌خانواده با نشان پیشین و هماهنگ با پالت وب‌سایت سازمانی. */
export function BrandLogo() {
  return (
    <span className={styles.brand}>
      <svg className={styles.brandMark} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="12" fill="var(--marketing-deep)" />
        <path d="M12 12h8l16 24h-8L12 12Z" fill="var(--marketing-lime)" />
        <path d="M29 12h7L19 36h-7l17-24Z" fill="var(--marketing-on-deep)" />
        <path d="M32 6h10v10" stroke="var(--marketing-lime)" strokeWidth="1.5" />
      </svg>
      <span className={styles.brandType}>
        <span className={styles.wordmark} dir="ltr" lang="en">
          xennic<span>.</span>
        </span>
        <span className={styles.brandLegal}>{company.name}</span>
      </span>
    </span>
  );
}
