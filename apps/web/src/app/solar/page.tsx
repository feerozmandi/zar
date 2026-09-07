import { PanelShell } from "../_components/panels/panel-shell";
import { SolarWizard } from "../_components/solar/solar-wizard";

export const metadata = { title: "امکان‌سنجی نیروگاه خورشیدی | زننیک" };

export default function SolarAssessPage() {
  return (
    <PanelShell
      accent="#F3A812"
      description="استان، مساحت سقف و مصرف را وارد کنید: ظرفیت، تولید، صرفه‌جویی و دوره بازگشت همان لحظه محاسبه می‌شود — دقیقاً با همان موتوری که API استفاده می‌کند."
      status="آماده‌به‌کار"
      title="امکان‌سنجی خورشیدی"
    >
      <SolarWizard />
    </PanelShell>
  );
}
