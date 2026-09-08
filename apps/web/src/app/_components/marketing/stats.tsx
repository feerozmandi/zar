"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "./reveal";

const stats = [
  { to: 30, prefix: "+", suffix: "", label: "سال تجربه تخصصی در صنعت برق" },
  { to: 100, prefix: "", suffix: "٪", label: "مطابقت با آیین‌نامه‌های توانیر و IEC" },
  { to: 4, prefix: "", suffix: "", label: "ماژول تخصصی و یکپارچه ابری" },
  { to: 12, prefix: "+", suffix: "", label: "ابزار و تحلیلگر تخصصی انرژی" },
];

/** تبدیل عدد به ارقام فارسی */
const fa = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

/** شمارنده‌ی نرم با easing — فقط پس از ورود به دید؛ با کاهش حرکت، مستقیم عدد نهایی */
function Counter({ to, started }: { to: number; started: boolean }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!started) return;
    // با ترجیح کاهش حرکت، مدت صفر → عدد نهایی در همان تیک اول
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1500;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = duration === 0 ? 1 : Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, to]);

  return <>{fa(value)}</>;
}

/** شمارنده‌های اعتبار تجاری (نوت ۴ §۴) — نوار آماری با شمارش متحرک هنگام اسکرول */
export function Stats() {
  const ref = useRef<HTMLElement | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      aria-label="آمار و اعتبار شرکت"
      className="relative border-y border-border/60 bg-card/30"
    >
      <dl className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-14 lg:grid-cols-4 lg:px-8 lg:py-16">
        {stats.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 90} className="text-center">
            <dd className="xennic-numeric text-4xl font-black text-primary lg:text-5xl">
              <span dir="ltr" className="inline-flex items-baseline">
                {stat.prefix}
                <Counter to={stat.to} started={started} />
                {stat.suffix}
              </span>
            </dd>
            <dt className="mx-auto mt-3 max-w-48 text-xs leading-6 text-muted-foreground sm:text-sm">
              {stat.label}
            </dt>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
