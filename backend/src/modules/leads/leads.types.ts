import { LeadStage } from '@prisma/client';

export interface LeadDTO {
  id: string;
  agencyId: string;
  name: string;
  email: string | null;
  phone: string;
  stage: LeadStage;
  source: string | null;
  assignedToId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
