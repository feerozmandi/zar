/**
 * مخزن درون‌حافظه‌ای access token — بدون واکنش‌پذیری؛ توسط apiFetch خوانده و
 * توسط auth-store نوشته می‌شود تا سشن بین فراخوان‌های API مشترک باشد.
 */
let current: string | null = null;

export const accessTokenStore = {
  get(): string | null {
    return current;
  },
  set(token: string | null): void {
    current = token;
  },
};
