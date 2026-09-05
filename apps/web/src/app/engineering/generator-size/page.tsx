import { PanelShell } from "../../_components/panels/panel-shell";
import { ToolStub } from "../../_components/tools/tool-stub";

export default function GeneratorSizePage() {
  return (
    <PanelShell
      description="برآورد ظرفیت نامی دیزل‌ژنراتور اضطراری با ضریب هم‌زمانی و حاشیه راه‌اندازی."
      title="انتخاب ژنراتور"
    >
      <ToolStub apiPath="/engineering/generator-size" tool="انتخاب ژنراتور" />
    </PanelShell>
  );
}
