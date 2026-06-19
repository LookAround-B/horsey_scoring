import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getEventById, listSheetsByEvent } from "@/lib/events";
import { listUsers } from "@/lib/users";
import { listCustomSheetCards } from "@/lib/customSheets";
import { TEST_CARDS } from "@/lib/dummy-data";
import { ROLE_LABELS, type UserRole } from "@/lib/roles";
import {
  updateEventMetaAction,
  setVisibilityAction,
  regenerateCodeAction,
  addRiderAction,
  deleteRiderAction,
  addParticipantAction,
  removeParticipantAction,
  saveEventSheetsAction,
  deleteEventAction,
} from "../actions";
import { ArrowLeft, KeyRound, Trash2, Plus, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

const OFFICIAL_ROLES: UserRole[] = [
  "dressage_judge",
  "showjumping_judge",
  "dressage_writer",
  "showjumping_writer",
  "examiner",
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

  const [allUsers, customCards, sheetsByEvent] = await Promise.all([
    listUsers(),
    listCustomSheetCards(),
    listSheetsByEvent(),
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
        <form action={updateEventMetaAction} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="hidden" name="eventId" value={id} />
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Name</label>
            <input name="name" defaultValue={ev.name} required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Location</label>
            <input name="location" defaultValue={ev.location ?? ""} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Status</label>
            <select name="status" defaultValue={ev.status} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Start date</label>
            <input type="date" name="startDate" defaultValue={ev.start_date ?? ""} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">End date</label>
            <input type="date" name="endDate" defaultValue={ev.end_date ?? ""} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div className="sm:col-span-2">
            <button className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">Save details</button>
          </div>
        </form>
      </Section>

      {/* Visibility */}
      <Section title="Visibility (what officials can see on the event dashboard)">
        <form action={setVisibilityAction} className="space-y-3">
          <input type="hidden" name="eventId" value={id} />
          <div className="flex flex-wrap gap-4">
            {(["riders", "scores", "judges", "secretary"] as const).map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm capitalize cursor-pointer">
                <input type="checkbox" name={k} defaultChecked={vis[k] ?? true} className="h-4 w-4 rounded border-border accent-primary" />
                {k}
              </label>
            ))}
          </div>
          <button className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
            <Eye className="h-4 w-4" /> Save visibility
          </button>
        </form>
      </Section>

      {/* Riders */}
      <Section title={`Riders (${ev.riders.length})`}>
        <form action={addRiderAction} className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          <input type="hidden" name="eventId" value={id} />
          <input name="name" required placeholder="Rider name" className="col-span-2 sm:col-span-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          <input name="competitorNo" placeholder="No." className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          <input name="nf" placeholder="NF" className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          <input name="horse" placeholder="Horse" className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          <input name="horseNo" placeholder="Horse No." className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          <input name="imageUrl" placeholder="Image URL (optional)" className="col-span-2 sm:col-span-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
          <div className="col-span-2 sm:col-span-3">
            <button className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"><Plus className="h-3.5 w-3.5" /> Add rider</button>
          </div>
        </form>
        <div className="divide-y divide-border">
          {ev.riders.map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-2">
              {r.image_url ? (
                <img src={r.image_url} alt={r.name} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-[10px] font-semibold">
                  {r.competitor_no ?? "—"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {[r.competitor_no && `#${r.competitor_no}`, r.horse, r.nf].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <form action={deleteRiderAction}>
                <input type="hidden" name="eventId" value={id} />
                <input type="hidden" name="riderId" value={r.id} />
                <button className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-muted transition-colors"><Trash2 className="h-4 w-4" /></button>
              </form>
            </div>
          ))}
          {ev.riders.length === 0 && <p className="text-sm text-muted-foreground py-3">No riders yet.</p>}
        </div>
      </Section>

      {/* Officials / participants */}
      <Section title={`Officials (${ev.participants.length})`}>
        <form action={addParticipantAction} className="flex flex-wrap items-end gap-2 mb-4">
          <input type="hidden" name="eventId" value={id} />
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Person</label>
            <select name="userId" required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">Select…</option>
              {invitable.map((u) => (
                <option key={u.id} value={u.id}>{u.name ?? u.email} {u.role ? `(${ROLE_LABELS[u.role]})` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Role at event</label>
            <select name="roleAtEvent" className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary">
              {OFFICIAL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <button className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"><Plus className="h-3.5 w-3.5" /> Invite</button>
        </form>
        <div className="divide-y divide-border">
          {ev.participants.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name ?? ""} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-[10px] font-semibold">
                  {(p.name ?? p.email ?? "?").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{p.name ?? p.email}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {p.role_at_event ? ROLE_LABELS[p.role_at_event as UserRole] ?? p.role_at_event : "—"}
                  {" · "}
                  {p.joined_at ? `Joined ${fmtDateTime(p.joined_at)}` : "Invited (not joined)"}
                </div>
              </div>
              <form action={removeParticipantAction}>
                <input type="hidden" name="eventId" value={id} />
                <input type="hidden" name="participantId" value={p.id} />
                <button className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-muted transition-colors"><Trash2 className="h-4 w-4" /></button>
              </form>
            </div>
          ))}
          {ev.participants.length === 0 && <p className="text-sm text-muted-foreground py-3">No officials yet.</p>}
        </div>
      </Section>

      {/* Sheets */}
      <Section title="Scoring sheets in this event">
        <form action={saveEventSheetsAction} className="space-y-3">
          <input type="hidden" name="eventId" value={id} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 max-h-72 overflow-y-auto pr-1">
            {sheets.map((t) => (
              <label key={t.slug} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
                <input type="checkbox" name="slug" value={t.slug} defaultChecked={assignedSlugs.has(t.slug)} className="h-4 w-4 rounded border-border accent-primary" />
                <span className="truncate">{t.category}</span>
              </label>
            ))}
          </div>
          <button className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">Save sheets</button>
        </form>
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
