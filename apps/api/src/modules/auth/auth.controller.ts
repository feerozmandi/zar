import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@xennic/shared";
import { Public } from "../../common/decorators/roles.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { AuthService, type AuthTokens } from "./auth.service.js";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  public constructor(private readonly auth: AuthService) {}

  @Post("register")
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "ثبت‌نام کاربر جدید" })
  public register(@Body(new ZodValidationPipe(registerSchema)) input: RegisterInput): Promise<unknown> {
    return this.auth.register(input);
  }

  @Post("login")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "ورود و دریافت JWT Token" })
  public async login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
  ): Promise<AuthTokens & { user: { id: string; email: string; role: string } }> {
    const tokens = await this.auth.login(input);
    const user = await this.auth.findUserByEmail(input.email);
    if (!user) throw new UnauthorizedException("کاربر یافت نشد");
    return { ...tokens, user: { id: user.id, email: user.email, role: user.role } };
  }
}
