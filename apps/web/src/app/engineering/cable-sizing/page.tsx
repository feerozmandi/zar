import { PanelShell } from "../../_components/panels/panel-shell";
import { EngineeringToolRunner, type FieldSpec } from "../../_components/tools/engineering-tool-runner";

const fields: FieldSpec[] = [
  {
    name: "system",
    label: "نوع سیستم",
    type: "select",
    required: true,
    options: [
      { value: "three", label: "سه‌فاز" },
      { value: "single", label: "تک‌فاز" },
    ],
  },
  { name: "voltage", label: "ولتاژ نامی (V)", type: "number", required: true },
  { name: "current", label: "جریان بار (A)", type: "number", required: true },
  { name: "length", label: "طول مسیر (m)", type: "number", required: true },
  {
    name: "conductor",
    label: "جنس هادی",
    type: "select",
    required: true,
    options: [
      { value: "copper", label: "مس" },
      { value: "aluminium", label: "آلومینیوم" },
    ],
  },
  {
    name: "installationMethod",
    label: "روش نصب",
    type: "select",
    required: true,
    options: [
      { value: "conduit", label: "داخل لوله" },
      { value: "tray", label: "سینی کابل" },
      { value: "buried", label: "دفن مستقیم" },
      { value: "clip", label: "روی دیوار/کلمپ" },
    ],
  },
  { name: "ambientTempC", label: "دمای محیط (°C)", type: "number", step: "1", min: -10, max: 60 },
  { name: "maxDropPercent", label: "حداکثر افت ولتاژ (٪)", type: "number", step: "0.1", min: 0.5, max: 10 },
];

export default function CableSizingPage() {
  return (
    <PanelShell
      description="انتخاب کوچک‌ترین مقطع استاندارد هادی با رعایت حد جریان مجاز و حد افت ولتاژ — مطابق IEC 60364-5-52 و نشریه ۱۱۰."
      status="آماده‌به‌کار"
      title="سایزینگ کابل"
    >
      <EngineeringToolRunner apiPath="engineering/cable-sizing" fields={fields} />
    </PanelShell>
  );
}
