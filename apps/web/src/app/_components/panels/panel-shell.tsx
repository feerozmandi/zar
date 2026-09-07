import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@xennic/ui";

export interface PanelShellProps {
  title: string;
  description: string;
  /** رنگ تأکیدی ماژول — از توکن‌های design-tokens */
  accent?: string;
  status?: "آماده‌به‌کار" | "در حال توسعه" | "برنامه‌ریزی‌شده";
  children?: ReactNode;
}

/** پوسته‌ی مشترک همه‌ی پنل‌ها؛ عنوان/توضیح را یکجا نگه می‌دارد تا UI پنل‌ها یکسان بماند */
export function PanelShell({
  title,
  description,
  accent,
  status = "در حال توسعه",
  children,
}: PanelShellProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-8">
      <Card className="xennic-glass overflow-hidden">
        <CardHeader className="border-b border-border/60">
          <div className="flex items-center gap-3">
            {accent ? (
              <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: accent }} />
            ) : null}
            <CardTitle className="text-xl">{title}</CardTitle>
            <span className="mr-auto rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
              {status}
            </span>
          </div>
          <CardDescription className="max-w-3xl leading-7">{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-6">{children}</CardContent>
      </Card>
    </section>
  );
}
