import { z } from "zod";

export const authenticatedUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  role: z.enum(["USER", "PRO_ENGINEER", "EPC_PARTNER", "SUPER_ADMIN"]),
});

export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;
