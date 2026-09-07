import Link from "next/link";
import { Card, CardContent, CardDescription, CardTitle } from "@xennic/ui";
import { PanelShell } from "../_components/panels/panel-shell";

interface ToolEntry {
  href: string;
  title: string;
  summary: string;
  standards: string;
  /** فرم تعاملی کامل دارد (باقی از طریق API/استاب در دسترس است) */
  interactive: boolean;
}

interface ToolGroup {
  category: string;
  accent: string;
  tools: ToolEntry[];
}

const groups: ToolGroup[] = [
  {
    category: "مدار، تغذیه و کابل",
    accent: "#3AA0FF",
    tools: [
      {
        href: "/engineering/voltage-drop",
        title: "افت ولتاژ",
        summary: "افت ولتاژ مدار تک‌فاز/سه‌فاز بر پایه‌ی طول، جریان و مقطع.",
        standards: "IEC 60364-5-52 · نشریه ۱۱۰",
        interactive: true,
      },
      {
        href: "/engineering/cable-sizing",
        title: "سایزینگ کابل",
        summary: "انتخاب مقطع استاندارد با رعایت حد جریان و حد افت ولتاژ.",
        standards: "IEC 60364-5-52 · نشریه ۱۱۰",
        interactive: false,
      },
      {
        href: "/engineering/demand",
        title: "محاسبه بار و دیماند",
        summary: "حداکثر تقاضای هم‌زمان با ضرایب تقاضا.",
        standards: "مبحث ۱۳ · IEEE 141",
        interactive: false,
      },
    ],
  },
  {
    category: "شبکه و تجهیزات",
    accent: "#22C55E",
    tools: [
      {
        href: "/engineering/transformer",
        title: "انتخاب ترانسفورماتور",
        summary: "انتخاب ظرفیت از سری استاندارد و برآورد جریان/اتصال کوتاه.",
        standards: "IEC 60076 · توانیر",
        interactive: false,
      },
      {
        href: "/engineering/switchgear",
        title: "انتخاب کلید (بریکر)",
        summary: "جریان نامی و قدرت قطع کلید بر پایه‌ی سطح اتصال کوتاه.",
        standards: "IEC 60947-2 · IEC 62271",
        interactive: false,
      },
      {
        href: "/engineering/busbar",
        title: "سایزینگ شینه",
        summary: "سطح مقطع شینه‌ی مسی/آلومینیومی بر پایه‌ی جریان بار.",
        standards: "IEC 62271 · نشریه ۱۱۰",
        interactive: false,
      },
      {
        href: "/engineering/voltage-class",
        title: "طبقه‌بندی ولتاژ و رنج تجهیز",
        summary: "Um و سطح عایقی تجهیز برای هر سطح ولتاژ.",
        standards: "IEC 60038 · IEC 62271",
        interactive: false,
      },
    ],
  },
  {
    category: "حفاظت و کیفیت توان",
    accent: "#F59E0B",
    tools: [
      {
        href: "/engineering/short-circuit",
        title: "جریان اتصال کوتاه",
        summary: "I″k، جریان پیک و قدرت قطع لازم.",
        standards: "IEC 60909",
        interactive: false,
      },
      {
        href: "/engineering/capacitor-bank",
        title: "بانک خازنی / اصلاح ضریب قدرت",
        summary: "ظرفیت خازن و پله‌بندی برای رسیدن به ضریب قدرت هدف.",
        standards: "توانیر · IEC 60831",
        interactive: false,
      },
    ],
  },
  {
    category: "تولید، ارت و روشنایی",
    accent: "#8B5CF6",
    tools: [
      {
        href: "/engineering/generator-size",
        title: "انتخاب دیزل‌ژنراتور",
        summary: "ظرفیت ژنراتور اضطراری با ضریب هم‌زمانی.",
        standards: "IEC 60034-1",
        interactive: false,
      },
      {
        href: "/engineering/earthing",
        title: "مقاومت الکترود زمین",
        summary: "مقاومت میله‌ی ارت با توجه به نوع خاک.",
        standards: "IEEE 80 · مبحث ۱۳",
        interactive: false,
      },
      {
        href: "/engineering/lighting",
        title: "روشنایی داخلی",
        summary: "تعداد چراغ با روش لومن.",
        standards: "مبحث ۱۳ · CIE",
        interactive: false,
      },
    ],
  },
];

export default function EngineeringIndexPage() {
  return (
    <PanelShell
      description="ابزارهای محاسباتی مهندسی برق با خروجی مستند و قابل استناد؛ در پایان هر محاسبه، استاندارد معتبرِ ایرانی/بین‌المللی و رنج تجهیز پیوست می‌شود."
      title="جعبه‌ابزار محاسبات مهندسی برق"
    >
      <div className="space-y-8">
        {groups.map((group) => (
          <section className="space-y-3" key={group.category}>
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: group.accent }} />
              {group.category}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.tools.map((tool) => (
                <Link className="block" href={tool.href} key={tool.href}>
                  <Card className="h-full transition-colors hover:border-primary/60">
                    <CardContent className="flex h-full flex-col gap-2 p-5">
                      <CardTitle>{tool.title}</CardTitle>
                      <CardDescription className="flex-1">{tool.summary}</CardDescription>
                      <span className="rounded bg-muted/20 px-2 py-1 font-mono text-[11px] text-muted-foreground">
                        {tool.standards}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PanelShell>
  );
}
