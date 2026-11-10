import prisma from '@/config/db';

export class DashboardRepository {
  async getAgencyMetrics(agencyId: string) {
    const [
      totalProperties,
      activeListings,
      totalLeads,
      scheduledVisits,
      deals,
      recentLeads,
      upcomingVisits,
    ] = await Promise.all([
      prisma.property.count({ where: { agencyId } }),
      prisma.property.count({ where: { agencyId, status: 'AVAILABLE' } }),
      prisma.lead.count({ where: { agencyId } }),
      prisma.visit.count({ where: { agencyId, status: 'SCHEDULED' } }),
      prisma.deal.findMany({ where: { agencyId } }),
      prisma.lead.findMany({
        where: { agencyId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, stage: true, createdAt: true },
      }),
      prisma.visit.findMany({
        where: { agencyId, status: 'SCHEDULED' },
        take: 5,
        orderBy: { scheduledAt: 'asc' },
        include: {
          property: { select: { title: true } },
          lead: { select: { name: true } },
        },
      }),
    ]);

    const wonDeals = deals.filter((d) => d.status === 'WON');
    const totalDealsValue = wonDeals.reduce((sum, d) => sum + Number(d.value), 0);

    return {
      metrics: {
        totalProperties,
        activeListings,
        totalLeads,
        newLeadsThisMonth: totalLeads,
        scheduledVisits,
        totalDealsValue,
        wonDealsCount: wonDeals.length,
      },
      recentLeads,
      upcomingVisits: upcomingVisits.map((v) => ({
        id: v.id,
        scheduledAt: v.scheduledAt,
        propertyName: v.property.title,
        leadName: v.lead.name,
      })),
    };
  }
}

export const dashboardRepository = new DashboardRepository();
