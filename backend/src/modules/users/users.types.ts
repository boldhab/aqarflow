import { Role } from '@/shared/permissions';

export interface UserDTO {
  id: string;
  agencyId: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentOptionDTO {
  id: string;
  name: string;
}

