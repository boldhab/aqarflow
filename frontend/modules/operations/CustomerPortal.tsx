"use client";
import { apiClient } from "@/shared/lib";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { buttonClass, inputClass, secondaryClass } from "./ResourceWorkspace";
import { RecordItem, value } from "./api";
async function portal<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await apiClient<{ data: T }>(`/portal${path}`, {
    method,
    skipAuthRedirect: true,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return response.data;
}
export function CustomerAuth({ register = false }: { register?: boolean }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError("");
    try {
      await portal(`/auth/${register ? "register" : "login"}`, "POST", body);
      window.location.href = "/portal/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Link href="/" className="text-sm font-semibold text-brand-700">
        ← AqarFlow
      </Link>
      <h1 className="mt-6 text-3xl font-bold">
        {register ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        Save your favorite properties and follow your inquiries.
      </p>
      <form
        onSubmit={submit}
        className="mt-8 space-y-5 rounded-2xl border bg-white p-6 shadow-sm"
      >
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        {register && (
          <>
            <label className="block space-y-2 text-sm">
              <span>Full name</span>
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={150}
                className={inputClass}
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span>Pakistani mobile number</span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+923001234567"
                required
                className={inputClass}
              />
            </label>
          </>
        )}
        <label className="block space-y-2 text-sm">
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span>Password</span>
          <input
            name="password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            minLength={10}
            maxLength={128}
            required
            className={inputClass}
          />
        </label>
        <button disabled={busy} className={`${buttonClass} w-full`}>
          {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
        </button>
        <p className="text-sm text-slate-600">
          {register ? "Already registered?" : "New here?"}{" "}
          <Link
            className="font-semibold text-brand-700"
            href={register ? "/portal/login" : "/register"}
          >
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </form>
    </main>
  );
}
let favoriteSnapshot: Promise<{ items: RecordItem[] }> | null = null;
function loadFavorites() {
  if (!favoriteSnapshot)
    favoriteSnapshot = portal<{ items: RecordItem[] }>("/favorites");
  return favoriteSnapshot;
}
export function FavoriteButton({ propertyId }: { propertyId: string }) {
  const [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    loadFavorites()
      .then((data) => {
        if (active)
          setSaved(data.items.some((f) => f.propertyId === propertyId));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [propertyId]);
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        aria-pressed={saved}
        disabled={busy}
        aria-label={saved ? "Remove from saved properties" : "Save property"}
        className={`${secondaryClass} ${saved ? "text-brand-700" : ""}`}
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          setBusy(true);
          setError("");
          try {
            await portal(
              `/favorites/${propertyId}`,
              saved ? "DELETE" : "POST",
              {},
            );
            setSaved((v) => !v);
            favoriteSnapshot = null;
            window.dispatchEvent(
              new CustomEvent("aqarflow:favorite", {
                detail: { propertyId, saved: !saved },
              }),
            );
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "Unable to save property",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {saved ? "♥ Saved" : "♡ Save"}
      </button>
      {error && (
        <span role="alert" className="mt-2 text-xs text-red-700">
          {error}{" "}
          <Link href="/portal/login" className="underline">
            Customer sign in
          </Link>
        </span>
      )}
    </span>
  );
}
export function PortalInquiry({ propertyId }: { propertyId: string }) {
  const [message, setMessage] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-4 space-y-3 rounded-xl border bg-white p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await portal("/inquiries", "POST", { propertyId, message });
          setMessage("");
          setStatus(
            "Your inquiry has been sent. Track it in your customer dashboard.",
          );
        } catch (e) {
          setStatus(e instanceof Error ? e.message : "Unable to send inquiry");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="font-semibold">Send an inquiry from your account</h2>
      <label className="block text-sm">
        Your message
        <textarea
          className={`${inputClass} mt-2`}
          required
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>
      <button className={buttonClass} disabled={busy}>
        {busy ? "Sending…" : "Send inquiry"}
      </button>
      {status && (
        <p role="status" className="text-sm">
          {status}
        </p>
      )}
      <Link href="/portal/dashboard" className="block text-sm text-brand-700">
        Customer dashboard →
      </Link>
    </form>
  );
}
export function CustomerDashboard() {
  const [data, setData] = useState<{ name: string } | null>(null),
    [favorites, setFavorites] = useState<RecordItem[]>([]),
    [inquiries, setInquiries] = useState<RecordItem[]>([]),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const [me, f, i] = await Promise.all([
        portal<{ name: string }>("/auth/me"),
        portal<{ items: RecordItem[] }>("/favorites"),
        portal<{ items: RecordItem[] }>("/my-inquiries"),
      ]);
      setData(me);
      setFavorites(f.items);
      setInquiries(i.items);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load account");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <Link
            href="/properties"
            className="text-sm font-semibold text-brand-700"
          >
            Browse properties →
          </Link>
          <h1 className="mt-4 text-3xl font-bold">
            {data ? `Hello, ${data.name}` : "Your customer account"}
          </h1>
        </div>
        {data && (
          <button
            className={secondaryClass}
            onClick={async () => {
              try {
                await portal("/auth/logout", "POST", {});
                window.location.href = "/portal/login";
              } catch {
                setError("Unable to sign out. Please try again.");
              }
            }}
          >
            Sign out
          </button>
        )}
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          {error}{" "}
          <Link className="font-semibold underline" href="/portal/login">
            Sign in
          </Link>
          <button onClick={load} className="ml-3 underline">
            Retry
          </button>
        </div>
      )}
      {data && (
        <>
          <section>
            <h2 className="mb-4 text-xl font-bold">Saved properties</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {!favorites.length && (
                <p className="text-sm text-slate-600">
                  Save a property to find it here later.
                </p>
              )}
              {favorites.map((f) => (
                <article
                  key={f.id}
                  className="space-y-4 rounded-2xl border bg-white p-5"
                >
                  <Link
                    className="font-semibold text-slate-900"
                    href={`/properties/${value(f, "property.id")}`}
                  >
                    {value(f, "property.title")}
                  </Link>
                  <p className="text-brand-700">
                    {value(f, "property.currency")} {value(f, "property.price")}
                  </p>
                  <FavoriteButton propertyId={value(f, "property.id")} />
                </article>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-bold">
              My inquiries & upcoming visits
            </h2>
            {!inquiries.length && (
              <p className="text-sm text-slate-600">
                Inquiries sent from your account appear here.
              </p>
            )}
            <div className="space-y-4">
              {inquiries.map((i) => (
                <article key={i.id} className="rounded-2xl border bg-white p-5">
                  <div className="flex flex-wrap justify-between gap-3">
                    <h3 className="font-semibold">
                      {value(i, "property.title")}
                    </h3>
                    <span className="text-sm font-semibold text-brand-700">
                      {value(i, "stage").replace(/_/g, " ")}
                    </span>
                  </div>
                  {(i.visits as RecordItem[])?.map((v) => (
                    <p key={v.id} className="mt-3 text-sm text-slate-600">
                      {value(v, "status")} ·{" "}
                      {new Date(String(v.scheduledAt)).toLocaleString("en-PK", {
                        timeZone: "Asia/Karachi",
                      })}{" "}
                      PKT · {value(v, "meetingPoint")}
                    </p>
                  ))}
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
