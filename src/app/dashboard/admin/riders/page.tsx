import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { DUMMY_RIDERS } from "@/lib/dummy-data";
import { ArrowLeft, Users } from "lucide-react";
import { AdminRidersClient } from "./AdminRidersClient";

export const dynamic = "force-dynamic";

export default async function AdminRidersPage() {
  const sess = await auth();
  const user = sess?.user;
  if (!user || user.status !== "approved") redirect("/dashboard");
  if (user.role !== "super_admin") redirect("/dashboard");

  const riders = DUMMY_RIDERS;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Admin panel
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-6 w-6 text-muted-foreground" />
          <h1 className="font-display text-3xl tracking-tight">All Riders</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {riders.length} registered riders across all events
        </p>
      </div>

      {riders.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl py-12 text-center">
          <p className="text-sm text-muted-foreground">No riders registered yet.</p>
        </div>
      ) : (
        <AdminRidersClient riders={riders} />
      )}
    </div>
  );
}
