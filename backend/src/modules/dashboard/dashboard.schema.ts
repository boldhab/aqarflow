import { z } from 'zod';

export const dashboardOverviewQuerySchema = z.object({
  query: z.object({
    period: z.enum(['7d', '30d', '90d', 'year']).default('30d'),
  }),
});

export type DashboardOverviewQuery = z.infer<typeof dashboardOverviewQuerySchema>['query'];
