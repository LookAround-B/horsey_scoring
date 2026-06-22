"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { PaginationBar, PAGE_SIZE } from "@/components/PaginationBar";
import { approveAction, rejectAction } from "./actions";
import { ASSIGNABLE_ROLES, ROLE_LABELS, type ApprovalStatus } from "@/lib/roles";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  status: ApprovalStatus;
};

function StatusBadge({ s }: { s: ApprovalStatus }) {
  const styles: Record<ApprovalStatus, string> = {
    pending: "bg-highlight/15 text-highlight",
    approved: "bg-primary/15 text-primary",
    rejected: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${styles[s]}`}>
      {s}
    </span>
  );
}

export function ActionableList({ users }: { users: UserRow[] }) {
  const [page, setPage] = useState(0);
  const pageItems = users.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="space-y-3">
        {pageItems.map((u) => (
          <form
            key={u.id}
            className="flex flex-col gap-3 bg-card border border-border rounded-xl p-4"
          >
            <input type="hidden" name="userId" value={u.id} />
            <div className="flex items-center gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{u.name ?? "Unnamed user"}</div>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
              </div>
              <StatusBadge s={u.status} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                name="role"
                defaultValue={u.role ?? ""}
                required
                className="flex-1 min-w-[140px] bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="" disabled>Assign role…</option>
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  formAction={approveAction}
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button
                  formAction={rejectAction}
                  className="inline-flex items-center gap-1.5 border border-border rounded-lg px-3 py-2 text-sm font-medium hover:border-destructive hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          </form>
        ))}
      </div>
      <PaginationBar page={page} total={users.length} onPageChange={setPage} />
    </div>
  );
}

export function ApprovedList({ users }: { users: UserRow[] }) {
  const [page, setPage] = useState(0);
  const pageItems = users.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="divide-y divide-border">
        {pageItems.map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{u.name ?? "Unnamed user"}</div>
              <div className="text-xs text-muted-foreground truncate">{u.email}</div>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {u.role ? ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] : "—"}
            </span>
            <StatusBadge s={u.status} />
          </div>
        ))}
      </div>
      <PaginationBar page={page} total={users.length} onPageChange={setPage} />
    </div>
  );
}
