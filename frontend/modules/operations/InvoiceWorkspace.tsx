"use client";
import { Modal } from "@/shared/components/ui";
import { useAuth } from "@/shared/hooks";
import { FormEvent, useState } from "react";
import {
  buttonClass,
  DynamicFields,
  inputClass,
  ResourceWorkspace,
  secondaryClass,
} from "./ResourceWorkspace";
import { InvoiceActions } from "./Workspaces";
import { request } from "./api";
const fields = [
  { name: "contactId", label: "Customer", source: "/contacts" },
  { name: "dueDate", label: "Due date", type: "date" },
  {
    name: "taxRate",
    label: "Tax rate (%)",
    type: "number",
    min: 0,
    step: "0.01",
    required: false,
  },
];
export function InvoiceWorkspace() {
  const { role } = useAuth();
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0),
    [items, setItems] = useState([
      { description: "", quantity: 1, unitPrice: 0 },
    ]);
  const close = () => {
    if (!busy && window.confirm("Discard this invoice draft?")) setOpen(false);
  };
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await request("/finance/invoices", "POST", {
        contactId: fd.get("contactId"),
        dueDate: fd.get("dueDate"),
        taxRate: Number(fd.get("taxRate") || 0),
        items,
      });
      setOpen(false);
      setVersion((v) => v + 1);
      setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create invoice");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="flex justify-end px-6 pt-6">
        {role === "ADMIN" && (
          <button className={buttonClass} onClick={() => setOpen(true)}>
            Create invoice
          </button>
        )}
      </div>
      <ResourceWorkspace
        key={version}
        title="Invoices"
        statusOptions={["ISSUED", "DUE", "PARTIALLY_PAID", "PAID", "CANCELLED"]}
        description="Issue sequential invoices, collect partial payments, and download printable documents."
        endpoint="/finance/invoices"
        columns={[
          { key: "invoiceNumber", label: "Invoice" },
          { key: "contact.name", label: "Customer" },
          { key: "totalAmount", label: "Total" },
          { key: "status", label: "Status" },
        ]}
        actions={(row, refresh) => (
          <InvoiceActions row={row} refresh={refresh} />
        )}
      />
      <Modal isOpen={open} onClose={close} title="Create invoice" size="xl">
        <form onSubmit={submit} className="space-y-5">
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <DynamicFields fields={fields} />
          </div>
          <fieldset className="space-y-3">
            <legend className="mb-3 font-semibold">Line items</legend>
            {items.map((item, i) => (
              <div
                key={i}
                className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[2fr_1fr_1fr_auto]"
              >
                <label className="text-xs">
                  Description
                  <input
                    className={inputClass}
                    required
                    value={item.description}
                    onChange={(e) =>
                      setItems((a) =>
                        a.map((v, n) =>
                          n === i ? { ...v, description: e.target.value } : v,
                        ),
                      )
                    }
                  />
                </label>
                <label className="text-xs">
                  Quantity
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={item.quantity}
                    onChange={(e) =>
                      setItems((a) =>
                        a.map((v, n) =>
                          n === i
                            ? { ...v, quantity: Number(e.target.value) }
                            : v,
                        ),
                      )
                    }
                  />
                </label>
                <label className="text-xs">
                  Unit price
                  <input
                    className={inputClass}
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={item.unitPrice}
                    onChange={(e) =>
                      setItems((a) =>
                        a.map((v, n) =>
                          n === i
                            ? { ...v, unitPrice: Number(e.target.value) }
                            : v,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  aria-label={`Remove line ${i + 1}`}
                  disabled={items.length === 1}
                  className={secondaryClass}
                  onClick={() => setItems((a) => a.filter((_, n) => n !== i))}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className={secondaryClass}
              onClick={() =>
                setItems((a) => [
                  ...a,
                  { description: "", quantity: 1, unitPrice: 0 },
                ])
              }
            >
              Add line
            </button>
          </fieldset>
          <p className="font-semibold text-slate-800">
            Subtotal:{" "}
            {items
              .reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
              .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className={secondaryClass}
              disabled={busy}
              onClick={close}
            >
              Cancel
            </button>
            <button className={buttonClass} disabled={busy}>
              {busy ? "Creating…" : "Issue invoice"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
