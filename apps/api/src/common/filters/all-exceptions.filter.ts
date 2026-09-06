import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Request, Response } from "express";

/** خطای ساختاریافته‌ی یکنواخت برای همه‌ی کلاینت‌ها (وب، تلگرام، Mini App) */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("HttpException");

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : null;
    const body =
      typeof payload === "string"
        ? { message: payload }
        : ((payload as { message?: string | string[] } | null) ?? { message: "خطای غیرمنتظره در سرور" });

    if (status >= 500)
      this.logger.error(`${request.method} ${request.url} → ${status}`, (exception as Error)?.stack);

    response.status(status).json({
      success: false,
      path: request.url,
      statusCode: status,
      message: body.message ?? "خطا",
      timestamp: new Date().toISOString(),
    });
  }
}
