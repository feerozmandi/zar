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
        // مسیرهای OpenAPI پیشوند `api/v1` را دارند؛ پس سرور باید ریشه‌ی سرویس باشد
        // تا «Try it out» به آدرس http://host/api/v1/api/v1/... نرود (پیشوند دوگانه).
        .addServer(`http://localhost:${config.port}`, "Local Development")
        .addServer(`/`, "Same-Origin (Reverse Proxy)")
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
      customCss: `.swagger-ui .topbar { display: none; }
#xennic-login-panel { margin: 12px 0; padding: 12px 16px; border: 1px solid #e0e0e0; border-radius: 6px; background: #f9f9f9; font-family: sans-serif; }
#xennic-login-panel h4 { margin: 0 0 8px; font-size: 14px; color: #333; }
#xennic-login-panel .xennic-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
#xennic-login-panel input { padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; }
#xennic-login-panel input[type=text] { width: 220px; }
#xennic-login-panel input[type=password] { width: 180px; }
#xennic-login-panel button { padding: 6px 16px; border: none; border-radius: 4px; background: #4990e2; color: #fff; font-size: 13px; cursor: pointer; }
#xennic-login-panel button:hover { background: #357abd; }
#xennic-login-panel .xennic-msg { margin-top: 6px; font-size: 12px; }
#xennic-login-panel .xennic-msg.ok { color: #2e7d32; }
#xennic-login-panel .xennic-msg.err { color: #c62828; }
.dark #xennic-login-panel { background: #2d2d2d; border-color: #555; }
.dark #xennic-login-panel h4 { color: #eee; }
.dark #xennic-login-panel input { background: #1a1a1a; color: #eee; border-color: #666; }
.dark #xennic-login-panel .xennic-msg.ok { color: #66bb6a; }
.dark #xennic-login-panel .xennic-msg.err { color: #ef5350; }`,
      customSiteTitle: `${XENNIC_BRAND.name} API Docs`,
      customfavIcon: undefined,
      customJsStr: `
(function() {
  function waitForSwagger(cb) {
    var el = document.querySelector('.swagger-ui');
    if (el) cb(); else setTimeout(function() { waitForSwagger(cb); }, 200);
  }
  waitForSwagger(function() {
    if (document.getElementById('xennic-login-panel')) return;
    var panel = document.createElement('div');
    panel.id = 'xennic-login-panel';
    panel.innerHTML = '<h4>\u26a1 Quick Login (for testing)</h4>'
      + '<div class="xennic-row">'
      + '<input id="xennic-email" type="text" placeholder="Email" value="admin@xennic.ir" />'
      + '<input id="xennic-pass" type="password" placeholder="Password" />'
      + '<button id="xennic-login-btn">Login & Authorize</button>'
      + '</div>'
      + '<div id="xennic-login-msg" class="xennic-msg"></div>';
    var info = document.querySelector('.swagger-ui .info');
    if (info && info.parentNode) info.parentNode.insertBefore(panel, info.nextSibling);
    else { var top = document.querySelector('.swagger-ui'); if (top) top.insertBefore(panel, top.firstChild); }

    document.getElementById('xennic-login-btn').addEventListener('click', function() {
      var email = document.getElementById('xennic-email').value.trim();
      var pass = document.getElementById('xennic-pass').value;
      var msg = document.getElementById('xennic-login-msg');
      if (!email || !pass) { msg.className = 'xennic-msg err'; msg.textContent = 'Enter email and password'; return; }
      msg.className = 'xennic-msg'; msg.textContent = 'Logging in...';
      fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: pass })
      })
      .then(function(r) { return r.json(); })
      .then(function(payload) {
        if (payload.success && payload.data && payload.data.accessToken) {
          var token = payload.data.accessToken;
          window.__xennic_token = token;
          // Try to set it in Swagger UI authorization
          try {
            var ui = window.ui;
            if (ui && ui.authActions) {
              ui.authActions.authorize({ 'access-token': { value: token } });
            }
          } catch(e) { /* fallback: token is still set */ }
          msg.className = 'xennic-msg ok';
          msg.textContent = 'Token set! You can now Execute any protected endpoint.';
          document.getElementById('xennic-pass').value = '';
        } else {
          msg.className = 'xennic-msg err';
          msg.textContent = (payload.message || 'Login failed');
        }
      })
      .catch(function(err) {
        msg.className = 'xennic-msg err';
        msg.textContent = 'Network error: ' + err.message;
      });
    });
  });
})();
`,
    });
    logger.log(`Swagger UI: http://${config.host}:${config.port}${config.globalPrefix}/docs`);
  }

  await app.listen(config.port, config.host);
  logger.log(`Xennic Core API روی http://${config.host}:${config.port}${config.globalPrefix}/v1 آماده است`);
}

void bootstrap();
