import { PanelShell } from "../../_components/panels/panel-shell";
import { ToolStub } from "../../_components/tools/tool-stub";

export default function DemandPage() {
  return (
    <PanelShell
      description="برآورد حداکثر تقاضای هم‌زمان از بارهای متصل با ضرایب تقاضا — مطابق مبحث ۱۳ و IEEE 141."
      title="محاسبه بار و دیماند"
    >
      <ToolStub apiPath="/engineering/demand" tool="محاسبه بار و دیماند" />
    </PanelShell>
  );
}
