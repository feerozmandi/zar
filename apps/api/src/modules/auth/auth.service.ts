import { ConflictException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { hashPassword, verifyPassword, type LoginInput, type RegisterInput } from "@xennic/shared";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { PrismaService } from "../../infra/prisma/prisma.service.js";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * ثبت‌نام/ورود یکپارچه (SSO برای همه‌ی پنل‌ها) — نوت ۳ §۴ «Auth & User API».
 * توکن refresh در دیتابیس hash می‌شود تا در صورت سرریز لاگ، قابل استفاده نباشد.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  public constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
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

  public async login(input: LoginInput): Promise<AuthTokens> {
    const user = await this.prisma.client.user.findUnique({ where: { email: input.email } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new UnauthorizedException("ایمیل یا رمز عبور نادرست است");
    }
    if (user.status === "SUSPENDED") throw new UnauthorizedException("حساب کاربری غیرفعال است");

    return this.issueTokens({ id: user.id, email: user.email, role: user.role });
  }

  public issueTokens(user: AuthenticatedUser): AuthTokens {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwt.sign(payload),
      refreshToken: this.jwt.sign({ ...payload, typ: "refresh" }, { expiresIn: "30d" }),
      expiresIn: "15m",
    };
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
}
