import prisma from "@/config/db";
import { stableUuid } from "./domain";
import { transaction, audit } from "./transaction";
/** Run each minute with email:deliver. Transitions and reminder IDs make repeated runs safe. */
export async function reconcileLifecycle() {
  const now = new Date();
  let expired = 0;
  const due = await prisma.lease.findMany({
    where: { status: { in: ["ACTIVE", "RENEWED"] }, endDate: { lte: now } },
    select: { id: true, agencyId: true },
    take: 100,
  });
  for (const item of due)
    await transaction(async (tx) => {
      const lease = await tx.lease.findUniqueOrThrow({
        where: { id: item.id },
      });
      if (!["ACTIVE", "RENEWED"].includes(lease.status)) return;
      await tx.lease.update({
        where: { id: lease.id },
        data: { status: "EXPIRED" },
      });
      const admins = await tx.user.findMany({
        where: { agencyId: lease.agencyId, role: "ADMIN", isActive: true },
        select: { id: true },
      });
      for (const admin of admins)
        await tx.notification.upsert({
          where: { id: stableUuid(`lease-expired:${lease.id}:${admin.id}`) },
          create: {
            id: stableUuid(`lease-expired:${lease.id}:${admin.id}`),
            agencyId: lease.agencyId,
            userId: admin.id,
            title: "Lease expired",
            body: "Review the move-out inspection and property availability.",
            linkUrl: `/rentals/${lease.id}`,
          },
          update: {},
        });
      await audit(
        tx,
        lease.agencyId,
        undefined,
        "LEASE_EXPIRED",
        "Lease",
        lease.id,
        lease,
        { ...lease, status: "EXPIRED" },
      );
      expired++;
    });
  const starting = await prisma.lease.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lte: now },
      endDate: { gt: now },
      property: { status: "AVAILABLE" },
    },
    select: { id: true, agencyId: true, propertyId: true },
    take: 100,
  });
  for (const item of starting)
    await transaction(async (tx) => {
      const lease = await tx.lease.findFirst({
        where: {
          id: item.id,
          status: "ACTIVE",
          startDate: { lte: now },
          endDate: { gt: now },
        },
        include: { property: true },
      });
      if (!lease || lease.property.status !== "AVAILABLE") return;
      const status = lease.property.purpose === "RENT" ? "RENTED" : "LEASED";
      await tx.property.update({
        where: { id: lease.propertyId },
        data: { status, isPublished: false },
      });
      await audit(
        tx,
        lease.agencyId,
        undefined,
        "LEASE_ACTIVATED",
        "Property",
        lease.propertyId,
        lease.property,
        { ...lease.property, status },
      );
    });
  let reminderCount = 0;
  let cursor: string | undefined;
  while (true) {
    const upcoming = await prisma.visit.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: now, lte: new Date(now.getTime() + 24 * 3600000) },
      },
      include: {
        lead: { select: { email: true } },
        property: { select: { title: true } },
      },
      take: 100,
      orderBy: { id: "asc" },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (!upcoming.length) break;
    cursor = upcoming[upcoming.length - 1].id;
    reminderCount += upcoming.length;
    for (const v of upcoming)
      await transaction(async (tx) => {
        if (v.agentId)
          await tx.notification.upsert({
            where: {
              id: stableUuid(
                `visit-reminder:${v.id}:${v.scheduledAt.getTime()}`,
              ),
            },
            create: {
              id: stableUuid(
                `visit-reminder:${v.id}:${v.scheduledAt.getTime()}`,
              ),
              agencyId: v.agencyId,
              userId: v.agentId,
              title: "Upcoming visit",
              body: `${v.property.title} at ${v.scheduledAt.toISOString()}`,
              linkUrl: "/visits",
            },
            update: {},
          });
        if (v.lead.email)
          await tx.emailJob.upsert({
            where: {
              id: stableUuid(
                `visit-reminder:${v.id}:${v.scheduledAt.getTime()}`,
              ),
            },
            create: {
              id: stableUuid(
                `visit-reminder:${v.id}:${v.scheduledAt.getTime()}`,
              ),
              agencyId: v.agencyId,
              recipient: v.lead.email,
              subject: "Your property viewing is coming up",
              body: `Reminder: your viewing of ${v.property.title} is scheduled for ${v.scheduledAt.toISOString()}.`,
            },
            update: {},
          });
      });
  }
  return { expired, activated: starting.length, reminders: reminderCount };
}
if (require.main === module)
  reconcileLifecycle()
    .then(console.log)
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
