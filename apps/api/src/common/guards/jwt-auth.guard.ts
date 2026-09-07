import { type ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { PUBLIC_KEY } from "../decorators/roles.decorator.js";

/** گارد سراسری JWT — مسیرهای علامت‌خورده با @Public بدون بررسی عبور می‌کنند */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  public constructor(private readonly reflector: Reflector) {
    super();
  }

  public override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  public override handleRequest<TUser>(err: unknown, user: TUser | false): TUser {
    if (err || !user)
      throw err instanceof Error ? err : new UnauthorizedException("برای این مسیر نیاز به ورود است");
    return user;
  }
}
