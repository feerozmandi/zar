import { describe, expect, it } from "vitest";
import { contactRequestSchema, contactResponseSchema } from "./contact.js";

const request = {
  name: "  علی مهندس  ",
  email: "  ali@example.com  ",
  message: "  درخواست مشاوره نیروگاه خورشیدی  ",
};

describe("قرارداد فرم مشاوره", () => {
  it("فیلدهای اختیاری را الزامی نمی‌کند و فاصله‌های اضافی را حذف می‌کند", () => {
    expect(contactRequestSchema.parse(request)).toEqual({
      name: "علی مهندس",
      email: "ali@example.com",
      message: "درخواست مشاوره نیروگاه خورشیدی",
      topic: "audit",
    });
  });
  it("شماره تماس و موضوع معتبر را نگه می‌دارد", () => {
    expect(contactRequestSchema.parse({ ...request, phone: "09123456789", topic: "solar" })).toMatchObject({
      phone: "09123456789",
      topic: "solar",
    });
  });
  it("ایمیل، شماره و موضوع نامعتبر را رد می‌کند", () => {
    expect(contactRequestSchema.safeParse({ ...request, email: "not-email" }).success).toBe(false);
    expect(contactRequestSchema.safeParse({ ...request, phone: "123" }).success).toBe(false);
    expect(contactRequestSchema.safeParse({ ...request, topic: "unknown" }).success).toBe(false);
  });
  it("پاسخ POST /contact را جدا از ورودی فرم اعتبارسنجی می‌کند", () => {
    const response = { id: "request-1", status: "NEW", createdAt: "2026-09-08T10:00:00.000Z" };
    expect(contactResponseSchema.parse(response)).toEqual(response);
    expect(contactResponseSchema.safeParse(request).success).toBe(false);
    expect(contactRequestSchema.safeParse(response).success).toBe(false);
  });
});
