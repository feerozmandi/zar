import { z } from "zod";

export const authenticatedUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  role: z.enum(["USER", "PRO_ENGINEER", "EPC_PARTNER", "SUPER_ADMIN"]),
});

export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;

/** پاسخ login/refresh: توکن‌ها + کاربر (به‌صورت envelope در `data`) */
export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.string(),
  user: authenticatedUserSchema,
});

export type AuthTokens = z.infer<typeof authTokensSchema>;
/** قرارداد خروج؛ فقط هنگام نیاز به بازیابی/خروج نشست بارگذاری می‌شود. */
export const revokedSchema = z.object({ revoked: z.boolean() });
