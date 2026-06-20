import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TEST_CARDS } from "@/lib/dummy-data";
import { listEvents, listSheetsByEvent } from "@/lib/events";
import { listCustomSheetCards } from "@/lib/customSheets";
import { createEventAction, deleteEventAction, saveEventSheetsAction } from "./actions";
import { CalendarRange, Plus, Trash2, ChevronDown, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventsAdminPage() {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }

  const [events, sheetsByEvent, customCards] = await Promise.all([
    listEvents(),
    listSheetsByEvent(),
    listCustomSheetCards(),
  ]);
  const bySlug = new Map(TEST_CARDS.map((c) => [c.slug, c]));
  customCards.forEach((c) => bySlug.set(c.slug, c));
  const TEST_CARDS_ALL = [...bySlug.values()];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <CalendarRange className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl tracking-tight">Events</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Create event tabs (KSEC, KPL, …) and choose which scoring sheets appear under each. A sheet
        can belong to several events.
      </p>

      {/* Create event */}
      <form action={createEventAction} className="flex items-center gap-2 mb-8">
        <input
          name="name"
          required
          placeholder="New event name (e.g. KSEC)"
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Add event
        </button>
      </form>

      {events.length === 0 ? (
        <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl py-10 text-center">
          No events yet. Create one above.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const assigned = new Set(sheetsByEvent[ev.id] ?? []);
            return (
              <details key={ev.id} className="group bg-card border border-border rounded-xl overflow-hidden">
                <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none list-none">
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                  <span className="font-medium">{ev.name}</span>
                  <span className="text-xs text-muted-foreground">{assigned.size} sheets</span>
                </summary>

                <div className="border-t border-border px-4 py-4 space-y-4">
                  {/* Assign sheets */}
                  <form action={saveEventSheetsAction} className="space-y-3">
                    <input type="hidden" name="eventId" value={ev.id} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 max-h-80 overflow-y-auto pr-1">
                      {TEST_CARDS_ALL.map((t) => (
                        <div key={t.slug} className="flex items-center gap-2 text-sm py-0.5">
                          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              name="slug"
                              value={t.slug}
                              defaultChecked={assigned.has(t.slug)}
                              className="h-4 w-4 rounded border-border accent-primary shrink-0"
                            />
                            <span className="truncate">{t.category}</span>
                          </label>
                          <a
                            href={`/scoring/${t.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Preview sheet"
                            className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                    <button className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
                      Save sheets
                    </button>
                  </form>

                  {/* Delete event */}
                  <form action={deleteEventAction} className="pt-1 border-t border-border">
                    <input type="hidden" name="eventId" value={ev.id} />
                    <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors mt-3">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete event
                    </button>
                  </form>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
