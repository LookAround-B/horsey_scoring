"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  DUMMY_RIDERS, DUMMY_EVENTS, DUMMY_SESSIONS, DUMMY_ENTRIES,
  type Rider, type ScoringSession, type TestCard,
  TEST_CARDS, TEST_NAMES, ROLE_LABELS, ROLE_DASHBOARD,
} from "@/lib/dummy-data";
import {
  ExternalLink, Search, Calendar, Users, FileText,
  CheckCircle, Clock, FileEdit, ChevronRight, Trophy,
  LayoutDashboard, Layers, Plus, Loader2, Pencil,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Discipline = "dressage" | "showjumping";
const DISCIPLINES: { id: Discipline; label: string }[] = [
  { id: "dressage", label: "Dressage" },
  { id: "showjumping", label: "Show Jumping" },
];

type Tab = "overview" | "sheets" | "riders" | "sessions";

const STATUS_CHIP: Record<string, string> = {
  draft:     "bg-muted text-muted-foreground",
  submitted: "bg-highlight/20 text-highlight",
  verified:  "bg-primary/10 text-primary",
  upcoming:  "bg-muted text-muted-foreground",
  active:    "bg-highlight/20 text-highlight",
  completed: "bg-primary/10 text-primary",
};

function SessionStatusIcon({ status }: { status: ScoringSession["status"] }) {
  if (status === "verified")  return <CheckCircle className="h-3.5 w-3.5 text-highlight" />;
  if (status === "submitted") return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  return <FileEdit className="h-3.5 w-3.5 text-muted-foreground/40" />;
}

const EMPTY_RIDER_FORM = { name: "", nf: "", competitorNo: "", horse: "", horseNo: "" };

/** A score sheet saved from the scoring page into localStorage["saved-sessions"]. */
type SavedSession = {
  id: string;
  riderId: string | null;
  testId: string;
  testName?: string;
  judgeName?: string | null;
  riderName?: string;
  competitorNo?: string;
  horse?: string;
  nf?: string;
  event?: string;
  eventDate?: string;
  percentage: number;
  eliminated?: boolean;
  grandTotal?: number;
  grandTotalMax?: number;
  status: ScoringSession["status"];
  savedAt?: string;
};

/** Unified shape consumed by the Saved Scores cards, built from either a dummy or a saved session. */
type SessionCard = {
  id: string;
  testId: string;
  testName: string;
  riderName: string;
  competitorNo: string;
  horse: string;
  nf: string;
  eventName: string;
  percentage: number;
  eliminated: boolean;
  status: ScoringSession["status"];
  when: string;
  source: "saved" | "demo";
};

function formatWhen(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function HubPage() {
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>("overview");
  const [sheetDiscipline, setSheetDiscipline] = useState<Discipline>("dressage");
  const [riderSearch, setRiderSearch] = useState("");
  const [sessionFilter, setSessionFilter] = useState<"all" | ScoringSession["status"]>("all");
  const [allRiders, setAllRiders] = useState<Rider[]>(DUMMY_RIDERS);
  const [allSessions] = useState<ScoringSession[]>(DUMMY_SESSIONS);
  const [showAddRider, setShowAddRider] = useState(false);
  const [riderForm, setRiderForm] = useState(EMPTY_RIDER_FORM);
  const [riderFormError, setRiderFormError] = useState("");
  const [riderFormSaving, setRiderFormSaving] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [placements, setPlacements] = useState<Record<string, Discipline>>({});
  const [events, setEvents] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [membership, setMembership] = useState<Record<string, string[]>>({});
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [customCards, setCustomCards] = useState<TestCard[]>([]);

  useEffect(() => {
    fetch("/api/sheet-placements")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => setPlacements(data as Record<string, Discipline>))
      .catch(() => {});
    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : { events: [], membership: {} }))
      .then((data) => {
        setEvents(data.events ?? []);
        setMembership(data.membership ?? {});
      })
      .catch(() => {});
    fetch("/api/custom-sheets")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCustomCards(data as TestCard[]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem("saved-sessions");
        setSavedSessions(raw ? (JSON.parse(raw) as SavedSession[]) : []);
      } catch { /* ignore */ }
    };
    load();
    // Pick up scores saved from the scoring sheet (which opens in a separate tab).
    window.addEventListener("storage", load);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("focus", load);
    };
  }, []);

  // Unified, newest-first list combining sheets saved from the scoring page with the demo sessions.
  const sessionCards = useMemo<SessionCard[]>(() => {
    const fromSaved: SessionCard[] = [...savedSessions].reverse().map((s) => {
      const rider = s.riderId ? allRiders.find((r) => r.id === s.riderId) : null;
      return {
        id: s.id,
        testId: s.testId,
        testName: s.testName || TEST_NAMES[s.testId] || s.testId,
        riderName: s.riderName || rider?.name || "Unnamed rider",
        competitorNo: s.competitorNo || rider?.competitorNo || "",
        horse: s.horse || rider?.horse || "—",
        nf: s.nf || rider?.nf || "",
        eventName: s.event || "",
        percentage: s.percentage,
        eliminated: !!s.eliminated,
        status: s.status,
        when: formatWhen(s.savedAt ?? ""),
        source: "saved",
      };
    });
    const fromDemo: SessionCard[] = DUMMY_SESSIONS.map((s) => {
      const rider = allRiders.find((r) => r.id === s.riderId);
      const event = DUMMY_EVENTS.find((e) => e.id === s.eventId);
      return {
        id: s.id,
        testId: s.testId,
        testName: TEST_NAMES[s.testId] || s.testId,
        riderName: rider?.name || "—",
        competitorNo: rider?.competitorNo || "",
        horse: rider?.horse || "—",
        nf: rider?.nf || "",
        eventName: event?.name || "",
        percentage: s.percentage,
        eliminated: false,
        status: s.status,
        when: formatWhen(s.createdAt),
        source: "demo",
      };
    });
    return [...fromSaved, ...fromDemo];
  }, [savedSessions, allRiders]);

  const filteredCards =
    sessionFilter === "all" ? sessionCards : sessionCards.filter((c) => c.status === sessionFilter);

  // DB sheets (edits/overrides + fully custom) win over the built-in by slug.
  const cardBySlug = new Map<string, TestCard>();
  TEST_CARDS.forEach((c) => cardBySlug.set(c.slug, c));
  customCards.forEach((c) => cardBySlug.set(c.slug, c));
  const allCards = [...cardBySlug.values()];
  const disciplineOf = (t: { slug: string; discipline?: Discipline }): Discipline =>
    placements[t.slug] ?? t.discipline ?? "dressage";
  const inEvent = (slug: string) =>
    selectedEvent === "all"
      ? true
      : (membership[slug]?.includes(selectedEvent) ?? false);
  const sheetCards = allCards.filter(
    (t) => disciplineOf(t) === sheetDiscipline && inEvent(t.slug)
  );

  if (!user) return null;

  const activeEvent = DUMMY_EVENTS.find((e) => e.status === "active");
  const pending  = allSessions.filter((s) => s.status === "submitted").length;
  const verified = allSessions.filter((s) => s.status === "verified").length;

  const filteredRiders = allRiders.filter(
    (r) =>
      r.name.toLowerCase().includes(riderSearch.toLowerCase()) ||
      r.horse.toLowerCase().includes(riderSearch.toLowerCase()) ||
      r.competitorNo.includes(riderSearch)
  );

  const roleDash = ROLE_DASHBOARD[user.role];

  const stats = [
    { label: "Active Events",     value: DUMMY_EVENTS.filter((e) => e.status === "active").length, icon: Calendar },
    { label: "Registered Riders", value: allRiders.length,                                          icon: Users },
    { label: "Pending Review",    value: pending,                                                    icon: Clock },
    { label: "Verified Sheets",   value: verified,                                                   icon: CheckCircle },
  ];

  const quickActions = [
    { label: "My Dashboard",   href: roleDash,                   icon: LayoutDashboard, accent: "border-primary/30 hover:bg-primary/5" },
    { label: "All Riders",     action: () => setTab("riders"),   icon: Users,           accent: "border-border hover:bg-muted" },
    { label: "Scoring Sheets", action: () => setTab("sheets"),   icon: Layers,          accent: "border-border hover:bg-muted" },
    { label: "Saved Scores",   action: () => setTab("sessions"), icon: FileText,        accent: "border-border hover:bg-muted" },
    ...(activeEvent ? [{ label: activeEvent.name, href: roleDash, icon: Trophy, accent: "border-highlight/30 hover:bg-highlight/5 text-highlight" }] : []),
  ];

  const handleAddRider = () => {
    if (!riderForm.name.trim()) { setRiderFormError("Rider name is required."); return; }
    if (!riderForm.competitorNo.trim()) { setRiderFormError("Competitor number is required."); return; }
    setRiderFormSaving(true);
    setTimeout(() => {
      const newRider: Rider = {
        id: `r${Date.now()}`,
        name: riderForm.name.trim(),
        nf: riderForm.nf.trim(),
        competitorNo: riderForm.competitorNo.trim(),
        horse: riderForm.horse.trim(),
        horseNo: riderForm.horseNo.trim(),
      };
      setAllRiders((prev) => [...prev, newRider]);
      setRiderForm(EMPTY_RIDER_FORM);
      setRiderFormError("");
      setShowAddRider(false);
      setRiderFormSaving(false);
    }, 400);
  };

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">{ROLE_LABELS[user.role]}</div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">
            Welcome back, <span className="italic text-highlight">{user.name.split(" ")[0]}</span>
          </h1>
          {activeEvent && (
            <p className="text-sm text-muted-foreground mt-1">
              Active event: <span className="text-foreground font-medium">{activeEvent.name}</span> · {activeEvent.date}
            </p>
          )}
        </div>
        <Link href={roleDash} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
          <LayoutDashboard className="h-4 w-4" /> My Dashboard <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="font-display text-3xl tabular-nums">{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-0.5 border-b border-border overflow-x-auto no-scrollbar">
        {(["overview", "sheets", "riders", "sessions"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors -mb-px ${
              tab === t ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "overview" ? "Overview" : t === "sheets" ? "Scoring Sheets" : t === "riders" ? "Riders" : "Saved Scores"}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-lg mb-3">Quick Access</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {quickActions.map((a) => {
                const Icon = a.icon;
                const inner = (<><Icon className="h-5 w-5 mb-2 text-muted-foreground" /><span className="text-xs font-medium text-center leading-tight">{a.label}</span></>);
                return "href" in a ? (
                  <Link key={a.label} href={a.href} className={`flex flex-col items-center justify-center rounded-xl border p-4 transition-colors ${a.accent}`}>{inner}</Link>
                ) : (
                  <button key={a.label} onClick={a.action} className={`flex flex-col items-center justify-center rounded-xl border p-4 transition-colors ${a.accent}`}>{inner}</button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-display text-base">Events</h2>
                <span className="text-xs text-muted-foreground">{DUMMY_EVENTS.length} total</span>
              </div>
              <div className="divide-y divide-border">
                {DUMMY_EVENTS.map((ev) => (
                  <div key={ev.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{ev.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{ev.date} · {ev.classes.length} classes</div>
                    </div>
                    <span className={`shrink-0 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${STATUS_CHIP[ev.status]}`}>{ev.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-display text-base">Recent Sessions</h2>
                <button onClick={() => setTab("sessions")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  See all <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="divide-y divide-border">
                {allSessions.slice(0, 4).map((s) => {
                  const rider = allRiders.find((r) => r.id === s.riderId);
                  return (
                    <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                      <SessionStatusIcon status={s.status} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{rider?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{TEST_NAMES[s.testId] ?? s.testId} · {rider?.horse ?? "—"}</div>
                      </div>
                      <div className="font-display tabular-nums text-highlight text-sm shrink-0">
                        {s.percentage > 0 ? `${s.percentage.toFixed(2)}%` : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-base">Riders</h2>
              <button onClick={() => setTab("riders")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                All {allRiders.length} <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-sm">
                <thead className="bg-muted text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-2.5">No.</th>
                    <th className="text-left px-5 py-2.5">Rider</th>
                    <th className="text-left px-5 py-2.5">NF</th>
                    <th className="text-left px-5 py-2.5">Horse</th>
                    <th className="text-center px-5 py-2.5">Sessions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allRiders.slice(0, 5).map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground">{r.competitorNo}</td>
                      <td className="px-5 py-2.5 font-medium">{r.name}</td>
                      <td className="px-5 py-2.5 text-muted-foreground">{r.nf}</td>
                      <td className="px-5 py-2.5">{r.horse}</td>
                      <td className="px-5 py-2.5 text-center font-display tabular-nums text-sm">{allSessions.filter((s) => s.riderId === r.id).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SCORING SHEETS */}
      {tab === "sheets" && (
        <div className="space-y-4">
          {/* Event tabs */}
          <div className="flex flex-wrap items-center gap-1 border-b border-border">
            {[{ slug: "all", name: "All" }, ...events].map((ev) => {
              const count =
                ev.slug === "all"
                  ? allCards.length
                  : allCards.filter((t) => membership[t.slug]?.includes(ev.slug)).length;
              const active = selectedEvent === ev.slug;
              return (
                <button key={ev.slug} onClick={() => setSelectedEvent(ev.slug)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    active ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {ev.name}
                  <span className="text-[11px] tabular-nums opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Discipline toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted">
            {DISCIPLINES.map((d) => {
              const count = allCards.filter((t) => disciplineOf(t) === d.id && inEvent(t.slug)).length;
              const active = sheetDiscipline === d.id;
              return (
                <button key={d.id} onClick={() => setSheetDiscipline(d.id)}
                  className={`flex items-center gap-2 text-sm px-4 py-1.5 rounded-md transition-colors ${
                    active ? "bg-card text-foreground shadow-soft font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d.label}
                  <span className={`text-[11px] tabular-nums px-1.5 rounded-full ${active ? "bg-primary/10 text-primary" : "bg-foreground/5 text-muted-foreground"}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground">Open any scoring sheet to start scoring. Scores auto-save as you go.</p>

          {sheetCards.length === 0 ? (
            <div className="bg-card border border-border rounded-xl shadow-soft py-16 text-center">
              <Layers className="h-7 w-7 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No {sheetDiscipline === "showjumping" ? "show jumping" : "dressage"} sheets
                {selectedEvent !== "all" && " in this event"}.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {selectedEvent !== "all"
                  ? "Assign sheets to this event under Admin → Events."
                  : "Sheets for this discipline will appear here once they’re added."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sheetCards.map((t) => {
                const riderCount = activeEvent
                  ? activeEvent.classes.filter((c) => c.testId === t.slug).reduce((n, c) => n + (DUMMY_ENTRIES[c.id]?.length ?? 0), 0)
                  : 0;
                return (
                  <div key={t.slug} className="bg-card border border-border rounded-xl p-5 shadow-soft flex flex-col gap-3 hover:border-foreground/20 transition-colors">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{t.appendix}</div>
                      <div className="font-display text-xl tracking-tight">{t.category}</div>
                      <div className="text-xs text-muted-foreground mt-1 leading-snug">{t.description}</div>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        {disciplineOf(t) === "showjumping" ? (
                          "Show jumping"
                        ) : (
                          <>Max <span className="font-mono">{t.maxScore}</span> pts</>
                        )}
                        {riderCount > 0 && <> · <span className="text-foreground">{riderCount} riders today</span></>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {user.role === "super_admin" && (
                          <Link href={`/dashboard/admin/edit-sheet/${t.slug}`}
                            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </Link>
                        )}
                        <Link href={`/scoring/${t.slug}`} target="_blank"
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                        >
                          Open <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* RIDERS */}
      {tab === "riders" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input type="text" placeholder="Search by name, horse or number…" value={riderSearch}
                onChange={(e) => setRiderSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <span className="text-xs text-muted-foreground">{filteredRiders.length} of {allRiders.length}</span>
            <button onClick={() => { setShowAddRider(true); setRiderFormError(""); }}
              className="ml-auto flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" /> Add Rider
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3">No.</th>
                  <th className="text-left px-5 py-3">Rider</th>
                  <th className="text-left px-5 py-3">NF</th>
                  <th className="text-left px-5 py-3">Horse</th>
                  <th className="text-left px-5 py-3">H.No</th>
                  <th className="text-center px-5 py-3">Sessions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRiders.map((r) => {
                  const sessions = allSessions.filter((s) => s.riderId === r.id);
                  return (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{r.competitorNo}</td>
                      <td className="px-5 py-3 font-medium">{r.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{r.nf}</td>
                      <td className="px-5 py-3">{r.horse}</td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{r.horseNo}</td>
                      <td className="px-5 py-3 text-center font-display tabular-nums">{sessions.length}</td>
                    </tr>
                  );
                })}
                {filteredRiders.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">No riders match your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SESSIONS */}
      {tab === "sessions" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "draft", "submitted", "verified"] as const).map((f) => (
              <button key={f} onClick={() => setSessionFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${sessionFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== "all" && <span className="ml-1.5 opacity-60">{sessionCards.filter((c) => c.status === f).length}</span>}
              </button>
            ))}
            <span className="text-xs text-muted-foreground ml-auto">{filteredCards.length} score{filteredCards.length !== 1 ? "s" : ""}</span>
          </div>

          {filteredCards.length === 0 ? (
            <div className="bg-card border border-border rounded-xl shadow-soft py-16 text-center">
              <FileText className="h-7 w-7 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No saved scores yet.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Open a scoring sheet, fill it in, and hit <span className="font-medium text-foreground">Save Score</span> — it’ll show up here.</p>
              <button onClick={() => setTab("sheets")} className="mt-4 inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                <Layers className="h-3.5 w-3.5" /> Browse scoring sheets
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCards.map((c) => (
                <div key={c.id} className="bg-card border border-border rounded-xl p-5 shadow-soft flex flex-col gap-4 hover:border-foreground/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1.5">
                        {c.testName}
                        {c.source === "saved" && <span className="text-highlight normal-case tracking-normal font-medium">· New</span>}
                      </div>
                      <div className="font-display text-xl tracking-tight truncate">{c.riderName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {c.competitorNo && <span className="font-mono">#{c.competitorNo}</span>}
                        {c.competitorNo && (c.horse !== "—" || c.nf) ? " · " : ""}
                        {c.horse !== "—" ? c.horse : ""}{c.nf ? ` (${c.nf})` : ""}
                      </div>
                    </div>
                    <span className={`shrink-0 flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${STATUS_CHIP[c.status]}`}>
                      <SessionStatusIcon status={c.status} /> {c.status}
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Final score</div>
                      <div className="font-display text-3xl tabular-nums text-highlight leading-none mt-1">
                        {c.eliminated ? <span className="text-destructive text-xl">Eliminated</span> : c.percentage > 0 ? `${c.percentage.toFixed(2)}%` : "—"}
                      </div>
                    </div>
                    {c.eventName && (
                      <div className="text-right min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Event</div>
                        <div className="text-xs mt-1 truncate max-w-[140px]">{c.eventName}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{c.when || "—"}</span>
                    <Link href={c.source === "saved" ? `/scoring/${c.testId}?session=${c.id}` : `/scoring/${c.testId}`} target="_blank"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD RIDER MODAL */}
      <Dialog open={showAddRider} onOpenChange={(o) => { if (!o) { setShowAddRider(false); setRiderForm(EMPTY_RIDER_FORM); setRiderFormError(""); } }}>
        <DialogContent className="max-w-md p-0 gap-0">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display text-lg">Add New Rider</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Rider Name <span className="text-destructive">*</span></label>
                  <Input type="text" value={riderForm.name} onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })} placeholder="Full name"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Competitor No. <span className="text-destructive">*</span></label>
                  <Input type="text" value={riderForm.competitorNo} onChange={(e) => setRiderForm({ ...riderForm, competitorNo: e.target.value })} placeholder="e.g. 109"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">NF / Country</label>
                  <Input type="text" value={riderForm.nf} onChange={(e) => setRiderForm({ ...riderForm, nf: e.target.value })} placeholder="e.g. IND"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Horse Name</label>
                  <Input type="text" value={riderForm.horse} onChange={(e) => setRiderForm({ ...riderForm, horse: e.target.value })} placeholder="Horse name"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Horse No.</label>
                  <Input type="text" value={riderForm.horseNo} onChange={(e) => setRiderForm({ ...riderForm, horseNo: e.target.value })} placeholder="e.g. H09"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
              </div>
              {riderFormError && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{riderFormError}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => { setShowAddRider(false); setRiderForm(EMPTY_RIDER_FORM); setRiderFormError(""); }}
                className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleAddRider} disabled={riderFormSaving}
                className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                {riderFormSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Add Rider
              </button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
