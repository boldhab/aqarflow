-- CreateEnum
CREATE TYPE "PropertyPurpose" AS ENUM ('SALE', 'RENT', 'LEASE');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'VILLA', 'PLOT', 'COMMERCIAL', 'OFFICE', 'SHOP');

-- CreateEnum
CREATE TYPE "AreaUnit" AS ENUM ('SQFT', 'SQM', 'MARLA', 'KANAL');

-- AlterEnum
ALTER TYPE "PropertyStatus" ADD VALUE 'UNDER_OFFER';
ALTER TYPE "PropertyStatus" ADD VALUE 'LEASED';

-- DropIndex
DROP INDEX IF EXISTS "properties_agencyId_status_idx";

-- AlterTable
ALTER TABLE "properties" DROP COLUMN IF EXISTS "areaSqFt",
DROP COLUMN IF EXISTS "country",
ADD COLUMN "areaUnit" "AreaUnit" NOT NULL DEFAULT 'SQFT',
ADD COLUMN "areaValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "assignedAgentId" TEXT,
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "locality" TEXT,
ADD COLUMN "longitude" DOUBLE PRECISION,
ADD COLUMN "purpose" "PropertyPurpose" NOT NULL DEFAULT 'SALE',
ADD COLUMN "referenceCode" TEXT,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "currency" SET DEFAULT 'PKR',
DROP COLUMN IF EXISTS "type",
ADD COLUMN "type" "PropertyType" NOT NULL DEFAULT 'APARTMENT';

-- Populate existing properties with unique referenceCode
UPDATE "properties" SET "referenceCode" = 'AF-' || LPAD(SUBSTRING(id, 1, 4), 4, '0') WHERE "referenceCode" IS NULL;

-- Now set referenceCode to NOT NULL
ALTER TABLE "properties" ALTER COLUMN "referenceCode" SET NOT NULL;

-- AlterTable
ALTER TABLE "property_images" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "storageKey" TEXT;

-- CreateTable
CREATE TABLE "property_status_history" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "fromStatus" "PropertyStatus" NOT NULL,
    "toStatus" "PropertyStatus" NOT NULL,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_status_history_agencyId_idx" ON "property_status_history"("agencyId");

-- CreateIndex
CREATE INDEX "property_status_history_propertyId_idx" ON "property_status_history"("propertyId");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE INDEX "properties_city_idx" ON "properties"("city");

-- CreateIndex
CREATE INDEX "properties_purpose_idx" ON "properties"("purpose");

-- CreateIndex
CREATE UNIQUE INDEX "properties_agencyId_referenceCode_key" ON "properties"("agencyId", "referenceCode");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_status_history" ADD CONSTRAINT "property_status_history_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_status_history" ADD CONSTRAINT "property_status_history_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_status_history" ADD CONSTRAINT "property_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
