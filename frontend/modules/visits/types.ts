export interface VisitItem {
  id: string;
  property: {
    id: string;
    title: string;
  };
  lead: {
    id: string;
    name: string;
    phone: string;
  };
  agent?: {
    id: string;
    name: string;
  } | null;
  scheduledAt: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string | null;
}
