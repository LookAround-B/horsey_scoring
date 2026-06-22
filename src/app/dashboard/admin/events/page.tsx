import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listAllEvents, listEventsForSecretary, listGuidelineTemplates, type EventSummary } from "@/lib/events";
import { listUsers } from "@/lib/users";
import { listCustomSheetCards } from "@/lib/customSheets";
import { TEST_CARDS } from "@/lib/dummy-data";
import { CreateEventForm } from "./CreateEventForm";
import { EventsListClient } from "./EventsListClient";
import { CalendarRange } from "lucide-react";

export const dynamic = "force-dynamic";

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
      <CreateEventForm
        isAdmin={isAdmin}
        secretaries={secretaries}
        allSheets={allSheets}
        templates={templates}
      />

      <EventsListClient events={events} isAdmin={isAdmin} />
    </div>
  );
}
