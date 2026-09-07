import { PanelShell } from "../../_components/panels/panel-shell";
import { EngineeringToolRunner, type FieldSpec } from "../../_components/tools/engineering-tool-runner";

const fields: FieldSpec[] = [
  { name: "activePowerKw", label: "توان اکتیو میان‌باری (kW)", type: "number", required: true },
  {
    name: "cosPhiBefore",
    label: "ضریب قدرت فعلی",
    type: "number",
    step: "0.01",
    min: 0.4,
    max: 0.99,
    required: true,
  },
  { name: "cosPhiTarget", label: "ضریب قدرت هدف", type: "number", step: "0.01", min: 0.9, max: 0.99 },
];

export default function CapacitorBankPage() {
  return (
    <PanelShell
      description="محاسبه‌ی ظرفیت بانک خازنی، پله‌بندی خازن‌ها و بررسی آستانه‌ی جریمه‌ی توان راکتیو (cos φ ≥ ۰٫۹) — مطابق ضوابط توانیر و IEC 60831."
      status="آماده‌به‌کار"
      title="بانک خازنی / اصلاح ضریب قدرت"
    >
      <EngineeringToolRunner apiPath="engineering/capacitor-bank" fields={fields} />
    </PanelShell>
  );
}
