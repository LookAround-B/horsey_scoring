"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { PaginationBar, PAGE_SIZE } from "@/components/PaginationBar";

type EventItem = {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;

export function MyEventsClient({ events }: { events: EventItem[] }) {
  const [page, setPage] = useState(0);

  if (events.length === 0) {
    return (
      <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl py-10 text-center">
        You haven&apos;t joined any events yet. Use a code to join one.
      </div>
    );
  }

  const pageItems = events.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="space-y-3">
        {pageItems.map((e) => (
          <Link
            key={e.id}
            href={`/dashboard/events/${e.id}`}
            className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-foreground/20 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{e.name}</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-highlight/15 text-highlight shrink-0">
                  {e.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3">
                {fmt(e.start_date) && <span>{fmt(e.start_date)}</span>}
                {e.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {e.location}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>
      <PaginationBar page={page} total={events.length} onPageChange={setPage} />
    </div>
  );
}
