import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { ContactForm } from "./contact-form";

vi.mock("next/link", () => ({
  default: ({ children, prefetch: _prefetch, ...props }: ComponentProps<"a"> & { prefetch?: boolean }) => (
    <a {...props}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText("نام و نام خانوادگی"), { target: { value: "علی مهندس" } });
  fireEvent.change(screen.getByLabelText("ایمیل"), { target: { value: "ali@example.com" } });
  fireEvent.change(screen.getByLabelText("شرح نیاز شما"), {
    target: { value: "درخواست مشاوره برای نیروگاه خورشیدی روی بام کارخانه" },
  });
}

describe("مسیر ثبت مشاوره", () => {
  it("ورودی خالی را با پیام فارسی و ارتباط دسترس‌پذیر خطا رد می‌کند", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ContactForm />);
    fireEvent.click(screen.getByRole("button", { name: "ارسال درخواست مشاوره" }));
    await screen.findByText("نام و نام خانوادگی را با حداقل ۳ نویسه وارد کنید");
    expect(screen.getByLabelText("نام و نام خانوادگی").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("نام و نام خانوادگی").getAttribute("aria-describedby")).toBe(
      "contact-name-error",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("شماره اختیاری خالی را حذف و پاسخ واقعی API را به‌عنوان موفقیت قبول می‌کند", async () => {
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(
        Response.json({
          success: true,
          data: { id: "request-123", status: "NEW", createdAt: "2026-09-08T12:00:00.000Z" },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<ContactForm initialTopic="solar" />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "ارسال درخواست مشاوره" }));
    await screen.findByText("گفت‌وگوی ما از همین‌جا شروع شد.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/proxy/contact");
    if (typeof init?.body !== "string") throw new Error("Expected a JSON request body");
    const payload: unknown = JSON.parse(init.body);
    expect(payload).toMatchObject({ name: "علی مهندس", topic: "solar" });
    expect(payload).not.toHaveProperty("phone");
    expect(document.activeElement).toBe(screen.getByRole("status"));
  });

  it("در قطع سرویس، موفقیت کاذب نشان نمی‌دهد و امکان تلاش مجدد را حفظ می‌کند", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(Response.json({ message: "هسته API در دسترس نیست" }, { status: 503 }))),
    );
    render(<ContactForm />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "ارسال درخواست مشاوره" }));
    const error = await screen.findByRole("alert");
    expect(error.textContent).toContain("درخواست ارسال نشد");
    expect(screen.getByLabelText<HTMLInputElement>("نام و نام خانوادگی").value).toBe("علی مهندس");
    expect(screen.queryByRole("status")).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "ارسال درخواست مشاوره" }).disabled).toBe(
        false,
      ),
    );
  });

  it("شماره نامعتبر از ارسال فرم جلوگیری می‌کند", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ContactForm />);
    fillRequiredFields();
    fireEvent.change(screen.getByLabelText(/شماره تماس/), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "ارسال درخواست مشاوره" }));
    await screen.findByText("شماره تماس معتبر، با صفر ابتدایی وارد کنید");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
