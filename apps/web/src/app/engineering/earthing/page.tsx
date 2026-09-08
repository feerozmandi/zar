import { PanelShell } from "../../_components/panels/panel-shell";
import { EngineeringToolRunner, type FieldSpec } from "../../_components/tools/engineering-tool-runner";

const fields: FieldSpec[] = [
  {
    name: "rhoOhmM",
    label: "مقاومت ویژه‌ی خاک (Ω·m) — اختیاری",
    type: "number",
    min: 1,
    max: 10000,
    placeholder: "اگر نوع خاک زیر را بدهید لازم نیست",
  },
  {
    name: "soilId",
    label: "نوع خاک",
    type: "select",
    options: [
      { value: "swamp", label: "باتلاقی" },
      { value: "loam", label: "رس/لوم مرطوب" },
      { value: "sand_wet", label: "ماسه‌ی مرطوب" },
      { value: "gravel", label: "شن و قلوه‌سنگ" },
      { value: "rock", label: "سنگ" },
    ],
  },
  { name: "rodLengthM", label: "طول میله (m)", type: "number", step: "0.1", min: 0.5, max: 10 },
  { name: "rodDiameterM", label: "قطر میله (m)", type: "number", step: "0.001", min: 0.005, max: 0.1 },
  { name: "rodCount", label: "تعداد میله‌ها", type: "number", step: "1", min: 1, max: 24 },
  { name: "targetOhm", label: "مقاومت هدف (Ω)", type: "number", step: "0.1", min: 0.1, max: 100 },
];

export default function EarthingPage() {
  return (
    <PanelShell
      description="محاسبه‌ی مقاومت الکترود زمین با توجه به نوع خاک و بررسی رسیدن به مقاومت هدف — مطابق IEEE Std 80، IEC 62305 و مبحث ۱۳."
      status="آماده‌به‌کار"
      title="مقاومت الکترود زمین"
    >
      <EngineeringToolRunner apiPath="engineering/earthing" fields={fields} />
    </PanelShell>
  );
}
