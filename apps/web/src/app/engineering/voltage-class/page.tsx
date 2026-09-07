import { PanelShell } from "../../_components/panels/panel-shell";
import { ToolStub } from "../../_components/tools/tool-stub";

export default function VoltageClassPage() {
  return (
    <PanelShell
      description="رنج نامی تجهیز (Um و سطح عایقی) برای سطوح ولتاژ سیستم — IEC 60038 / شبکه ایران."
      title="طبقه‌بندی ولتاژ و رنج تجهیز"
    >
      <ToolStub apiPath="/engineering/voltage-class" tool="طبقه‌بندی ولتاژ و رنج تجهیز" />
    </PanelShell>
  );
}
