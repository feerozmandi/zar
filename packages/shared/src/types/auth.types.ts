export enum UserRole {
  USER = 'USER',
  PRO_ENGINEER = 'PRO_ENGINEER',
  EPC_PARTNER = 'EPC_PARTNER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface LoginResponse {
  user: UserSession;
  tokens: AuthTokens;
}
