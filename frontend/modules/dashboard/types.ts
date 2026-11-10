export interface DashboardMetrics {
  totalProperties: number;
  activeListings: number;
  totalLeads: number;
  newLeadsThisMonth: number;
  scheduledVisits: number;
  totalDealsValue: number;
  wonDealsCount: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentLeads: Array<{
    id: string;
    name: string;
    stage: string;
    createdAt: string;
  }>;
  upcomingVisits: Array<{
    id: string;
    scheduledAt: string;
    propertyName: string;
    leadName: string;
  }>;
}
