import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listEventsForParticipant, listEventsForSecretary, type EventSummary } from "@/lib/events";
import { MyEventsClient } from "./MyEventsClient";
import { CalendarRange, KeyRound } from "lucide-react";

export const dynamic = "force-dynamic";

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

      <MyEventsClient events={events} />
    </div>
  );
}
