import { PanelShell } from "../../_components/panels/panel-shell";
import { ToolStub } from "../../_components/tools/tool-stub";

export default function SolarFeasibilityReportPage() {
  return (
    <PanelShell
      description="طرح توجیهی فنی-مالی (ماده ۱۲، ماده ۱۶ و بورس سبز) با قابلیت خروجی PDF."
      title="طرح توجیهی"
    >
      <ToolStub apiPath="/solar/roi-calculator" tool="گزارش طرح توجیهی خورشیدی" />
    </PanelShell>
  );
}
