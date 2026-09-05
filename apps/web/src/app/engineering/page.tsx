import Link from "next/link";
import { Card, CardContent, CardDescription, CardTitle } from "@xennic/ui";
import { PanelShell } from "../_components/panels/panel-shell";

const tools = [
  { href: "/engineering/voltage-drop", title: "افت ولتاژ", ready: true, note: "IEC 60364-5-52" },
  { href: "/engineering/cable-sizing", title: "سایزینگ کابل", ready: false, note: "فاز ۳" },
  { href: "/engineering/capacitor-bank", title: "بانک خازنی", ready: false, note: "فاز ۳" },
  { href: "/engineering/generator-size", title: "انتخاب ژنراتور", ready: false, note: "فاز ۳" },
];

export default function EngineeringIndexPage() {
  return (
    <PanelShell
      description="ابزارهای محاسباتی با خروجی مستند و قابل استناد برای ناظر و کارفرما."
      title="ابزارها"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link className="block" href={tool.href} key={tool.href}>
            <Card className="transition-colors hover:border-primary/60">
              <CardContent className="p-5">
                <CardTitle>{tool.title}</CardTitle>
                <CardDescription className="mt-1">
                  {tool.ready ? "آماده‌ی استفاده" : `در حال توسعه — ${tool.note}`}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PanelShell>
  );
}
