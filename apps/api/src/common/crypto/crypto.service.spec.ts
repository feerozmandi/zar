import { describe, expect, it } from "vitest";
import type { AppConfigService } from "../../config/app-config.service.js";
import { CryptoService } from "./crypto.service.js";

function makeService(): CryptoService {
  const config = { encryptionKey: "a".repeat(64) } as unknown as AppConfigService;
  return new CryptoService(config);
}

describe("CryptoService (AES-256-GCM)", () => {
  it("round-trips a BYOK key", () => {
    const service = makeService();
    const payload = service.encrypt("sk-secret-1234567890");
    expect(payload.ciphertext).not.toContain("sk-secret");
    expect(service.decrypt(payload)).toBe("sk-secret-1234567890");
  });

  it("fails on tampered ciphertext", () => {
    const service = makeService();
    const payload = service.encrypt("sk-secret-1234567890");
    const tampered = { ...payload, ciphertext: Buffer.from("xx").toString("base64") };
    expect(() => service.decrypt(tampered)).toThrow();
  });

  it("redacts for display", () => {
    expect(CryptoService.redact("sk-proj-abcdef1234")).toBe("••••1234");
  });
});
