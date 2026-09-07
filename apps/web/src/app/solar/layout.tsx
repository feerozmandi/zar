import { PanelNav } from "../_components/panels/panel-nav";

const links = [
  { href: "/solar", label: "امکان‌سنجی" },
  { href: "/solar/map", label: "نقشه تابش" },
  { href: "/solar/roof-designer", label: "طراح سقف" },
  { href: "/solar/feasibility-report", label: "طرح توجیهی" },
  { href: "/solar/marketplace", label: "مارکت‌پلیس EPC" },
];

/** چیدمان پنل سولار */
export default function SolarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PanelNav accent="#FFB224" links={links} title="امکان‌سنجی نیروگاه خورشیدی" />
      {children}
    </>
  );
}
