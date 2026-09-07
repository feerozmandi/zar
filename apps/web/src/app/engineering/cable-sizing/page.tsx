import { PanelShell } from "../../_components/panels/panel-shell";
import { ToolStub } from "../../_components/tools/tool-stub";

export default function CableSizingPage() {
  return (
    <PanelShell
      description="انتخاب کوچک‌ترین مقطع استاندارد با رعایت حد جریان و حد افت ولتاژ."
      title="سایزینگ کابل"
    >
      <ToolStub apiPath="/engineering/cable-sizing" tool="سایزینگ کابل" />
    </PanelShell>
  );
}
