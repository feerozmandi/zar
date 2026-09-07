import { PanelShell } from "../../_components/panels/panel-shell";
import { ToolStub } from "../../_components/tools/tool-stub";

export default function TransformerPage() {
  return (
    <PanelShell
      description="انتخاب ظرفیت ترانسفورماتور توزیع از سری استاندارد با برآورد جریان و اتصال کوتاه — IEC 60076."
      title="انتخاب ترانسفورماتور"
    >
      <ToolStub apiPath="/engineering/transformer" tool="انتخاب ترانسفورماتور" />
    </PanelShell>
  );
}
