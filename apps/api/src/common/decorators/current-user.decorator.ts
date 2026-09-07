import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

/** مقدار `user` که JwtStrategy روی request می‌نشاند */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    return request.user as AuthenticatedUser;
  },
);
