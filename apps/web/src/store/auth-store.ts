import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";
import { apiFetch } from "@/lib/api-client";
import { accessTokenStore } from "@/lib/token-store";
import { authTokensSchema, type AuthenticatedUser } from "@/lib/auth-types";
import { ROLES } from "@xennic/shared";

/**
 * وضعیت احراز هویت سراسری (SSO بین پنل‌ها) — نوت ۳ §۲-ب
 * access token فقط در حافظه نگه داشته می‌شود؛ refresh token در کوکی httpOnly
 * سمت API است و با `restore` در هر بار بازشدن صفحه، نشست از روی آن بازسازی می‌شود.
 */
interface AuthState {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  status: "anonymous" | "authenticated";
  /** آیا یک بار تلاش restore انجام شده است؟ */
  restoring: boolean;
  signIn: (user: AuthenticatedUser, accessToken: string) => void;
  signOut: () => Promise<void>;
  /** بازسازی نشست از کوکی رفرش httpOnly (بعد از رفرش صفحه) */
  restore: () => Promise<boolean>;
  /** آدرس هدف پیش‌فرض پس از ورود — می‌تواند توسط فر 건당 تغییر کند */
  postLoginRedirect: string;
  setPostLoginRedirect: (path: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      status: "anonymous",
      restoring: false,
      postLoginRedirect: "/audit",
      signIn: (user, accessToken) => {
        accessTokenStore.set(accessToken);
        set({ user, accessToken, status: "authenticated" });
      },
      signOut: async () => {
        try {
          await apiFetch(
            "auth/logout",
            zRevoked,
            { method: "POST", body: {}, timeoutMs: 8_000 },
          );
        } catch {
          // حتی اگر API در دسترس نباشد، نشست محلی باید پاک شود
        }
        accessTokenStore.set(null);
        set({ user: null, accessToken: null, status: "anonymous" });
      },
      restore: async () => {
        if (get().accessToken) return true;
        if (get().restoring) return get().status === "authenticated";
        set({ restoring: true });
        try {
          const result = await apiFetch("auth/refresh", authTokensSchema, {
            method: "POST",
            timeoutMs: 10_000,
          });
          accessTokenStore.set(result.accessToken);
          set({
            user: result.user,
            accessToken: result.accessToken,
            status: "authenticated",
          });
          return true;
        } catch {
          accessTokenStore.set(null);
          set({ user: null, accessToken: null, status: "anonymous" });
          return false;
        } finally {
          set({ restoring: false });
        }
      },
      setPostLoginRedirect: (path) => set({ postLoginRedirect: path }),
    }),
    {
      name: "xennic.auth",
      partialize: (state) => ({ user: state.user, status: state.status }),
    },
  ),
);

const zRevoked = z.object({ revoked: z.boolean() });

/** مسیر پیش‌فرض پس از ورود بر اساس نقش کاربر */
export function defaultRedirectForRole(role: AuthenticatedUser["role"]): string {
  switch (role) {
    case ROLES.superAdmin:
      return "/admin";
    case ROLES.proEngineer:
      return "/engineering";
    case ROLES.epcPartner:
      return "/solar";
    default:
      return "/audit";
  }
}