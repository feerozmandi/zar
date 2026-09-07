import { Injectable, Logger } from "@nestjs/common";
import { contactRequestSchema, type ContactRequestInput } from "@xennic/shared";
import { PrismaService } from "../../infra/prisma/prisma.service.js";

/** ثبت درخواست مشاوره/همکاری از لندینگ پیج و فرم‌های پنل‌ها */
@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  public constructor(private readonly prisma: PrismaService) {}

  public async create(input: ContactRequestInput, userId?: string) {
    const parsed = contactRequestSchema.parse(input);
    const saved = await this.prisma.client.contactRequest.create({
      data: { ...parsed, userId, status: "NEW" },
      select: { id: true, status: true, createdAt: true },
    });
    this.logger.log(`درخواست مشاوره‌ی جدید از ${parsed.email}`);
    return saved;
  }

  public open() {
    return this.prisma.client.contactRequest.findMany({
      where: { status: { in: ["NEW", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
}
