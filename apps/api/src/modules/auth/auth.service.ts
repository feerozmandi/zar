import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserRole } from '@xennic/shared';
import { LoginDto, RegisterDto } from './auth.controller';

@Injectable()
export class AuthService {
  async register(dto: RegisterDto) {
    if (!dto.email || !dto.password || !dto.fullName) {
      throw new BadRequestException('Email, password, and full name are required');
    }

    return {
      message: 'کاربر با موفقیت ثبت‌نام شد',
      user: {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        email: dto.email,
        fullName: dto.fullName,
        role: UserRole.USER,
        isActive: true,
      },
    };
  }

  async login(dto: LoginDto) {
    if (!dto.email || !dto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      user: {
        id: 'user-demo-101',
        email: dto.email,
        fullName: 'کاربر پلتفرم زننیک',
        role: UserRole.USER,
        isActive: true,
      },
      tokens: {
        accessToken: 'mock-jwt-access-token-xennic-auth',
        refreshToken: 'mock-jwt-refresh-token-xennic-auth',
        expiresIn: '7d',
      },
    };
  }
}
