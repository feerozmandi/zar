"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  aiCompareResultSchema,
  aiModelListSchema,
  aiUsageSchema,
  type AiCompareResult,
} from "@xennic/shared";
import { Gauge, LoaderCircle, Swords, Timer } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, CardContent, Label, Textarea } from "@xennic/ui";
import { apiFetch, ApiError } from "@/lib/api-client";

const MAX_MODELS = 3;

/**
 * AI Arena Playground — مقایسه‌ی هم‌زمان یک پرامپت روی چند مدل (نوت ۵ — گام چهارم).
 * پرامپت به POST /ai/compare می‌رود و پاسخ هر مدل با تأخیر و مصرف توکن کنار هم نمایش
 * داده می‌شود؛ خطای یک مدل نتیجه‌ی بقیه را از بین نمی‌برد.
 */
export function ArenaPlayground() {
  const queryClient = useQueryClient();
  const models = useQuery({
    queryKey: ["ai", "models"],
    queryFn: () => apiFetch("ai/models", aiModelListSchema),
    staleTime: 5 * 60 * 1000,
  });

  // سهمیه‌ی روزانه‌ی لایه‌ی رایگان — در نبود لاگین بی‌صدا نادیده گرفته می‌شود
  const usage = useQuery({
    queryKey: ["ai", "usage"],
    queryFn: () => apiFetch("ai/usage", aiUsageSchema),
    staleTime: 30 * 1000,
    retry: false,
  });

  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [useOwnKey, setUseOwnKey] = useState(false);
  const [result, setResult] = useState<AiCompareResult | null>(null);

  const compare = useMutation({
    mutationFn: () =>
      apiFetch("ai/compare", aiCompareResultSchema, {
        method: "POST",
        body: { prompt, models: selected, useOwnKey },
        timeoutMs: 120_000,
      }),
    onSuccess: (data) => {
      setResult(data);
      void queryClient.invalidateQueries({ queryKey: ["ai", "usage"] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        toast.error("برای استفاده از AI Arena ابتدا وارد شوید");
        return;
      }
      if (error instanceof ApiError && error.status === 429) {
        toast.error(error.message);
        void queryClient.invalidateQueries({ queryKey: ["ai", "usage"] });
        return;
      }
      toast.error(error.message);
    },
  });

  const toggleModel = (slug: string) => {
    setSelected((current) => {
      if (current.includes(slug)) return current.filter((entry) => entry !== slug);
      if (current.length >= MAX_MODELS) {
        toast.warning(`حداکثر ${MAX_MODELS} مدل هم‌زمان قابل انتخاب است`);
        return current;
      }
      return [...current, slug];
    });
  };

  const canSubmit = prompt.trim().length >= 4 && selected.length > 0 && !compare.isPending;

  // سقف «نامحدود» (MAX_SAFE_INTEGER) نمایش داده نمی‌شود
  const quota =
    usage.data && usage.data.limit < Number.MAX_SAFE_INTEGER
      ? { used: usage.data.used, limit: usage.data.limit, remaining: usage.data.remaining }
      : null;

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="grid gap-4 p-6">
          {quota && !useOwnKey ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
              <Gauge className="size-3.5 text-muted-foreground" />
              <span>
                سهمیه‌ی رایگان امروز:{" "}
                <span className="xennic-numeric font-semibold">
                  {quota.remaining}/{quota.limit}
                </span>{" "}
                فراخوان باقی‌مانده
              </span>
              {quota.remaining === 0 ? (
                <span className="text-destructive">— برای ادامه، کلید اختصاصی (BYOK) ثبت کنید</span>
              ) : null}
            </div>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor="arena-prompt">پرامپت / سند انرژی</Label>
            <Textarea
              id="arena-prompt"
              className="min-h-32"
              placeholder="مثال: این پروفیل مصرف را تحلیل کن و راهکار کاهش جریمه‌ی راکتیو پیشنهاد بده…"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>مدل‌ها (حداکثر {MAX_MODELS} مورد)</Label>
            <div className="flex flex-wrap gap-2">
              {models.isPending ? (
                <span className="text-xs text-muted-foreground">در حال بارگذاری مدل‌ها…</span>
              ) : null}
              {models.data?.map((row) => {
                const active = selected.includes(row.slug);
                return (
                  <button
                    key={row.slug}
                    type="button"
                    onClick={() => toggleModel(row.slug)}
                    aria-pressed={active}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {row.displayName}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              checked={useOwnKey}
              className="size-3.5 accent-primary"
              onChange={(event) => setUseOwnKey(event.target.checked)}
              type="checkbox"
            />
            استفاده از کلید اختصاصی من (BYOK) به‌جای لایه‌ی رایگان سیستم
          </label>

          <div className="flex items-center gap-3">
            <Button disabled={!canSubmit} onClick={() => compare.mutate()} type="button">
              {compare.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Swords className="size-4" />
              )}
              مقایسه‌ی مدل‌ها
            </Button>
            {compare.isPending ? (
              <span className="text-xs text-muted-foreground">
                در حال دریافت پاسخ {selected.length} مدل — بسته به مدل ممکن است تا یک دقیقه طول بکشد…
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {result ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {result.results.map((entry) => (
            <Card key={entry.model} className={entry.ok ? "" : "border-destructive/40"}>
              <CardContent className="grid gap-3 p-5">
                <div className="flex items-center gap-2">
                  <span className="xennic-numeric text-sm font-semibold">{entry.model}</span>
                  <Badge variant={entry.ok ? "success" : "danger"}>
                    {entry.ok ? "موفق" : "خطا"}
                  </Badge>
                  <span className="mr-auto flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Timer className="size-3" />
                    <span className="xennic-numeric">{entry.latencyMs}</span> ms
                  </span>
                </div>
                {entry.ok ? (
                  <>
                    <p className="text-sm leading-7 whitespace-pre-wrap">{entry.content}</p>
                    {entry.usage ? (
                      <p className="xennic-numeric text-[11px] text-muted-foreground">
                        توکن ورودی: {entry.usage.promptTokens} — توکن خروجی: {entry.usage.completionTokens}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-xs leading-6 text-destructive">{entry.errorMessage}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
