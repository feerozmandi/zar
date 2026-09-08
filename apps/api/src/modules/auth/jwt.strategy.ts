import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, type SecretOrKeyProvider, Strategy } from "passport-jwt";
import { AppConfigService } from "../../config/app-config.service.js";
import { AuthService } from "./auth.service.js";

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  public constructor(
    config: AppConfigService,
    private readonly auth: AuthService,
  ) {
    const secretProvider: SecretOrKeyProvider = (_request, _rawJwtToken, done) =>
      done(null, config.jwtSecret);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // passport-jwt 4 با `done` صدا زده می‌شود؛ یک تابع `() => secret` بازگشتی
      // هرگز callback را اجرا نمی‌کند و هر مسیر محافظت‌شده برای همیشه می‌ماند.
      secretOrKeyProvider: secretProvider,
    });
  }

  /** مقدار بازگشتی روی request.user قرار می‌گیرد (مصرف‌شده در @CurrentUser) */
  public async validate(payload: JwtPayload) {
    const user = await this.auth.validateUser(payload.sub);
    if (!user) throw new UnauthorizedException("نشست نامعتبر یا منقضی شده است");
    return user;
  }
}
