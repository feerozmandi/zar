import { ShieldCheck } from "lucide-react";

export function AdminSectionStub() {
  return (
    <div className="flex items-start gap-3 rounded-(--radius-card) border border-dashed border-border p-5 text-sm text-muted-foreground">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-secondary" />
      <p>
        این بخش در فاز ۵ (پنل ادمین، درگاه پرداخت و ربات تلگرام) کامل می‌شود. گاردهای RBAC و مسیرهای API از
        هم‌اکنون در <code className="xennic-numeric rounded bg-muted/20 px-1 py-0.5">apps/api</code> پیاده
        شده‌اند.
      </p>
    </div>
  );
}
