import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listAllEvents, listEventsForSecretary, listGuidelineTemplates, type EventSummary } from "@/lib/events";
import { listUsers } from "@/lib/users";
import { listCustomSheetCards } from "@/lib/customSheets";
import { TEST_CARDS } from "@/lib/dummy-data";
import { createFullEventAction } from "./actions";
import { GuidelinesField } from "./GuidelinesField";
import { CalendarRange, Plus, MapPin, Users as UsersIcon, ChevronRight, ChevronDown } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-muted text-muted-foreground",
  active: "bg-highlight/20 text-highlight",
  completed: "bg-primary/10 text-primary",
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;

export default async function EventsAdminPage() {
  const sess = await auth();
  const user = sess?.user;
  if (!user || user.status !== "approved") redirect("/dashboard");
  const isAdmin = user.role === "super_admin";
  if (!isAdmin && user.role !== "show_secretary") redirect("/dashboard");

  const events: EventSummary[] = isAdmin
    ? await listAllEvents()
    : await listEventsForSecretary(user.id);

  // Super admin can assign any approved secretary; otherwise the event is owned by self.
  const secretaries = isAdmin
    ? (await listUsers()).filter((u) => u.status === "approved" && u.role === "show_secretary")
    : [];

  // All sheets selectable at creation (built-in + custom, deduped).
  const customCards = await listCustomSheetCards();
  const bySlug = new Map(TEST_CARDS.map((c) => [c.slug, c]));
  customCards.forEach((c) => bySlug.set(c.slug, c));
  const allSheets = [...bySlug.values()];
  const templates = await listGuidelineTemplates();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <CalendarRange className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl tracking-tight">Events</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {isAdmin ? "All shows on the platform." : "Shows you manage."}
      </p>

      {/* Create */}
      <form
        action={createFullEventAction}
        className="bg-card border border-border rounded-xl p-4 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <div className="sm:col-span-2">
          <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Event name</label>
          <input name="name" required placeholder="e.g. KSEC Spring Classic 2026"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Venue</label>
          <input name="location" placeholder="Arena / city"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        {isAdmin && (
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Secretary</label>
            <select name="secretaryId"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">— Me (admin) —</option>
              {secretaries.map((s) => (
                <option key={s.id} value={s.id}>{s.name ?? s.email}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Start date</label>
          <input type="date" name="startDate"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">End date</label>
          <input type="date" name="endDate"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Start time</label>
          <input type="time" name="startTime"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">End time</label>
          <input type="time" name="endTime"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
        </div>
        <div className="sm:col-span-2">
          <GuidelinesField templates={templates} />
        </div>
        <details className="sm:col-span-2 group border border-border rounded-lg">
          <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none list-none text-sm">
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
            Scoring sheets <span className="text-muted-foreground">(optional — you can also add them later)</span>
          </summary>
          <div className="border-t border-border p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 max-h-64 overflow-y-auto">
            {allSheets.map((t) => (
              <label key={t.slug} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
                <input type="checkbox" name="slug" value={t.slug} className="h-4 w-4 rounded border-border accent-primary" />
                <span className="truncate">{t.category}</span>
              </label>
            ))}
          </div>
        </details>
        <div className="sm:col-span-2">
          <button className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Create event
          </button>
          <p className="text-[11px] text-muted-foreground mt-2">
            After creating, you&apos;ll set up riders, judges, examiners, the access code and visibility.
          </p>
        </div>
      </form>

      {events.length === 0 ? (
        <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl py-10 text-center">
          No events yet. Create one above.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <Link
              key={e.id}
              href={`/dashboard/admin/events/${e.id}`}
              className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-foreground/20 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{e.name}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[e.status] ?? ""}`}>
                    {e.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  {fmt(e.start_date) && <span>{fmt(e.start_date)}{fmt(e.end_date) ? ` – ${fmt(e.end_date)}` : ""}</span>}
                  {e.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>}
                  <span className="flex items-center gap-1"><UsersIcon className="h-3 w-3" /> {e.rider_count} riders · {e.participant_count} officials</span>
                  {isAdmin && e.secretary_name && <span>Secretary: {e.secretary_name}</span>}
                </div>
              </div>
              {e.access_code && (
                <span className="hidden sm:block text-xs font-mono px-2 py-1 rounded bg-muted text-muted-foreground">
                  {e.access_code}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
