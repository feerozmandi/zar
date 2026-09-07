"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { voltageDropSchema, type VoltageDropInputDto } from "@xennic/shared";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge, Button, Card, CardContent, Input, Label, Separator } from "@xennic/ui";
import { apiFetch } from "@/lib/api-client";

const resultSchema = z.object({
  resistanceOhm: z.number(),
  reactanceOhm: z.number(),
  dropVolt: z.number(),
  dropPercent: z.number(),
  limitPercent: z.number(),
  withinLimit: z.boolean(),
});

type Result = z.infer<typeof resultSchema>;

/**
 * ابزار افت ولتاژ — نمونه‌ی کامل «اتصال پنل به Core API» در فاز ۱:
 * اعتبارسنجی با اسکیمای مشترک، فراخوان از پروکسی هم‌ریشه و نمایش نتیجه.
 */
export function VoltageDropTool() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<z.input<typeof voltageDropSchema>, unknown, VoltageDropInputDto>(
    {
      resolver: zodResolver(voltageDropSchema),
    },
  );

  async function onSubmit(values: VoltageDropInputDto) {
    setError(null);
    try {
      setResult(await apiFetch("engineering/voltage-drop", resultSchema, { method: "POST", body: values }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "خطا در محاسبه");
      setResult(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <Card>
        <CardContent className="grid gap-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="voltage" label="ولتاژ نامی (V)">
              <Input dir="ltr" id="voltage" type="number" {...register("voltage", { valueAsNumber: true })} />
            </Field>
            <Field htmlFor="current" label="جریان (A)">
              <Input dir="ltr" id="current" type="number" {...register("current", { valueAsNumber: true })} />
            </Field>
            <Field htmlFor="length" label="طول مسیر (m)">
              <Input dir="ltr" id="length" type="number" {...register("length", { valueAsNumber: true })} />
            </Field>
            <Field htmlFor="powerFactor" label="کسینوس فی">
              <Input
                dir="ltr"
                id="powerFactor"
                step="0.01"
                type="number"
                {...register("powerFactor", { valueAsNumber: true })}
              />
            </Field>
            <Field htmlFor="system" label="نوع سیستم">
              <select
                className="h-10 w-full rounded-(--radius-button) border border-input bg-transparent px-3 text-sm"
                id="system"
                {...register("system")}
              >
                <option value="three">سه‌فاز</option>
                <option value="single">تک‌فاز</option>
              </select>
            </Field>
            <Field htmlFor="conductor" label="جنس هادی">
              <select
                className="h-10 w-full rounded-(--radius-button) border border-input bg-transparent px-3 text-sm"
                id="conductor"
                {...register("conductor")}
              >
                <option value="copper">مس</option>
                <option value="aluminium">آلومینیوم</option>
              </select>
            </Field>
          </div>
          <Button onClick={() => void handleSubmit(onSubmit)()} type="button">
            محاسبه
          </Button>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card className="bg-card/60">
        <CardContent className="p-6">
          <p className="text-sm font-bold">نتیجه</p>
          {result ? (
            <>
              <Separator className="my-4" />
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <Item label="افت ولتاژ" value={`${result.dropVolt} V`} />
                <Item label="درصد افت" value={`${result.dropPercent} %`} />
                <Item label="حد مجاز" value={`${result.limitPercent} %`} />
                <Item
                  label="وضعیت"
                  value={
                    <Badge variant={result.withinLimit ? "success" : "danger"}>
                      {result.withinLimit ? "در محدوده مجاز" : "خارج از حد مجاز"}
                    </Badge>
                  }
                />
              </dl>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              برای دیدن نتیجه مقادیر را وارد کنید و «محاسبه» را بزنید (نیازمند اجرای apps/api).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ children, htmlFor, label }: { children: React.ReactNode; htmlFor: string; label: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="xennic-numeric mt-1 text-base font-bold">{value}</dd>
    </div>
  );
}
