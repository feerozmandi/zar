import { PanelShell } from "../../_components/panels/panel-shell";
import { EngineeringToolRunner, type FieldSpec } from "../../_components/tools/engineering-tool-runner";

const fields: FieldSpec[] = [
  {
    name: "voltageLevel",
    label: "سطح ولتاژ",
    type: "select",
    required: true,
    options: [
      { value: "lv", label: "فشار ضعیف (≤ ۱kV)" },
      { value: "mv", label: "ولتاژ متوسط" },
      { value: "hv", label: "ولتاژ بالا" },
    ],
  },
  {
    name: "nominalVoltageKv",
    label: "ولتاژ نامی سیستم (kV)",
    type: "number",
    step: "0.1",
    required: true,
    placeholder: "0.4 یا 20 یا 63",
  },
  { name: "iKKA", label: "جریان اتصال کوتاه اولیه I″k (kA)", type: "number", step: "0.1", required: true },
  { name: "rxRatio", label: "نسبت R/X (اختیاری)", type: "number", step: "0.01", min: 0, max: 2 },
];

export default function ShortCircuitPage() {
  return (
    <PanelShell
      description="محاسبه‌ی جریان اتصال کوتاه سه‌فاز متقارن، سطح اتصال کوتاه (MVA)، جریان پیک و تعیین قدرت قطع لازم — مطابق IEC 60909."
      status="آماده‌به‌کار"
      title="جریان اتصال کوتاه"
    >
      <EngineeringToolRunner apiPath="engineering/short-circuit" fields={fields} />
    </PanelShell>
  );
}
