import { PanelShell } from "../../_components/panels/panel-shell";
import { EngineeringToolRunner, type FieldSpec } from "../../_components/tools/engineering-tool-runner";

const fields: FieldSpec[] = [
  { name: "areaM2", label: "مساحت فضا (m²)", type: "number", required: true },
  {
    name: "space",
    label: "نوع فضا",
    type: "select",
    required: true,
    options: [
      { value: "office", label: "اداری/دفتر کار" },
      { value: "corridor", label: "راهرو" },
      { value: "warehouse", label: "انبار" },
      { value: "industrial", label: "صنعتی (مونتاژ سبک)" },
      { value: "drawing", label: "دفتر نقشه‌کشی" },
      { value: "parking", label: "پارکینگ" },
      { value: "classroom", label: "کلاس درس" },
    ],
  },
  { name: "lumensPerLuminaire", label: "شار نوری هر چراغ (لومن)", type: "number", required: true },
  { name: "utilizationFactor", label: "ضریب بهره‌وری", type: "number", step: "0.05", min: 0.3, max: 0.9 },
  { name: "maintenanceFactor", label: "ضریب نگهداری", type: "number", step: "0.05", min: 0.5, max: 1 },
];

export default function LightingPage() {
  return (
    <PanelShell
      description="محاسبه‌ی تعداد چراغ به روش لومن برای رسیدن به سطح روشنایی استاندارد فضا — مطابق مبحث ۱۳ مقررات ملی ساختمان و CIE S 008."
      status="آماده‌به‌کار"
      title="روشنایی داخلی"
    >
      <EngineeringToolRunner apiPath="engineering/lighting" fields={fields} />
    </PanelShell>
  );
}
