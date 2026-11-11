-- CreateEnum
CREATE TYPE "PreferredContact" AS ENUM ('PHONE', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'MANUAL');

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "leads_assignedToId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "leads_agencyId_stage_idx";

-- AlterTable: Rename assignedToId to assignedAgentId if it exists, otherwise add it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'assignedToId'
  ) THEN
    ALTER TABLE "leads" RENAME COLUMN "assignedToId" TO "assignedAgentId";
  ELSE
    ALTER TABLE "leads" ADD COLUMN "assignedAgentId" TEXT;
  END IF;
END $$;

ALTER TABLE "leads"
ADD COLUMN IF NOT EXISTS "propertyId" TEXT,
ADD COLUMN IF NOT EXISTS "message" TEXT,
ADD COLUMN IF NOT EXISTS "normalizedPhone" TEXT,
ADD COLUMN IF NOT EXISTS "normalizedEmail" TEXT,
ADD COLUMN IF NOT EXISTS "preferredContact" "PreferredContact" NOT NULL DEFAULT 'PHONE',
ADD COLUMN IF NOT EXISTS "purpose" "PropertyPurpose";

-- Recreate source column with enum
ALTER TABLE "leads" DROP COLUMN IF EXISTS "source";
ALTER TABLE "leads" ADD COLUMN "source" "LeadSource" NOT NULL DEFAULT 'WEBSITE';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "leads_stage_idx" ON "leads"("stage");
CREATE INDEX IF NOT EXISTS "leads_propertyId_idx" ON "leads"("propertyId");
CREATE INDEX IF NOT EXISTS "leads_normalizedPhone_idx" ON "leads"("normalizedPhone");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
