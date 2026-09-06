import { PanelNav } from "../_components/panels/panel-nav";

const links = [
  { href: "/admin", label: "داشبورد" },
  { href: "/admin/users", label: "کاربران" },
  { href: "/admin/transactions", label: "تراکنش‌ها" },
  { href: "/admin/wiki-cms", label: "CMS دانشنامه" },
  { href: "/admin/audit-logs", label: "لاگ مدیریتی" },
];

/** پنل مدیریت ارشد — دسترسی فقط برای نقش SUPER_ADMIN (کنترل در API) */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PanelNav accent="#0B303A" links={links} title="پنل مدیریت ارشد Xennic" />
      {children}
    </>
  );
}
