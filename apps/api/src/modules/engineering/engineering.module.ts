import { Module } from "@nestjs/common";
import { EngineeringController } from "./engineering.controller.js";
import { EngineeringService } from "./engineering.service.js";

@Module({
  controllers: [EngineeringController],
  providers: [EngineeringService],
  exports: [EngineeringService],
})
export class EngineeringModule {}
