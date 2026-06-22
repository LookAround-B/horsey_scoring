import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listUsers } from "@/lib/users";
import { ActionableList, ApprovedList } from "./ApprovalsClient";
import { UserCheck, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }

  const users = await listUsers();
  const actionable = users.filter((u) => u.status !== "approved");
  const approved = users.filter((u) => u.status === "approved");

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
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
        <ActionableList users={actionable} />
      )}

      {approved.length > 0 && (
        <>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mt-10 mb-3">
            Approved accounts ({approved.length})
          </h2>
          <ApprovedList users={approved} />
        </>
      )}
    </div>
  );
}
