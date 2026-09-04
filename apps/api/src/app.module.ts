import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { AuditModule } from './modules/audit/audit.module';
import { SolarModule } from './modules/solar/solar.module';
import { EngineeringModule } from './modules/engineering/engineering.module';
import { WikiModule } from './modules/wiki/wiki.module';
import { AiGatewayModule } from './modules/ai-gateway/ai-gateway.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    HealthModule,
    AuthModule,
    UserModule,
    AuditModule,
    SolarModule,
    EngineeringModule,
    WikiModule,
    AiGatewayModule,
    AdminModule,
  ],
})
export class AppModule {}
