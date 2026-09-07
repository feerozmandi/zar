import { PanelShell } from "../../_components/panels/panel-shell";
import { ToolStub } from "../../_components/tools/tool-stub";

export default function EarthingPage() {
  return (
    <PanelShell
      description="محاسبه‌ی مقاومت میله‌ی ارت با توجه به نوع خاک — IEEE 80 / مبحث ۱۳."
      title="مقاومت الکترود زمین"
    >
      <ToolStub apiPath="/engineering/earthing" tool="مقاومت الکترود زمین" />
    </PanelShell>
  );
}
