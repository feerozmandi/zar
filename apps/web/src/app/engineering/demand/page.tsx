import { PanelShell } from "../../_components/panels/panel-shell";
import { DemandTool } from "../../_components/tools/demand-tool";

export default function DemandPage() {
  return (
    <PanelShell
      description="برآورد حداکثر تقاضای هم‌زمان از بارهای متصل با اعمال ضرایب تقاضا و ضریب هم‌زمانی — مبنای انتخاب ترانسفورماتور، ژنراتور و انشعاب (مبحث ۱۳ / IEEE 141)."
      status="آماده‌به‌کار"
      title="محاسبه بار و دیماند"
    >
      <DemandTool />
    </PanelShell>
  );
}
