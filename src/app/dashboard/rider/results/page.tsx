import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Trophy, CalendarRange } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RiderResultsPage() {
  const sess = await auth();
  const user = sess?.user;
  if (!user || user.status !== "approved") redirect("/dashboard");
  if (user.role !== "rider") redirect("/dashboard");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <Trophy className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl tracking-tight">My results</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Your verified scores from events appear here once submitted by the show secretary.
      </p>

      <div className="bg-card border border-dashed border-border rounded-xl py-14 text-center space-y-3">
        <Trophy className="h-8 w-8 text-muted-foreground/40 mx-auto" />
        <p className="text-sm font-medium">No results yet</p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Once a judge submits and the show secretary verifies your scores, they will appear here.
        </p>
        <Link
          href="/dashboard/events"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-2"
        >
          <CalendarRange className="h-3.5 w-3.5" />
          View my events
        </Link>
      </div>
    </div>
  );
}
