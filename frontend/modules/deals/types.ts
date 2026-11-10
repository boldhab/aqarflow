export interface DealItem {
  id: string;
  property: {
    id: string;
    title: string;
  };
  lead: {
    id: string;
    name: string;
  };
  agent?: {
    id: string;
    name: string;
  } | null;
  value: number | string;
  status: 'OPEN' | 'WON' | 'LOST';
  closedAt?: string | null;
  createdAt: string;
}
