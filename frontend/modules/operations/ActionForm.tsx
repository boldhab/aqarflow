"use client";
import { Modal } from "@/shared/components/ui";
import { FormEvent, useRef, useState } from "react";
import {
  buttonClass,
  DynamicFields,
  Field,
  readForm,
  secondaryClass,
} from "./ResourceWorkspace";
import { request } from "./api";
export function ActionForm({
  label,
  endpoint,
  fields = [],
  method = "PATCH",
  defaults = {},
  body,
  refresh,
  normalize,
}: {
  label: string;
  endpoint: string;
  fields?: Field[];
  method?: string;
  defaults?: Record<string, unknown>;
  body?: unknown;
  refresh: () => void;
  normalize?: (data: Record<string, unknown>) => unknown;
}) {
  const requestKey = useRef("");
  const [open, setOpen] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [dirty, setDirty] = useState(false);
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
    const values = readForm(e.currentTarget, fields);
    setSaving(true);
    setError("");
    try {
      const payload = body ?? (normalize ? normalize(values) : values);
      if (payload && typeof payload === "object" && "requestKey" in payload) {
        if (!requestKey.current) requestKey.current = crypto.randomUUID();
        (payload as Record<string, unknown>).requestKey = requestKey.current;
      }
      await request(endpoint, method, payload);
      setOpen(false);
      setDirty(false);
      requestKey.current = "";
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className={secondaryClass}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <Modal isOpen={open} onClose={close} title={label}>
        <form
          onSubmit={submit}
          onChange={() => setDirty(true)}
          className="space-y-4"
        >
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}
          <DynamicFields fields={fields} defaults={defaults} />
          {!fields.length && (
            <p className="text-sm text-slate-600">
              Confirm this change to the record.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              className={secondaryClass}
              onClick={close}
            >
              Cancel
            </button>
            <button className={buttonClass} disabled={saving}>
              {saving ? "Saving…" : "Confirm"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
