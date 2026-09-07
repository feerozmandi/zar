"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { solarAssessSchema, type SolarAssessInput } from "@xennic/shared";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Card, CardContent, Input, Label } from "@xennic/ui";
import { apiFetch } from "@/lib/api-client";

/** فرم ارزیابی سایت خورشیدی — POST /solar/assess */
export function SolarAssessForm() {
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<z.input<typeof solarAssessSchema>, unknown, SolarAssessInput>({
    resolver: zodResolver(solarAssessSchema),
  });

  async function onSubmit(values: SolarAssessInput) {
    setError(null);
    try {
      setResult(
        await apiFetch("solar/assess", z.record(z.string(), z.unknown()), { method: "POST", body: values }),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "خطا در محاسبه");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="grid gap-4 p-6">
          <Field htmlFor="province" label="استان (کلید انگلیسی مطابق فهرست مشترک)">
            <Input dir="ltr" id="province" placeholder="tehran" {...register("province")} />
          </Field>
          <Field htmlFor="roofAreaM2" label="مساحت سقف (متر مربع)">
            <Input
              dir="ltr"
              id="roofAreaM2"
              inputMode="decimal"
              type="number"
              {...register("roofAreaM2", { valueAsNumber: true })}
            />
          </Field>
          <Field htmlFor="shadingFactor" label="ضریب سایه (۰ تا ۱)">
            <Input
              dir="ltr"
              id="shadingFactor"
              step="0.01"
              type="number"
              {...register("shadingFactor", { valueAsNumber: true })}
            />
          </Field>
          <Button onClick={() => void handleSubmit(onSubmit)()} type="button">
            محاسبه ظرفیت پیشنهادی
          </Button>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card className="bg-card/60">
        <CardContent className="p-6">
          <p className="text-sm font-bold">خروجی</p>
          <pre className="xennic-numeric mt-3 max-h-64 overflow-auto rounded-lg bg-muted/20 p-4 text-xs leading-6">
            {result ? JSON.stringify(result, null, 2) : "هنوز محاسبه‌ای انجام نشده است."}
          </pre>
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
