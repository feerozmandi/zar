import { PanelNav } from "../_components/panels/panel-nav";

const links = [
  { href: "/audit", label: "داشبورد" },
  { href: "/audit/upload", label: "آپلود قبض" },
  { href: "/audit/analytics", label: "تحلیل و گزارش" },
];

/** چیدمان پنل ممیزی و تحلیل قبض (نوت ۳ §۳ — app/audit) */
export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PanelNav accent="#E51923" links={links} title="ممیزی و تحلیل هوشمند قبض" />
      {children}
    </>
  );
}
