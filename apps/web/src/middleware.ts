import { NextResponse, type NextRequest } from "next/server";

/**
 * گارد مسیرهای پنل: بدون کوکی نشست (xennic_refresh httpOnly) کاربر به /login
 * هدایت می‌شود. اعتبار خود کوکی هنگام فراخوان API با 401→refresh بررسی می‌شود
 * و در اینجا فقط «وجود نشست» بودن درها را باز/بسته می‌کند.
 *
 * استثنا: مسیرهای /solar عمومی‌اند (مدل Google Project Sunroof) تا بازدیدکننده
 * بتواند بدون ثبت‌نام پتانسیلِ پشت‌بامش را ببیند؛ تنها «ذخیره در تاریخچه» و
 * «ارسال به پیمانکاران» نیازمند حساب هستند و در خود صفحه هدایت می‌شوند.
 */
const PROTECTED_PREFIXES = ["/audit", "/admin", "/engineering", "/ai"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();

  if (!request.cookies.has("xennic_refresh")) {
    const login = new URL("/login", request.url);
    if (pathname !== "/login") login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/audit/:path*", "/admin/:path*", "/engineering/:path*", "/ai/:path*"],
};
