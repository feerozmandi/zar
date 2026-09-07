import { PanelShell } from "../../_components/panels/panel-shell";
import { ToolStub } from "../../_components/tools/tool-stub";

export default function LightingPage() {
  return (
    <PanelShell description="محاسبه‌ی تعداد چراغ با روش لومن — مبحث ۱۳ / CIE." title="روشنایی داخلی">
      <ToolStub apiPath="/engineering/lighting" tool="روشنایی داخلی" />
    </PanelShell>
  );
}
