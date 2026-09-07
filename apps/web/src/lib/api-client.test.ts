// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError, apiFetch } from "./api-client";

const payload = z.object({ answer: z.number() });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("پاکت success/data را باز می‌کند و با zod اعتبارسنجی می‌کند", async () => {
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(Response.json({ success: true, data: { answer: 42 } })),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("engineering/voltage-drop", payload)).resolves.toEqual({ answer: 42 });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/proxy/engineering/voltage-drop");
  });

  it("در خطای سرور، ApiError با پیام فارسی API می‌سازد", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ success: false, message: "داده نامعتبر است" }), { status: 400 }),
        ),
      ),
    );

    await expect(apiFetch("x", payload)).rejects.toBeInstanceOf(ApiError);
  });
});
