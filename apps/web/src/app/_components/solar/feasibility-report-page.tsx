"use client";

import { useMemo } from "react";
import { Button, Card, CardContent } from "@xennic/ui";
import { DEFAULT_DRAFT, runFeasibility, useSolarDraft } from "@/lib/solar/draft";
import { ReportView } from "./report-view";

/**
 * صفحه‌ی طرح توجیهی: پیش‌نویسِ پروژه از sessionStorage خوانده و گزارش در مرورگر
 * ساخته می‌شود (بدون نیاز به ورود). اگر کاربر وارد باشد، می‌تواند گزارش را در
 * تاریخچه‌ی حسابش ذخیره کند.
 */
export function FeasibilityReportPage() {
  const [draftSnapshot, setDraft] = useSolarDraft();
  const input = draftSnapshot.input;
  const result = useMemo(() => runFeasibility(input), [input]);

  if (!result.ok) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="grid gap-3 p-6">
          <p className="text-sm text-destructive">{result.error}</p>
          <Button onClick={() => setDraft(DEFAULT_DRAFT)} type="button" variant="outline">
            بازگشت به پروژه‌ی نمونه
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <ReportView report={result.report} />;
}
