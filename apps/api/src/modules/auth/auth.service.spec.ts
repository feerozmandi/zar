import { describe, expect, it, vi } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import { hashPassword } from "@xennic/shared/security";
import type { AppConfigService } from "../../config/app-config.service.js";
import type { PrismaService } from "../../infra/prisma/prisma.service.js";
import { AuthService } from "./auth.service.js";

function makeService(): { auth: AuthService; prisma: ReturnType<typeof makePrisma> } {
  const prisma = makePrisma();
  const jwt = { sign: vi.fn(() => "signed.access.token") } as unknown as JwtService;
  const config = { jwtAccessTtl: "15m", jwtRefreshTtl: "30d" } as unknown as AppConfigService;
  const auth = new AuthService(prisma as unknown as PrismaService, jwt, config);
  return { auth, prisma };
}

function makePrisma() {
  const activeUser = {
    id: "u-1",
    email: "admin@xennic.ir",
    role: "SUPER_ADMIN",
  };
  const sessions: Array<Record<string, unknown>> = [];
  const calls: { marks: Array<[string, string]> } = { marks: [] };
  return {
    calls,
    client: {
      user: {
        findUnique: vi.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
          if (where.email === "pending@xennic.ir") {
            return {
              id: "u-2",
              email: "pending@xennic.ir",
              role: "USER",
              passwordHash: await hashPassword("Xennic@2026!"),
              status: "PENDING_VERIFICATION",
            };
          }
          if (where.email === activeUser.email || where.id === activeUser.id) {
            return { ...activeUser, passwordHash: await hashPassword("Xennic@2026!"), status: "ACTIVE" };
          }
          return null;
        }),
        update: vi.fn(() => Promise.resolve({})),
      },
      session: {
        findUnique: vi.fn(({ where }: { where: { refreshToken?: string } }) =>
          Promise.resolve(sessions.find((s) => s.refreshToken === where.refreshToken) ?? null),
        ),
        create: vi.fn(({ data }: { data: Record<string, unknown> }) => {
          const record = { id: `s-${sessions.length + 1}`, revokedAt: null, ...data };
          sessions.push(record);
          return Promise.resolve(record);
        }),
        update: vi.fn(({ where, data }: { where: { id?: string }; data: Record<string, unknown> }) => {
          const session = sessions.find((s) => s.id === where.id);
          Object.assign(session ?? {}, data);
          calls.marks.push([String(where.id), data.revokedAt ? "revoked" : "active"]);
          return Promise.resolve(session);
        }),
      },
    },
  };
}

describe("AuthService (refresh rotation)", () => {
  it("issues a session on login for an ACTIVE user (hash stored, token returned)", async () => {
    const { auth, prisma } = makeService();
    const tokens = await auth.login({ email: "admin@xennic.ir", password: "Xennic@2026!" });

    expect(tokens.accessToken).toBe("signed.access.token");
    expect(tokens.refreshToken).toHaveLength(96); // 48 random bytes as hex
    const stored = prisma.client.session.create.mock.calls[0]?.[0]?.data as
      { refreshToken: string } | undefined;
    expect(stored?.refreshToken).not.toBe(tokens.refreshToken); // hash، نه مقدار خام
    expect(stored?.refreshToken).toHaveLength(64); // sha256 hex
  });

  it("blocks PENDING_VERIFICATION accounts", async () => {
    const { auth } = makeService();
    await expect(auth.login({ email: "pending@xennic.ir", password: "Xennic@2026!" })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rotates the session on refresh: old revoked + fresh token issued", async () => {
    const { auth, prisma } = makeService();
    const tokens = await auth.login({ email: "admin@xennic.ir", password: "Xennic@2026!" });

    const refreshed = await auth.refresh(tokens.refreshToken);
    expect(refreshed.accessToken).toBe("signed.access.token");
    expect(refreshed.refreshToken).not.toBe(tokens.refreshToken);
    expect(refreshed.user.email).toBe("admin@xennic.ir");

    // دو نشست ساخته شده و نشست قبلی باطل (revoked) شده است
    const creates = prisma.client.session.create.mock.calls.length;
    expect(prisma.calls.marks[0]?.[1]).toBe("revoked"); // نشست قبلی باطل شده
    expect(creates).toBe(2);
  });

  it("rejects a revoked/unknown refresh token", async () => {
    const { auth } = makeService();
    await expect(auth.refresh("deadbeef".repeat(12))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
