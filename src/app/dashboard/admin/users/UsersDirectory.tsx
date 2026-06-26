"use client";

import { useMemo, useState } from "react";
import { Users, Search } from "lucide-react";
import { ROLE_LABELS, type UserRole, type ApprovalStatus } from "@/lib/roles";
import { PaginationBar, PAGE_SIZE } from "@/components/PaginationBar";
import { Input } from "@/components/ui/input";

type Row = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole | null;
  status: ApprovalStatus;
  image_url: string | null;
  phone: string | null;
  created_at: string;
};

const STATUS_STYLES: Record<ApprovalStatus, string> = {
  pending: "bg-highlight/15 text-highlight",
  approved: "bg-primary/15 text-primary",
  rejected: "bg-destructive/15 text-destructive",
};

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return <img src={image} alt={name} className="h-8 w-8 rounded-full object-cover" />;
  }
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-xs font-semibold">
      {initials}
    </div>
  );
}

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

export function UsersDirectory({ users }: { users: Row[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "judges" | UserRole | "pending">("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (filter === "pending" && u.status !== "pending") return false;
      else if (filter === "judges" && !(u.role === "dressage_judge" || u.role === "showjumping_judge")) return false;
      else if (filter !== "all" && filter !== "pending" && filter !== "judges" && u.role !== filter) return false;

      if (q) {
        const hay = `${u.name ?? ""} ${u.email ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [users, q, filter]);

  const chips: { id: typeof filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "judges", label: "Judges" },
    { id: "dressage_writer", label: "Dressage Writers" },
    { id: "show_secretary", label: "Secretaries" },
    { id: "rider", label: "Riders" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl tracking-tight">Users</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Everyone registered on the platform.</p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => { setPage(0); setQ(e.target.value); }}
            placeholder="Search name or email…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c.id}
              onClick={() => { setPage(0); setFilter(c.id); }}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                filter === c.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} of {users.length}</span>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead className="bg-muted text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Phone</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={u.name ?? u.email ?? "?"} image={u.image_url} />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{u.name ?? "Unnamed"}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{u.role ? ROLE_LABELS[u.role] : "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[u.status]}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{u.phone ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{fmtDate(u.created_at)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No users match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-3">
          <PaginationBar page={page} total={filtered.length} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
