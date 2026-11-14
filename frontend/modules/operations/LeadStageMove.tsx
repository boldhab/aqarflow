"use client";
import { useState } from "react";
import { request } from "./api";
const stages = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VISIT_SCHEDULED",
  "NEGOTIATION",
  "CONVERTED",
  "LOST",
];
export function LeadStageMove({
  id,
  stage,
  refresh,
}: {
  id: string;
  stage: string;
  refresh: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="px-3 pb-3">
      <label className="block text-xs text-slate-600">
        Move to stage
        <select
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
          disabled={busy}
          value={stage}
          onChange={async (e) => {
            const next = e.target.value;
            setBusy(true);
            setError("");
            try {
              await request(`/leads/${id}`, "PATCH", { stage: next });
              refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Unable to move lead");
            } finally {
              setBusy(false);
            }
          }}
        >
          {stages.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>
      {busy && (
        <p role="status" className="mt-1 text-xs">
          Moving…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
