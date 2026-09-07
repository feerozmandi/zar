import { PanelShell } from "../../_components/panels/panel-shell";
import { EngineeringToolRunner, type FieldSpec } from "../../_components/tools/engineering-tool-runner";

const fields: FieldSpec[] = [
  {
    name: "voltageLevel",
    label: "سطح ولتاژ",
    type: "select",
    required: true,
    options: [
      { value: "lv", label: "فشار ضعیف" },
      { value: "mv", label: "ولتاژ متوسط" },
      { value: "hv", label: "ولتاژ بالا" },
    ],
  },
  { name: "nominalVoltageKv", label: "ولتاژ نامی سیستم (kV)", type: "number", step: "0.1", required: true },
  { name: "loadCurrentA", label: "جریان بار (A)", type: "number", required: true },
  { name: "faultLevelKA", label: "سطح اتصال کوتاه نقطه (kA)", type: "number", step: "0.1", required: true },
];

export default function SwitchgearPage() {
  return (
    <PanelShell
      description="انتخاب کلید/بریکر بر پایه‌ی ولتاژ، جریان بار (با حاشیه‌ی ۱٫۲۵) و قدرت قطع متناسب با سطح اتصال کوتاه — مطابق IEC 60947-2 / IEC 62271-100."
      status="آماده‌به‌کار"
      title="انتخاب کلید (بریکر)"
    >
      <EngineeringToolRunner apiPath="engineering/switchgear" fields={fields} />
    </PanelShell>
  );
}
