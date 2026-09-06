import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  // بیلد در محیط کانتینری/CI فقط به خروجی build نیاز دارد
  outputFileTracingRoot: repositoryRoot,
  // خروجی standalone: سرور تولیدی فقط به .next/standalone (+ static/public) نیاز دارد
  // و از کپی کامل node_modules مونورپو در ایمیج جلوگیری می‌شود (رجوع: apps/web/Dockerfile)
  output: "standalone",
  // بسته‌های داخلی مونورپو باید توسط Next ترنسپایل شوند (منبع TS دارند)
  transpilePackages: ["@xennic/ui", "@xennic/design-tokens", "@xennic/shared"],
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60,
  },
  experimental: {
    // در Next 16 حالت بیلد پایدار است؛ فقط optimizePackageImports برای درخت‌چینی لازم است
    optimizePackageImports: ["lucide-react", "recharts", "@xennic/ui"],
  },
  headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://localhost:4000 ws://localhost:4000; font-src 'self'; object-src 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
