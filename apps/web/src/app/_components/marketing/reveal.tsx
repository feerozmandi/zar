"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** کلاس‌های اضافی روی خود المان */
  className?: string;
  /** تأخیر انیمیشن بر حسب میلی‌ثانیه (برای افکت پلکانی) */
  delay?: number;
  /** المان زیربنایی — پیش‌فرض div */
  as?: ElementType;
  id?: string;
};

/**
 * ظهور نرم محتوا هنگام اسکرول (IntersectionObserver — بدون کتابخانه).
 * با «کاهش حرکت» سیستم، محتوا بدون انیمیشن و کاملاً نمایان رندر می‌شود.
 */
export function Reveal({ children, className, delay = 0, as: Tag = "div", id }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      id={id}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`reveal${visible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </Tag>
  );
}
