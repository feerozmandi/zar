import { PanelShell } from "../_components/panels/panel-shell";
import { ApiModelTable } from "../_components/ai/model-table";

export const metadata = { title: "مقایسه مدل‌های هوش مصنوعی" };

export default function AiArenaPage() {
  return (
    <PanelShell
      description="مقایسه تحلیل مدل‌های مختلف روی سند انرژی؛ در صورت فعال بودن BYOK، فهرست از دیتابیس خوانده می‌شود."
      status="در حال توسعه"
      title="AI Arena"
    >
      <ApiModelTable />
    </PanelShell>
  );
}
