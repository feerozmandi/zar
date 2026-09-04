import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health & Monitoring')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness and Readiness probe for Docker & CI' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return {
      status: 'ok',
      service: 'xennic-api-gateway',
      company: 'Zar Noor Niroo Yekta',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
    };
  }
}
