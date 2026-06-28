import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listAllEvents, getEventById } from "@/lib/events";
import { Users } from "lucide-react";
import { ClubRidersClient } from "./ClubRidersClient";

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
    .flatMap((e) => e.riders.map((r) => ({
      id: r.id,
      name: r.name,
      competitor_no: r.competitor_no,
      nf: r.nf,
      horse: r.horse,
      eventId: e.id,
      eventName: e.name,
    })));

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
        <ClubRidersClient rows={rows} />
      )}
    </div>
  );
}
