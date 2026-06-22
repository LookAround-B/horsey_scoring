"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Users as UsersIcon, ChevronRight } from "lucide-react";
import { PaginationBar, PAGE_SIZE } from "@/components/PaginationBar";

type EventItem = {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  rider_count: number;
  participant_count: number;
  secretary_name: string | null;
  access_code: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-muted text-muted-foreground",
  active: "bg-highlight/20 text-highlight",
  completed: "bg-primary/10 text-primary",
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;

export function EventsListClient({ events, isAdmin }: { events: EventItem[]; isAdmin: boolean }) {
  const [page, setPage] = useState(0);

  if (events.length === 0) {
    return (
      <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl py-10 text-center">
        No events yet. Create one above.
      </div>
    );
  }

  const pageEvents = events.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="space-y-3">
        {pageEvents.map((e) => (
          <Link
            key={e.id}
            href={`/dashboard/admin/events/${e.id}`}
            className="flex items-center gap-3 sm:gap-4 bg-card border border-border rounded-xl p-3 sm:p-4 hover:border-foreground/20 hover:shadow-sm transition-all duration-300"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{e.name}</span>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[e.status] ?? ""}`}>
                  {e.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                {fmt(e.start_date) && (
                  <span>{fmt(e.start_date)}{fmt(e.end_date) ? ` – ${fmt(e.end_date)}` : ""}</span>
                )}
                {e.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {e.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <UsersIcon className="h-3 w-3" /> {e.rider_count} riders · {e.participant_count} officials
                </span>
                {isAdmin && e.secretary_name && <span>Secretary: {e.secretary_name}</span>}
              </div>
            </div>
            {e.access_code && (
              <span className="hidden sm:block text-xs font-mono px-2 py-1 rounded bg-muted text-muted-foreground shrink-0">
                {e.access_code}
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>
      <PaginationBar page={page} total={events.length} onPageChange={setPage} />
    </div>
  );
}
