import { Wrench } from "lucide-react";

/**
 * جای‌نگهدار ابزارهایی که فرم آن‌ها در فاز ۳ ساخته می‌شود.
 * مسیر API و اسکیمای ورودی از قبل در @xennic/shared تعریف شده‌اند.
 */
export function ToolStub({ tool, apiPath }: { tool: string; apiPath: string }) {
  return (
    <div className="flex items-start gap-3 rounded-(--radius-card) border border-dashed border-border p-5 text-sm text-muted-foreground">
      <Wrench className="mt-0.5 size-4 shrink-0" />
      <p>
        فرم «{tool}» در فاز ۳ ساخته می‌شود. قرارداد ورودی/خروجی از هم‌اکنون در{" "}
        <code className="rounded bg-muted/20 px-1 py-0.5">@xennic/shared</code> تعریف شده و مسیر{" "}
        <code className="xennic-numeric rounded bg-muted/20 px-1 py-0.5">POST {apiPath}</code> در Core API
        آماده است.
      </p>
    </div>
  );
}
