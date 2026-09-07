import { modules } from "@xennic/design-tokens";
import { PanelShell } from "../_components/panels/panel-shell";
import { RecentBills } from "../_components/panels/recent-bills";

export default function AuditDashboardPage() {
  return (
    <PanelShell
      accent={modules[0]?.accent}
      description="آرشیو قبوض، وضعیت پردازش صف OCR و خلاصه‌ی یافته‌های تعرفه‌ای."
      title="داشبورد ممیزی"
    >
      <RecentBills />
    </PanelShell>
  );
}
