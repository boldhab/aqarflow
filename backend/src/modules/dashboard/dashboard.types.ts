export interface DashboardMetrics {
  totalProperties: number;
  activeListings: number;
  totalLeads: number;
  newLeadsThisMonth: number;
  scheduledVisits: number;
  totalDealsValue: number;
  wonDealsCount: number;
}

export interface DashboardOverviewDTO {
  metrics: DashboardMetrics;
  recentLeads: Array<{
    id: string;
    name: string;
    stage: string;
    createdAt: Date;
  }>;
  upcomingVisits: Array<{
    id: string;
    scheduledAt: Date;
    propertyName: string;
    leadName: string;
  }>;
}
