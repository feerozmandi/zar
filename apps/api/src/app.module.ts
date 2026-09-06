import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard.js";
import { RolesGuard } from "./common/guards/roles.guard.js";
import { ConfigModule } from "./config/config.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { AuditModule } from "./modules/audit/audit.module.js";
import { SolarModule } from "./modules/solar/solar.module.js";
import { EngineeringModule } from "./modules/engineering/engineering.module.js";
import { WikiModule } from "./modules/wiki/wiki.module.js";
import { AiModule } from "./modules/ai/ai.module.js";
import { AdminModule } from "./modules/admin/admin.module.js";
import { ContactModule } from "./modules/contact/contact.module.js";
import { PrismaModule } from "./infra/prisma/prisma.module.js";
import { QueueModule } from "./infra/queue/queue.module.js";

/**
 * Xennic NestJS Core API Gateway — نوت ۳ §۱
 * هر ماژول کسب‌وکار یک پنل را تغذیه می‌کند و همه از یک لایه‌ی احراز هویت/پرداخت استفاده می‌کنند.
 */
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    QueueModule,
    HealthModule,
    AuthModule,
    UsersModule,
    AuditModule,
    SolarModule,
    EngineeringModule,
    WikiModule,
    AiModule,
    AdminModule,
    ContactModule,
  ],
  providers: [
    // ترتیب ثبت اهمیت دارد: اول احراز هویت، سپس بررسی نقش‌ها.
    // محدودسازی نرخ در لایه‌ی لبه (Nginx limit_req و Cloudflare) انجام می‌شود؛
    // رجوع: infra/nginx/conf.d/xennic.conf
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
