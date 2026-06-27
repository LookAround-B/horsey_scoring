import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getEventById, listSheetsByEvent, listSheetRiders, listGuidelineTemplates } from "@/lib/events";
import { listUsers } from "@/lib/users";
import { listCustomSheetCards } from "@/lib/customSheets";
import { BulkRiderImport } from "../BulkRiderImport";
import { DetailsForm } from "../DetailsForm";
import { PermissionsForm } from "../PermissionsForm";
import { TimerConfigForm } from "../TimerConfigForm";
import { SaveSheetsForm } from "../SaveSheetsForm";
import { SheetRidersForm } from "../SheetRidersForm";
import { RidersListClient } from "./RidersListClient";
import { OfficialsListClient } from "./OfficialsListClient";
import { AddOfficialForm } from "./AddOfficialForm";
import { TEST_CARDS } from "@/lib/dummy-data";
import { type UserRole } from "@/lib/roles";
import {
  regenerateCodeAction,
  addRiderAction,
  deleteEventAction,
} from "../actions";
import { ArrowLeft, KeyRound, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

const OFFICIAL_ROLES: UserRole[] = [
  "dressage_judge",
  "showjumping_judge",
  "dressage_writer",
  "showjumping_writer",
];

const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const sess = await auth();
  const user = sess?.user;
  if (!user || user.status !== "approved") redirect("/dashboard");

  const { id } = await params;
  const ev = await getEventById(id);
  if (!ev) notFound();

  const isAdmin = user.role === "super_admin";
  const isOwner = ev.secretary_id === user.id;
  if (!isAdmin && !isOwner) redirect("/dashboard");

  const [allUsers, customCards, sheetsByEvent, sheetRiders, templates] = await Promise.all([
    listUsers(),
    listCustomSheetCards(),
    listSheetsByEvent(),
    listSheetRiders(id),
    listGuidelineTemplates(),
  ]);
  const assignedSlugs = new Set(sheetsByEvent[id] ?? []);
  const bySlug = new Map(TEST_CARDS.map((c) => [c.slug, c]));
  customCards.forEach((c) => bySlug.set(c.slug, c));
  const sheets = [...bySlug.values()];

  const participantUserIds = new Set(ev.participants.map((p) => p.user_id));
  const invitable = allUsers.filter((u) => u.status === "approved" && !participantUserIds.has(u.id));
  const vis = ev.visibility ?? {};

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="bg-card border border-border rounded-xl p-5">
      <h2 className="font-display text-base mb-4">{title}</h2>
      {children}
    </section>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3">
        <a href="/dashboard/admin/events" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All events
        </a>
        <span className="text-xs text-muted-foreground">Created {fmtDateTime(ev.created_at)}</span>
      </div>

      <div>
        <h1 className="font-display text-3xl tracking-tight">{ev.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {ev.location || "No location"} · {ev.status}
          {isAdmin && ev.secretary_name ? ` · Secretary: ${ev.secretary_name}` : ""}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Set up the event below — add riders, invite judges/writers, choose scoring sheets,
          and share the access code. Add as many as you need.
        </p>
      </div>

      {/* Access code */}
      <Section title="Event access code">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-lg tracking-widest">{ev.access_code}</span>
          </div>
          <form action={regenerateCodeAction}>
            <input type="hidden" name="eventId" value={id} />
            <button className="text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
              Regenerate
            </button>
          </form>
          <p className="text-xs text-muted-foreground">
            Judges &amp; writers enter this code at <span className="font-mono">/dashboard/join</span> to access the event.
          </p>
        </div>
      </Section>

      {/* Meta */}
      <Section title="Details">
        <DetailsForm eventId={id} ev={ev} templates={templates} />
      </Section>

      {/* Permissions */}
      <Section title="Permissions — what officials can see">
        <p className="text-xs text-muted-foreground mb-3">
          Toggle which sections are visible to judges and writers on the event dashboard.
        </p>
        <PermissionsForm eventId={id} vis={vis} />
      </Section>

      {/* Timer config */}
      <Section title="Timer — default time limits for scoring">
        <p className="text-xs text-muted-foreground mb-3">
          Set the default time allowed (in seconds) for each discipline. Judges see this pre-filled in their scoring timer.
        </p>
        <TimerConfigForm eventId={id} config={ev.timer_config ?? {}} />
      </Section>

      {/* Riders */}
      <Section title={`Riders (${ev.riders.length})`}>
        <BulkRiderImport eventId={id} />
        <form action={addRiderAction} className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          <input type="hidden" name="eventId" value={id} />
          <Input name="name" required placeholder="Rider name" className="col-span-2 sm:col-span-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          <Input name="competitorNo" placeholder="No." className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          <Input name="nf" placeholder="NF" className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          <Input name="horse" placeholder="Horse" className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          <Input name="horseNo" placeholder="Horse No." className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          <Input name="imageUrl" placeholder="Image URL (optional)" className="col-span-2 sm:col-span-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          <div className="col-span-2 sm:col-span-3">
            <button className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"><Plus className="h-3.5 w-3.5" /> Add rider</button>
          </div>
        </form>
        <RidersListClient riders={ev.riders} eventId={id} />
      </Section>

      {/* Officials / participants */}
      <Section title={`Officials (${ev.participants.length})`}>
        <AddOfficialForm eventId={id} invitable={invitable} roles={OFFICIAL_ROLES} />
        <OfficialsListClient officials={ev.participants} eventId={id} />
      </Section>

      {/* Sheets */}
      <Section title="Scoring sheets in this event">
        <SaveSheetsForm eventId={id} sheets={sheets} assignedSlugs={assignedSlugs} />
        {assignedSlugs.size > 0 && (
          <div className="mt-5 pt-4 border-t border-border space-y-2">
            <p className="text-xs text-muted-foreground">
              Choose which riders participate in each sheet. A rider can be on multiple sheets.
            </p>
            {sheets
              .filter((t) => assignedSlugs.has(t.slug))
              .map((t) => (
                <div key={t.slug} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{t.category}</span>
                  <SheetRidersForm
                    eventId={id}
                    testSlug={t.slug}
                    label={t.category}
                    riders={ev.riders}
                    selectedIds={new Set(sheetRiders[t.slug] ?? [])}
                  />
                </div>
              ))}
          </div>
        )}
      </Section>

      {/* Danger */}
      <form action={deleteEventAction} className="pt-2">
        <input type="hidden" name="eventId" value={id} />
        <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="h-3.5 w-3.5" /> Delete event
        </button>
      </form>
    </div>
  );
}
