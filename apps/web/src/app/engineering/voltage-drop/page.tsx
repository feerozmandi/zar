import type { Metadata } from "next";
import { PanelShell } from "../../_components/panels/panel-shell";
import { VoltageDropTool } from "../../_components/tools/voltage-drop-tool";

export const metadata: Metadata = { title: "محاسبه افت ولتاژ" };

export default function VoltageDropPage() {
  return (
    <PanelShell
      description="محاسبه‌ی افت ولتاژ بر پایه طول مسیر، جریان، مقطع و ضریب قدرت — مطابق IEC و نشریه ۱۱۰."
      status="آماده‌به‌کار"
      title="محاسبه‌گر افت ولتاژ"
    >
      <VoltageDropTool />
    </PanelShell>
  );
}
