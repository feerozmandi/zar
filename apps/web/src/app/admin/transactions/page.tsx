import { PanelShell } from "../../_components/panels/panel-shell";
import { AdminSectionStub } from "../../_components/admin/admin-section-stub";

/** تراکنش‌ها — بخش Super Admin پنل مدیریت */
export default function AdminTransactionsPage() {
  return (
    <PanelShell
      description="فهرست تراکنش‌ها با وضعیت و ارائه‌دهنده — GET /admin/transactions"
      title="تراکنش‌ها"
    >
      <AdminSectionStub />
    </PanelShell>
  );
}
