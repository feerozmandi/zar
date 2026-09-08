import { SiteFooter } from "../_components/layout/site-footer";
import { SiteHeader } from "../_components/layout/site-header";
import styles from "../_components/layout/site-chrome.module.css";

/** محتوای عمومی با هویت مستقل و بدون پس‌زمینه سه‌بعدی پنل‌ها. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-shell">
      <a className={styles.skipLink} href="#main-content">
        رفتن به محتوای اصلی
      </a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
