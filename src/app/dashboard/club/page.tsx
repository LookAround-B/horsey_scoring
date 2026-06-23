import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { listAllEvents } from "@/lib/events";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-primary/15 text-primary",
  upcoming: "bg-muted text-muted-foreground",
  completed: "bg-secondary text-secondary-foreground",
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";

export default async function ClubEventsPage() {
  const sess = await auth();
  const user = sess?.user;
  if (!user || user.status !== "approved") redirect("/dashboard");
  if (user.role !== "club" && user.role !== "super_admin") redirect("/dashboard");

  const events = await listAllEvents();

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <Calendar className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl tracking-tight">All events</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Every event on the platform. Open one to see its riders and scores.
      </p>

      {events.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl py-14 text-center">
          <p className="text-sm text-muted-foreground">No events yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => (
            <Link
              key={ev.id}
              href={`/dashboard/club/${ev.id}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-foreground/20 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">{ev.name}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[ev.status] ?? ""}`}>
                    {ev.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(ev.start_date)}</span>
                  {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>}
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{ev.rider_count} riders</span>
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
