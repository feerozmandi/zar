import { PanelShell } from "../../_components/panels/panel-shell";
import { AdminSectionStub } from "../../_components/admin/admin-section-stub";

/** درآمد و تراکنش‌ها — بخش Super Admin پنل مدیریت */
export default function AdminRevenuePage() {
  return (
    <PanelShell description="گزارش مالی به تفکیک ماژول‌ها و کیف‌پول‌ها" title="درآمد و تراکنش‌ها">
      <AdminSectionStub />
    </PanelShell>
  );
}
