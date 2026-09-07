import { PROVINCE_PEAK_SUN_HOURS } from "@xennic/shared";
import { PanelShell } from "../../_components/panels/panel-shell";

export const revalidate = 86_400;

/**
 * نقشه تابش: فعلاً جدول اقلیمیِ @xennic/shared نمایش داده می‌شود؛
 * لایه‌ی نقشه تعاملی در فاز ۳ افزوده می‌شود.
 */
export default function SolarMapPage() {
  const rows = Object.entries(PROVINCE_PEAK_SUN_HOURS).sort((a, b) => b[1] - a[1]);

  return (
    <PanelShell description="میانگین سالانه تابش روزانه معادل به ساعت." title="نقشه پتانسیل تابش">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([province, hours]) => (
          <div
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            key={province}
          >
            <span>{province}</span>
            <span className="xennic-numeric font-bold text-primary">{hours.toFixed(1)} h</span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}
