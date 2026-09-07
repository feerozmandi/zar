import { Global, Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { AppConfigService } from "./app-config.service.js";

/**
 * بارگذاری فایل‌های .env (محلی و ریشه‌ی مخزن) و ارائه‌ی AppConfigService.
 * Global است تا هر ماژولی بدون import تکراری به آن دسترسی داشته باشد.
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [".env", "../../.env"],
      expandVariables: true,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule {}
