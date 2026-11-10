import { VisitStatus } from '@prisma/client';

export interface VisitDTO {
  id: string;
  agencyId: string;
  propertyId: string;
  leadId: string;
  agentId: string | null;
  scheduledAt: Date;
  status: VisitStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
