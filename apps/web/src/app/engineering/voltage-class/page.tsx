import { PanelShell } from "../../_components/panels/panel-shell";
import { EngineeringToolRunner, type FieldSpec } from "../../_components/tools/engineering-tool-runner";

const fields: FieldSpec[] = [
  {
    name: "nominalKv",
    label: "ولتاژ نامی سیستم (kV)",
    type: "number",
    step: "0.1",
    required: true,
    placeholder: "0.4 / 20 / 63 / 132 ...",
  },
];

export default function VoltageClassPage() {
  return (
    <PanelShell
      description="طبقه‌بندی ولتاژ شبکه و تعیین رنج نامی تجهیز (Um و سطح عایقی BIL) — مطابق IEC 60038 / IEC 62271 و سطوح ولتاژ شبکه‌ی ایران."
      status="آماده‌به‌کار"
      title="طبقه‌بندی ولتاژ و رنج تجهیز"
    >
      <EngineeringToolRunner apiPath="engineering/voltage-class" fields={fields} />
    </PanelShell>
  );
}
