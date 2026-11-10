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
  stage: LeadStage;
  source?: string | null;
  assignedTo?: {
    id: string;
    name: string;
  } | null;
}
