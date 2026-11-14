import prisma from "@/config/db";
import { transaction } from "@/modules/operations/transaction";

/** Durable outbox worker. Provider failures retain the message and back off for retry. */
export async function deliverEmailBatch() {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
    return { configured: false, sent: 0 };
  let sent = 0;
  for (let i = 0; i < 20; i++) {
    const job = await transaction(async (tx) => {
      const next = await tx.emailJob.findFirst({
        where: {
          OR: [
            { status: "PENDING", nextAttemptAt: { lte: new Date() } },
            {
              status: "SENDING",
              lockedAt: { lt: new Date(Date.now() - 300000) },
            },
          ],
          attempts: { lt: 8 },
        },
        orderBy: { createdAt: "asc" },
      });
      if (!next) return null;
      return tx.emailJob.update({
        where: { id: next.id },
        data: {
          status: "SENDING",
          lockedAt: new Date(),
          attempts: { increment: 1 },
        },
      });
    });
    if (!job) break;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": job.id,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: [job.recipient],
          subject: job.subject,
          text: job.body,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok)
        throw new Error(`Email provider returned ${response.status}`);
      await prisma.emailJob.update({
        where: { id: job.id },
        data: { status: "SENT", lockedAt: null, lastError: null },
      });
      sent++;
    } catch (error) {
      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: job.attempts >= 8 ? "FAILED" : "PENDING",
          lockedAt: null,
          lastError: error instanceof Error ? error.message : "Delivery failed",
          nextAttemptAt: new Date(
            Date.now() + Math.min(3600000, 30000 * 2 ** job.attempts),
          ),
        },
      });
    }
  }
  return { configured: true, sent };
}
if (require.main === module)
  deliverEmailBatch()
    .then((result) => {
      console.log(result);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
