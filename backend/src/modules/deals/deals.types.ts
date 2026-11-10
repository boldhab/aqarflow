import { DealStatus } from '@prisma/client';

export interface DealDTO {
  id: string;
  agencyId: string;
  propertyId: string;
  leadId: string;
  agentId: string | null;
  value: string | number;
  status: DealStatus;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
