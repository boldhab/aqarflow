"use client";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RecordItem, request, value } from "./api";
export function NotificationBell() {
  const [open, setOpen] = useState(false),
    [items, setItems] = useState<RecordItem[]>([]),
    [unread, setUnread] = useState(0),
    [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    try {
      const data = await request<{ items: RecordItem[]; unread: number }>(
        "/notifications?limit=10",
      );
      setItems(data.items);
      setUnread(data.unread);
      setError("");
    } catch {
      setError("Notifications unavailable");
    }
  }, []);
  useEffect(() => {
    load();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 30000);
    return () => clearInterval(interval);
  }, [load]);
  useEffect(() => {
    function close(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl p-3 text-slate-700 hover:bg-slate-100"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute right-0 top-0 rounded-full bg-brand-700 px-1.5 text-xs text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <section
          aria-label="Notifications"
          className="absolute right-0 top-full z-40 max-h-96 w-80 max-w-[90vw] overflow-y-auto rounded-2xl border bg-white p-4 shadow-xl"
        >
          <h2 className="mb-3 font-bold">Notifications</h2>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          {!items.length && !error && (
            <p className="text-sm text-slate-600">You’re all caught up.</p>
          )}
          {items.map((n) => (
            <article
              key={n.id}
              className={`border-t py-3 ${n.readAt ? "" : "bg-brand-50/50"}`}
            >
              <p className="text-sm font-semibold">{value(n, "title")}</p>
              <p className="mt-1 text-xs text-slate-600">{value(n, "body")}</p>
              <div className="mt-2 flex gap-3">
                {typeof n.linkUrl === "string" &&
                  n.linkUrl.startsWith("/") &&
                  !n.linkUrl.startsWith("//") && (
                    <Link
                      className="text-xs font-semibold text-brand-700"
                      href={n.linkUrl}
                      onClick={() => setOpen(false)}
                    >
                      Open
                    </Link>
                  )}
                {!n.readAt && (
                  <button
                    className="text-xs font-semibold text-brand-700"
                    onClick={async () => {
                      try {
                        await request(
                          `/notifications/${n.id}/read`,
                          "PATCH",
                          {},
                        );
                        await load();
                      } catch {
                        setError("Unable to mark notification as read");
                      }
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
