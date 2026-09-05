import { Module } from "@nestjs/common";
import { CryptoService } from "../../common/crypto/crypto.service.js";
import { UsersController } from "./users.controller.js";
import { UsersService } from "./users.service.js";

@Module({
  controllers: [UsersController],
  providers: [UsersService, CryptoService],
  exports: [UsersService, CryptoService],
})
export class UsersModule {}
