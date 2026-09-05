import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from "class-validator";

/** بدنه‌ی multipart آپلود قبض — فایل با فیلد `file` ارسال می‌شود */
export class UploadBillDto {
  @ApiPropertyOptional({ description: "شماره اشتراک برق (۶ تا ۱۲ رقم)" })
  @IsOptional()
  @Matches(/^\d{6,12}$/)
  subscriptionId?: string;

  @ApiPropertyOptional({ description: "برچسب دوره، مثال: ۱۴۰۵/۰۶" })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  periodLabel?: string;

  @ApiPropertyOptional({
    enum: ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "AGRICULTURAL", "GOVERNMENTAL", "HOSPITALS"],
  })
  @IsOptional()
  @IsIn(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "AGRICULTURAL", "GOVERNMENTAL", "HOSPITALS"])
  tariffType?: "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "AGRICULTURAL" | "GOVERNMENTAL" | "HOSPITALS";

  @ApiPropertyOptional({ description: "تعداد اخطارهای مجاز بازپردازش" })
  @IsOptional()
  @IsInt()
  @Min(0)
  retryLimit?: number;
}
