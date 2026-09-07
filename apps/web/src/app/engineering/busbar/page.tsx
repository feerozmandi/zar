import { PanelShell } from "../../_components/panels/panel-shell";
import { ToolStub } from "../../_components/tools/tool-stub";

export default function BusbarPage() {
  return (
    <PanelShell description="تعیین سطح مقطع شینه‌ی مسی/آلومینیومی بر پایه‌ی جریان بار." title="سایزینگ شینه">
      <ToolStub apiPath="/engineering/busbar" tool="سایزینگ شینه" />
    </PanelShell>
  );
}
