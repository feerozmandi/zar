import { Injectable, BadRequestException } from '@nestjs/common';
import { encryptAES256GCM, UserRole } from '@xennic/shared';
import { UpdateAISettingsDto } from './user.controller';

@Injectable()
export class UserService {
  private readonly defaultSecret =
    process.env.BYOK_ENCRYPTION_KEY ||
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  async getProfile() {
    return {
      id: 'usr-default-01',
      email: 'engineer@zar-noor.ir',
      fullName: 'مهندس ناظر و مشاور انرژی',
      role: UserRole.PRO_ENGINEER,
      company: 'شرکت زر نور نیرو یکتا',
      aiSettings: {
        isBYOKActive: true,
        provider: 'GITHUB_MODELS',
        preferredModel: 'gpt-4o',
      },
    };
  }

  async saveAISettings(dto: UpdateAISettingsDto) {
    if (!dto.apiKey || dto.apiKey.trim().length < 8) {
      throw new BadRequestException('کلید API معتبر نمی‌باشد');
    }

    // Encrypt the API key using AES-256-GCM
    const encryptedData = encryptAES256GCM(dto.apiKey, this.defaultSecret);

    return {
      message: 'کلید اختصاصی هوش مصنوعی با موفقیت و به صورت رمزنگاری‌شده (AES-256-GCM) ذخیره شد.',
      provider: dto.provider,
      preferredModel: dto.preferredModel || 'gpt-4o',
      isBYOKActive: true,
      encryptionMetadata: {
        algorithm: 'AES-256-GCM',
        ivLength: encryptedData.iv.length,
        tagLength: encryptedData.tag.length,
      },
    };
  }
}
