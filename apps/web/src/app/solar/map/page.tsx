import { PROVINCES } from "@xennic/shared";
import { PanelShell } from "../../_components/panels/panel-shell";
import { ProvinceExplorer } from "../../_components/solar/province-explorer";

export const metadata = { title: "نقشه تابش خورشید ایران | زننیک" };

/**
 * نقشه‌ی پتانسیل تابش — مرزهای واقعی استان‌ها + شبیه‌سازِ برآوردِ تولید.
 * کاربر استان را انتخاب می‌کند و همان‌جا برآوردِ ظرفیت و تولید را می‌بیند.
 */
export default function SolarMapPage() {
  return (
    <PanelShell
      accent="#F3A812"
      description="روی هر استان کلیک کنید: تابش سالانه، ظرفیت پیشنهادی روی سقفِ شما و تولید سالانه همان‌جا برآورد می‌شود."
      status="آماده‌به‌کار"
      title="نقشه پتانسیل تابش ایران"
    >
      <ProvinceExplorer
        provinces={PROVINCES.map((province) => ({
          code: province.code,
          nameFa: province.nameFa,
          lat: province.lat,
          lon: province.lon,
          elevationM: province.elevationM,
        }))}
      />
    </PanelShell>
  );
}
