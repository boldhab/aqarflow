export type LeadStage =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'VISIT_SCHEDULED'
  | 'NEGOTIATION'
  | 'CONVERTED'
  | 'LOST';

export interface LeadItem {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  normalizedPhone?: string | null;
  stage: LeadStage;
  source?: string | null;
  message?: string | null;
  preferredContact?: 'PHONE' | 'EMAIL' | 'WHATSAPP';
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    title: string;
    referenceCode: string;
    price?: number | string;
    currency?: string;
    city?: string;
  } | null;
  assignedAgent?: {
    id: string;
    name: string;
    email?: string;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
  } | null;
}
