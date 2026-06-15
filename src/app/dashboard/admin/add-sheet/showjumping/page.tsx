import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Trophy, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AddShowJumpingPage() {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link
        href="/dashboard/admin/add-sheet"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-muted grid place-items-center mb-4">
          <Trophy className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="font-display text-2xl tracking-tight mb-2">Show jumping — coming soon</h1>
        <p className="text-sm text-muted-foreground">
          Show jumping is scored differently from dressage (jump faults, time penalties), so it needs
          its own sheet format. Send a reference sheet and this builder will be added next.
        </p>
      </div>
    </div>
  );
}
