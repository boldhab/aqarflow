"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div
      role="alert"
      className="max-w-xl mx-auto my-16 p-8 rounded-2xl border bg-white text-center space-y-4"
    >
      <h1 className="text-2xl font-bold">We couldn’t load this page</h1>
      <p className="text-slate-600">
        The service may be temporarily unavailable. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-5 py-3 rounded-xl bg-brand-600 text-white"
      >
        Try again
      </button>
      <Link className="block text-brand-700 underline" href="/">
        Return to Home
      </Link>
    </div>
  );
}
