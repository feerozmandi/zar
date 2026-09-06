const stats = [
  { label: "سال تجربه تخصصی در صنعت برق", value: "+۳۰" },
  { label: "مطابقت با آیین‌نامه‌های توانیر و IEC", value: "۱۰۰٪" },
  { label: "ماژول تخصصی و یکپارچه ابری", value: "۳" },
];

/** شمارنده‌های اعتبار تجاری (نوت ۴ §۴) */
export function Stats() {
  return (
    <section className="border-y border-border/60 bg-card/40">
      <dl className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            <dd className="xennic-numeric mt-1 text-3xl font-black text-primary">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
