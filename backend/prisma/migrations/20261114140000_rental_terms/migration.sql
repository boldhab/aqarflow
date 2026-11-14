-- AlterTable
ALTER TABLE "leases" ADD COLUMN     "billingFrequency" TEXT NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "dueDayOfMonth" INTEGER,
ADD COLUMN     "gracePeriodDays" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "landlordContactId" TEXT,
ADD COLUMN     "managerUserId" TEXT,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "rent_obligations" ADD COLUMN     "periodEnd" TIMESTAMP(3),
ADD COLUMN     "periodStart" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_landlordContactId_fkey" FOREIGN KEY ("landlordContactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_managerUserId_fkey" FOREIGN KEY ("managerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

