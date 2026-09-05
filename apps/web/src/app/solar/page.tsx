import { PanelShell } from "../_components/panels/panel-shell";
import { SolarAssessForm } from "../_components/solar/solar-assess-form";

export default function SolarAssessPage() {
  return (
    <PanelShell
      accent="#F3A812"
      description="انتخاب استان/لوکیشن، مساحت سقف و الگوی مصرف؛ ظرفیت پیشنهادی و تولید سالانه محاسبه می‌شود."
      title="امکان‌سنجی خورشیدی"
    >
      <SolarAssessForm />
    </PanelShell>
  );
}
