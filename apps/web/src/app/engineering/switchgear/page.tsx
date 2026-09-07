import { PanelShell } from "../../_components/panels/panel-shell";
import { ToolStub } from "../../_components/tools/tool-stub";

export default function SwitchgearPage() {
  return (
    <PanelShell
      description="انتخاب جریان نامی و قدرت قطع کلید بر پایه‌ی ولتاژ، بار و سطح اتصال کوتاه — IEC 60947/62271."
      title="انتخاب کلید (بریکر)"
    >
      <ToolStub apiPath="/engineering/switchgear" tool="انتخاب کلید (بریکر)" />
    </PanelShell>
  );
}
