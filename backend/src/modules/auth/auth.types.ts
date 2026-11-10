import { Role } from '@/shared/permissions';

export interface AuthTokens {
  accessToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    agencyId: string;
  };
  tokens: AuthTokens;
}
