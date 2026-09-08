import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/audit",
          "/solar",
          "/engineering",
          "/admin",
          "/ai",
          "/api/",
          "/login",
          "/register",
          "/forgot",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).href,
    host: new URL(siteUrl).origin,
  };
}
