import { PanelShell } from "../../_components/panels/panel-shell";
import { EngineeringToolRunner, type FieldSpec } from "../../_components/tools/engineering-tool-runner";

const fields: FieldSpec[] = [
  { name: "currentA", label: "جریان بار شینه (A)", type: "number", required: true },
  {
    name: "material",
    label: "جنس شینه",
    type: "select",
    required: true,
    options: [
      { value: "copper", label: "مس" },
      { value: "aluminium", label: "آلومینیوم" },
    ],
  },
  { name: "ambientTempC", label: "دمای محیط (°C)", type: "number", step: "1", min: -10, max: 60 },
];

export default function BusbarPage() {
  return (
    <PanelShell
      description="تعیین سطح مقطع استاندارد شینه‌ی (باس‌بار) مسی/آلومینیومی بر پایه‌ی جریان بار و تراکم جریان مجاز — مطابق نشریه ۱۱۰ و IEC 62271."
      status="آماده‌به‌کار"
      title="سایزینگ شینه"
    >
      <EngineeringToolRunner apiPath="engineering/busbar" fields={fields} />
    </PanelShell>
  );
}
