import { PanelShell } from "../../_components/panels/panel-shell";
import { AdminSectionStub } from "../../_components/admin/admin-section-stub";

/** لاگ مدیریتی — بخش Super Admin پنل مدیریت */
export default function AdminAuditLogsPage() {
  return (
    <PanelShell description="کنترل اقدامات مدیران — GET /admin/audit-logs" title="لاگ مدیریتی">
      <AdminSectionStub />
    </PanelShell>
  );
}
