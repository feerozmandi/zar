import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
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
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtSecret,
    });
  }

  /** مقدار بازگشتی روی request.user قرار می‌گیرد (مصرف‌شده در @CurrentUser) */
  public async validate(payload: JwtPayload) {
    const user = await this.auth.validateUser(payload.sub);
    if (!user) throw new UnauthorizedException("نشست نامعتبر یا منقضی شده است");
    return user;
  }
}
