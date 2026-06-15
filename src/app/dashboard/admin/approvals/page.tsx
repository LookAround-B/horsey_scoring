import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listUsers } from "@/lib/users";
import { ASSIGNABLE_ROLES, ROLE_LABELS, type ApprovalStatus } from "@/lib/roles";
import { approveAction, rejectAction } from "./actions";
import { Check, X, UserCheck, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

function StatusBadge({ s }: { s: ApprovalStatus }) {
  const styles: Record<ApprovalStatus, string> = {
    pending: "bg-highlight/15 text-highlight",
    approved: "bg-primary/15 text-primary",
    rejected: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[s]}`}>
      {s}
    </span>
  );
}

export default async function ApprovalsPage() {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }

  const users = await listUsers();
  const actionable = users.filter((u) => u.status !== "approved");
  const approved = users.filter((u) => u.status === "approved");

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <UserCheck className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl tracking-tight">User approvals</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Review accounts that signed in with Google, assign a role, and grant access.
      </p>

      <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Needs review {actionable.length > 0 && `(${actionable.length})`}
      </h2>

      {actionable.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground border border-dashed border-border rounded-xl">
          <Inbox className="h-6 w-6" />
          <span className="text-sm">Nothing waiting for review.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {actionable.map((u) => (
            <form
              key={u.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 bg-card border border-border rounded-xl p-4"
            >
              <input type="hidden" name="userId" value={u.id} />
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{u.name ?? "Unnamed user"}</div>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge s={u.status} />
                <select
                  name="role"
                  defaultValue={u.role ?? ""}
                  required
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="" disabled>
                    Assign role…
                  </option>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>

                <button
                  formAction={approveAction}
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </button>
                <button
                  formAction={rejectAction}
                  className="inline-flex items-center gap-1.5 border border-border rounded-lg px-3 py-2 text-sm font-medium hover:border-destructive hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </form>
          ))}
        </div>
      )}

      {approved.length > 0 && (
        <>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mt-10 mb-3">
            Approved accounts
          </h2>
          <div className="border border-border rounded-xl overflow-hidden">
            {approved.map((u, i) => (
              <div
                key={u.id}
                className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{u.name ?? "Unnamed user"}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {u.role ? ROLE_LABELS[u.role] : "—"}
                </span>
                <StatusBadge s={u.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
