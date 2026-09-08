"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

/**
 * بازدیدکننده ناشناس صفحات عمومی به درخواست نشست نیاز ندارد.
 * اطلاعات محلی فقط نشانه‌ی تلاش برای restore است، نه مجوز دسترسی؛
 * نشست کاربران برگشتی و همه‌ی مسیرهای ورود/پنل همچنان توسط API اعتبارسنجی می‌شود.
 */
export function AuthBootstrap() {
  const pathname = usePathname();
  const restore = useAuthStore((state) => state.restore);

  useEffect(() => {
    const isPublic = ["/", "/about", "/contact", "/wiki"].includes(pathname) || pathname.startsWith("/wiki/");
    if (isPublic && !useAuthStore.getState().user) return;
    void restore();
  }, [pathname, restore]);

  return null;
}
