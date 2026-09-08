import { SiteHeader } from "../_components/layout/site-header";
import { SolarNav } from "../_components/solar/solar-nav";

/** چیدمان راست‌به‌چپ با منوی عمودی اختصاصی خورشیدی. */
export default function SolarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="border-b border-border/60 bg-card/40 print:hidden">
        <SiteHeader />
      </div>
      <div className="mx-auto grid w-full max-w-[1600px] items-start gap-6 px-4 py-6 lg:px-8 xl:grid-cols-[270px_minmax(0,1fr)] print:block print:p-0">
        <SolarNav />
        <div className="min-w-0 [&>section]:max-w-none [&>section]:p-0">{children}</div>
      </div>
    </>
  );
}
