"use client";
import { useAuth } from "@/shared/hooks";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ActionForm } from "./ActionForm";
import { RecordItem, request, value } from "./api";
import { branchFields, settingsFields } from "./config";
export function SettingsWorkspace() {
  const { role } = useAuth();
  const [agency, setAgency] = useState<RecordItem | null>(null),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setAgency(await request("/settings/agency"));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load settings");
    }
  }, []);
  useEffect(() => {
    if (role === "ADMIN") load();
  }, [load, role]);
  if (role !== "ADMIN")
    return <p className="p-8">Administrator access required.</p>;
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
      <h1 className="text-3xl font-bold">Agency settings</h1>
      <p className="text-sm text-slate-600">
        Manage your brand, financial defaults, and branch locations.
      </p>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {agency && (
        <>
          <section className="rounded-2xl border bg-white p-6">
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{value(agency, "name")}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {value(agency, "email")} · {value(agency, "phone")}
                </p>
              </div>
              <ActionForm
                label="Edit agency profile"
                endpoint="/settings/agency"
                fields={settingsFields}
                defaults={agency}
                refresh={load}
              />
            </div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { k: "currency", label: "Currency" },
                { k: "timezone", label: "Time zone" },
                { k: "invoicePrefix", label: "Invoice prefix" },
                { k: "commissionRate", label: "Commission rate (%)" },
                { k: "taxNumber", label: "Tax registration" },
                { k: "address", label: "Address" },
              ].map((f) => (
                <div key={f.k}>
                  <dt className="text-xs text-slate-500">{f.label}</dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {value(agency, f.k)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-2xl border bg-white p-6">
            <div className="mb-5 flex justify-between">
              <h2 className="text-lg font-bold">Branches</h2>
              <ActionForm
                label="Add branch"
                endpoint="/settings/branches"
                method="POST"
                fields={branchFields}
                refresh={load}
              />
            </div>
            {(agency.branches as RecordItem[]).map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 border-t py-4"
              >
                <div>
                  <h3 className="font-semibold">{value(b, "name")}</h3>
                  <p className="text-sm text-slate-600">
                    {value(b, "address")} · {value(b, "city")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionForm
                    label="Edit branch"
                    endpoint={`/settings/branches/${b.id}`}
                    fields={branchFields}
                    defaults={b}
                    refresh={load}
                  />
                  <ActionForm
                    label="Assign staff"
                    method="POST"
                    endpoint={`/settings/branches/${b.id}/assign`}
                    fields={[
                      {
                        name: "userId",
                        label: "Staff member",
                        source: "/users",
                      },
                    ]}
                    refresh={load}
                  />
                  <ActionForm
                    label="Assign property"
                    method="POST"
                    endpoint={`/settings/branches/${b.id}/assign`}
                    fields={[
                      {
                        name: "propertyId",
                        label: "Property",
                        source: "/properties",
                      },
                    ]}
                    refresh={load}
                  />
                </div>
              </div>
            ))}
          </section>
          <Link
            href="/settings/audit"
            className="inline-block text-sm font-semibold text-brand-700"
          >
            View audit history →
          </Link>
        </>
      )}
    </div>
  );
}
