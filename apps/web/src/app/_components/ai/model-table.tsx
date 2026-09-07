"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiKeySchema, aiModelListSchema } from "@xennic/shared";
import { LoaderCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge, Button, Card, CardContent, Input, Label } from "@xennic/ui";
import { apiFetch } from "@/lib/api-client";

const keyResponseSchema = z.object({ id: z.string(), maskedKey: z.string() });
const settingsResponseSchema = z.object({
  id: z.string(),
  provider: z.string(),
  defaultModel: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

/**
 * AI Arena — فهرست مدل‌های فعال دروازه و تنظیمات کلید اختصاصی (BYOK).
 *
 * اسکیمای اعتبارسنجی ورودی از @xennic/shared import می‌شود (همان اسکیمایی که Core API
 * با آن اعتبارسنجی می‌کند)؛ پاسخ‌ها اما با اسکیمای محلیِ کوچک بازبینی می‌شوند.
 * توجه: اشیای zod قابل پاس‌دادن از Server Component به Client Component نیستند.
 */
export function ApiModelTable({ path = "ai/models" }: { path?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const models = useQuery({
    queryKey: ["ai", "models"],
    queryFn: () => apiFetch(path, aiModelListSchema),
    staleTime: 5 * 60 * 1000,
  });

  // مقدار انتخاب‌شدهٔ کاربر؛ تا انتخاب دستی، اولین مدل فهرست پیش‌فرض است (بدون useEffect)
  const [pickedModel, setPickedModel] = useState("");
  const defaultModel = pickedModel || (models.data?.[0]?.slug ?? "");

  const keyForm = useForm<z.input<typeof aiKeySchema>>({
    resolver: zodResolver(aiKeySchema),
    defaultValues: { provider: "GITHUB_MODELS", label: "default" },
  });

  const saveSettings = useMutation({
    mutationFn: (slug: string) =>
      apiFetch("user/ai-settings", settingsResponseSchema, { method: "PUT", body: { defaultModel: slug } }),
    onSuccess: () => {
      toast.success("مدل پیش‌فرض ذخیره شد");
      router.refresh();
    },
  });

  const saveKey = useMutation({
    mutationFn: (values: z.output<typeof aiKeySchema>) =>
      apiFetch("user/ai-settings", keyResponseSchema, { method: "POST", body: values }),
    onSuccess: (result) => {
      toast.success(`کلید ذخیره شد — ${result.maskedKey}`);
      keyForm.reset({
        provider: keyForm.getValues("provider"),
        label: keyForm.getValues("label"),
        apiKey: "",
      });
      void queryClient.invalidateQueries({ queryKey: ["ai", "credentials"] });
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">مدل</th>
                  <th className="px-4 py-2 font-medium">ارائه‌دهنده</th>
                  <th className="px-4 py-2 font-medium">بینایی</th>
                  <th className="px-4 py-2 font-medium">سقف توکن</th>
                  <th className="px-4 py-2 font-medium">لایه</th>
                </tr>
              </thead>
              <tbody>
                {models.isPending ? (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                      در حال بارگذاری فهرست مدل‌ها…
                    </td>
                  </tr>
                ) : null}
                {models.data?.map((row) => (
                  <tr className="border-t border-border" key={row.slug}>
                    <td className="px-4 py-2">
                      <span className="block">{row.displayName}</span>
                      <span className="xennic-numeric block text-[11px] text-muted-foreground">
                        {row.slug}
                      </span>
                    </td>
                    <td className="px-4 py-2">{row.provider}</td>
                    <td className="px-4 py-2">{row.supportsVision ? "پشتیبانی" : "—"}</td>
                    <td className="xennic-numeric px-4 py-2">{row.maxTokens ?? "—"}</td>
                    <td className="px-4 py-2">
                      <Badge variant={row.freeTierOnly ? "success" : "muted"}>
                        {row.freeTierOnly ? "رایگان" : "پولی"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {models.data?.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                      فهرست مدل‌ها خالی است؛ با `pnpm db:seed` کاتالوگ اولیه پر می‌شود.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {models.isError ? (
            <p className="px-4 py-3 text-xs text-destructive">
              فهرست مدل‌ها خوانده نشد: {models.error.message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardContent className="grid gap-3 p-6">
            <h2 className="text-sm font-semibold">مدل پیش‌فرض تحلیل</h2>
            <div className="grid gap-1.5">
              <Label htmlFor="ai-default-model">مدل</Label>
              <select
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                id="ai-default-model"
                onChange={(event) => setPickedModel(event.target.value)}
                value={defaultModel}
              >
                {(models.data ?? []).map((row) => (
                  <option key={row.slug} value={row.slug}>
                    {row.displayName}
                  </option>
                ))}
              </select>
            </div>
            <Button
              disabled={!defaultModel || saveSettings.isPending}
              onClick={() => saveSettings.mutate(defaultModel)}
              size="sm"
              type="button"
            >
              {saveSettings.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              ذخیره‌ی تنظیمات
            </Button>
            {saveSettings.isError ? (
              <p className="text-xs text-destructive">ذخیره‌ی تنظیمات نیازمند یک کلید اختصاصی ثبت‌شده است.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-3 p-6">
            <h2 className="text-sm font-semibold">کلید اختصاصی (BYOK)</h2>
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                void keyForm.handleSubmit((values) => saveKey.mutateAsync(values))(event);
              }}
            >
              <div className="grid gap-1.5">
                <Label htmlFor="ai-key">کلید API</Label>
                <Input
                  dir="ltr"
                  id="ai-key"
                  type="password"
                  placeholder="sk-…"
                  {...keyForm.register("apiKey")}
                />
                {keyForm.formState.errors.apiKey?.message ? (
                  <p className="text-[11px] text-destructive">{keyForm.formState.errors.apiKey.message}</p>
                ) : null}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ai-label">برچسب</Label>
                <Input id="ai-label" {...keyForm.register("label")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ai-provider">ارائه‌دهنده</Label>
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  id="ai-provider"
                  {...keyForm.register("provider")}
                >
                  <option value="GITHUB_MODELS">GitHub Models</option>
                  <option value="OPENAI">OpenAI</option>
                  <option value="ANTHROPIC">Anthropic</option>
                  <option value="GEMINI">Gemini</option>
                </select>
              </div>
              <Button disabled={saveKey.isPending} size="sm" type="submit">
                {saveKey.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
                ذخیره‌ی امن کلید
              </Button>
            </form>
            <p className="text-[11px] leading-5 text-muted-foreground">
              کلید با AES-256-GCM رمزنگاری و فقط در لحظه‌ی فراخوان مدل رمزگشایی می‌شود؛ در دیتابیس تنها ۴
              نویسه‌ی آخر ذخیره می‌ماند.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
