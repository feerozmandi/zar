import { PanelShell } from "../../_components/panels/panel-shell";
import { RoofDesigner } from "../../_components/solar/roof-designer";

export const metadata = { title: "طراح سقف خورشیدی | زننیک" };

export default function RoofDesignerPage() {
  return (
    <PanelShell
      accent="#F3A812"
      description="چندضلعی سقف و موانع (دودکش، کانال، کلاهک) را روی شبکه‌ی متری ترسیم کنید؛ چیدمان پنل‌ها با احتساب حریم، سایه و گامِ ردیف همان لحظه محاسبه می‌شود."
      status="آماده‌به‌کار"
      title="طراح سقف"
    >
      <RoofDesigner />
    </PanelShell>
  );
}
