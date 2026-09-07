import type { ZodType } from "zod";

export class ApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly issues?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestInitLike extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** زمان انتظار (ms) برای جلوگیری از آویزان شدن سمت سرور */
  timeoutMs?: number;
}

/**
 * کلاینت یکپارچه‌ی فراخوان Core API.
 * مسیرها نسبت‌به‌هم‌ریشه‌اند (پیش‌فرض /api/proxy) تا در مرورگر، Next Server و
 * پیش‌نمایش کانتینری همه بدون تنظیم CORS کار کنند.
 */
export async function apiFetch<TOutput>(
  path: string,
  schema: ZodType<TOutput>,
  init: RequestInitLike = {},
): Promise<TOutput> {
  const { timeoutMs = 20_000, headers, body, ...rest } = init;
  const base = process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
      ...rest,
      headers: {
        accept: "application/json",
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};

    if (!response.ok) {
      throw new ApiError(
        typeof payload["message"] === "string" ? payload["message"] : `خطای سرور (${response.status})`,
        response.status,
        payload["issues"] as ApiError["issues"],
      );
    }

    return schema.parse(payload["data"] ?? payload);
  } finally {
    clearTimeout(timer);
  }
}
