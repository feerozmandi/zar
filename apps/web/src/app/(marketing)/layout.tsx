import { SiteFooter } from "../_components/layout/site-footer";
import { SiteHeader } from "../_components/layout/site-header";

/** چیدمان بخش عمومی (لندینگ، درباره، تماس) — سئومحور و رندر استاتیک */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
