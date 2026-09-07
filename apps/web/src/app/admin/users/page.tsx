import { PanelShell } from "../../_components/panels/panel-shell";
import { AdminSectionStub } from "../../_components/admin/admin-section-stub";

/** مدیریت کاربران — بخش Super Admin پنل مدیریت */
export default function AdminUsersPage() {
  return (
    <PanelShell description="فهرست، تعلیق و تغییر نقش کاربران — GET /admin/users" title="مدیریت کاربران">
      <AdminSectionStub />
    </PanelShell>
  );
}
