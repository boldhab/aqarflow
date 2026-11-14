"use client";
import { Modal } from "@/shared/components/ui";
import { useAuth } from "@/shared/hooks";
import { apiClient } from "@/shared/lib";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { PageData, RecordItem, request, value } from "./api";
export interface Field {
  name: string;
  label: string;
  type?: string;
  options?: string[];
  source?: string;
  required?: boolean;
  min?: number;
  step?: string;
}
interface Props {
  statusOptions?: string[];
  boardStatuses?: string[];
  title: string;
  description: string;
  endpoint: string;
  columns: { key: string; label: string }[];
  fields?: Field[];
  adminCreate?: boolean;
  detailBase?: string;
  actions?: (row: RecordItem, refresh: () => void) => React.ReactNode;
  normalize?: (data: Record<string, unknown>) => unknown;
}
export const inputClass =
  "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";
export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50";
export const secondaryClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50";
function AssetInput({
  name,
  defaultValue,
  required,
}: {
  name: string;
  defaultValue: string;
  required: boolean;
}) {
  const [url, setUrl] = useState(defaultValue),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <span className="block space-y-2">
      <input
        name={name}
        type="url"
        className={inputClass}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required={required}
        placeholder="Image URL or upload below"
      />
      <input
        aria-label="Upload image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy}
        className="block w-full text-sm"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) {
            setError("Choose an image smaller than 5MB");
            return;
          }
          const body = new FormData();
          body.append("file", file);
          setBusy(true);
          setError("");
          try {
            const result = await apiClient<{ data: { url: string } }>(
              "/assets",
              { method: "POST", body },
            );
            setUrl(result.data.url);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Upload failed");
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy && (
        <span role="status" className="text-xs">
          Uploading…
        </span>
      )}
      {error && (
        <span role="alert" className="text-xs text-red-700">
          {error}
        </span>
      )}
    </span>
  );
}
export function DynamicFields({
  fields,
  defaults = {},
}: {
  fields: Field[];
  defaults?: Record<string, unknown>;
}) {
  const [sources, setSources] = useState<Record<string, RecordItem[]>>({});
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    Promise.all(
      fields
        .filter((f) => f.source)
        .map(async (f) => {
          const items: RecordItem[] = [];
          let page = 1,
            totalPages = 1;
          do {
            const data = await request<PageData | RecordItem[]>(
              `${f.source}${f.source!.includes("?") ? "&" : "?"}limit=50&page=${page}`,
            );
            items.push(...(Array.isArray(data) ? data : data.items));
            totalPages = Array.isArray(data) ? 1 : data.totalPages;
            page++;
          } while (page <= totalPages && page <= 100);
          return [f.name, items] as const;
        }),
    )
      .then((results) => {
        if (alive) setSources(Object.fromEntries(results));
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [fields]);
  return (
    <>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          Could not load form options: {error}
        </p>
      )}
      {fields.map((f) => (
        <label
          key={f.name}
          className="block space-y-1.5 text-sm font-medium text-slate-700"
        >
          <span>
            {f.label}
            {f.required !== false && " *"}
          </span>
          {f.type === "asset" ? (
            <AssetInput
              name={f.name}
              defaultValue={String(defaults[f.name] ?? "")}
              required={f.required !== false}
            />
          ) : f.options || f.source ? (
            <select
              name={f.name}
              className={inputClass}
              required={f.required !== false}
              defaultValue={String(defaults[f.name] ?? "")}
            >
              <option value="">Select {f.label.toLowerCase()}</option>
              {f.options?.map((o) => (
                <option key={o} value={o}>
                  {o.replace(/_/g, " ")}
                </option>
              ))}
              {sources[f.name]?.map((o) => (
                <option key={o.id} value={o.id}>
                  {value(o, "name") !== "—"
                    ? value(o, "name")
                    : value(o, "title") !== "—"
                      ? value(o, "title")
                      : value(o, "invoiceNumber")}
                </option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              name={f.name}
              className={inputClass}
              rows={3}
              maxLength={2000}
              required={f.required !== false}
              defaultValue={String(defaults[f.name] ?? "")}
            />
          ) : (
            <input
              name={f.name}
              type={f.type ?? "text"}
              className={inputClass}
              min={f.min}
              step={f.step}
              maxLength={f.type === "password" ? 128 : 2000}
              required={f.required !== false}
              defaultValue={String(defaults[f.name] ?? "")}
              autoComplete={f.type === "password" ? "new-password" : undefined}
            />
          )}
        </label>
      ))}
    </>
  );
}
export function readForm(form: HTMLFormElement, fields: Field[]) {
  const data: Record<string, unknown> = {};
  const values = new FormData(form);
  fields.forEach((f) => {
    const v = String(values.get(f.name) ?? "").trim();
    if (v !== "") data[f.name] = f.type === "number" ? Number(v) : v;
  });
  return data;
}
export function ResourceWorkspace({
  title,
  description,
  endpoint,
  columns,
  fields,
  adminCreate,
  detailBase,
  actions,
  normalize,
  statusOptions,
  boardStatuses,
}: Props) {
  const { role } = useAuth();
  const requestVersion = useRef(0);
  const [statusFilter, setStatusFilter] = useState(""),
    [board, setBoard] = useState(Boolean(boardStatuses));
  const [data, setData] = useState<PageData>({
    items: [],
    total: 0,
    totalPages: 0,
    page: 1,
  });
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [open, setOpen] = useState(false),
    [saving, setSaving] = useState(false),
    [dirty, setDirty] = useState(false),
    [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError("");
    try {
      const result = await request<PageData | RecordItem[]>(
        `${endpoint}?page=${page}&limit=20&search=${encodeURIComponent(query)}&status=${encodeURIComponent(statusFilter)}`,
      );
      if (version !== requestVersion.current) return;
      setData(
        Array.isArray(result)
          ? { items: result, total: result.length, totalPages: 1, page: 1 }
          : result,
      );
    } catch (e) {
      if (version === requestVersion.current)
        setError(e instanceof Error ? e.message : "Unable to load records");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [endpoint, page, query, statusFilter]);
  useEffect(() => {
    load();
    return () => {
      requestVersion.current++;
    };
  }, [load]);
  const close = () => {
    if (
      !saving &&
      (!dirty || window.confirm("Discard your unsaved changes?"))
    ) {
      setOpen(false);
      setDirty(false);
    }
  };
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fields) return;
    const body = readForm(e.currentTarget, fields);
    setSaving(true);
    setError("");
    try {
      await request(endpoint, "POST", normalize ? normalize(body) : body);
      setOpen(false);
      setDirty(false);
      setNotice("Record created successfully.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-700">
            Agency workspace
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
        </div>
        {fields && (!adminCreate || role === "ADMIN") && (
          <button
            className={buttonClass}
            onClick={() => {
              setError("");
              setOpen(true);
            }}
          >
            <Plus size={17} />
            Create record
          </button>
        )}
      </div>
      {notice && (
        <p
          role="status"
          className="rounded-xl bg-brand-50 p-3 text-sm text-brand-800"
        >
          {notice}
        </p>
      )}
      {error && !open && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
          <button className={secondaryClass} onClick={load}>
            Retry
          </button>
        </div>
      )}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <span className="text-lg font-bold text-slate-900">
              {data.total}
            </span>
            <span className="ml-2 text-sm text-slate-600">records</span>
          </div>
          {statusOptions && (
            <select
              aria-label="Filter status"
              className="rounded-xl border border-slate-300 p-2 text-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {statusOptions.map((s) => (
                <option value={s} key={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          )}
          {boardStatuses && (
            <button
              className={secondaryClass}
              onClick={() => setBoard((v) => !v)}
            >
              {board ? "List view" : "Board view"}
            </button>
          )}
          <form
            className="flex w-full min-w-0 gap-2 sm:w-auto"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQuery(search);
            }}
          >
            <input
              aria-label={`Search ${title}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search records"
              className={inputClass}
            />
            <button aria-label="Apply search" className={secondaryClass}>
              <Search size={18} />
            </button>
            <button
              type="button"
              aria-label="Refresh records"
              className={secondaryClass}
              onClick={load}
            >
              <RefreshCw size={17} />
            </button>
          </form>
        </div>
        {loading ? (
          <p role="status" className="p-12 text-center text-sm text-slate-600">
            Loading records…
          </p>
        ) : !data.items.length ? (
          <div className="p-12 text-center">
            <h2 className="font-semibold text-slate-900">No records found</h2>
            <p className="mt-2 text-sm text-slate-600">
              Create your first record or adjust your search.
            </p>
          </div>
        ) : board && boardStatuses ? (
          <div className="grid gap-4 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-3">
            {boardStatuses.map((status) => (
              <section
                key={status}
                className="min-w-0 rounded-xl border border-slate-200 bg-slate-100/50 p-3"
              >
                <h2 className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-600">
                  {status.replace(/_/g, " ")}
                  <span>
                    {data.items.filter((r) => r.status === status).length}
                  </span>
                </h2>
                <div className="space-y-3">
                  {data.items
                    .filter((r) => r.status === status)
                    .map((row) => (
                      <article
                        key={row.id}
                        className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <h3 className="font-semibold text-slate-900">
                          {value(row, "title")}
                        </h3>
                        <dl className="space-y-2">
                          {columns
                            .filter((c) => !["title", "status"].includes(c.key))
                            .map((c) => (
                              <div
                                key={c.key}
                                className="flex justify-between gap-2 text-xs"
                              >
                                <dt className="text-slate-500">{c.label}</dt>
                                <dd className="text-right font-medium">
                                  {value(row, c.key)}
                                </dd>
                              </div>
                            ))}
                        </dl>
                        <div className="flex flex-wrap gap-2">
                          {actions?.(row, load)}
                        </div>
                      </article>
                    ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.items.map((row) => (
              <article
                key={row.id}
                className="grid items-center gap-4 p-5 hover:bg-slate-50/60 md:grid-cols-[1fr_auto]"
              >
                <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {columns.map((c) => (
                    <div key={c.key} className="min-w-0">
                      <dt className="mb-1 text-xs font-medium text-slate-500">
                        {c.label}
                      </dt>
                      <dd
                        className={`break-words text-sm font-semibold ${c.key === "status" ? "text-brand-700" : "text-slate-900"}`}
                      >
                        {value(row, c.key).replace(/_/g, " ")}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="flex flex-wrap gap-2">
                  {detailBase && (
                    <Link
                      href={`${detailBase}/${row.id}`}
                      className={secondaryClass}
                    >
                      View details
                      <ArrowUpRight size={15} />
                    </Link>
                  )}
                  {actions?.(row, load)}
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-200 p-4">
          <p className="text-xs text-slate-600">
            Page {page} of {Math.max(1, data.totalPages)}
          </p>
          <div className="flex gap-2">
            <button
              aria-label="Previous page"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              className={secondaryClass}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              aria-label="Next page"
              disabled={page >= data.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className={secondaryClass}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
      <Modal
        isOpen={open}
        onClose={close}
        title={`Create ${title.toLowerCase()} record`}
        size="lg"
      >
        <form
          onSubmit={submit}
          onChange={() => setDirty(true)}
          className="space-y-5"
        >
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}
          <DynamicFields fields={fields ?? []} />
          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={close}
              className={secondaryClass}
            >
              Cancel
            </button>
            <button disabled={saving} className={buttonClass}>
              {saving ? "Saving…" : "Save record"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
