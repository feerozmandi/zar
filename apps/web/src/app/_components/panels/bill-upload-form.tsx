"use client";

import { useRef, useState } from "react";
import { Button, Card, CardContent } from "@xennic/ui";

/**
 * آپلود قبض — فاز ۱ فقط انتخاب فایل و پیش‌نمایش حجم را انجام می‌دهد؛
 * ارسال به POST /audit/upload (multipart) پس از فعال‌سازی لایه‌ی احراز هویت کامل می‌شود.
 */
export function BillUploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  return (
    <Card className="border-dashed">
      <CardContent className="grid gap-4 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          فایل PDF یا تصویر قبض (حداکثر ۱۰ مگابایت) را انتخاب یا در این کادر رها کنید.
        </p>
        <input
          accept=".pdf,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          ref={inputRef}
          type="file"
        />
        <div className="flex justify-center gap-3">
          <Button onClick={() => inputRef.current?.click()}>انتخاب فایل</Button>
          <Button disabled={!file} variant="outline">
            ارسال برای تحلیل
          </Button>
        </div>
        {file ? (
          <p className="xennic-numeric text-xs text-muted-foreground">
            {file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
