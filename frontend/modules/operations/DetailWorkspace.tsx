"use client";
import { useAuth } from "@/shared/hooks";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ActionForm } from "./ActionForm";
import { secondaryClass } from "./ResourceWorkspace";
import { RecordItem, request, value } from "./api";
import { contactFields, leaseFields, paymentFields } from "./config";
const activityFields = [
  {
    name: "type",
    label: "Activity type",
    options: ["CALL", "MEETING", "EMAIL", "WHATSAPP", "SYSTEM_NOTE"],
  },
  { name: "subject", label: "Subject" },
  { name: "description", label: "Notes", type: "textarea", required: false },
];
const depositFields = [
  {
    name: "type",
    label: "Movement type",
    options: ["RECEIVED", "REFUNDED", "DEDUCTED"],
  },
  { name: "amount", label: "Amount", type: "number", min: 0.01, step: "0.01" },
  { name: "notes", label: "Notes", type: "textarea", required: false },
];
export function DetailWorkspace({
  id,
  kind,
}: {
  id: string;
  kind: "contacts" | "rentals";
}) {
  const { role } = useAuth();
  const [record, setRecord] = useState<RecordItem | null>(null),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setRecord(await request(`/${kind}/${id}`));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load record");
    }
  }, [id, kind]);
  useEffect(() => {
    load();
  }, [load]);
  if (error)
    return (
      <div role="alert" className="p-8 text-red-700">
        {error}
        <button className={secondaryClass} onClick={load}>
          Retry
        </button>
      </div>
    );
  if (!record)
    return (
      <p className="p-8" role="status">
        Loading details…
      </p>
    );
  const obligations = (record.obligations ?? []) as RecordItem[],
    activities = (record.activities ?? []) as RecordItem[],
    leads = (record.leads ?? []) as RecordItem[],
    deposits = (record.deposits ?? []) as RecordItem[];
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <Link className="text-sm font-semibold text-brand-700" href={`/${kind}`}>
        ← Back to {kind}
      </Link>
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {kind === "contacts"
              ? value(record, "name")
              : value(record, "property.title")}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {kind === "contacts"
              ? `${value(record, "type")} · ${value(record, "phone")}`
              : `Tenant: ${value(record, "contact.name")} · ${value(record, "status")}`}
          </p>
        </div>
        {kind === "contacts" ? (
          <div className="flex flex-wrap gap-2">
            <ActionForm
              label="Edit contact"
              endpoint={`/contacts/${id}`}
              fields={contactFields}
              defaults={record}
              refresh={load}
            />
            <ActionForm
              label="Log activity"
              method="POST"
              endpoint={`/contacts/${id}/activities`}
              fields={activityFields}
              refresh={load}
            />
          </div>
        ) : (
          role === "ADMIN" && (
            <div className="flex flex-wrap gap-2">
              <ActionForm
                label="Renew lease"
                method="POST"
                endpoint={`/rentals/${id}/renew`}
                fields={leaseFields}
                defaults={{
                  propertyId: record.propertyId,
                  contactId: record.contactId,
                  monthlyRent: record.monthlyRent,
                  depositAmount: record.depositAmount,
                  startDate: String(record.endDate).slice(0, 10),
                }}
                refresh={load}
              />
              <ActionForm
                label="Record deposit movement"
                method="POST"
                endpoint={`/rentals/${id}/deposits`}
                fields={depositFields}
                normalize={(data) => ({
                  ...data,
                  requestKey: crypto.randomUUID(),
                })}
                refresh={load}
              />
              {record.status === "ACTIVE" && (
                <ActionForm
                  label="Terminate lease"
                  endpoint={`/rentals/${id}/terminate`}
                  method="POST"
                  fields={[
                    {
                      name: "notes",
                      label: "Move-out inspection notes",
                      type: "textarea",
                    },
                    {
                      name: "makeAvailable",
                      label: "Make property available after inspection?",
                      options: ["NO", "YES"],
                    },
                  ]}
                  normalize={(data) => ({
                    ...data,
                    makeAvailable: data.makeAvailable === "YES",
                  })}
                  refresh={load}
                />
              )}
            </div>
          )
        )}
      </div>
      {kind === "contacts" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="mb-4 text-lg font-bold">Activity timeline</h2>
            {!activities.length && (
              <p className="text-sm text-slate-600">
                No activities recorded yet.
              </p>
            )}
            <ol className="space-y-4">
              {activities.map((a) => (
                <li key={a.id} className="border-l-2 border-brand-200 pl-4">
                  <p className="text-xs text-slate-500">
                    {value(a, "type")} ·{" "}
                    {new Date(String(a.occurredAt)).toLocaleString()}
                  </p>
                  <h3 className="mt-1 font-semibold">{value(a, "subject")}</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                    {value(a, "description")}
                  </p>
                </li>
              ))}
            </ol>
          </section>
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="mb-4 text-lg font-bold">
              Inquiries, visits & deals
            </h2>
            {!leads.length && (
              <p className="text-sm text-slate-600">No linked inquiries yet.</p>
            )}
            {leads.map((l) => (
              <article key={l.id} className="border-b py-4">
                <Link className="font-semibold text-brand-700" href="/leads">
                  {value(l, "name")} · {value(l, "stage")}
                </Link>
                <p className="mt-1 text-sm text-slate-600">
                  {(l.visits as unknown[])?.length ?? 0} visits ·{" "}
                  {(l.deals as unknown[])?.length ?? 0} deals
                </p>
              </article>
            ))}
            <h2 className="mb-3 mt-6 font-bold">Financial records</h2>
            <p className="text-sm text-slate-600">
              {(record.leases as unknown[])?.length ?? 0} leases ·{" "}
              {(record.invoices as unknown[])?.length ?? 0} invoices
            </p>
          </section>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Monthly rent", v: record.monthlyRent },
              { label: "Agreed deposit", v: record.depositAmount },
              { label: "End date", v: String(record.endDate).slice(0, 10) },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border bg-white p-5">
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {String(item.v)}
                </p>
              </div>
            ))}
          </div>
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="mb-4 text-lg font-bold">Rent schedule</h2>
            <div className="divide-y">
              {obligations.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div>
                    <p className="font-semibold">
                      Due {String(o.dueDate).slice(0, 10)}
                    </p>
                    <p className="text-sm text-slate-600">
                      Amount {String(o.amount)} · Paid {String(o.amountPaid)} ·
                      Balance{" "}
                      {(o.status === "WAIVED"
                        ? 0
                        : Number(o.amount) - Number(o.amountPaid)
                      ).toFixed(2)}
                    </p>
                  </div>
                  {o.status !== "WAIVED" &&
                  Number(o.amount) > Number(o.amountPaid) ? (
                    <ActionForm
                      label="Record rent payment"
                      method="POST"
                      endpoint="/finance/payments"
                      fields={paymentFields}
                      normalize={(data) => ({
                        ...data,
                        obligationId: o.id,
                        requestKey: crypto.randomUUID(),
                      })}
                      refresh={load}
                    />
                  ) : (
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
                      {o.status === "WAIVED" ? "Waived" : "Paid"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border bg-white p-5">
            <h2 className="mb-4 text-lg font-bold">Deposit history</h2>
            {!deposits.length && (
              <p className="text-sm text-slate-600">
                No deposit movements recorded.
              </p>
            )}
            {deposits.map((d) => (
              <p key={d.id} className="border-b py-3 text-sm">
                {value(d, "type")} · {value(d, "amount")} · {value(d, "notes")}
              </p>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
