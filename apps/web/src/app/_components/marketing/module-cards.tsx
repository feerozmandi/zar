"use client";

import { useState } from "react";
import { ArrowUpLeft, BookOpen, Calculator, FileChartColumn, LockKeyhole, Sun } from "lucide-react";
import Link from "next/link";
import { filterTools, type ToolFilter } from "@/lib/marketing-content";
import styles from "./marketing.module.css";

const icons = { audit: FileChartColumn, solar: Sun, engineering: Calculator, wiki: BookOpen };
const filters: { id: ToolFilter; label: string }[] = [
  { id: "all", label: "همه ابزارها" },
  { id: "available", label: "قابل استفاده و آزمایشی" },
  { id: "development", label: "در حال توسعه" },
];

/** تنها بخش تعاملی محتوای لندینگ؛ فیلتر بدون درخواست شبکه یا جابه‌جایی مسیر کار می‌کند. */
export function ModuleCards() {
  const [filter, setFilter] = useState<ToolFilter>("all");
  const tools = filterTools(filter);

  return (
    <section className={styles.toolsSection} id="tools" aria-labelledby="tools-title">
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden="true" />
              جعبه‌ابزار دیجیتال Xennic
            </p>
            <h2 className={styles.sectionTitle} id="tools-title">
              دانش مهندسی،
              <br />
              این بار در دسترس شما.
            </h2>
          </div>
          <p className={styles.sectionIntro}>
            ابزارهایی که توسعه می‌دهیم تا پیچیدگی محاسبات کمتر و تصمیم‌های شما دقیق‌تر شود. یک نقطه شروع
            هوشمند، در کنار مشاوره تخصصی.
          </p>
        </div>
        <div className={styles.toolToolbar}>
          <div className={styles.toolFilters} role="group" aria-label="فیلتر وضعیت ابزارها">
            {filters.map((item) => (
              <button
                type="button"
                aria-pressed={filter === item.id}
                aria-controls="tool-results"
                className={styles.filterButton}
                key={item.id}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <span className={styles.toolCount} role="status" aria-live="polite" aria-atomic="true">
            {tools.length.toLocaleString("fa-IR")} ابزار تخصصی
          </span>
        </div>
        <div className={styles.toolGrid} id="tool-results">
          {tools.map((tool) => {
            const Icon = icons[tool.id];
            return (
              <article className={styles.toolCard} key={tool.id}>
                <div className={styles.toolCardTop}>
                  <Icon size={27} strokeWidth={1.4} aria-hidden="true" />
                  <span className={styles.toolStatus} data-status={tool.status}>
                    <span aria-hidden="true" />
                    {tool.statusLabel}
                  </span>
                </div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                <Link className={styles.toolLink} href={tool.href} prefetch={false}>
                  {tool.cta}
                  <ArrowUpLeft size={18} aria-hidden="true" />
                  {tool.requiresAccount && <span className="sr-only"> (نیازمند ورود به حساب)</span>}
                </Link>
              </article>
            );
          })}
        </div>
        <p className={styles.toolsFootnote}>
          <LockKeyhole size={15} aria-hidden="true" />
          ابزارهای محاسباتی به حساب کاربری نیاز دارند. نتایج اولیه، جایگزین بررسی تخصصی پروژه نیستند.
        </p>
      </div>
    </section>
  );
}
