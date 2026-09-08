import { PanelShell } from "../_components/panels/panel-shell";
import { ApiModelTable } from "../_components/ai/model-table";
import { ArenaPlayground } from "../_components/ai/arena-playground";
import { JobHistory } from "../_components/ai/job-history";

export const metadata = { title: "AI Arena — مقایسه مدل‌های هوش مصنوعی" };

export default function AiArenaPage() {
  return (
    <PanelShell
      description="یک پرامپت یا سند انرژی را هم‌زمان به چند مدل بدهید و پاسخ‌ها را با تأخیر و مصرف توکن مقایسه کنید؛ در صورت فعال بودن BYOK، فراخوان با کلید اختصاصی شما انجام می‌شود."
      status="آماده‌به‌کار"
      title="AI Arena"
    >
      <ArenaPlayground />
      <JobHistory />
      <ApiModelTable />
    </PanelShell>
  );
}
