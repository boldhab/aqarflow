import { LeadStage, LeadSource, PreferredContact } from '@prisma/client';

export interface LeadDTO {
  id: string;
  agencyId: string;
  name: string;
  email: string | null;
  phone: string;
  normalizedPhone?: string | null;
  normalizedEmail?: string | null;
  stage: LeadStage;
  source: LeadSource;
  propertyId?: string | null;
  assignedAgentId?: string | null;
  assignedToId?: string | null;
  message?: string | null;
  preferredContact?: PreferredContact;
  createdAt: Date;
  updatedAt: Date;
}
