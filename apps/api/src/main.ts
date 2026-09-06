import "reflect-metadata";
import { Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { XENNIC_BRAND } from "@xennic/design-tokens";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { ApiEnvelopeInterceptor } from "./common/interceptors/api-envelope.interceptor.js";
import { AppModule } from "./app.module.js";
import { AppConfigService } from "./config/app-config.service.js";

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  const config = app.get(AppConfigService);

  // همه‌ی مسیرها از پیشوند یکسان می‌آیند؛ probe داکر/Nginx همان
  // /api/v1/health/live را صدا می‌زند (رجوع: apps/api/Dockerfile، infra/nginx).
  app.setGlobalPrefix(config.globalPrefix.replace(/^\//u, ""));
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.use(
    helmet({
      contentSecurityPolicy: false, // صفحات مستندات و CSP در فاز ۲ تنظیم می‌شود
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.enableCors({
    origin: [...config.corsOrigins, `http://localhost:${config.port}`],
    credentials: true,
    maxAge: 86_400,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
  });
  if (config.isProd) app.set("trust proxy", 1);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  if (config.swaggerEnabled) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle(`${XENNIC_BRAND.name} — Core API`)
        .setDescription(`سند ${XENNIC_BRAND.name} (${XENNIC_BRAND.legalName}) — مطابق نوت ۳`)
        .setVersion("1.0")
        .addServer(`http://localhost:${config.port}${config.globalPrefix}/v1`, "Local Development")
        .addServer(`${config.globalPrefix}/v1`, "Production")
        .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "access-token")
        .build(),
    );
    SwaggerModule.setup(`${config.globalPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: "list",
        filter: true,
        showRequestDuration: true,
      },
      customCss: ".swagger-ui .topbar { display: none; }",
      customSiteTitle: `${XENNIC_BRAND.name} API Docs`,
    });
    logger.log(`Swagger UI: http://${config.host}:${config.port}${config.globalPrefix}/docs`);
  }

  await app.listen(config.port, config.host);
  logger.log(`Xennic Core API روی http://${config.host}:${config.port}${config.globalPrefix}/v1 آماده است`);
}

void bootstrap();
