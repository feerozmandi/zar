import { PanelShell } from "../../_components/panels/panel-shell";
import { FeasibilityReportPage } from "../../_components/solar/feasibility-report-page";

export const metadata = { title: "طرح توجیهی نیروگاه خورشیدی | زننیک" };

export default function Page() {
  return (
    <PanelShell
      accent="#F3A812"
      description="گزارش کامل فنی-مالی: چیدمان، تولید ساعتی، تراز تلفات، قبض قبل/بعد، مقایسه‌ی سناریوهای خودتأمین، ماده ۱۲ و بورس سبز، تحلیل حساسیت و ریسک‌ها."
      status="آماده‌به‌کار"
      title="طرح توجیهی (گزارش امکان‌سنجی)"
    >
      <FeasibilityReportPage />
    </PanelShell>
  );
}
