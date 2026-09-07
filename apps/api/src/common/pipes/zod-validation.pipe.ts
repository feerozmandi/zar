import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

/**
 * اعتبارسنجی بدنه‌ی درخواست با اسکیمای zodِ تعریف‌شده در @xennic/shared.
 * مزیت: همان اسکیمای فرانت‌اند و بک‌اند — بدون تکرار قواعد در دو بخش.
 */
@Injectable()
export class ZodValidationPipe<TOutput> implements PipeTransform<unknown, TOutput> {
  public constructor(private readonly schema: ZodType<TOutput>) {}

  public transform(value: unknown): TOutput {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "داده‌ی ارسالی نامعتبر است",
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    return result.data;
  }
}
