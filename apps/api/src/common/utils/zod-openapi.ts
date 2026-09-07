import { ApiBody, type ApiBodyOptions } from "@nestjs/swagger";
import type { z } from "zod";

/**
 * تبدیل اسکیمای zod به JSON Schema قابل‌دریافت در OpenAPI/Swagger.
 * در zod v4 خروجی آماده‌ی `toJSONSchema` استفاده می‌شود تا بدنه‌ی درخواست
 * در «Try it out» قابل‌مشاهده/ویرایش باشد (requestBody خالی مشکل رایج است).
 */
export function zodToOpenApiSchema(schema: z.ZodType): Record<string, unknown> {
  const json = schema.toJSONSchema() as Record<string, unknown>;
  delete json["$schema"];
  return json;
}

/**
 * دکوراتور `@ApiBody` بر پایه‌ی اسکیمای zod — همان اسکیمایی که ZodValidationPipe
 * در همان مسیر اعمال می‌کند تا سند و Validation همیشه هم‌راستا بمانند.
 */
export function ApiBodyZod(
  schema: z.ZodType,
  options: Omit<ApiBodyOptions, "schema"> = {},
): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    ApiBody({
      schema: zodToOpenApiSchema(schema),
      required: true,
      ...options,
    })(target, propertyKey as string, descriptor as PropertyDescriptor);
  };
}