import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "@xennic/shared";
import { ROLES_KEY } from "../decorators/roles.decorator.js";
import type { AuthenticatedUser } from "../decorators/current-user.decorator.js";

@Injectable()
export class RolesGuard implements CanActivate {
  public constructor(private readonly reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>().user;
    if (!user) throw new ForbiddenException("کاربر شناسایی نشد");
    if (!required.includes(user.role as Role)) {
      throw new ForbiddenException(`این قابلیت برای نقش‌های ${required.join(" / ")} است`);
    }
    return true;
  }
}
