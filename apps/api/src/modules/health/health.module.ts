import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { HealthController } from "./health.controller.js";
import { QueueService } from "./queue.service.js";

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [QueueService],
})
export class HealthModule {}
