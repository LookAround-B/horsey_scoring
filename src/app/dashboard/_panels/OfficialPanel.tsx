import Link from "next/link";
import {
  CalendarRange, MapPin, KeyRound, ExternalLink,
  ClipboardList, CheckCircle, FileEdit, Clock, AlertCircle,
} from "lucide-react";
import { PastEventsClient } from "./PastEventsClient";
import { listEventsForParticipant, listSheetsByEvent, type EventSummary } from "@/lib/events";
import { listCustomSheetCards } from "@/lib/customSheets";
import { TEST_CARDS, type TestCard } from "@/lib/dummy-data";
import { query } from "@/lib/db";

type Discipline = "dressage" | "showjumping" | "all";

type RoleConfig = {
  icon: React.ElementType;
  label: string;
  discipline: Discipline;
  description: string;
  sheetAction: string;
  emptyHint: string;
};

const STATUS_STYLES = {
  draft:      { cls: "bg-muted/60 text-muted-foreground",         icon: FileEdit,     text: "Draft" },
  submitted:  { cls: "bg-highlight/10 text-highlight",            icon: Clock,        text: "Submitted" },
  verified:   { cls: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400", icon: CheckCircle, text: "Verified" },
  none:       { cls: "bg-background border border-dashed border-border text-muted-foreground", icon: AlertCircle, text: "Not started" },
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;

async function getEventScoreSummary(eventIds: string[]) {
  if (!eventIds.length) return {} as Record<string, Record<string, string>>;
  const rows = await query<{ event_id: string; test_slug: string; rider_id: string | null; status: string }>(
    `select event_id, test_slug, rider_id, status from scores where event_id = ANY($1)`,
    [eventIds]
  );
  const map: Record<string, Record<string, string>> = {};
  for (const r of rows) {
    if (!map[r.event_id]) map[r.event_id] = {};
    const key = `${r.test_slug}|${r.rider_id ?? ""}`;
    map[r.event_id][key] = r.status;
  }
  return map;
}

export async function OfficialPanel({
  userId,
  config,
}: {
  userId: string;
  config: RoleConfig;
}) {
  const [events, sheetsByEvent, customCards] = await Promise.all([
    listEventsForParticipant(userId),
    listSheetsByEvent(),
    listCustomSheetCards(),
  ]);

  const eventIds = events.map((e) => e.id);
  const scoreSummary = await getEventScoreSummary(eventIds);

  const bySlug = new Map(TEST_CARDS.map((c) => [c.slug, c]));
  customCards.forEach((c) => bySlug.set(c.slug, c));

  const activeEvents = events.filter((e) => e.status !== "completed");
  const pastEvents = events.filter((e) => e.status === "completed");

  const getSheetsForEvent = (eventId: string): TestCard[] => {
    const slugs = sheetsByEvent[eventId] ?? [];
    return slugs
      .map((s) => bySlug.get(s))
      .filter((t): t is TestCard => {
        if (!t) return false;
        if (config.discipline === "all") return true;
        return t.discipline === config.discipline;
      });
  };

  const sheetStatus = (eventId: string, sheet: TestCard) => {
    const scores = scoreSummary[eventId] ?? {};
    const matchingKeys = Object.keys(scores).filter((k) => k.startsWith(sheet.slug + "|"));
    if (!matchingKeys.length) return "none";
    const statuses = matchingKeys.map((k) => scores[k]);
    if (statuses.every((s) => s === "verified")) return "verified";
    if (statuses.some((s) => s === "submitted")) return "submitted";
    return "draft";
  };

  const Icon = config.icon;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/10 grid place-items-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl tracking-tight">{config.label}</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-prose">{config.description}</p>
          </div>
        </div>

        {events.length > 0 && (
          <div className="mt-5 pt-5 border-t border-border grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <div className="font-display text-2xl tabular-nums text-highlight">{activeEvents.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Active events</div>
            </div>
            <div>
              <div className="font-display text-2xl tabular-nums">{pastEvents.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Completed</div>
            </div>
            <div>
              <div className="font-display text-2xl tabular-nums">
                {eventIds.reduce((n, id) => n + getSheetsForEvent(id).length, 0)}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Sheets total</div>
            </div>
          </div>
        )}
      </div>

      {/* Active events */}
      {activeEvents.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <CalendarRange className="h-3.5 w-3.5" /> Active & upcoming events
          </h2>
          <div className="space-y-3">
            {activeEvents.map((ev) => (
              <EventCard
                key={ev.id}
                ev={ev}
                sheets={getSheetsForEvent(ev.id)}
                sheetAction={config.sheetAction}
                getStatus={(sheet) => sheetStatus(ev.id, sheet)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {events.length === 0 && (
        <div className="bg-card border border-dashed border-border rounded-xl py-14 text-center space-y-3">
          <ClipboardList className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-medium">No events assigned yet</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {config.emptyHint}
          </p>
          <Link
            href="/dashboard/join"
            className="inline-flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg mt-2 hover:opacity-90 transition-opacity"
          >
            <KeyRound className="h-3.5 w-3.5" /> Join event with code
          </Link>
        </div>
      )}

      {/* Past events (collapsed) */}
      {pastEvents.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Completed events ({pastEvents.length})
          </h2>
          <PastEventsClient events={pastEvents.map((ev) => ({ id: ev.id, name: ev.name, start_date: ev.start_date }))} />
        </section>
      )}

      {/* Quick action always visible */}
      {events.length > 0 && (
        <Link
          href="/dashboard/join"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <KeyRound className="h-3 w-3" /> Join another event with code
        </Link>
      )}
    </div>
  );
}

function EventCard({
  ev,
  sheets,
  sheetAction,
  getStatus,
}: {
  ev: EventSummary;
  sheets: TestCard[];
  sheetAction: string;
  getStatus: (sheet: TestCard) => string;
}) {
  const statusBadge: Record<string, string> = {
    upcoming: "bg-muted text-muted-foreground",
    active:   "bg-highlight/15 text-highlight",
    completed:"bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Event header */}
      <div className="flex items-start gap-3 p-4 border-b border-border">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{ev.name}</span>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusBadge[ev.status] ?? statusBadge.upcoming}`}>
              {ev.status}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3">
            {fmt(ev.start_date) && (
              <span className="flex items-center gap-1">
                <CalendarRange className="h-3 w-3" /> {fmt(ev.start_date)}
                {fmt(ev.end_date) && ` – ${fmt(ev.end_date)}`}
              </span>
            )}
            {ev.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {ev.location}
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/dashboard/events/${ev.id}`}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          Details <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Sheets */}
      {sheets.length === 0 ? (
        <div className="px-4 py-5 text-xs text-muted-foreground text-center">
          No scoring sheets assigned to this event yet.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {sheets.map((sheet) => {
            const status = getStatus(sheet);
            const style = STATUS_STYLES[status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.none;
            const StatusIcon = style.icon;
            return (
              <div key={sheet.slug} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{sheet.category}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    {sheet.appendix}
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${style.cls}`}>
                  <StatusIcon className="h-3 w-3" /> {style.text}
                </span>
                <Link
                  href={`/scoring/${sheet.slug}?event=${ev.id}`}
                  target="_blank"
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {sheetAction} <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
