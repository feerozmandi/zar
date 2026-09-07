import { z } from "zod";

/** فرم «درخواست مشاوره تخصصی» لندینگ — نوت ۴ §۶ */
export const contactRequestSchema = z.object({
  name: z.string().min(3).max(120),
  email: z.email(),
  phone: z
    .string()
    .regex(/^0\d{9,11}$/, "شماره تماس نامعتبر است")
    .optional(),
  company: z.string().max(120).optional(),
  topic: z.enum(["audit", "solar", "engineering", "wiki", "partnership", "support"]).default("audit"),
  message: z.string().min(10).max(4000),
});

export type ContactRequestInput = z.infer<typeof contactRequestSchema>;
