import type { NextRequest } from "next/server";

/**
 * پروکسی هم‌ریشه: مرورگر فقط با apps/web حرف می‌زند و فراخوان‌ها سمت سرور
 * به Core API ارسال می‌شوند (بدون CORS، بدون افشای آدرس داخلی بک‌اند).
 */
const UPSTREAM = (process.env.API_INTERNAL_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

async function proxy(request: NextRequest): Promise<Response> {
  const incoming = new URL(request.url);
  const target = incoming.pathname.replace(/^\/api\/proxy\//u, "");
  const url = new URL(`${UPSTREAM}/${target}${incoming.search}`);

  const headers = new Headers(request.headers);
  for (const hop of ["host", "cookie", "connection", "content-length"]) headers.delete(hop);

  const isBodyless = request.method === "GET" || request.method === "HEAD";
  const body = isBodyless ? undefined : await request.arrayBuffer();

  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      duplex: body ? "half" : undefined,
    } as RequestInit);

    const responseHeaders = new Headers(upstream.headers);
    for (const hop of ["content-encoding", "content-length", "transfer-encoding"])
      responseHeaders.delete(hop);

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json({ success: false, message: "هسته‌ی API در دسترس نیست" }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
