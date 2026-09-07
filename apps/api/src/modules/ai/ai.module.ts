import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module.js";
import { AiController } from "./ai.controller.js";
import { AiService } from "./ai.service.js";

@Module({
  imports: [UsersModule], // استفاده مجدد از CryptoService بدون ساخت مجدد لایه‌ی رمزنگاری
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
