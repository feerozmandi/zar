import { PanelNav } from "../_components/panels/panel-nav";

const links = [
  { href: "/solar", label: "امکان‌سنجی" },
  { href: "/solar/map", label: "نقشه تابش" },
  { href: "/solar/feasibility-report", label: "طرح توجیهی" },
];

/** چیدمان پنل سولار */
export default function SolarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PanelNav accent="#F3A812" links={links} title="امکان‌سنجی نیروگاه خورشیدی" />
      {children}
    </>
  );
}
