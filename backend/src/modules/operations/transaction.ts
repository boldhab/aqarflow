import prisma from "@/config/db";
import { ApiError } from "@/shared/errors";
import { Prisma } from "@prisma/client";
export type Tx = Prisma.TransactionClient;
export async function transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(fn, { isolationLevel: "Serializable" });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2034", "P2002"].includes(error.code) &&
        attempt < 2
      )
        continue;
      throw error;
    }
  }
  throw ApiError.conflict("Concurrent update; retry the operation");
}
export async function audit(
  tx: Tx,
  agencyId: string,
  actorId: string | undefined,
  action: string,
  entityType: string,
  entityId: string,
  before: unknown,
  after: unknown,
) {
  const clean = (value: unknown) =>
    JSON.parse(
      JSON.stringify(value, (key, v) =>
        /password|token|secret/i.test(key) ? undefined : v,
      ),
    );
  return tx.auditLog.create({
    data: {
      agencyId,
      actorId,
      action,
      entityType,
      entityId,
      beforeJson: before == null ? Prisma.JsonNull : clean(before),
      afterJson: after == null ? Prisma.JsonNull : clean(after),
    },
  });
}
export async function requireReference(
  tx: Tx,
  entity: "property" | "contact" | "user" | "lead" | "branch",
  id: string | null | undefined,
  agencyId: string,
) {
  if (!id) return;
  // Explicit delegates preserve generated type safety and never accept a client-controlled model name.
  const row =
    entity === "property"
      ? await tx.property.findFirst({
          where: { id, agencyId, deletedAt: null },
        })
      : entity === "contact"
        ? await tx.contact.findFirst({ where: { id, agencyId } })
        : entity === "user"
          ? await tx.user.findFirst({ where: { id, agencyId, isActive: true } })
          : entity === "branch"
            ? await tx.branch.findFirst({ where: { id, agencyId } })
            : await tx.lead.findFirst({ where: { id, agencyId } });
  if (!row) throw ApiError.badRequest(`Invalid ${entity} for this agency`);
}
