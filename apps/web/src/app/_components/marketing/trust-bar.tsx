const standards = [
  "IEC 60364",
  "نشریه ۱۱۰ سازمان برنامه",
  "مبحث ۱۳ مقررات ملی",
  "مصوبات ماده ۱۲ و ۱۶",
  "آیین‌نامه‌های توانیر",
  "بورس انرژی ایران",
];

/** نوار اعتبار — مراجع و استانداردهای حاکم بر خدمات و ابزارهای پلتفرم */
export function TrustBar() {
  return (
    <section aria-label="استانداردها و مراجع فنی" className="border-b border-border/60">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-7 lg:px-8">
        {standards.map((item, index) => (
          <span
            key={item}
            className="inline-flex items-center gap-8 text-sm font-medium text-muted-foreground/90"
          >
            {index > 0 && (
              <span aria-hidden className="hidden size-1 rounded-full bg-primary/40 sm:inline-block" />
            )}
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
