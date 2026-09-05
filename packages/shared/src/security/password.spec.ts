import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password hashing", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("Xennic@2026!");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("Xennic@2026!", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("rejects malformed hashes", async () => {
    expect(await verifyPassword("x", "bcrypt$aa$bb")).toBe(false);
  });
});
