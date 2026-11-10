import { Role } from '@/shared/permissions';

export interface AuthAgencyDTO {
  id: string;
  name: string;
  slug: string;
}

export interface AuthUserDTO {
  id: string;
  email: string;
  name: string;
  role: Role;
  agency: AuthAgencyDTO;
}

export interface AuthResponse {
  user: AuthUserDTO;
}
