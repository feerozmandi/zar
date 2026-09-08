import { PanelShell } from "../../_components/panels/panel-shell";
import { EpcMarketplace } from "../../_components/solar/epc-marketplace";

export const metadata = { title: "مارکت‌پلیس پیمانکاران خورشیدی | زننیک" };

export default function SolarMarketplacePage() {
  return (
    <PanelShell
      accent="#F3A812"
      description="پروژه را یک‌بار ثبت کنید و پیشنهادهای چند پیمانکار را بر اساس قیمتِ هر وات، رده‌ی پنل، گارانتی، رتبه و زمان تحویل مقایسه کنید؛ اطلاعات تماس شما تا زمان انتخاب ناشناس می‌ماند."
      status="آماده‌به‌کار"
      title="مارکت‌پلیس پیمانکاران (EPC)"
    >
      <EpcMarketplace />
    </PanelShell>
  );
}
