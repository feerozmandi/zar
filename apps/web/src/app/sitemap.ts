import { modules, routes } from "@xennic/design-tokens";
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

/** نقشه‌ی سایت سئومحور (نوت ۴ — لندینگ + پنل‌ها) */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const marketing = [routes.home, routes.about, routes.contact];
  const panels = [...modules.map((module) => module.route), routes.ai, routes.login, routes.register];

  return [...marketing, ...panels]
    .filter((path, index, list) => list.indexOf(path) === index)
    .map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority: path === "/" ? 1 : 0.7,
    }));
}
