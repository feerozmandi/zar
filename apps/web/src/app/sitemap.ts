import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

/** فقط صفحات عمومی واقعی؛ مسیرهای نیازمند ورود و ابزارهای شخصی در sitemap نیستند. */
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/about", "/contact"].map((path) => ({
    url: new URL(path, siteUrl).href,
    changeFrequency: path === "/" ? "monthly" : "yearly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
