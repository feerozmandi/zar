import { PanelShell } from "../../_components/panels/panel-shell";
import { ToolStub } from "../../_components/tools/tool-stub";

export default function ShortCircuitPage() {
  return (
    <PanelShell
      description="محاسبه‌ی I″k، جریان پیک و تعیین قدرت قطع لازم — مطابق IEC 60909."
      title="جریان اتصال کوتاه"
    >
      <ToolStub apiPath="/engineering/short-circuit" tool="جریان اتصال کوتاه" />
    </PanelShell>
  );
}
