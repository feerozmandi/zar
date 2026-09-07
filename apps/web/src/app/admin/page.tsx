import { PanelShell } from "../_components/panels/panel-shell";
import { AdminSectionStub } from "../_components/admin/admin-section-stub";

export default function AdminDashboardPage() {
  return (
    <PanelShell
      description="آمار کلی کاربران، تراکنش‌ها و بار سرور — داده از GET /admin/dashboard خوانده می‌شود."
      title="داشبورد مدیریت"
    >
      <AdminSectionStub />
    </PanelShell>
  );
}
