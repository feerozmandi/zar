import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService, type HealthIndicatorResult } from "@nestjs/terminus";
import { Public } from "../../common/decorators/roles.decorator.js";
import { PrismaService } from "../../infra/prisma/prisma.service.js";
import { QueueService } from "./queue.service.js";

/** مسیرهای سلامت برای healthcheck داکر و Nginx (نوت ۵ §۱) */
@Controller("health")
@Public()
export class HealthController {
  public constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
    private readonly queues: QueueService,
  ) {}

  @Get("live")
  @HealthCheck()
  public liveness() {
    return this.health.check([
      (): HealthIndicatorResult => ({
        xennicApi: { status: "up", uptimeSeconds: Math.round(process.uptime()) },
      }),
    ]);
  }

  @Get("ready")
  @HealthCheck()
  public readiness() {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => ({
        postgres: { status: (await this.prisma.ping()) ? "up" : "down" },
      }),
      async (): Promise<HealthIndicatorResult> => this.queues.indicator(),
    ]);
  }
}
