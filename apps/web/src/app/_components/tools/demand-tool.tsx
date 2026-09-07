"use client";

import { useState } from "react";
import { z } from "zod";
import { Button, Card, CardContent, Input, Label, Separator } from "@xennic/ui";
import { Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface LoadRow {
  label: string;
  kw: number | null;
  category: string;
  demandFactor: number | null;
}

const CATEGORIES: Array<{ value: string; label: string; df: number }> = [
  { value: "lighting", label: "روشنایی", df: 1 },
  { value: "socket", label: "پریز و مصارف پراکنده", df: 0.4 },
  { value: "motor", label: "موتور", df: 0.75 },
  { value: "hvac", label: "سرمایش/گرمایش", df: 0.9 },
  { value: "elevator", label: "آسانسور", df: 0.5 },
  { value: "computer", label: "IT و سرور", df: 0.9 },
  { value: "equipment", label: "تجهیزات صنعتی", df: 0.7 },
];

interface DemandResult {
  totalConnectedKw?: number;
  coincidentDemandKw?: number;
  demandFactor?: number;
  demandCurrentA?: number;
  [key: string]: unknown;
}

export function DemandTool() {
  const [rows, setRows] = useState<LoadRow[]>([
    { label: "", kw: null, category: "lighting", demandFactor: null },
  ]);
  const [diversity, setDiversity] = useState("0.8");
  const [voltage, setVoltage] = useState("400");
  const [result, setResult] = useState<DemandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function updateRow(i: number, patch: Partial<LoadRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { label: "", kw: null, category: "lighting", demandFactor: null }]);
  }
  function removeRow(i: number) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  async function onSubmit() {
    setError(null);
    const loads = rows.map((r) => ({
      label: r.label.trim() || "بار",
      kw: Number(r.kw),
      ...(r.category ? { category: r.category } : {}),
      ...(r.demandFactor && r.demandFactor > 0 ? { demandFactor: Number(r.demandFactor) } : {}),
    }));
    if (loads.some((l) => !Number.isFinite(l.kw) || l.kw <= 0)) {
      setError("برای هر بار، توان (kW) مثبت وارد کنید.");
      return;
    }
    setBusy(true);
    try {
      const data = await apiFetch("engineering/demand", z.unknown(), {
        method: "POST",
        body: { loads, diversityFactor: Number(diversity) || 0.8, voltage: Number(voltage) || 400 },
      });
      setResult(data as DemandResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "خطا در محاسبه");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ضریب هم‌زمانی بین گروه‌ها">
              <Input
                dir="ltr"
                min={0.6}
                max={1}
                step="0.05"
                type="number"
                value={diversity}
                onChange={(e) => setDiversity(e.target.value)}
              />
            </Field>
            <Field label="ولتاژ انشعاب (V)">
              <Input
                dir="ltr"
                min={1}
                step="1"
                type="number"
                value={voltage}
                onChange={(e) => setVoltage(e.target.value)}
              />
            </Field>
          </div>

          <Separator />
          <div className="space-y-3">
            <p className="text-sm font-bold">بارهای متصل</p>
            {rows.map((row, i) => (
              <div
                className="grid gap-3 rounded border border-border/50 p-3 sm:grid-cols-[1fr_110px_1fr_120px]"
                key={i}
              >
                <Field label={`عنوان بار ${i + 1}`}>
                  <Input
                    dir="rtl"
                    placeholder="مثلاً موتور پمپ"
                    value={row.label}
                    onChange={(e) => updateRow(i, { label: e.target.value })}
                  />
                </Field>
                <Field label="توان (kW)">
                  <Input
                    dir="ltr"
                    type="number"
                    value={row.kw ?? ""}
                    onChange={(e) => updateRow(i, { kw: e.target.value ? Number(e.target.value) : null })}
                  />
                </Field>
                <Field label="دسته‌بندی">
                  <select
                    className="h-10 w-full rounded-(--radius-button) border border-input bg-transparent px-2 text-sm"
                    value={row.category}
                    onChange={(e) => {
                      const cat = CATEGORIES.find((c) => c.value === e.target.value);
                      updateRow(i, { category: e.target.value, demandFactor: cat ? cat.df : null });
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label} ({c.df})
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="ضریب تقاضا">
                  <Input
                    dir="ltr"
                    max={1}
                    min={0.1}
                    step="0.05"
                    type="number"
                    value={row.demandFactor ?? ""}
                    onChange={(e) =>
                      updateRow(i, { demandFactor: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                </Field>
              </div>
            ))}
          </div>
          <Button onClick={addRow} type="button" variant="outline">
            <Plus className="size-4" /> افزودن بار
          </Button>
          <div className="flex items-center gap-3">
            <Button disabled={busy || rows.length === 0} onClick={() => void onSubmit()} type="button">
              {busy ? "در حال محاسبه..." : "محاسبه"}
            </Button>
            {rows.length > 1 ? (
              <Button onClick={() => removeRow(rows.length - 1)} type="button" variant="ghost">
                <Trash2 className="size-4" /> حذف
              </Button>
            ) : null}
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card className="bg-card/60">
        <CardContent className="p-6">
          <p className="text-sm font-bold">نتیجه</p>
          {result ? (
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <Item label="بار متصل کل (kW)" value={result.totalConnectedKw ?? 0} />
              <Item label="دیماند هم‌زمان (kW)" value={result.coincidentDemandKw ?? 0} />
              <Item label="ضریب تقاضای کلی" value={result.demandFactor ?? 0} />
              <Item label="جریان دیماند (A)" value={result.demandCurrentA ?? 0} />
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              بارها را وارد کنید و «محاسبه» را بزنید (نیازمند اجرای Core API).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
function Item({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="xennic-numeric mt-1 text-base font-bold">{value}</dd>
    </div>
  );
}
