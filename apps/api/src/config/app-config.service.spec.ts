import { describe, expect, it } from "vitest";
import { AppConfigService } from "./app-config.service.js";

function makeService(env: Record<string, string | undefined>): AppConfigService {
  const config = { get: () => env } as unknown as ConstructorParameters<typeof AppConfigService>[0];
  return new AppConfigService(config);
}

describe("AppConfigService", () => {
  it("پیش‌فرض‌های توسعه را اعمال می‌کند", () => {
    const service = makeService({
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://x:x@localhost:5432/x",
    });
    expect(service.port).toBe(4000);
    expect(service.globalPrefix).toBe("/api");
    expect(service.uploadMaxBytes).toBe(10 * 1024 * 1024);
  });

  it("برای JWT_SECRET کوتاه خطا می‌دهد", () => {
    expect(() => makeService({ NODE_ENV: "test", JWT_SECRET: "short" })).toThrow();
  });
});
