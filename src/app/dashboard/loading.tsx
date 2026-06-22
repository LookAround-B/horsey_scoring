export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">

      {/* Page title */}
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-lg bg-muted" />
        <div className="h-4 w-80 rounded bg-muted/60" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-4 w-4 rounded bg-muted" />
            </div>
            <div className="h-9 w-16 rounded-lg bg-muted" />
            <div className="h-3 w-24 rounded bg-muted/60" />
          </div>
        ))}
      </div>

      {/* Content card with list rows */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="h-8 w-24 rounded-lg bg-muted" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 rounded bg-muted" style={{ width: `${45 + (i % 3) * 15}%` }} />
                <div className="h-3 rounded bg-muted/60" style={{ width: `${30 + (i % 4) * 10}%` }} />
              </div>
              <div className="h-5 w-16 rounded-full bg-muted shrink-0" />
              <div className="h-4 w-4 rounded bg-muted/60 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Second content card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="h-5 w-40 rounded bg-muted" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-4">
              <div className="h-4 w-4 rounded bg-muted/60 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 rounded bg-muted" style={{ width: `${55 + (i % 2) * 20}%` }} />
                <div className="h-3 rounded bg-muted/60" style={{ width: `${35 + (i % 3) * 12}%` }} />
              </div>
              <div className="h-8 w-20 rounded-lg bg-muted shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
