import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const isDev = process.env.NODE_ENV !== "production";
const isArenaPreview = process.env.ARENA_PREVIEW === "true";

const nextConfig: NextConfig = {
  outputFileTracingRoot: repositoryRoot,
  output: "standalone",
  transpilePackages: ["@xennic/ui", "@xennic/design-tokens", "@xennic/shared"],
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ["*.e2b.app"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "@xennic/ui"],
  },
  headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // اجازه‌ی iframe فقط با opt-in محیط پیش‌نمایش؛ تولید همچنان SAMEORIGIN است.
          ...(!isArenaPreview ? [{ key: "X-Frame-Options", value: "SAMEORIGIN" }] : []),
          {
            key: "Content-Security-Policy",
            // صفحات SSG به bootstrap درون‌خطی Next/next-themes نیاز دارند.
            // nonce به رندر پویا نیاز دارد؛ eval فقط در توسعه مجاز است.
            // ارتباط مرورگر با API فقط از مسیر هم‌ریشه /api/proxy انجام می‌شود.
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              ...(!isArenaPreview ? ["frame-ancestors 'self'"] : []),
            ].join("; "),
          },
        ],
      },
      {
        source: "/images/landing/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
