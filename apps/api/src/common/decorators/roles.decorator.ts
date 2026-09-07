import { SetMetadata } from "@nestjs/common";
import { ROLES, type Role } from "@xennic/shared";

export const ROLES_KEY = "xennic:roles" as const;

/** محدودسازی مسیر به نقش‌های RBAC — نوت ۳ §۵-۳ */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const PUBLIC_KEY = "xennic:public" as const;
/** مسیر بدون احراز هویت (لندینگ، سلامت، ثبت‌نام) */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

export const SUPER_ADMIN_ONLY = [ROLES.superAdmin] as const;
