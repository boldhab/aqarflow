"use client";
import { useAuth } from "@/shared/hooks";
import { useState } from "react";
import { ActionForm } from "./ActionForm";
import { download, RecordItem } from "./api";
import {
  contactFields,
  expenseFields,
  leaseFields,
  maintenanceFields,
  maintenanceUpdateFields,
  paymentFields,
  staffFields,
} from "./config";
import { ResourceWorkspace, secondaryClass } from "./ResourceWorkspace";
function DownloadButton({
  path,
  name,
  label = "Download PDF",
}: {
  path: string;
  name: string;
  label?: string;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div>
      <button
        className={secondaryClass}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await download(path, name);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Download failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Downloading…" : label}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
export { DownloadButton };
export function StaffWorkspace() {
  const { user, role } = useAuth();
  if (role !== "ADMIN")
    return <p className="p-8">Administrator access required.</p>;
  return (
    <ResourceWorkspace
      title="Staff management"
      description="Manage agency access and keep your team directory current."
      endpoint="/users"
      fields={staffFields}
      adminCreate
      columns={[
        { key: "name", label: "Team member" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role" },
        { key: "isActive", label: "Active" },
        { key: "_count.assignedProperties", label: "Active listings" },
      ]}
      actions={(row, refresh) => (
        <>
          {row.id !== user?.id && (
            <ActionForm
              label={row.isActive ? "Deactivate" : "Activate"}
              endpoint={`/users/${row.id}`}
              body={{ isActive: !row.isActive }}
              refresh={refresh}
            />
          )}
          <ActionForm
            label="Edit staff"
            endpoint={`/users/${row.id}`}
            fields={[
              { name: "name", label: "Name" },
              { name: "role", label: "Role", options: ["ADMIN", "AGENT"] },
              { name: "phone", label: "Phone", required: false },
            ]}
            defaults={row}
            refresh={refresh}
          />
        </>
      )}
    />
  );
}
export function ContactsWorkspace() {
  return (
    <ResourceWorkspace
      title="Contacts"
      description="One customer profile for every relationship, conversation, and transaction."
      endpoint="/contacts"
      fields={contactFields}
      detailBase="/contacts"
      columns={[
        { key: "name", label: "Name" },
        { key: "type", label: "Relationship" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
      ]}
    />
  );
}
export function RentalsWorkspace() {
  return (
    <ResourceWorkspace
      title="Rental portfolio"
      statusOptions={[
        "ACTIVE",
        "EXPIRING",
        "RENEWED",
        "EXPIRED",
        "ENDED",
        "TERMINATED",
      ]}
      description="Manage tenancies, collect rent, and prepare renewals before agreements expire."
      endpoint="/rentals"
      fields={leaseFields}
      adminCreate
      detailBase="/rentals"
      columns={[
        { key: "property.title", label: "Property" },
        { key: "contact.name", label: "Tenant" },
        { key: "monthlyRent", label: "Monthly rent" },
        { key: "endDate", label: "Expires" },
      ]}
    />
  );
}
export function ExpensesWorkspace() {
  return (
    <ResourceWorkspace
      title="Expenses"
      description="Track operating costs with a clear history of agency spending."
      endpoint="/finance/expenses"
      fields={expenseFields}
      adminCreate
      columns={[
        { key: "category", label: "Category" },
        { key: "description", label: "Description" },
        { key: "amount", label: "Amount" },
        { key: "date", label: "Date" },
      ]}
    />
  );
}
export function PaymentsWorkspace() {
  return (
    <ResourceWorkspace
      title="Payments"
      description="A permanent record of receipts. Record invoice payments from invoices and rent payments from each lease."
      endpoint="/finance/payments"
      columns={[
        { key: "contact.name", label: "Received from" },
        { key: "amount", label: "Amount" },
        { key: "method", label: "Method" },
        { key: "referenceCode", label: "Reference" },
      ]}
      actions={(row) => (
        <DownloadButton
          path={`/finance/payments/${row.id}/pdf`}
          name={`receipt-${row.id}.pdf`}
        />
      )}
    />
  );
}
export function CommissionsWorkspace() {
  const { role } = useAuth();
  return (
    <ResourceWorkspace
      title="Agent commissions"
      description="Commissions are calculated when deals are won, then approved and paid by an administrator."
      endpoint="/finance/commissions"
      columns={[
        { key: "agent.name", label: "Agent" },
        { key: "deal.property.title", label: "Property" },
        { key: "amount", label: "Commission" },
        { key: "status", label: "Status" },
      ]}
      actions={(row, refresh) =>
        role === "ADMIN" ? (
          <>
            {row.status === "PENDING_APPROVAL" && (
              <ActionForm
                label="Approve"
                endpoint={`/finance/commissions/${row.id}`}
                body={{ status: "APPROVED" }}
                refresh={refresh}
              />
            )}{" "}
            {row.status === "APPROVED" && (
              <ActionForm
                label="Mark paid"
                endpoint={`/finance/commissions/${row.id}`}
                body={{ status: "PAID" }}
                refresh={refresh}
              />
            )}{" "}
            {["PENDING_APPROVAL", "APPROVED"].includes(String(row.status)) && (
              <ActionForm
                label="Cancel commission"
                endpoint={`/finance/commissions/${row.id}`}
                body={{ status: "CANCELLED" }}
                refresh={refresh}
              />
            )}
          </>
        ) : null
      }
    />
  );
}
export function MaintenanceWorkspace() {
  return (
    <ResourceWorkspace
      title="Maintenance"
      statusOptions={[
        "OPEN",
        "ASSIGNED",
        "IN_PROGRESS",
        "WAITING",
        "RESOLVED",
        "CLOSED",
      ]}
      boardStatuses={[
        "OPEN",
        "ASSIGNED",
        "IN_PROGRESS",
        "WAITING",
        "RESOLVED",
        "CLOSED",
      ]}
      description="Coordinate repairs, assign contractors, and track progress and costs."
      endpoint="/maintenance"
      fields={maintenanceFields}
      normalize={(data) => {
        const { photoUrl, ...rest } = data;
        return { ...rest, photos: photoUrl ? [photoUrl] : [] };
      }}
      columns={[
        { key: "title", label: "Issue" },
        { key: "property.title", label: "Property" },
        { key: "priority", label: "Priority" },
        { key: "status", label: "Status" },
      ]}
      actions={(row, refresh) =>
        row.status !== "CLOSED" ? (
          <ActionForm
            label="Update ticket"
            endpoint={`/maintenance/${row.id}`}
            fields={maintenanceUpdateFields}
            defaults={row}
            refresh={refresh}
          />
        ) : null
      }
    />
  );
}
export function AuditWorkspace() {
  const { role } = useAuth();
  return role === "ADMIN" ? (
    <ResourceWorkspace
      title="Audit history"
      description="Append-only records of agency changes, with previous and updated values."
      endpoint="/audit-logs"
      columns={[
        { key: "action", label: "Action" },
        { key: "entityType", label: "Record type" },
        { key: "actorId", label: "Actor" },
        { key: "createdAt", label: "Time" },
      ]}
      actions={(row) => (
        <details className="max-w-sm">
          <summary className="cursor-pointer text-sm font-semibold text-brand-700">
            View changes
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-50 p-3 text-xs">
            {JSON.stringify(
              { before: row.beforeJson, after: row.afterJson },
              null,
              2,
            )}
          </pre>
        </details>
      )}
    />
  ) : (
    <p className="p-8">Administrator access required.</p>
  );
}
export function InvoiceActions({
  row,
  refresh,
}: {
  row: RecordItem;
  refresh: () => void;
}) {
  const { role } = useAuth();
  return (
    <>
      <DownloadButton
        path={`/finance/invoices/${row.id}/pdf`}
        name={`${row.invoiceNumber}.pdf`}
      />
      {!["PAID", "CANCELLED"].includes(String(row.status)) && (
        <ActionForm
          label="Record payment"
          endpoint="/finance/payments"
          method="POST"
          fields={paymentFields}
          normalize={(data) => ({
            ...data,
            invoiceId: row.id,
            requestKey: crypto.randomUUID(),
          })}
          refresh={refresh}
        />
      )}{" "}
      {role === "ADMIN" &&
        Number(row.amountPaid) === 0 &&
        row.status !== "CANCELLED" && (
          <ActionForm
            label="Cancel invoice"
            endpoint={`/finance/invoices/${row.id}`}
            body={{ status: "CANCELLED" }}
            refresh={refresh}
          />
        )}
    </>
  );
}

export function RentScheduleWorkspace() {
  return (
    <ResourceWorkspace
      title="Rent collection schedule"
      statusOptions={[
        "PENDING",
        "DUE",
        "OVERDUE",
        "PARTIALLY_PAID",
        "PAID",
        "WAIVED",
      ]}
      description="Scheduled installments with live due and overdue statuses, including each lease’s grace period."
      endpoint="/rent-obligations"
      columns={[
        { key: "property.title", label: "Property" },
        { key: "contact.name", label: "Tenant" },
        { key: "dueDate", label: "Due date" },
        { key: "status", label: "Status" },
      ]}
      actions={(row, refresh) =>
        !["PAID", "WAIVED"].includes(String(row.status)) ? (
          <ActionForm
            label="Record payment"
            endpoint="/finance/payments"
            method="POST"
            fields={paymentFields}
            normalize={(data) => ({
              ...data,
              obligationId: row.id,
              requestKey: crypto.randomUUID(),
            })}
            refresh={refresh}
          />
        ) : null
      }
    />
  );
}
