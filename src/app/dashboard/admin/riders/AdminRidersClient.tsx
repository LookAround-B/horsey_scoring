"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PaginationBar, PAGE_SIZE } from "@/components/PaginationBar";

type Rider = {
  id: string;
  name: string;
  club: string;
  competitorNo: string;
  horse: string;
  category: string;
};

export function AdminRidersClient({ riders }: { riders: Rider[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const filtered = riders.filter(
    (r) =>
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      (r.club ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (r.horse ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (r.competitorNo ?? "").includes(q)
  );

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, club or horse..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} of {riders.length}</span>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Club</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Horse</th>
                <th className="text-left px-5 py-3">Competitor No.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map((rider) => (
                <tr key={rider.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3 font-medium">{rider.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{rider.club || "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{rider.category || "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{rider.horse || "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{rider.competitorNo || "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No riders match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-3">
          <PaginationBar page={page} total={filtered.length} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
