import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module.js";
import { BillController } from "./bill.controller.js";
import { BillService } from "./bill.service.js";

@Module({
  imports: [AiModule],
  controllers: [BillController],
  providers: [BillService],
  exports: [BillService],
})
export class BillModule {}
