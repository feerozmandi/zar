import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { Faq } from "./faq";
import { ModuleCards } from "./module-cards";
import { faqs } from "@/lib/marketing-content";

vi.mock("next/link", () => ({
  default: ({ children, prefetch: _prefetch, ...props }: ComponentProps<"a"> & { prefetch?: boolean }) => (
    <a {...props}>{children}</a>
  ),
}));

afterEach(cleanup);

describe("فیلتر ابزارهای Xennic", () => {
  it("همه ابزارها ابتدا در HTML حاضرند و فیلتر به درخواست شبکه نیاز ندارد", () => {
    const { container } = render(<ModuleCards />);
    expect(container.querySelectorAll("article")).toHaveLength(4);
    const filters = within(screen.getByRole("group", { name: "فیلتر وضعیت ابزارها" }));
    const development = filters.getByRole("button", { name: "در حال توسعه" });
    fireEvent.click(development);
    expect(container.querySelectorAll("article")).toHaveLength(1);
    expect(development.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("heading", { name: "دانشنامه برق و انرژی" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("۱ ابزار");
    fireEvent.click(filters.getByRole("button", { name: "قابل استفاده و آزمایشی" }));
    expect(container.querySelectorAll("article")).toHaveLength(3);
    fireEvent.click(filters.getByRole("button", { name: "همه ابزارها" }));
    expect(container.querySelectorAll("article")).toHaveLength(4);
  });

  it("مسیر واقعی ابزار و نیاز به ورود در نام قابل دسترس لینک وجود دارد", () => {
    render(<ModuleCards />);
    const tool = screen.getByRole("link", { name: /محاسبه افت ولتاژ.*نیازمند ورود به حساب/ });
    expect(tool.getAttribute("href")).toBe("/engineering/voltage-drop");
    expect(screen.getByRole("link", { name: "پیش‌نمایش دانشنامه" }).getAttribute("href")).toBe("/wiki");
  });
});

describe("پرسش‌های متداول بدون وابستگی به جاوااسکریپت", () => {
  it("از details/summary بومی با محتوای قابل خزش استفاده می‌کند", () => {
    const { container } = render(<Faq />);
    expect(container.querySelectorAll("details")).toHaveLength(faqs.length);
    expect(container.querySelectorAll("details[open]")).toHaveLength(1);
    for (const faq of faqs) {
      expect(screen.getByText(faq.question)).toBeTruthy();
      expect(screen.getByText(faq.answer)).toBeTruthy();
    }
  });
});
