import { Injectable, NotFoundException } from "@nestjs/common";
import { CryptoService } from "../../common/crypto/crypto.service.js";
import { PrismaService } from "../../infra/prisma/prisma.service.js";
import type { AiKeyInput, AiSettingsInput } from "@xennic/shared";

@Injectable()
export class UsersService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  /** پروفایل + موجودی کیف‌پول ماژول‌ها (نوت ۳: GET /user/profile) */
  public async profile(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        company: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        wallets: { select: { module: true, balance: true, currency: true } },
      },
    });
    if (!user) throw new NotFoundException("کاربر یافت نشد");
    return user;
  }

  /** ذخیره‌ی کلید اختصاصی با رمزنگاری AES-256-GCM (نوت ۳ §۵-۱) */
  public async saveAiKey(userId: string, input: AiKeyInput): Promise<{ id: string; maskedKey: string }> {
    const encrypted = this.crypto.encrypt(input.apiKey);
    const label = input.label ?? "default";

    const saved = await this.prisma.client.aiProviderCredential.upsert({
      where: { userId_provider_label: { userId, provider: input.provider, label } },
      update: {
        ...encrypted,
        last4: input.apiKey.slice(-4),
        defaultModel: input.defaultModel,
        isActive: true,
      },
      create: {
        userId,
        provider: input.provider,
        label,
        defaultModel: input.defaultModel,
        last4: input.apiKey.slice(-4),
        ...encrypted,
      },
      select: { id: true, last4: true },
    });

    return { id: saved.id, maskedKey: `••••${saved.last4 ?? ""}` };
  }

  public async listAiKeys(userId: string) {
    const rows = await this.prisma.client.aiProviderCredential.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        label: true,
        defaultModel: true,
        last4: true,
        lastUsedAt: true,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });
    // کلید خام هرگز برگردانده نمی‌شود؛ تنها ۴ نویسه‌ی آخر ذخیره و نمایش داده می‌شود
    return rows.map((row: { last4?: string | null }) => ({ ...row, maskedKey: `••••${row.last4 ?? ""}` }));
  }

  /**
   * PUT /user/ai-settings — انتخاب مدل پیش‌فرض برای کلید (یا غیرفعال‌کردن آن).
   * اگر شناسه‌ی کلید مشخص نشود، کلید فعالِ آخرین باری که استفاده شده هدف قرار می‌گیرد.
   */
  public async updateAiSettings(userId: string, input: AiSettingsInput) {
    const target = await this.prisma.client.aiProviderCredential.findFirst({
      where: {
        userId,
        ...(input.provider ? { provider: input.provider } : {}),
        ...(input.label ? { label: input.label } : {}),
      },
      orderBy: [{ isActive: "desc" }, { lastUsedAt: "desc" }, { createdAt: "desc" }],
    });
    if (!target) throw new NotFoundException("کلید اختصاصی‌ای برای این کاربر ثبت نشده است");

    return this.prisma.client.aiProviderCredential.update({
      where: { id: target.id },
      data: {
        ...(input.defaultModel === undefined ? {} : { defaultModel: input.defaultModel }),
        ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      },
      select: { id: true, provider: true, defaultModel: true, isActive: true },
    });
  }

  public async deleteAiKey(userId: string, id: string): Promise<{ deleted: boolean }> {
    const existing = await this.prisma.client.aiProviderCredential.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException("کلید موردنظر یافت نشد");
    await this.prisma.client.aiProviderCredential.delete({ where: { id } });
    return { deleted: true };
  }
}
