import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listEventsForParticipant, listEventsForSecretary, type EventSummary } from "@/lib/events";
import { CalendarRange, MapPin, KeyRound, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;

export default async function MyEventsPage() {
  const sess = await auth();
  const user = sess?.user;
  if (!user || user.status !== "approved") redirect("/dashboard");

  const joined = await listEventsForParticipant(user.id);
  const owned = user.role === "show_secretary" ? await listEventsForSecretary(user.id) : [];
  const seen = new Set<string>();
  const events: EventSummary[] = [...owned, ...joined].filter((e) =>
    seen.has(e.id) ? false : (seen.add(e.id), true)
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-3">
          <CalendarRange className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl tracking-tight">My events</h1>
        </div>
        <Link href="/dashboard/join" className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          <KeyRound className="h-3.5 w-3.5" /> Join with code
        </Link>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Events you&apos;ve joined or manage.</p>

      {events.length === 0 ? (
        <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl py-10 text-center">
          You haven&apos;t joined any events yet. Use a code to join one.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <Link key={e.id} href={`/dashboard/events/${e.id}`} className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-foreground/20 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{e.name}</span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-highlight/15 text-highlight">{e.status}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3">
                  {fmt(e.start_date) && <span>{fmt(e.start_date)}</span>}
                  {e.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
