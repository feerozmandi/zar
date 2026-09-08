"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";

/**
 * بازسازی نشست در شروع هر صفحه: اگر access token در حافظه نباشد (رفرش صفحه)،
 * با کوکی رفرش httpOnly از /auth/refresh بازیابی می‌شود.
 */
export function AuthBootstrap() {
  const restore = useAuthStore((state) => state.restore);

  useEffect(() => {
    void restore();
  }, [restore]);

  return null;
}
