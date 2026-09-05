import { PanelShell } from "../../_components/panels/panel-shell";
import { ConsumptionChart } from "../../_components/panels/consumption-chart";

export default function AuditAnalyticsPage() {
  return (
    <PanelShell
      description="نمودار بارگذاری هفتگی، مصرف میان‌باری/پیک و سهم جریمه‌های دیماند و راکتیو."
      title="تحلیل و گزارش"
    >
      <ConsumptionChart />
    </PanelShell>
  );
}
