export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="max-w-7xl mx-auto p-8 space-y-6"
    >
      <span className="sr-only">Loading page…</span>
      <div className="h-8 w-56 rounded-xl bg-slate-200 animate-pulse" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-80 bg-slate-100 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
