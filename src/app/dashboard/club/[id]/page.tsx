import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getEventById } from "@/lib/events";
import { listScoresForEvent } from "@/lib/scores";
import { TEST_NAMES } from "@/lib/dummy-data";
import { ArrowLeft, Calendar, MapPin, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  verified: "bg-primary/15 text-primary",
  submitted: "bg-secondary text-secondary-foreground",
  draft: "bg-muted text-muted-foreground",
};

const testName = (slug: string) => TEST_NAMES[slug] ?? slug;
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";

export default async function ClubEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const sess = await auth();
  const user = sess?.user;
  if (!user || user.status !== "approved") redirect("/dashboard");
  if (user.role !== "club" && user.role !== "super_admin") redirect("/dashboard");

  const { id } = await params;
  const ev = await getEventById(id);
  if (!ev) notFound();

  const scores = await listScoresForEvent(id);
  const byRider = new Map<string, typeof scores>();
  for (const s of scores) {
    if (!s.rider_id) continue;
    const list = byRider.get(s.rider_id) ?? [];
    list.push(s);
    byRider.set(s.rider_id, list);
  }

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <Link href="/dashboard/club" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> All events
      </Link>

      <h1 className="font-display text-2xl tracking-tight">{ev.name}</h1>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 mb-8 flex-wrap">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(ev.start_date)}</span>
        {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</span>}
        <span className="uppercase tracking-wider">{ev.status}</span>
      </div>

      <h2 className="text-sm font-medium mb-3">Riders &amp; scores</h2>
      {ev.riders.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl py-12 text-center">
          <p className="text-sm text-muted-foreground">No riders added to this event.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ev.riders.map((r) => {
            const rScores = byRider.get(r.id) ?? [];
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {[r.competitor_no && `#${r.competitor_no}`, r.nf, r.horse].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                </div>
                {rScores.length > 0 && (
                  <div className="mt-3 border-t border-border pt-3 space-y-1.5">
                    {rScores.map((s, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground truncate">{testName(s.test_slug)}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {s.result != null && (
                            <span className="flex items-center gap-1 font-medium">
                              <Trophy className="h-3 w-3 text-primary" />{s.result}
                            </span>
                          )}
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[s.status] ?? ""}`}>
                            {s.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
