"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@xennic/ui";

/** سوییچ تم تیره/روشن — تم تیره مطابق نوت ۴ پیش‌فرض است */
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const next = resolvedTheme === "light" ? "dark" : "light";

  return (
    <Button aria-label="تغییر تم" onClick={() => setTheme(next)} size="icon" variant="ghost">
      {resolvedTheme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
      <span className="sr-only">
        <Monitor />
      </span>
    </Button>
  );
}
