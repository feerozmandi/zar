import { PanelNav } from "../_components/panels/panel-nav";

const links = [
  { href: "/engineering", label: "فهرست ابزارها" },
  { href: "/engineering/voltage-drop", label: "افت ولتاژ" },
  { href: "/engineering/cable-sizing", label: "سایزینگ کابل" },
  { href: "/engineering/capacitor-bank", label: "بانک خازنی" },
  { href: "/engineering/generator-size", label: "ژنراتور" },
];

/** چیدمان پنل جعبه‌ابزار مهندسی */
export default function EngineeringLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PanelNav accent="#00A8B5" links={links} title="جعبه‌ابزار محاسبات مهندسی برق" />
      {children}
    </>
  );
}
