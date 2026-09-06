import { Module } from "@nestjs/common";
import { SolarController } from "./solar.controller.js";
import { SolarService } from "./solar.service.js";

@Module({ controllers: [SolarController], providers: [SolarService], exports: [SolarService] })
export class SolarModule {}
