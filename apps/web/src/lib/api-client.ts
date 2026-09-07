import type { ZodType } from "zod";
import { accessTokenStore } from "./token-store";

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

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy").replace(/\/$/, "");
}

async function fetchText(
  path: string,
  init: RequestInitLike,
  withAuth: boolean,
): Promise<{ status: number; text: string }> {
  const { timeoutMs = 20_000, headers, body, ...rest } = init;
  const token = withAuth ? accessTokenStore.get() : null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl()}/${path.replace(/^\//, "")}`, {
      ...rest,
      headers: {
        accept: "application/json",
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    return { status: response.status, text };
  } finally {
    clearTimeout(timer);
  }
}

function parsePayload<TOutput>(status: number, text: string, schema: ZodType<TOutput>): TOutput {
  const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (status >= 400) {
    throw new ApiError(
      typeof payload["message"] === "string" ? payload["message"] : `خطای سرور (${status})`,
      status,
      payload["issues"] as ApiError["issues"],
    );
  }
  return schema.parse(payload["data"] ?? payload);
}

/** نوسازی نشست با کوکی رفرش httpOnly؛ فقط یکبار به‌صورت هم‌زمان */
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const { status, text } = await fetchText("auth/refresh", { method: "POST", timeoutMs: 10_000 }, false);
      if (status >= 400) return false;
      const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      const token = (payload["data"] as { accessToken?: unknown } | undefined)?.accessToken;
      if (typeof token === "string" && token) {
        accessTokenStore.set(token);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

const NO_RETRY_PREFIXES = ["auth/login", "auth/register", "auth/refresh", "auth/logout"];

/**
 * کلاینت یکپارچه‌ی فراخوان Core API.
 * - هدر Authorization را از accessTokenStore اضافه می‌کند.
 * - در پاسخ 401 با کوکی رفرش httpOnly نشست را تازه و یکبار درخواست را تکرار می‌کند.
 */
export async function apiFetch<TOutput>(
  path: string,
  schema: ZodType<TOutput>,
  init: RequestInitLike = {},
): Promise<TOutput> {
  const first = await fetchText(path, init, true);

  if (
    first.status === 401 &&
    accessTokenStore.get() !== null &&
    !NO_RETRY_PREFIXES.some((prefix) => path.startsWith(prefix))
  ) {
    if (await refreshSession()) {
      const retry = await fetchText(path, init, true);
      return parsePayload(retry.status, retry.text, schema);
    }
  }
  return parsePayload(first.status, first.text, schema);
}
