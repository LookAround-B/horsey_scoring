import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEventById, listSheetsByEvent } from "@/lib/events";
import { listCustomSheetCards } from "@/lib/customSheets";
import { TEST_CARDS } from "@/lib/dummy-data";
import { ROLE_LABELS, type UserRole } from "@/lib/roles";
import { MapPin, CalendarRange, ExternalLink, Users as UsersIcon, ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) return <img src={image} alt={name} className="h-9 w-9 rounded-full object-cover" />;
  return (
    <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-xs font-semibold">
      {name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
    </div>
  );
}

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const sess = await auth();
  const user = sess?.user;
  if (!user || user.status !== "approved") redirect("/dashboard");

  const { id } = await params;
  const ev = await getEventById(id);
  if (!ev) redirect("/dashboard/join");

  const isManager = user.role === "super_admin" || ev.secretary_id === user.id;
  const joined = ev.participants.some((p) => p.user_id === user.id && p.joined_at);
  if (!isManager && !joined) redirect("/dashboard/join");

  const vis = ev.visibility ?? {};
  const canSee = (k: "riders" | "scores" | "judges" | "secretary") => isManager || (vis[k] ?? true);

  const sheetsByEvent = await listSheetsByEvent();
  const slugs = sheetsByEvent[id] ?? [];
  const customCards = await listCustomSheetCards();
  const bySlug = new Map(TEST_CARDS.map((c) => [c.slug, c]));
  customCards.forEach((c) => bySlug.set(c.slug, c));
  const eventSheets = slugs.map((s) => bySlug.get(s)).filter(Boolean) as { slug: string; category: string; appendix: string }[];

  const officials = ev.participants.filter((p) => p.joined_at || isManager);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-display text-3xl tracking-tight">{ev.name}</h1>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-highlight/15 text-highlight">{ev.status}</span>
        </div>
        <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          {fmt(ev.start_date) && <span className="flex items-center gap-1"><CalendarRange className="h-3.5 w-3.5" /> {fmt(ev.start_date)}{fmt(ev.end_date) ? ` – ${fmt(ev.end_date)}` : ""}</span>}
          {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {ev.location}</span>}
        </div>
        {isManager && (
          <Link href={`/dashboard/admin/events/${id}`} className="inline-block mt-2 text-xs text-primary hover:underline">
            Manage event →
          </Link>
        )}
      </div>

      {/* Secretary */}
      {canSee("secretary") && ev.secretary_name && (
        <section className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Show secretary</h2>
          <div className="font-medium">{ev.secretary_name}</div>
        </section>
      )}

      {/* Sheets to score */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-display text-base mb-4 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Scoring sheets</h2>
        {eventSheets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sheets assigned to this event yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {eventSheets.map((t) => (
              <div key={t.slug} className="flex items-center justify-between gap-3 border border-border rounded-lg px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{t.category}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.appendix}</div>
                </div>
                <Link href={`/scoring/${t.slug}`} target="_blank" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0">
                  Open <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Riders */}
        {canSee("riders") && (
          <section className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-display text-base mb-4 flex items-center gap-2"><UsersIcon className="h-4 w-4 text-primary" /> Riders ({ev.riders.length})</h2>
            <div className="divide-y divide-border">
              {ev.riders.map((r) => (
                <div key={r.id} className="flex items-center gap-3 py-2">
                  <Avatar name={r.name} image={r.image_url} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{r.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{[r.competitor_no && `#${r.competitor_no}`, r.horse, r.nf].filter(Boolean).join(" · ") || "—"}</div>
                  </div>
                </div>
              ))}
              {ev.riders.length === 0 && <p className="text-sm text-muted-foreground py-2">No riders.</p>}
            </div>
          </section>
        )}

        {/* Judges / officials */}
        {canSee("judges") && (
          <section className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-display text-base mb-4 flex items-center gap-2"><UsersIcon className="h-4 w-4 text-primary" /> Officials ({officials.length})</h2>
            <div className="divide-y divide-border">
              {officials.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2">
                  <Avatar name={p.name ?? p.email ?? "?"} image={p.image_url} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{p.name ?? p.email}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.role_at_event ? ROLE_LABELS[p.role_at_event as UserRole] ?? p.role_at_event : "Official"}</div>
                  </div>
                </div>
              ))}
              {officials.length === 0 && <p className="text-sm text-muted-foreground py-2">No officials yet.</p>}
            </div>
          </section>
        )}
      </div>

      {!canSee("scores") && (
        <p className="text-xs text-muted-foreground">Some sections are hidden by the show secretary.</p>
      )}
    </div>
  );
}
