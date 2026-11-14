-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('INQUIRY', 'QUALIFIED', 'VISIT', 'OFFER', 'NEGOTIATION', 'BOOKING', 'DOCUMENTATION', 'CLOSED_WON', 'CLOSED_LOST');

-- AlterTable
ALTER TABLE "agencies" ADD COLUMN     "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 1.5,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'PKR',
ADD COLUMN     "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "taxNumber" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Karachi';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "contactId" TEXT;

-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "meetingPoint" TEXT,
ADD COLUMN     "outcomeNotes" TEXT,
ADD COLUMN     "visitorCount" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "deals" ADD COLUMN     "agreedAmount" DECIMAL(14,2),
ADD COLUMN     "expectedCloseAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "offerAmount" DECIMAL(14,2),
ADD COLUMN     "stage" "DealStage" NOT NULL DEFAULT 'INQUIRY';

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "normalizedPhone" TEXT NOT NULL,
    "email" TEXT,
    "type" TEXT NOT NULL DEFAULT 'BUYER',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_properties" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "linkUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_jobs" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leases" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "monthlyRent" DECIMAL(14,2) NOT NULL,
    "depositAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "renewedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rent_obligations" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "amountPaid" DECIMAL(14,2) NOT NULL DEFAULT 0,

    CONSTRAINT "rent_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_movements" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "requestKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposit_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_sequences" (
    "agencyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "invoice_sequences_pkey" PRIMARY KEY ("agencyId","year")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "amountPaid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "notes" TEXT,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "obligationId" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "method" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "referenceCode" TEXT,
    "requestKey" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "receiptUrl" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "cost" DECIMAL(14,2),
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contacts_agencyId_normalizedPhone_key" ON "contacts"("agencyId", "normalizedPhone");

-- CreateIndex
CREATE UNIQUE INDEX "customers_contactId_key" ON "customers"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_agencyId_email_key" ON "customers"("agencyId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "saved_properties_customerId_propertyId_key" ON "saved_properties"("customerId", "propertyId");

-- CreateIndex
CREATE INDEX "activities_contactId_occurredAt_idx" ON "activities"("contactId", "occurredAt");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "email_jobs_status_nextAttemptAt_idx" ON "email_jobs"("status", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "leases_renewedFromId_key" ON "leases"("renewedFromId");

-- CreateIndex
CREATE INDEX "leases_agencyId_status_endDate_idx" ON "leases"("agencyId", "status", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "rent_obligations_leaseId_dueDate_key" ON "rent_obligations"("leaseId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_movements_requestKey_key" ON "deposit_movements"("requestKey");

-- CreateIndex
CREATE INDEX "invoices_agencyId_status_dueDate_idx" ON "invoices"("agencyId", "status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_agencyId_invoiceNumber_key" ON "invoices"("agencyId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "payments_agencyId_paidAt_idx" ON "payments"("agencyId", "paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "payments_agencyId_requestKey_key" ON "payments"("agencyId", "requestKey");

-- CreateIndex
CREATE INDEX "expenses_agencyId_date_idx" ON "expenses"("agencyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_dealId_key" ON "commissions"("dealId");

-- CreateIndex
CREATE INDEX "commissions_agencyId_status_idx" ON "commissions"("agencyId", "status");

-- CreateIndex
CREATE INDEX "maintenance_requests_agencyId_status_idx" ON "maintenance_requests"("agencyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "branches_agencyId_name_key" ON "branches"("agencyId", "name");

-- CreateIndex
CREATE INDEX "audit_logs_agencyId_createdAt_idx" ON "audit_logs"("agencyId", "createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_properties" ADD CONSTRAINT "saved_properties_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_properties" ADD CONSTRAINT "saved_properties_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_jobs" ADD CONSTRAINT "email_jobs_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_renewedFromId_fkey" FOREIGN KEY ("renewedFromId") REFERENCES "leases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_obligations" ADD CONSTRAINT "rent_obligations_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_movements" ADD CONSTRAINT "deposit_movements_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "leases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_sequences" ADD CONSTRAINT "invoice_sequences_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "rent_obligations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Backfill before introducing scheduling invariants. Existing conflicting appointments must be reconciled before deployment.
UPDATE "visits" SET "endsAt" = "scheduledAt" + interval '60 minutes' WHERE "endsAt" IS NULL;
ALTER TABLE "visits" ALTER COLUMN "endsAt" SET NOT NULL;
ALTER TABLE "visits" ADD CONSTRAINT "visit_positive_duration" CHECK ("durationMinutes" BETWEEN 5 AND 1440 AND "endsAt" > "scheduledAt");
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "visits" ADD CONSTRAINT "agent_visit_no_overlap" EXCLUDE USING gist ("agencyId" WITH =, "agentId" WITH =, tsrange("scheduledAt", "endsAt", '[)') WITH &&) WHERE ("status" = 'SCHEDULED' AND "agentId" IS NOT NULL);
UPDATE "deals" SET "stage" = CASE WHEN "status" = 'WON' THEN 'CLOSED_WON'::"DealStage" WHEN "status" = 'LOST' THEN 'CLOSED_LOST'::"DealStage" ELSE 'INQUIRY'::"DealStage" END;
CREATE UNIQUE INDEX "one_property_booking" ON "deals" ("agencyId", "propertyId") WHERE "stage" IN ('BOOKING', 'DOCUMENTATION', 'CLOSED_WON');
ALTER TABLE "leases" ADD CONSTRAINT "lease_no_overlap" EXCLUDE USING gist ("agencyId" WITH =, "propertyId" WITH =, tsrange("startDate", "endDate", '[)') WITH &&) WHERE ("status" = 'ACTIVE');
ALTER TABLE "payments" ADD CONSTRAINT "payment_positive_single_target" CHECK ("amount" > 0 AND (("invoiceId" IS NOT NULL)::int + ("obligationId" IS NOT NULL)::int) = 1);
ALTER TABLE "invoices" ADD CONSTRAINT "invoice_valid_balance" CHECK ("amountPaid" >= 0 AND "amountPaid" <= "totalAmount" AND "totalAmount" > 0);
ALTER TABLE "rent_obligations" ADD CONSTRAINT "rent_valid_balance" CHECK ("amountPaid" >= 0 AND "amountPaid" <= "amount" AND "amount" > 0);
CREATE FUNCTION prevent_record_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'This record is append-only'; END; $$;
CREATE TRIGGER audit_log_immutable BEFORE UPDATE OR DELETE ON "audit_logs" FOR EACH ROW EXECUTE FUNCTION prevent_record_mutation();
CREATE TRIGGER payment_immutable BEFORE UPDATE OR DELETE ON "payments" FOR EACH ROW EXECUTE FUNCTION prevent_record_mutation();
CREATE TRIGGER deposit_immutable BEFORE UPDATE OR DELETE ON "deposit_movements" FOR EACH ROW EXECUTE FUNCTION prevent_record_mutation();
-- Cover existing inventory/CRM/staff paths as well as the new application services.
CREATE FUNCTION audit_existing_record() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE before_data jsonb; after_data jsonb;
BEGIN
  IF TG_OP <> 'INSERT' THEN before_data = to_jsonb(OLD) - 'password'; END IF;
  IF TG_OP <> 'DELETE' THEN after_data = to_jsonb(NEW) - 'password'; END IF;
  INSERT INTO "audit_logs" ("id", "agencyId", "action", "entityType", "entityId", "beforeJson", "afterJson", "createdAt")
  VALUES (gen_random_uuid()::text, COALESCE(NEW."agencyId", OLD."agencyId"), TG_TABLE_NAME || '_' || TG_OP, TG_TABLE_NAME, COALESCE(NEW."id", OLD."id"), before_data, after_data, now());
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER property_audit AFTER INSERT OR UPDATE OR DELETE ON "properties" FOR EACH ROW EXECUTE FUNCTION audit_existing_record();
CREATE TRIGGER lead_audit AFTER INSERT OR UPDATE OR DELETE ON "leads" FOR EACH ROW EXECUTE FUNCTION audit_existing_record();
CREATE TRIGGER staff_audit AFTER INSERT OR UPDATE OR DELETE ON "users" FOR EACH ROW EXECUTE FUNCTION audit_existing_record();
