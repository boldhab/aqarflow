-- AlterTable
ALTER TABLE "rent_obligations" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "waiverReason" TEXT;

