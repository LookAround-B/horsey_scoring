import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { listAllEvents, getEventById } from "@/lib/events";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClubRidersPage() {
  const sess = await auth();
  const user = sess?.user;
  if (!user || user.status !== "approved") redirect("/dashboard");
  if (user.role !== "club" && user.role !== "super_admin") redirect("/dashboard");

  const events = await listAllEvents();
  const fulls = await Promise.all(events.map((e) => getEventById(e.id)));
  const rows = fulls
    .filter((e): e is NonNullable<typeof e> => e != null)
    .flatMap((e) => e.riders.map((r) => ({ rider: r, eventId: e.id, eventName: e.name })));

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl tracking-tight">All riders</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Every rider entered across all events ({rows.length}).
      </p>

      {rows.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl py-14 text-center">
          <p className="text-sm text-muted-foreground">No riders yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Rider</th>
                <th className="px-4 py-3 font-medium">No.</th>
                <th className="px-4 py-3 font-medium">NF</th>
                <th className="px-4 py-3 font-medium">Horse</th>
                <th className="px-4 py-3 font-medium">Event</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ rider, eventId, eventName }) => (
                <tr key={rider.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{rider.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{rider.competitor_no ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{rider.nf ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{rider.horse ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/club/${eventId}`} className="text-primary hover:underline">
                      {eventName}
                    </Link>
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
