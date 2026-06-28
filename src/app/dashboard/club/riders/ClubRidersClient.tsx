"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PaginationBar, PAGE_SIZE } from "@/components/PaginationBar";

type RiderRow = {
  id: string;
  name: string;
  competitor_no: string | null;
  nf: string | null;
  horse: string | null;
  eventId: string;
  eventName: string;
};

export function ClubRidersClient({ rows }: { rows: RiderRow[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const filtered = rows.filter(
    (r) =>
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      (r.horse ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (r.nf ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (r.competitor_no ?? "").includes(q) ||
      r.eventName.toLowerCase().includes(q.toLowerCase())
  );

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, horse, NF or event..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} of {rows.length}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Rider</th>
              <th className="px-4 py-3 font-medium">No.</th>
              <th className="px-4 py-3 font-medium">NF</th>
              <th className="px-4 py-3 font-medium">Horse</th>
              <th className="px-4 py-3 font-medium">Event</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.competitor_no ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.nf ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.horse ?? "—"}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/club/${r.eventId}`} className="text-primary hover:underline">
                    {r.eventName}
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No riders match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="px-4 pb-3">
          <PaginationBar page={page} total={filtered.length} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
