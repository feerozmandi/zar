"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { aiJobListSchema, type AiJobRow } from "@xennic/shared";
import { ChevronDown, RefreshCw } from "lucide-react";
import { Badge, Button, Card, CardContent } from "@xennic/ui";
import { apiFetch, ApiError } from "@/lib/api-client";

const STATUS_LABEL: Record<AiJobRow["status"], { label: string; variant: "default" | "success" | "danger" | "muted" }> = {
  QUEUED: { label: "در صف", variant: "muted" },
  RUNNING: { label: "در حال پردازش", variant: "default" },
  SUCCEEDED: { label: "موفق", variant: "success" },
  FAILED: { label: "ناموفق", variant: "danger" },
  CANCELLED: { label: "لغوشده", variant: "muted" },
};

const PURPOSE_LABEL: Record<string, string> = {
  "api.generate": "تحلیل ناهم‌زمان",
  "wiki.ask": "پرسش دانشنامه",
};

/**
 * تاریخچه‌ی کارهای ناهم‌زمان دروازه‌ی AI (GET /ai/jobs).
 * تا زمانی که کاری در صف/در حال پردازش است، فهرست هر ۵ ثانیه تازه می‌شود.
 */
export function JobHistory() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const jobs = useQuery({
    queryKey: ["ai", "jobs"],
    queryFn: () => apiFetch("ai/jobs?page=1&pageSize=10", aiJobListSchema),
    refetchInterval: (query) =>
      query.state.data?.items.some((job) => job.status === "QUEUED" || job.status === "RUNNING") ? 5000 : false,
    retry: (failureCount, error) => !(error instanceof ApiError && error.status === 401) && failureCount < 2,
  });

  if (jobs.isError && jobs.error instanceof ApiError && jobs.error.status === 401) {
    return (
      <Card>
        <CardContent className="p-6 text-xs text-muted-foreground">
          برای مشاهده‌ی تاریخچه‌ی پردازش‌های ناهم‌زمان وارد حساب کاربری شوید.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="grid gap-3 p-6">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">پردازش‌های ناهم‌زمان اخیر</h2>
          <Button
            className="mr-auto"
            disabled={jobs.isFetching}
            onClick={() => void jobs.refetch()}
            size="sm"
            type="button"
            variant="ghost"
          >
            <RefreshCw className={`size-3.5 ${jobs.isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {jobs.isPending ? <p className="text-xs text-muted-foreground">در حال بارگذاری…</p> : null}
        {jobs.data?.items.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            هنوز کاری در صف ثبت نشده است؛ درخواست‌های async از /ai/generate یا پرسش‌های دانشنامه اینجا می‌آیند.
          </p>
        ) : null}

        <ul className="grid gap-2">
          {jobs.data?.items.map((job) => {
            const status = STATUS_LABEL[job.status];
            const isOpen = expanded === job.id;
            return (
              <li className="rounded-lg border border-border" key={job.id}>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-right"
                  onClick={() => setExpanded(isOpen ? null : job.id)}
                  type="button"
                >
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <span className="text-xs">{PURPOSE_LABEL[job.purpose] ?? job.purpose}</span>
                  {job.model ? (
                    <span className="xennic-numeric text-[11px] text-muted-foreground">{job.model}</span>
                  ) : null}
                  <span className="xennic-numeric mr-auto text-[11px] text-muted-foreground">
                    {new Date(job.createdAt).toLocaleString("fa-IR")}
                  </span>
                  <ChevronDown className={`size-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen ? (
                  <div className="border-t border-border px-3 py-2">
                    {job.status === "SUCCEEDED" && job.resultText ? (
                      <p className="text-xs leading-6 whitespace-pre-wrap">{job.resultText}</p>
                    ) : null}
                    {job.status === "FAILED" ? (
                      <p className="text-xs leading-6 text-destructive">{job.errorMessage}</p>
                    ) : null}
                    {job.status === "QUEUED" || job.status === "RUNNING" ? (
                      <p className="text-xs text-muted-foreground">نتیجه پس از پایان پردازش اینجا نمایش داده می‌شود…</p>
                    ) : null}
                    {job.status === "SUCCEEDED" ? (
                      <p className="xennic-numeric mt-2 text-[11px] text-muted-foreground">
                        توکن ورودی: {job.promptTokens} — خروجی: {job.completionTokens} — تأخیر: {job.latencyMs} ms
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
