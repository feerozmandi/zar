"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import styles from "./site-chrome.module.css";

/** آیکون‌ها با CSS پوسته عوض می‌شوند؛ اختلاف HTML سرور و مرورگر نداریم. */
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      type="button"
      className={styles.iconButton}
      aria-label="تغییر پوسته روشن و تیره"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon size={18} strokeWidth={1.6} className={styles.lightIcon} aria-hidden="true" />
      <Sun size={19} strokeWidth={1.6} className={styles.darkIcon} aria-hidden="true" />
    </button>
  );
}
