import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthenticatedUser } from "@/lib/auth-types";

/**
 * وضعیت احراز هویت سراسری (SSO بین پنل‌ها) — نوت ۳ §۲-ب
 * توکن‌ها فقط در حافظه نگه داشته می‌شوند؛ refresh token در کوکی httpOnly سمت API است.
 */
interface AuthState {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  status: "anonymous" | "authenticated";
  signIn: (user: AuthenticatedUser, accessToken: string) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      status: "anonymous",
      signIn: (user, accessToken) => set({ user, accessToken, status: "authenticated" }),
      signOut: () => set({ user: null, accessToken: null, status: "anonymous" }),
    }),
    {
      name: "xennic.auth",
      partialize: (state) => ({ user: state.user, status: state.status }),
    },
  ),
);
