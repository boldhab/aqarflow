"use client";
import { useAuth } from "@/shared/hooks";
import { useEffect, useState } from "react";
import { ActionForm } from "./ActionForm";
import { RecordItem, request, value } from "./api";
const stageFields = [
  {
    name: "stage",
    label: "Lead stage",
    options: [
      "NEW",
      "CONTACTED",
      "QUALIFIED",
      "VISIT_SCHEDULED",
      "NEGOTIATION",
      "CONVERTED",
      "LOST",
    ],
  },
];
const dealFields = [
  {
    name: "stage",
    label: "Pipeline stage",
    options: [
      "INQUIRY",
      "QUALIFIED",
      "VISIT",
      "OFFER",
      "NEGOTIATION",
      "BOOKING",
      "DOCUMENTATION",
      "CLOSED_WON",
      "CLOSED_LOST",
    ],
  },
  {
    name: "offerAmount",
    label: "Offer amount",
    type: "number",
    step: "0.01",
    min: 0.01,
    required: false,
  },
  {
    name: "agreedAmount",
    label: "Agreed amount",
    type: "number",
    step: "0.01",
    min: 0.01,
    required: false,
  },
  {
    name: "expectedCloseAt",
    label: "Expected close date",
    type: "date",
    required: false,
  },
  { name: "notes", label: "Notes", type: "textarea", required: false },
];
const visitFields = [
  {
    name: "scheduledAt",
    label: "Appointment time (Pakistan time)",
    type: "datetime-local",
  },
  {
    name: "durationMinutes",
    label: "Duration (minutes)",
    type: "number",
    min: 5,
    step: "1",
  },
  { name: "meetingPoint", label: "Meeting point", required: false },
  {
    name: "visitorCount",
    label: "Visitor count",
    type: "number",
    min: 1,
    step: "1",
    required: false,
  },
  {
    name: "outcomeNotes",
    label: "Outcome notes",
    type: "textarea",
    required: false,
  },
];
export function CoreEditor({
  kind,
  id,
  refresh,
}: {
  kind: "leads" | "visits" | "deals";
  id: string;
  refresh: () => void;
}) {
  const { role } = useAuth();
  const [record, setRecord] = useState<RecordItem | null>(null),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    request<RecordItem>(`/${kind}/${id}`)
      .then((r) => {
        if (active) setRecord(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [kind, id, version]);
  const reload = () => {
    setVersion((v) => v + 1);
    refresh();
  };
  if (error)
    return (
      <p role="alert" className="text-red-700">
        {error}
      </p>
    );
  if (!record) return <p role="status">Loading workflow controls…</p>;
  const defaults = {
    ...record,
    ...(record.expectedCloseAt
      ? { expectedCloseAt: String(record.expectedCloseAt).slice(0, 10) }
      : {}),
    ...(record.scheduledAt
      ? {
          scheduledAt: new Date(
            new Date(String(record.scheduledAt)).getTime() + 5 * 3600000,
          )
            .toISOString()
            .slice(0, 16),
        }
      : {}),
  };
  return (
    <section className="space-y-4 border-t border-slate-200 pt-4">
      <h3 className="text-sm font-bold text-slate-900">Manage workflow</h3>
      <div className="flex flex-wrap gap-2">
        {kind === "leads" ? (
          <>
            <ActionForm
              label="Change stage"
              endpoint={`/leads/${id}`}
              fields={stageFields}
              defaults={defaults}
              refresh={reload}
            />
            {role === "ADMIN" && (
              <ActionForm
                label="Assign agent"
                endpoint={`/leads/${id}/assign`}
                method="POST"
                fields={[
                  {
                    name: "assignedAgentId",
                    label: "Agent",
                    source: "/users?role=AGENT",
                  },
                ]}
                defaults={defaults}
                refresh={reload}
              />
            )}
            <ActionForm
              label="Add note"
              endpoint={`/leads/${id}/notes`}
              method="POST"
              fields={[{ name: "content", label: "Note", type: "textarea" }]}
              refresh={reload}
            />
          </>
        ) : kind === "deals" ? (
          <ActionForm
            label="Update deal"
            endpoint={`/deals/${id}`}
            fields={dealFields}
            defaults={defaults}
            normalize={(data) => ({
              ...data,
              ...(data.expectedCloseAt
                ? {
                    expectedCloseAt: new Date(
                      String(data.expectedCloseAt),
                    ).toISOString(),
                  }
                : {}),
            })}
            refresh={reload}
          />
        ) : (
          <>
            <ActionForm
              label="Reschedule / edit visit"
              endpoint={`/visits/${id}`}
              fields={visitFields}
              defaults={defaults}
              normalize={(data) => ({
                ...data,
                scheduledAt: new Date(
                  `${data.scheduledAt}:00+05:00`,
                ).toISOString(),
              })}
              refresh={reload}
            />
            {record.status === "SCHEDULED" && (
              <>
                <ActionForm
                  label="Mark completed"
                  endpoint={`/visits/${id}`}
                  body={{ status: "COMPLETED" }}
                  refresh={reload}
                />
                <ActionForm
                  label="Cancel visit"
                  endpoint={`/visits/${id}`}
                  body={{ status: "CANCELLED" }}
                  refresh={reload}
                />
              </>
            )}
          </>
        )}
      </div>
      {kind === "leads" && (
        <ol className="space-y-2">
          {((record.notes ?? []) as RecordItem[]).map((n) => (
            <li key={n.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="whitespace-pre-wrap">{value(n, "content")}</p>
              <p className="mt-1 text-xs text-slate-500">
                {value(n, "author.name")} ·{" "}
                {new Date(String(n.createdAt)).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
