import { PanelShell } from "../../_components/panels/panel-shell";
import { ToolStub } from "../../_components/tools/tool-stub";

export default function CapacitorBankPage() {
  return (
    <PanelShell
      description="محاسبه ظرفیت بانک خازنی، پله‌بندی خازن‌ها و کاهش جریمه راکتیو."
      title="بانک خازنی"
    >
      <ToolStub apiPath="/engineering/capacitor-bank" tool="بانک خازنی" />
    </PanelShell>
  );
}
