import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { contactRequestSchema, type ContactRequestInput } from "@xennic/shared";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator.js";
import { Public } from "../../common/decorators/roles.decorator.js";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe.js";
import { ApiBodyZod } from "../../common/utils/zod-openapi.js";
import { ContactService } from "./contact.service.js";

@ApiTags("contact")
@Controller("contact")
export class ContactController {
  public constructor(private readonly contact: ContactService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  // احراز هویت اختیاری است: با نبود توکن، درخواست به‌عنوان ناشناس ثبت می‌شود
  @ApiOperation({ summary: "ثبت درخواست مشاوره تخصصی" })
  @ApiBodyZod(contactRequestSchema)
  public create(
    @Body(new ZodValidationPipe(contactRequestSchema)) input: ContactRequestInput,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.contact.create(input, user?.id);
  }
}
