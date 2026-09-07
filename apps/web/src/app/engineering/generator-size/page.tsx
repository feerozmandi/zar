import { PanelShell } from "../../_components/panels/panel-shell";
import { EngineeringToolRunner, type FieldSpec } from "../../_components/tools/engineering-tool-runner";

const fields: FieldSpec[] = [
  { name: "connectedLoadKw", label: "مجموع توان بارهای متصل (kW)", type: "number", required: true },
  { name: "diversityFactor", label: "ضریب هم‌زمانی", type: "number", step: "0.05", min: 0.4, max: 1 },
  { name: "efficiency", label: "بازده", type: "number", step: "0.01", min: 0.7, max: 1 },
  { name: "startingMargin", label: "حاشیه‌ی راه‌اندازی", type: "number", step: "0.05", min: 1, max: 2 },
  { name: "powerFactor", label: "ضریب قدرت", type: "number", step: "0.01", min: 0.5, max: 1 },
];

export default function GeneratorSizePage() {
  return (
    <PanelShell
      description="برآورد ظرفیت نامی دیزل‌ژنراتور اضطراری با ضریب هم‌زمانی، بازده و حاشیه‌ی راه‌اندازی — مطابق IEC 60034-1."
      status="آماده‌به‌کار"
      title="انتخاب ژنراتور"
    >
      <EngineeringToolRunner apiPath="engineering/generator-size" fields={fields} />
    </PanelShell>
  );
}
