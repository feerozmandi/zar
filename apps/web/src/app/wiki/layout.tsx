import { SiteHeader } from "../_components/layout/site-header";

/** چیدمان دانشنامه — سرفصل مشترک برای فهرست و مقاله */
export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-dvh">{children}</main>
    </>
  );
}
