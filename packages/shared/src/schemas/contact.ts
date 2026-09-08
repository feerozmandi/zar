import { z } from "zod";

/** قرارداد ورودی فرم مشاوره، مشترک بین سایت و Core API. */
export const contactRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "نام و نام خانوادگی را با حداقل ۳ نویسه وارد کنید")
    .max(120, "نام نباید بیشتر از ۱۲۰ نویسه باشد"),
  email: z.string().trim().pipe(z.email("نشانی ایمیل معتبر وارد کنید")),
  phone: z
    .string()
    .regex(/^0\d{9,11}$/, "شماره تماس معتبر، با صفر ابتدایی وارد کنید")
    .optional(),
  company: z.string().trim().max(120, "نام سازمان نباید بیشتر از ۱۲۰ نویسه باشد").optional(),
  topic: z.enum(["audit", "solar", "engineering", "wiki", "partnership", "support"]).default("audit"),
  message: z
    .string()
    .trim()
    .min(10, "شرح نیاز را با حداقل ۱۰ نویسه بنویسید")
    .max(4000, "شرح نیاز نباید بیشتر از ۴۰۰۰ نویسه باشد"),
});

/** پاسخ واقعی POST /contact با ورودی فرم یکسان نیست. */
export const contactResponseSchema = z.object({
  id: z.string().min(1),
  status: z.literal("NEW"),
  createdAt: z.iso.datetime(),
});

export type ContactRequestInput = z.infer<typeof contactRequestSchema>;
