import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { listAllEvents, getEventById } from "@/lib/events";
import { listScoresForEvent } from "@/lib/scores";
import { TEST_NAMES } from "@/lib/dummy-data";
import { Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  verified: "bg-primary/15 text-primary",
  submitted: "bg-secondary text-secondary-foreground",
  draft: "bg-muted text-muted-foreground",
};

const testName = (slug: string) => TEST_NAMES[slug] ?? slug;

export default async function ClubScoresPage() {
  const sess = await auth();
  const user = sess?.user;
  if (!user || user.status !== "approved") redirect("/dashboard");
  if (user.role !== "club" && user.role !== "super_admin") redirect("/dashboard");

  const events = await listAllEvents();
  const fulls = await Promise.all(events.map((e) => getEventById(e.id)));
  const scoreLists = await Promise.all(events.map((e) => listScoresForEvent(e.id)));

  const rows = events.flatMap((e, i) => {
    const full = fulls[i];
    const riderName = new Map((full?.riders ?? []).map((r) => [r.id, r.name]));
    return scoreLists[i].map((s) => ({
      eventId: e.id,
      eventName: e.name,
      rider: s.rider_id ? riderName.get(s.rider_id) ?? "—" : "—",
      test: testName(s.test_slug),
      result: s.result,
      status: s.status,
      updated_at: s.updated_at,
    }));
  });
  rows.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <Trophy className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl tracking-tight">All scores</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Every recorded score across all events ({rows.length}).
      </p>

      {rows.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl py-14 text-center">
          <p className="text-sm text-muted-foreground">No scores recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Rider</th>
                <th className="px-4 py-3 font-medium">Test</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Result</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{r.rider}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.test}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/club/${r.eventId}`} className="text-primary hover:underline">
                      {r.eventName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">{r.result ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status] ?? ""}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
