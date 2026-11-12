"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { LeadList } from "@/modules/leads";
import { VisitList } from "@/modules/visits";
import { DealList } from "@/modules/deals";
import { apiClient } from "@/shared/lib";
import { useAuth } from "@/shared/hooks";
import { Alert, Button, Input, Modal, Select } from "@/shared/components/ui";

type Kind = "leads" | "visits" | "deals";
type Choice = {
  id: string;
  title?: string;
  name?: string;
  referenceCode?: string;
};
async function allChoices(endpoint: string): Promise<Choice[]> {
  const items: Choice[] = [];
  let page = 1,
    totalPages = 1;
  do {
    const res = await apiClient<{
      data: { items: Choice[]; totalPages?: number };
    }>(`${endpoint}?limit=50&page=${page}`);
    items.push(...res.data.items);
    totalPages = res.data.totalPages || 1;
    page++;
  } while (page <= totalPages);
  return items;
}
export function WorkflowPage({ kind }: { kind: Kind }) {
  const params = useSearchParams(),
    router = useRouter();
  const [open, setOpen] = useState(params.get("create") === "1"),
    [revision, setRevision] = useState(0),
    [notice, setNotice] = useState("");
  useEffect(() => {
    if (params.get("create") === "1") setOpen(true);
  }, [params]);
  const label =
    kind === "leads"
      ? "New Lead"
      : kind === "visits"
        ? "Schedule Visit"
        : "Create Deal";
  function close() {
    setOpen(false);
    if (params.has("create")) {
      const next = new URLSearchParams(params.toString());
      next.delete("create");
      router.replace(`/${kind}${next.size ? `?${next}` : ""}`, {
        scroll: false,
      });
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} leftIcon={<Plus size={17} />}>
          {label}
        </Button>
      </div>
      {notice && (
        <Alert variant="success" onDismiss={() => setNotice("")}>
          {notice}
        </Alert>
      )}
      {kind === "leads" ? (
        <LeadList key={revision} />
      ) : kind === "visits" ? (
        <VisitList key={revision} />
      ) : (
        <DealList key={revision} />
      )}{" "}
      {open && (
        <WorkflowForm
          kind={kind}
          label={label}
          onClose={close}
          onSuccess={() => {
            close();
            setRevision((n) => n + 1);
            setNotice(
              kind === "leads"
                ? "Lead created."
                : kind === "visits"
                  ? "Visit scheduled."
                  : "Deal created.",
            );
          }}
        />
      )}
    </div>
  );
}
function WorkflowForm({
  kind,
  label,
  onClose,
  onSuccess,
}: {
  kind: Kind;
  label: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Choice[]>([]),
    [leads, setLeads] = useState<Choice[]>([]);
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [optionsError, setOptionsError] = useState(""),
    [revision, setRevision] = useState(0);
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [email, setEmail] = useState(""),
    [propertyId, setPropertyId] = useState(""),
    [leadId, setLeadId] = useState(""),
    [value, setValue] = useState(""),
    [scheduledAt, setScheduledAt] = useState(""),
    [notes, setNotes] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const dirty = Boolean(
    name ||
      phone ||
      email ||
      propertyId ||
      leadId ||
      value ||
      scheduledAt ||
      notes,
  );
  function close() {
    if (busy) return;
    if (dirty) setConfirmClose(true);
    else onClose();
  }
  useEffect(() => {
    let active = true;
    setLoading(true);
    setOptionsError("");
    Promise.all([
      allChoices("/properties"),
      kind === "leads" ? Promise.resolve([]) : allChoices("/leads"),
    ])
      .then(([p, l]) => {
        if (active) {
          setProperties(p);
          setLeads(l);
        }
      })
      .catch(() => {
        if (active)
          setOptionsError(
            "We couldn’t load properties and clients. Please retry.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [kind, revision]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload =
        kind === "leads"
          ? {
              name: name.trim(),
              phone: phone.trim(),
              email: email.trim() || undefined,
              propertyId: propertyId || undefined,
              message: notes,
              source: "MANUAL",
            }
          : kind === "visits"
            ? {
                propertyId,
                leadId,
                agentId: user?.id,
                scheduledAt: new Date(`${scheduledAt}+05:00`).toISOString(),
                notes,
              }
            : {
                propertyId,
                leadId,
                agentId: user?.id,
                value: Number(value),
                status: "OPEN",
              };
      await apiClient(`/${kind}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onSuccess();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to save. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      isOpen
      onClose={close}
      title={label}
      description={
        kind === "visits"
          ? "Schedule a property viewing. All appointment times are Pakistan time (PKT)."
          : "Add the details below. You can review them before saving."
      }
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="workflow-form"
            isLoading={busy}
            disabled={kind !== "leads" && (loading || Boolean(optionsError))}
          >
            {label}
          </Button>
        </>
      }
    >
      <form id="workflow-form" onSubmit={submit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {optionsError && (
          <Alert variant="error">
            {optionsError}
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={() => setRevision((n) => n + 1)}
            >
              Retry
            </Button>
          </Alert>
        )}
        {kind === "leads" && (
          <>
            <Input
              label="Client name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              required
              autoComplete="name"
            />
            <Input
              label="Phone number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              minLength={5}
              required
              autoComplete="tel"
            />
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </>
        )}
        <Select
          label={kind === "leads" ? "Property (optional)" : "Property"}
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          required={kind !== "leads"}
          disabled={loading || Boolean(optionsError)}
          options={[
            {
              value: "",
              label: loading ? "Loading properties…" : "Select a property",
            },
            ...properties.map((p) => ({
              value: p.id,
              label: `${p.referenceCode || ""} — ${p.title}`,
            })),
          ]}
        />
        {kind !== "leads" && (
          <Select
            label="Client / lead"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            required
            disabled={loading || Boolean(optionsError)}
            options={[
              {
                value: "",
                label: loading ? "Loading clients…" : "Select a client",
              },
              ...leads.map((l) => ({ value: l.id, label: l.name || l.id })),
            ]}
          />
        )}
        {kind !== "leads" &&
          !loading &&
          !optionsError &&
          (!properties.length || !leads.length) && (
            <p role="status" className="text-sm text-slate-600">
              Add a property and a lead before creating this record.
            </p>
          )}
        {kind === "visits" && (
          <Input
            label="Appointment date and time (PKT)"
            type="datetime-local"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        )}
        {kind === "deals" && (
          <Input
            label="Deal value (PKR)"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
        {kind !== "deals" && (
          <div>
            <label
              htmlFor="workflow-notes"
              className="block text-sm font-semibold mb-2"
            >
              {kind === "leads" ? "Client message / notes" : "Viewing notes"}
            </label>
            <textarea
              id="workflow-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-3 border border-slate-200 rounded-xl"
            />
          </div>
        )}
      </form>
      {confirmClose && (
        <Modal
          isOpen
          onClose={() => setConfirmClose(false)}
          title="Discard unsaved changes?"
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirmClose(false)}>
                Keep editing
              </Button>
              <Button variant="danger" onClick={onClose}>
                Discard
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Your entered details have not been saved.
          </p>
        </Modal>
      )}
    </Modal>
  );
}
