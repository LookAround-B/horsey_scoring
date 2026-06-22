"use client";

import { useState } from "react";
import Link from "next/link";
import { PaginationBar, PAGE_SIZE } from "@/components/PaginationBar";

type PastEvent = {
  id: string;
  name: string;
  start_date: string | null;
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;

export function PastEventsClient({ events }: { events: PastEvent[] }) {
  const [page, setPage] = useState(0);
  const pageItems = events.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="space-y-2">
        {pageItems.map((ev) => (
          <div key={ev.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate text-muted-foreground">{ev.name}</div>
              <div className="text-xs text-muted-foreground/60">{fmt(ev.start_date)}</div>
            </div>
            <Link
              href={`/dashboard/events/${ev.id}`}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline shrink-0"
            >
              View →
            </Link>
          </div>
        ))}
      </div>
      <PaginationBar page={page} total={events.length} onPageChange={setPage} />
    </div>
  );
}
