/**
 * PageLoader — full-page branded loading spinner.
 * Used by Next.js loading.tsx files for route-level Suspense boundaries.
 */
export default function PageLoader() {
  return (
    <div
      className="min-h-[60vh] flex flex-col items-center justify-center gap-5"
      aria-label="Loading…"
      role="status"
    >
      {/* Spinning circular logo */}
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-green-200" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-600 animate-spin" />
        {/* Circular logo in centre */}
        <img
          src="/circular-logo.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-1.5 w-[calc(100%-12px)] h-[calc(100%-12px)] rounded-full object-contain"
        />
      </div>

      <p className="text-sm font-medium text-gray-400 tracking-wide">Loading…</p>
    </div>
  );
}
