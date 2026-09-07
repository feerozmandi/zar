import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@xennic/shared";
import type { Request, Response } from "express";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { Public } from "../../common/decorators/roles.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { ApiBodyZod } from "../../common/utils/zod-openapi.js";
import {
  AuthService,
  REFRESH_COOKIE_NAME,
  type AuthTokens,
} from "./auth.service.js";

interface RefreshInput {
  refreshToken?: string;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  public constructor(private readonly auth: AuthService) {}

  @Post("register")
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "ثبت‌نام کاربر جدید" })
  @ApiBodyZod(registerSchema)
  public register(@Body(new ZodValidationPipe(registerSchema)) input: RegisterInput): Promise<unknown> {
    return this.auth.register(input);
  }

  @Post("login")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "ورود: صدور access+refresh و تنظیم کوکی httpOnly" })
  @ApiBodyZod(loginSchema)
  public async login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokens & { user: { id: string; email: string; role: string } }> {
    const tokens = await this.auth.login(input, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    this.setRefreshCookie(res, tokens.refreshToken);
    const user = await this.auth.findUserByEmail(input.email);
    if (!user) throw new UnauthorizedException("کاربر یافت نشد");
    return { ...tokens, user: { id: user.id, email: user.email, role: user.role } };
  }

  @Post("refresh")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "نوسازی نشست با refresh token (کوکی یا بدنه)" })
  public async refresh(
    @Body() input: RefreshInput = {},
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokens & { user: { id: string; email: string; role: string } }> {
    const refreshToken = input.refreshToken ?? readCookie(req, REFRESH_COOKIE_NAME);
    if (!refreshToken) throw new UnauthorizedException("نشست در دسترس نیست");

    const result = await this.auth.refresh(refreshToken, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    this.setRefreshCookie(res, result.refreshToken);
    return result;
  }

  @Post("logout")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "خروج: باطل‌کردن نشست و حذف کوکی" })
  public async logout(
    @Body() input: RefreshInput = {},
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ revoked: boolean }> {
    const refreshToken = input.refreshToken ?? readCookie(req, REFRESH_COOKIE_NAME);
    if (refreshToken) await this.auth.logout(refreshToken);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
    return { revoked: true };
  }

  @Get("me")
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "کاربر جاری (برای بازیابی نشست سمت وب‌کلاینت)" })
  public me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  private setRefreshCookie(res: Response, refreshToken: string): void {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: this.auth.refreshTtlMs,
    });
  }
}

/** خواندن یک کوکی از هدر خام (بدون وابستگی cookie-parser) */
function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name && rest.length > 0) return rest.join("=");
  }
  return undefined;
}