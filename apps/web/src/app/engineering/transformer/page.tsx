import { PanelShell } from "../../_components/panels/panel-shell";
import { EngineeringToolRunner, type FieldSpec } from "../../_components/tools/engineering-tool-runner";

const fields: FieldSpec[] = [
  { name: "demandKva", label: "دیماند بار (kVA یا kW)", type: "number", required: true },
  {
    name: "powerFactor",
    label: "ضریب قدرت (اگر بار kW است)",
    type: "number",
    step: "0.01",
    min: 0.3,
    max: 1,
  },
  { name: "primaryKv", label: "ولتاژ اولیه (kV)", type: "number", step: "0.1", min: 1, max: 400 },
  { name: "secondaryKv", label: "ولتاژ ثانویه (kV)", type: "number", step: "0.1", min: 0.1, max: 100 },
  { name: "loadingFactor", label: "ضریب بارگیری", type: "number", step: "0.01", min: 0.4, max: 0.95 },
];

export default function TransformerPage() {
  return (
    <PanelShell
      description="انتخاب ظرفیت ترانسفورماتور توزیع از سری استاندارد، محاسبه‌ی جریان‌های نامی و برآورد جریان اتصال کوتاه سمت ثانویه — مطابق IEC 60076."
      status="آماده‌به‌کار"
      title="انتخاب ترانسفورماتور"
    >
      <EngineeringToolRunner apiPath="engineering/transformer" fields={fields} />
    </PanelShell>
  );
}
