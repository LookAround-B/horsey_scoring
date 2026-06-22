import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEventById, listSheetsByEvent } from "@/lib/events";
import { listScoresForEvent } from "@/lib/scores";
import { listCustomSheetCards } from "@/lib/customSheets";
import { TEST_CARDS, type TestCard } from "@/lib/dummy-data";
import { ROLE_LABELS, type UserRole } from "@/lib/roles";
import { RidersSectionClient } from "./RidersSectionClient";
import { MapPin, CalendarRange, ExternalLink, Users as UsersIcon, ClipboardList, ChevronDown } from "lucide-react";
import { sanitizeImageSrc } from "@/lib/validation";

export const dynamic = "force-dynamic";

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;

function Avatar({ name, image }: { name: string; image: string | null }) {
  const safeSrc = sanitizeImageSrc(image);
  if (safeSrc) return <img src={safeSrc} alt={name} className="h-9 w-9 rounded-full object-cover" />;
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

  const [sheetsByEvent, customCards, scoreRows] = await Promise.all([
    listSheetsByEvent(),
    listCustomSheetCards(),
    listScoresForEvent(id),
  ]);
  const slugs = sheetsByEvent[id] ?? [];
  const bySlug = new Map(TEST_CARDS.map((c) => [c.slug, c]));
  customCards.forEach((c) => bySlug.set(c.slug, c));
  const eventSheets = slugs.map((s) => bySlug.get(s)).filter(Boolean) as TestCard[];

  const scoreMap = new Map<string, { status: string; result: number | null }>();
  scoreRows.forEach((s) => scoreMap.set(`${s.test_slug}|${s.rider_id ?? ""}`, s));
  const fmtResult = (r: number | null) =>
    r == null ? "" : r < 0 ? "Eliminated" : `${r.toFixed(2)}%`;

  const officials = ev.participants.filter((p) => p.joined_at || isManager);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-display text-3xl tracking-tight">{ev.name}</h1>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-highlight/15 text-highlight">{ev.status}</span>
        </div>
        <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          {fmt(ev.start_date) && (
            <span className="flex items-center gap-1">
              <CalendarRange className="h-3.5 w-3.5" /> {fmt(ev.start_date)}{fmt(ev.end_date) ? ` – ${fmt(ev.end_date)}` : ""}
              {ev.start_time ? ` · ${ev.start_time}${ev.end_time ? `–${ev.end_time}` : ""}` : ""}
            </span>
          )}
          {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {ev.location}</span>}
        </div>
        {isManager && (
          <Link href={`/dashboard/admin/events/${id}`} className="inline-block mt-2 text-xs text-primary hover:underline">
            Manage event →
          </Link>
        )}
      </div>

      {/* Guidelines */}
      {ev.guidelines && (
        <section className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Guidelines</h2>
          <div className="text-sm whitespace-pre-line leading-relaxed">{ev.guidelines}</div>
        </section>
      )}

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
          <div className="space-y-3">
            {eventSheets.map((t) => {
              const isGrid = t.discipline === "showjumping";
              if (isGrid) {
                const sc = scoreMap.get(`${t.slug}|`);
                return (
                  <div key={t.slug} className="flex items-center justify-between gap-3 border border-border rounded-lg px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{t.category}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {t.appendix} {sc ? `· ${sc.status}` : ""}
                      </div>
                    </div>
                    <Link href={`/scoring/${t.slug}?event=${id}`} target="_blank" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0">
                      Open grid <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                );
              }
              return (
                <details key={t.slug} className="group border border-border rounded-lg">
                  <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none list-none">
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{t.category}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.appendix} · per rider</div>
                    </div>
                    <span className="text-xs text-muted-foreground">{ev.riders.length} riders</span>
                  </summary>
                  <div className="border-t border-border divide-y divide-border">
                    {ev.riders.length === 0 && (
                      <p className="text-sm text-muted-foreground px-4 py-3">Add riders to score this sheet.</p>
                    )}
                    {ev.riders.map((r) => {
                      const sc = scoreMap.get(`${t.slug}|${r.id}`);
                      return (
                        <div key={r.id} className="flex items-center gap-3 px-4 py-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm truncate">{r.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {[r.competitor_no && `#${r.competitor_no}`, r.horse].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                          {sc && (
                            <span className="text-xs tabular-nums text-highlight font-medium">{fmtResult(sc.result)}</span>
                          )}
                          {sc && (
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{sc.status}</span>
                          )}
                          <Link
                            href={`/scoring/${t.slug}?event=${id}&rider=${r.id}`}
                            target="_blank"
                            className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
                          >
                            {sc ? "Edit" : "Score"}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Riders */}
        {canSee("riders") && (
          <section className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-display text-base mb-4 flex items-center gap-2"><UsersIcon className="h-4 w-4 text-primary" /> Riders ({ev.riders.length})</h2>
            <RidersSectionClient riders={ev.riders} />
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
