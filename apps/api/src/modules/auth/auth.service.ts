import { createHash, randomBytes } from "node:crypto";
import { ConflictException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { LoginInput, RegisterInput } from "@xennic/shared";
import { hashPassword, verifyPassword } from "@xennic/shared/security";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { AppConfigService } from "../../config/app-config.service.js";
import { PrismaService } from "../../infra/prisma/prisma.service.js";

/** نام کوکی httpOnly حامل refresh token (با مسیر پیش‌فرض، برای میزبان جاری) */
export const REFRESH_COOKIE_NAME = "xennic_refresh";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface SessionContext {
  userAgent?: string;
  ip?: string;
}

/** تبدیل TTL مثل "30d"/"15m" به روز (برای ستون expiresAt نشست) */
function toDays(ttl: string): number {
  const match = /^(\d+)([smhd])$/u.exec(ttl);
  if (!match) return 30;
  const amount = Number(match[1]);
  switch (match[2]) {
    case "s":
      return amount / 86_400;
    case "m":
      return amount / 1_440;
    case "h":
      return amount / 24;
    case "d":
      return amount;
    default:
      return 30;
  }
}

/** hash یکبارمصرف توکنهای refresh برای ذخیره در DB (نوت ۳ §۵ — امنیت از بدو طراحی) */
function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * ثبت‌نام/ورود یکپارچه (SSO برای همه‌ی پنل‌ها) — نوت ۳ §۴ «Auth & User API».
 *
 * احراز هویت دو مرحله‌ای:
 *  - access token (JWT کوتاه‌عمر، در حافظه‌ی مرورگر)
 *  - refresh token (opaque، فقط hash‌شده در دیتابیس Session ذخیره می‌شود؛
 *    در کوکی httpOnly سمت API قرار می‌گیرد تا XSS نتواند آن را بخواند)
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  public constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  public async register(input: RegisterInput): Promise<AuthenticatedUser> {
    const existing = await this.prisma.client.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException("این ایمیل قبلاً ثبت شده است");

    const created = await this.prisma.client.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        nationalId: input.nationalId,
        phone: input.phone,
        company: input.company,
        role: input.role,
        status: "PENDING_VERIFICATION",
        passwordHash: await hashPassword(input.password),
      },
      select: { id: true, email: true, fullName: true, role: true, status: true },
    });

    this.logger.log(`کاربر جدید ثبت‌نام کرد: ${created.email} (${created.role})`);
    return { id: created.id, email: created.email, role: created.role };
  }

  public async login(input: LoginInput, context: SessionContext = {}): Promise<AuthTokens> {
    const user = await this.prisma.client.user.findUnique({ where: { email: input.email } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new UnauthorizedException("ایمیل یا رمز عبور نادرست است");
    }
    if (user.status !== "ACTIVE") {
      if (user.status === "SUSPENDED") throw new UnauthorizedException("حساب کاربری غیرفعال است");
      throw new UnauthorizedException("حساب شما هنوز تأیید نشده است (وضعیت «در انتظار تأیید» است)");
    }

    void this.prisma.client.user
      .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
      .catch(() => undefined);

    const identity: AuthenticatedUser = { id: user.id, email: user.email, role: user.role };
    return this.createSession(identity, context);
  }

  /** نوسازی نشست با چرخش: نشست قبلی باطل و نشست تازه صادر می‌شود */
  public async refresh(
    refreshToken: string,
    context: SessionContext = {},
  ): Promise<AuthTokens & { user: AuthenticatedUser }> {
    const session = await this.prisma.client.session.findUnique({
      where: { refreshToken: sha256(refreshToken) },
    });
    if (!session || session.revokedAt !== null || session.expiresAt <= new Date()) {
      throw new UnauthorizedException("نشست نامعتبر یا منقضی است؛ دوباره وارد شوید");
    }

    const user = await this.prisma.client.user.findUnique({ where: { id: session.userId } });
    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException("حساب کاربری در دسترس نیست");
    }

    await this.prisma.client.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const identity: AuthenticatedUser = { id: user.id, email: user.email, role: user.role };
    const tokens = await this.createSession(identity, context);
    return { ...tokens, user: identity };
  }

  /** پایان نشست (خروج از حساب) */
  public async logout(refreshToken: string): Promise<void> {
    const session = await this.prisma.client.session.findUnique({
      where: { refreshToken: sha256(refreshToken) },
    });
    if (session) {
      await this.prisma.client.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  /** ایجاد نشست جدید: توکن opaque صادر + hash آن در DB ذخیره می‌شود */
  private async createSession(user: AuthenticatedUser, context: SessionContext): Promise<AuthTokens> {
    const refreshToken = randomBytes(48).toString("hex");
    await this.prisma.client.session.create({
      data: {
        userId: user.id,
        refreshToken: sha256(refreshToken),
        userAgent: context.userAgent ? context.userAgent.slice(0, 200) : null,
        ip: context.ip ? context.ip.slice(0, 45) : null,
        expiresAt: new Date(Date.now() + toDays(this.config.jwtRefreshTtl) * 24 * 60 * 60 * 1000),
      },
    });
    return {
      accessToken: this.jwt.sign({ sub: user.id, email: user.email, role: user.role }),
      refreshToken,
      expiresIn: this.config.jwtAccessTtl,
    };
  }

  /** طول عمر کوکی refresh (ms) — همان TTL نشست */
  public get refreshTtlMs(): number {
    return toDays(this.config.jwtRefreshTtl) * 24 * 60 * 60 * 1000;
  }

  /** ورودی محافظت‌شده‌ی JwtStrategy */
  public async validateUser(id: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, status: true },
    });
    if (!user || user.status !== "ACTIVE") return null;
    return { id: user.id, email: user.email, role: user.role };
  }

  /** یافتن کاربر از روی ایمیل برای بازگشت در پاسخ لاگین */
  public async findUserByEmail(email: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.client.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, status: true },
    });
    if (!user) return null;
    return { id: user.id, email: user.email, role: user.role };
  }
}
