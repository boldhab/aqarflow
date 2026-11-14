import { CreateDealInput, UpdateDealInput } from "@/modules/deals/deals.schema";
import {
  CreateVisitInput,
  UpdateVisitInput,
} from "@/modules/visits/visits.schema";
import { ApiError } from "@/shared/errors";
import { DealStatus } from "@prisma/client";
import { money } from "./domain";
import { audit, requireReference, transaction, Tx } from "./transaction";
export async function visitConflict(
  tx: Tx,
  agencyId: string,
  agentId: string | undefined | null,
  start: Date,
  end: Date,
  excludeId?: string,
) {
  if (!agentId) return [];
  return tx.visit.findMany({
    where: {
      agencyId,
      agentId,
      status: "SCHEDULED",
      id: { not: excludeId },
      scheduledAt: { lt: end },
      endsAt: { gt: start },
    },
    select: {
      id: true,
      scheduledAt: true,
      endsAt: true,
      property: { select: { title: true } },
    },
  });
}
export async function saveVisit(
  agencyId: string,
  input: CreateVisitInput | UpdateVisitInput,
  id?: string,
) {
  return transaction(async (tx) => {
    const old = id
      ? await tx.visit.findFirst({ where: { id, agencyId } })
      : null;
    if (id && !old) throw ApiError.notFound("Visit not found");
    const propertyId =
      ("propertyId" in input ? input.propertyId : undefined) ?? old!.propertyId;
    const leadId =
      ("leadId" in input ? input.leadId : undefined) ?? old!.leadId;
    const agentId = input.agentId ?? old?.agentId;
    await requireReference(tx, "property", propertyId, agencyId);
    await requireReference(tx, "lead", leadId, agencyId);
    await requireReference(tx, "user", agentId, agencyId);
    const scheduledAt = new Date(input.scheduledAt ?? old!.scheduledAt),
      durationMinutes = input.durationMinutes ?? old?.durationMinutes ?? 60;
    const endsAt = new Date(scheduledAt.getTime() + durationMinutes * 60000);
    const status =
      ("status" in input ? input.status : undefined) ??
      old?.status ??
      "SCHEDULED";
    const conflicts =
      status === "SCHEDULED"
        ? await visitConflict(tx, agencyId, agentId, scheduledAt, endsAt, id)
        : [];
    if (conflicts.length)
      throw new ApiError(409, "Agent already has a visit during this time", {
        conflicts,
      });
    const data = {
      agencyId,
      propertyId,
      leadId,
      agentId,
      scheduledAt,
      endsAt,
      durationMinutes,
      status,
      notes: input.notes,
      meetingPoint: input.meetingPoint,
      visitorCount: input.visitorCount,
      outcomeNotes: input.outcomeNotes,
    };
    const saved = id
      ? await tx.visit.update({ where: { id }, data })
      : await tx.visit.create({ data });
    await audit(
      tx,
      agencyId,
      undefined,
      id ? "VISIT_UPDATED" : "VISIT_CREATED",
      "Visit",
      saved.id,
      old,
      saved,
    );
    if (agentId)
      await tx.notification.create({
        data: {
          agencyId,
          userId: agentId,
          title: id ? "Visit updated" : "Visit scheduled",
          body: `Visit scheduled for ${scheduledAt.toISOString()}`,
          linkUrl: "/visits",
        },
      });
    const lead = await tx.lead.findUniqueOrThrow({ where: { id: leadId } });
    if (lead.email)
      await tx.emailJob.create({
        data: {
          agencyId,
          recipient: lead.email,
          subject: "Property visit update",
          body: `Your visit is ${status.toLowerCase()} for ${scheduledAt.toISOString()}.`,
        },
      });
    return saved;
  });
}
export async function saveDeal(
  agencyId: string,
  input: CreateDealInput | UpdateDealInput,
  id?: string,
) {
  return transaction(async (tx) => {
    const old = id
      ? await tx.deal.findFirst({ where: { id, agencyId } })
      : null;
    if (id && !old) throw ApiError.notFound("Deal not found");
    const propertyId =
      ("propertyId" in input ? input.propertyId : undefined) ?? old!.propertyId;
    const leadId =
      ("leadId" in input ? input.leadId : undefined) ?? old!.leadId;
    const agentId = input.agentId ?? old?.agentId;
    await requireReference(tx, "property", propertyId, agencyId);
    await requireReference(tx, "lead", leadId, agencyId);
    await requireReference(tx, "user", agentId, agencyId);
    const stage =
      input.stage ??
      (input.status === "WON"
        ? "CLOSED_WON"
        : input.status === "LOST"
          ? "CLOSED_LOST"
          : input.status === "OPEN"
            ? "INQUIRY"
            : (old?.stage ?? "INQUIRY"));
    const status: DealStatus =
      stage === "CLOSED_WON"
        ? "WON"
        : stage === "CLOSED_LOST"
          ? "LOST"
          : "OPEN";
    if (input.status && input.status !== status)
      throw ApiError.badRequest("Deal status and stage must agree");
    if (old?.status === "WON" && status !== "WON")
      throw ApiError.conflict(
        "Won deals require an accounting reversal before reopening",
      );
    if (
      ["BOOKING", "DOCUMENTATION", "CLOSED_WON"].includes(stage) &&
      (await tx.deal.findFirst({
        where: {
          agencyId,
          propertyId,
          id: { not: id },
          stage: { in: ["BOOKING", "DOCUMENTATION", "CLOSED_WON"] },
        },
      }))
    )
      throw ApiError.conflict("Another deal already holds this property");
    const data = {
      agencyId,
      propertyId,
      leadId,
      agentId,
      value: input.value ?? old!.value,
      status,
      stage,
      offerAmount: input.offerAmount,
      agreedAmount: input.agreedAmount,
      expectedCloseAt: input.expectedCloseAt
        ? new Date(input.expectedCloseAt)
        : undefined,
      notes: input.notes,
      closedAt: status === "OPEN" ? null : (old?.closedAt ?? new Date()),
    };
    const deal = id
      ? await tx.deal.update({ where: { id }, data })
      : await tx.deal.create({ data });
    if (status === "WON" && agentId) {
      const agency = await tx.agency.findUniqueOrThrow({
        where: { id: agencyId },
      });
      const existing = await tx.commission.findUnique({
        where: { dealId: deal.id },
      });
      const amount = money(
        (deal.agreedAmount ?? deal.value)
          .mul(existing?.rate ?? agency.commissionRate)
          .div(100),
      );
      if (
        existing &&
        (!existing.amount.eq(amount) || existing.agentId !== agentId)
      )
        throw ApiError.conflict(
          "Commission already exists; deal value and agent are locked",
        );
      await tx.commission.upsert({
        where: { dealId: deal.id },
        create: {
          agencyId,
          dealId: deal.id,
          agentId,
          rate: agency.commissionRate,
          amount,
        },
        update: {},
      });
    }
    if (status === "WON" && old?.status !== "WON") {
      const property = await tx.property.findUniqueOrThrow({
        where: { id: propertyId },
      });
      const nextStatus =
        property.purpose === "SALE"
          ? "SOLD"
          : property.purpose === "RENT"
            ? "RENTED"
            : "LEASED";
      await tx.property.update({
        where: { id: propertyId },
        data: { status: nextStatus, isPublished: false },
      });
      await tx.propertyStatusHistory.create({
        data: {
          agencyId,
          propertyId,
          fromStatus: property.status,
          toStatus: nextStatus,
        },
      });
      await tx.lead.update({
        where: { id: leadId },
        data: { stage: "CONVERTED" },
      });
    }
    await audit(
      tx,
      agencyId,
      undefined,
      id ? "DEAL_UPDATED" : "DEAL_CREATED",
      "Deal",
      deal.id,
      old,
      deal,
    );
    return deal;
  });
}
