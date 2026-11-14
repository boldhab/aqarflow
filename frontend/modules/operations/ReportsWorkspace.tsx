"use client";
import { useAuth } from "@/shared/hooks";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { request } from "./api";
import { buttonClass, inputClass } from "./ResourceWorkspace";
import { DownloadButton } from "./Workspaces";
interface Report {
  monthly: {
    month: string;
    sales: number;
    collections: number;
    rent: number;
    expenses: number;
  }[];
  funnel: { name: string; value: number }[];
  agents: {
    name: string;
    visits: number;
    won: number;
    volume: number;
    commissions: number;
  }[];
  rentDue: string;
  rentCollected: string;
  collectionRate: number;
  activeLeases: number;
  conversionRate: number;
  occupancyRate: number;
  expiringLeases: { id: string; endDate: string }[];
}
export function ReportsWorkspace() {
  const { role } = useAuth();
  const [report, setReport] = useState<Report | null>(null),
    [error, setError] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [query, setQuery] = useState("");
  useEffect(() => {
    let alive = true;
    setError("");
    request<Report>(`/reports/sales${query}`)
      .then((r) => {
        if (alive) setReport(r);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [query]);
  if (role !== "ADMIN")
    return <p className="p-8">Administrator access required.</p>;
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">
          Business intelligence
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Performance overview
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sales volume, cash collections, and operational trends for your
          agency.
        </p>
      </div>
      <form
        className="flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const q = new URLSearchParams();
          if (from) q.set("from", from);
          if (to) q.set("to", `${to}T23:59:59.999Z`);
          setQuery(`?${q}`);
        }}
      >
        <label className="text-sm">
          From
          <input
            className={inputClass}
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-sm">
          To
          <input
            className={inputClass}
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button className={buttonClass}>Apply dates</button>
        <DownloadButton
          path={`/reports/export-csv${query}`}
          name="agency-report.csv"
          label="Download CSV"
        />
        <DownloadButton
          path={`/reports/pdf${query}`}
          name="agency-report.pdf"
          label="PDF summary"
        />
      </form>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      {!report && !error ? (
        <p role="status">Loading report…</p>
      ) : (
        report && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Scheduled rent", value: report.rentDue },
                { label: "Collected rent", value: report.rentCollected },
                {
                  label: "Inquiry conversion",
                  value: `${report.conversionRate}%`,
                },
                {
                  label: "Rental occupancy",
                  value: `${report.occupancyRate}%`,
                },
                {
                  label: "Collection efficiency",
                  value: `${report.collectionRate}%`,
                },
                {
                  label: "Expiring within 30 days",
                  value: report.expiringLeases.length,
                },
              ].map((k) => (
                <div key={k.label} className="rounded-2xl border bg-white p-5">
                  <p className="text-sm text-slate-500">{k.label}</p>
                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {String(k.value)}
                  </p>
                </div>
              ))}
            </div>
            <section className="rounded-2xl border bg-white p-5">
              <h2 className="mb-6 text-lg font-bold">
                Sales volume & cash collections
              </h2>
              <div
                className="h-80"
                aria-label="Monthly sales and collections chart"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis width={85} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      name="Sales volume"
                      stroke="#16624b"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="collections"
                      name="Cash collections"
                      stroke="#2563eb"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="rent"
                      name="Rental collections"
                      stroke="#b45309"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer font-semibold">
                  View chart data
                </summary>
                {report.monthly.map((m) => (
                  <p key={m.month} className="py-1">
                    {m.month}: Sales {m.sales}, Collections {m.collections},
                    Rent {m.rent}
                  </p>
                ))}
              </details>
            </section>
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border bg-white p-5">
                <h2 className="mb-4 text-lg font-bold">
                  Pipeline activity counts
                </h2>
                <p className="mb-4 text-xs text-slate-600">
                  Independent counts within the selected period; these are not
                  cohort conversion rates.
                </p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.funnel}>
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        fill="#16624b"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section className="rounded-2xl border bg-white p-5">
                <h2 className="mb-4 text-lg font-bold">Agent performance</h2>
                <div className="space-y-3">
                  {report.agents.map((a) => (
                    <div
                      key={a.name}
                      className="flex justify-between gap-3 border-b py-3"
                    >
                      <div>
                        <p className="font-semibold">{a.name}</p>
                        <p className="text-xs text-slate-600">
                          {a.visits} completed visits · {a.won} won deals
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p>{a.volume.toLocaleString()} volume</p>
                        <p className="text-slate-600">
                          {a.commissions.toLocaleString()} commissions
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )
      )}
    </div>
  );
}
