"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Save, RotateCcw, Printer, ChevronLeft, ChevronRight,
  Lock, Unlock, Play, Pause, Plus, Trash2, Check, Settings,
  Users, Trophy, FileText,
} from "lucide-react";
import type { ShowJumpingConfig } from "@/lib/sheetTypes";
import { useScoreStore } from "@/lib/useScoreStore";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type FaultCode = "" | "4" | "4R" | "8" | "E";
// "" = clean (—), "4" = knockdown, "4R" = first refusal, "8" = second refusal, "E" = elimination

type RoundStatus = "" | "R" | "E" | "W" | "F" | "TW" | "HC";
// R=Retired, E=Eliminated, W=Withdrew, F=Fall, TW=Time/Weight, HC=Hors Concours

type RoundData = {
  faults: Record<string, FaultCode>; // obstacle label → fault code
  time: string;                       // elapsed as "ss.x" or "m:ss.x"
  status: RoundStatus;
};

type RiderEntry = {
  id: string;
  entryNo: string;
  name: string;
  horse: string;
  owner: string;
  nf: string;
  orderOfGo: number;
  fr: RoundData;
  jo: RoundData;
  note: string;
  approved: boolean;
};

type CourseInfo = {
  eventTitle: string;
  className: string;
  date: string;
  judge: string;
  speed: string;
  courseLength: string;
  timeAllowed: string;   // seconds — FR
  timeLimit: string;     // seconds — FR
  joTimeAllowed: string; // seconds — JO
};

// ─── Constants ────────────────────────────────────────────────────────────────

const FAULT_CYCLE: FaultCode[] = ["", "4", "4R", "8", "E"];

const FAULT_LABEL: Record<FaultCode, string> = {
  "": "—", "4": "4", "4R": "(4)R", "8": "8", "E": "E",
};

const FAULT_BTN_CLS: Record<FaultCode, string> = {
  "":   "bg-muted/60 text-muted-foreground border-border",
  "4":  "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 font-semibold",
  "4R": "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700 font-semibold",
  "8":  "bg-red-500/15 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700 font-semibold",
  "E":  "bg-destructive/20 text-destructive border-destructive/50 font-bold",
};

const STATUS_FLAGS: { key: RoundStatus; label: string }[] = [
  { key: "R",  label: "Retired"  },
  { key: "E",  label: "Elim."    },
  { key: "W",  label: "Withdrew" },
  { key: "F",  label: "Fall"     },
  { key: "TW", label: "T/W"      },
  { key: "HC", label: "H/C"      },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _uidCtr = 0;
const uid = () => `r${++_uidCtr}${Date.now().toString(36)}`;

const makeRound = (): RoundData => ({ faults: {}, time: "", status: "" });
const makeRider = (n: number): RiderEntry => ({
  id: uid(), entryNo: "", name: "", horse: "", owner: "", nf: "",
  orderOfGo: n, fr: makeRound(), jo: makeRound(), note: "", approved: false,
});

function parseSecs(s: string): number {
  if (!s?.trim()) return 0;
  if (s.includes(":")) {
    const [m, r] = s.split(":");
    return parseInt(m, 10) * 60 + (parseFloat(r) || 0);
  }
  return parseFloat(s) || 0;
}

function fmtTenths(t: number): string {
  const s = t / 10;
  if (s < 60) return s.toFixed(1);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? "0" : ""}${rem.toFixed(1)}`;
}

function calcJF(faults: Record<string, FaultCode>): number {
  return Object.values(faults).reduce((n, f) => n + (f === "4" || f === "4R" ? 4 : f === "8" ? 8 : 0), 0);
}

function hasElimFault(faults: Record<string, FaultCode>): boolean {
  return Object.values(faults).some(f => f === "E");
}

function isElimStatus(s: RoundStatus): boolean { return s === "E" || s === "F"; }
function isRetStatus(s: RoundStatus): boolean  { return s === "R" || s === "W"; }

function isRoundDone(r: RoundData): boolean {
  return r.time !== "" || hasElimFault(r.faults) || isElimStatus(r.status) || isRetStatus(r.status);
}

function isRoundOut(r: RoundData): boolean {
  return hasElimFault(r.faults) || isElimStatus(r.status) || isRetStatus(r.status);
}

function calcTF(timeStr: string, taSecs: number, rate = 4): number {
  if (!taSecs || !timeStr) return 0;
  const over = parseSecs(timeStr) - taSecs;
  return over <= 0 ? 0 : Math.ceil(over / rate);
}

function roundTotal(r: RoundData, taSecs: number, rate = 4): number {
  if (isRoundOut(r)) return Infinity;
  return calcJF(r.faults) + calcTF(r.time, taSecs, rate);
}

type PlacedRider = RiderEntry & {
  placing: number | null;
  frTotal: number;
  joTotal: number;
  inJO: boolean;
};

function computePlacements(riders: RiderEntry[], taSecs: number, joTaSecs: number): PlacedRider[] {
  const mapped: PlacedRider[] = riders.map(r => {
    const joHasTime = r.jo.time !== "";
    const joActive  = joHasTime || isElimStatus(r.jo.status) || isRetStatus(r.jo.status);
    return {
      ...r,
      placing: null,
      frTotal: isRoundDone(r.fr) ? roundTotal(r.fr, taSecs, 4) : Infinity,
      joTotal: joActive && joHasTime ? roundTotal(r.jo, joTaSecs, 1) : Infinity,
      inJO: joActive,
    };
  });

  const joF  = mapped.filter(r => r.inJO && r.joTotal < Infinity);
  const frF  = mapped.filter(r => !r.inJO && r.frTotal < Infinity);
  const rest = mapped.filter(r => !joF.includes(r) && !frF.includes(r));

  joF.sort((a, b) => a.joTotal  - b.joTotal  || parseSecs(a.jo.time) - parseSecs(b.jo.time));
  frF.sort((a, b) => a.frTotal  - b.frTotal  || parseSecs(a.fr.time) - parseSecs(b.fr.time));

  let p = 1;
  for (const r of [...joF, ...frF]) r.placing = p++;
  return [...joF, ...frF, ...rest];
}

// ─── Timer hook ───────────────────────────────────────────────────────────────

function useTimer() {
  const [tenths, setTenths] = useState(0);
  const [running, setRunning] = useState(false);
  const [splits,  setSplits]  = useState<number[]>([]);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    ref.current = setInterval(() => setTenths(t => t + 1), 100);
  }, [running]);

  const stop = useCallback(() => {
    setRunning(false);
    if (ref.current) { clearInterval(ref.current); ref.current = null; }
  }, []);

  const reset = useCallback(() => {
    stop();
    setTenths(0);
    setSplits([]);
  }, [stop]);

  const split = useCallback(() => setSplits(s => [...s, tenths]), [tenths]);

  useEffect(() => () => { if (ref.current) clearInterval(ref.current); }, []);

  return { tenths, running, splits, start, stop, reset, split };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ShowJumpingSheet({
  config,
  slug,
  eventId,
}: {
  config: ShowJumpingConfig;
  slug: string;
  eventId?: string | null;
}) {
  const frObs: string[] = config.firstRoundObstacles
    ?? config.obstacles.map((o, i) => o.name || String(i + 1));
  const joObs: string[] = config.jumpoffObstacles ?? [];
  const hasJO = joObs.length > 0;
  const frRate = config.timePenaltyRateFR ?? 4;
  const joRate = config.timePenaltyRateJO ?? 1;

  const STORAGE_KEY = `sj-live-v1:${slug}`;
  const store = useScoreStore({ slug, eventId, riderId: null, localKey: STORAGE_KEY });

  const [courseInfo, setCourseInfo] = useState<CourseInfo>({
    eventTitle: "",
    className: config.label,
    date: "",
    judge: "",
    speed:         config.defaultSpeed         != null ? String(config.defaultSpeed)         : "",
    courseLength:  config.defaultCourseLength   != null ? String(config.defaultCourseLength)  : "",
    timeAllowed:   config.defaultTimeAllowed    != null ? String(config.defaultTimeAllowed)   : "",
    timeLimit:     config.defaultTimeLimit      != null ? String(config.defaultTimeLimit)     : "",
    joTimeAllowed: config.defaultJoTimeAllowed  != null ? String(config.defaultJoTimeAllowed) : "",
  });

  const [riders,    setRiders]    = useState<RiderEntry[]>([makeRider(1)]);
  const [curIdx,    setCurIdx]    = useState(0);
  const [tab,       setTab]       = useState<"specs" | "scoring" | "standings" | "sheet">("scoring");
  const [timerRound, setTimerRound] = useState<"fr" | "jo">("fr");
  const [loaded,    setLoaded]    = useState(false);
  const [savedAt,   setSavedAt]   = useState("");

  const timer = useTimer();

  const taSecs   = parseSecs(courseInfo.timeAllowed);
  const tlSecs   = parseSecs(courseInfo.timeLimit) || (taSecs ? taSecs * 2 : 0);
  const joTaSecs = parseSecs(courseInfo.joTimeAllowed) || taSecs;

  const cur     = riders[curIdx] ?? null;
  const placed  = useMemo(() => computePlacements(riders, taSecs, joTaSecs), [riders, taSecs, joTaSecs]);
  const curPlac = cur ? (placed.find(p => p.id === cur.id)?.placing ?? null) : null;

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let live = true;
    store.load().then(d => {
      if (live && d) {
        if (d.courseInfo) setCourseInfo(ci => ({ ...ci, ...(d.courseInfo as object) }));
        if (Array.isArray(d.riders) && (d.riders as RiderEntry[]).length > 0)
          setRiders(d.riders as RiderEntry[]);
        if (typeof d.savedAt === "string") setSavedAt(d.savedAt);
      }
      if (live) setLoaded(true);
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, eventId]);

  // ── Autosave ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      const stamp = new Date().toISOString();
      store.save({ courseInfo, riders, savedAt: stamp });
      setSavedAt(stamp);
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseInfo, riders, loaded]);

  // ── Rider mutations ───────────────────────────────────────────────────────
  const patchRider = (patch: Partial<RiderEntry>) =>
    setRiders(rs => rs.map((r, i) => i === curIdx ? { ...r, ...patch } : r));

  const patchRound = (round: "fr" | "jo", patch: Partial<RoundData>) =>
    setRiders(rs => rs.map((r, i) =>
      i === curIdx ? { ...r, [round]: { ...r[round], ...patch } } : r
    ));

  const cycleFault = (round: "fr" | "jo", obs: string) => {
    if (!cur || cur.approved) return;
    const current = cur[round].faults[obs] ?? "";
    const idx  = FAULT_CYCLE.indexOf(current as FaultCode);
    const next = FAULT_CYCLE[(idx + 1) % FAULT_CYCLE.length];
    setRiders(rs => rs.map((r, i) =>
      i !== curIdx ? r : { ...r, [round]: { ...r[round], faults: { ...r[round].faults, [obs]: next } } }
    ));
  };

  const addRider = () => {
    const n = riders.length + 1;
    setRiders(rs => [...rs, makeRider(n)]);
    setCurIdx(riders.length);
  };

  const removeRider = () => {
    if (riders.length <= 1 || !confirm("Remove this rider?")) return;
    setRiders(rs => rs.filter((_, i) => i !== curIdx));
    setCurIdx(i => Math.max(0, i - 1));
  };

  const stopAndFill = () => {
    timer.stop();
    if (timer.tenths > 0) patchRound(timerRound, { time: fmtTenths(timer.tenths) });
  };

  const toggleApprove = () => {
    if (!cur) return;
    const next = !cur.approved;
    patchRider({ approved: next });
    toast(next ? `${cur.name || "Rider"} approved & locked.` : "Unlocked for editing.", {
      icon: next ? "🔒" : "🔓",
    });
  };

  const savedLabel = useMemo(() => {
    if (!savedAt) return "";
    const d = new Date(savedAt);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [savedAt]);

  const elapsed = timer.tenths / 10;
  const timerColor =
    tlSecs > 0 && elapsed > tlSecs   ? "text-destructive border-destructive/40 bg-destructive/10" :
    taSecs > 0 && elapsed > taSecs   ? "text-orange-500 border-orange-300 bg-orange-50 dark:bg-orange-950/20" :
    taSecs > 0 && elapsed >= taSecs * 0.85 ? "text-amber-500 border-amber-300 bg-amber-50 dark:bg-amber-950/20" :
    "text-foreground border-border bg-card";

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white">

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-primary text-primary-foreground print:hidden">
        <div className="px-3 py-2.5 flex items-center gap-2 flex-wrap">
          <Link href="/dashboard"
            className="p-1.5 rounded hover:bg-primary-foreground/10 transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="h-7 w-7 rounded bg-primary-foreground/20 grid place-items-center font-display text-xs font-bold shrink-0">SJ</div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-sm font-semibold leading-tight truncate">
              {courseInfo.eventTitle || config.label}
            </div>
            <div className="text-[10px] opacity-70 flex items-center gap-2 flex-wrap leading-tight mt-0.5">
              {courseInfo.className && <span>{courseInfo.className}</span>}
              {courseInfo.date && <span>· {courseInfo.date}</span>}
              {taSecs > 0 && <span>· TA {taSecs}s</span>}
              {tlSecs > 0 && <span>/ TL {tlSecs}s</span>}
              {courseInfo.speed && <span>· {courseInfo.speed} m/min</span>}
              {courseInfo.courseLength && <span>· {courseInfo.courseLength} m</span>}
              {courseInfo.judge && <span>· Judge: {courseInfo.judge}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {savedLabel && (
              <span className="text-[10px] opacity-60 hidden sm:flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
                Saved {savedLabel}
              </span>
            )}
            <button
              onClick={() => { const stamp = new Date().toISOString(); store.save({ courseInfo, riders, savedAt: stamp }, { status: "submitted" }); setSavedAt(stamp); toast.success("Sheet saved."); }}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-primary-foreground/15 hover:bg-primary-foreground/25 transition-colors">
              <Save className="h-3 w-3" /> Save
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-primary-foreground/15 hover:bg-primary-foreground/25 transition-colors print:hidden">
              <Printer className="h-3 w-3" /> Print
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-t border-primary-foreground/20 overflow-x-auto no-scrollbar">
          {([ ["specs",     "Course Specs",  Settings ],
              ["scoring",   "Live Scoring",  Users    ],
              ["standings", "Standings",     Trophy   ],
              ["sheet",     "Score Sheet",   FileText ],
            ] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                tab === key
                  ? "border-primary-foreground text-primary-foreground"
                  : "border-transparent text-primary-foreground/55 hover:text-primary-foreground/90"
              }`}>
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>
      </header>

      {/* ══════════════════════ TAB: Course Specs ══════════════════════════ */}
      {tab === "specs" && (
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <h2 className="font-display text-2xl">Course Information</h2>

          <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([ ["eventTitle",   "Event Title"               ],
                ["className",    "Class / Category"          ],
                ["date",         "Date"                      ],
                ["judge",        "Judge"                     ],
                ["speed",        "Speed (m/min)"             ],
                ["courseLength", "Course Length (m)"         ],
                ["timeAllowed",  "Time Allowed — FR (sec)"   ],
                ["timeLimit",    "Time Limit — FR (sec)"     ],
                ["joTimeAllowed","Time Allowed — JO (sec)"   ],
              ] as [keyof CourseInfo, string][]).map(([k, label]) => (
              <label key={k} className="block">
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
                <input
                  value={courseInfo[k]}
                  onChange={e => setCourseInfo(c => ({ ...c, [k]: e.target.value }))}
                  className="w-full bg-transparent border-b border-border py-1.5 text-sm outline-none focus:border-primary"
                />
              </label>
            ))}
          </div>

          {/* Obstacle lists */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            <div>
              <h3 className="font-display text-base mb-3">First Round — {frObs.length} obstacles</h3>
              <div className="flex flex-wrap gap-2">
                {frObs.map((o, i) => (
                  <span key={i} className="inline-flex items-center h-9 min-w-[2.5rem] px-2.5 rounded-lg border border-border bg-muted text-sm font-mono font-medium">{o}</span>
                ))}
              </div>
            </div>
            {hasJO && (
              <div>
                <h3 className="font-display text-base mb-3">Jump-off — {joObs.length} obstacles</h3>
                <div className="flex flex-wrap gap-2">
                  {joObs.map((o, i) => (
                    <span key={i} className="inline-flex items-center h-9 min-w-[2.5rem] px-2.5 rounded-lg border border-primary/40 bg-primary/5 text-sm font-mono font-medium text-primary">{o}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fault legend */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-display text-base mb-3">Fault Reference</h3>
            <div className="text-sm space-y-1.5">
              {[
                ["—",         "Clean (no fault) — click once on obstacle to add 4"],
                ["4",         "Knockdown / rail down = 4 penalties"],
                ["(4)R",      "First refusal / run-out = 4 penalties (marked in obstacle corner)"],
                ["8",         "Second refusal anywhere on course = 8 penalties"],
                ["E",         "Elimination: 3rd refusal; use status flags for RF/TE/MR"],
                ["Retired R", "Rider voluntarily leaves the course"],
                ["Elim. E",   "Technical Elimination (TE), Rider Fall (RF), Horse Fall (MR)"],
                ["Withdrew W","Rider withdraws before the start"],
                ["Fall F",    "Rider or horse fall"],
              ].map(([code, desc]) => (
                <div key={code} className="flex items-start gap-3">
                  <span className="font-mono text-xs text-foreground w-20 shrink-0 pt-0.5">{code}</span>
                  <span className="text-muted-foreground text-xs">{desc}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 border-t border-border pt-3">
              Time penalties: FR = 1 fault per started {frRate}s over TA · JO = 1 fault per started {joRate}s over TA
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB: Live Scoring ══════════════════════════ */}
      {tab === "scoring" && (
        <div className="flex flex-col" style={{ minHeight: "calc(100vh - 8rem)" }}>
          <div className="flex-1 max-w-6xl mx-auto w-full px-3 py-4 space-y-3">

            {/* ── Rider navigation bar ── */}
            <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-2 flex-wrap">
              <button onClick={() => setCurIdx(i => Math.max(0, i - 1))} disabled={curIdx === 0}
                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors shrink-0">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground tabular-nums w-16 text-center">
                {curIdx + 1} / {riders.length}
              </span>
              <button onClick={() => setCurIdx(i => Math.min(riders.length - 1, i + 1))} disabled={curIdx === riders.length - 1}
                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors shrink-0">
                <ChevronRight className="h-4 w-4" />
              </button>

              {cur && (
                <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Entry #</span>
                    <input
                      value={cur.entryNo}
                      onChange={e => patchRider({ entryNo: e.target.value })}
                      disabled={cur.approved}
                      placeholder="—"
                      className="w-16 bg-transparent border-b border-border py-0.5 text-sm font-mono font-semibold outline-none focus:border-primary disabled:opacity-50"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">Order: <b>{cur.orderOfGo}</b></span>
                  {curPlac != null && (
                    <span className="text-xs">Placing: <b className="font-display text-highlight">{curPlac}</b></span>
                  )}
                  {cur.approved && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-green-500/15 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                      <Lock className="h-2.5 w-2.5" /> Approved
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1.5 ml-auto">
                <button onClick={addRider}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Add Rider
                </button>
                <button onClick={removeRider} disabled={riders.length <= 1}
                  className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted hover:text-destructive disabled:opacity-30 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {cur && (
              <>
                {/* ── First Round Obstacles ── */}
                <ObstacleGrid
                  label={hasJO ? "First Round" : undefined}
                  obstacles={frObs}
                  faults={cur.fr.faults}
                  onCycle={obs => cycleFault("fr", obs)}
                  disabled={cur.approved}
                />

                {/* ── Jump-off Obstacles ── */}
                {hasJO && (
                  <ObstacleGrid
                    label="Jump-off"
                    obstacles={joObs}
                    faults={cur.jo.faults}
                    onCycle={obs => cycleFault("jo", obs)}
                    disabled={cur.approved}
                    variant="jo"
                  />
                )}

                {/* ── Rider info ── */}
                <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([
                    ["name",  "Rider"  ],
                    ["horse", "Horse"  ],
                    ["owner", "Owner"  ],
                    ["nf",    "NF/Club"],
                  ] as [keyof RiderEntry, string][]).map(([k, label]) => (
                    <label key={k} className="block col-span-1">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
                      <input
                        value={(cur[k] as string) ?? ""}
                        onChange={e => patchRider({ [k]: e.target.value })}
                        disabled={cur.approved}
                        className="w-full bg-transparent border-b border-border py-1 text-sm outline-none focus:border-primary disabled:opacity-50"
                      />
                    </label>
                  ))}
                </div>

                {/* ── Results summary ── */}
                <ResultsPanel
                  cur={cur}
                  frObs={frObs}
                  taSecs={taSecs}
                  tlSecs={tlSecs}
                  joTaSecs={joTaSecs}
                  frRate={frRate}
                  joRate={joRate}
                  hasJO={hasJO}
                  onPatchFR={p => patchRound("fr", p)}
                  onPatchJO={p => patchRound("jo", p)}
                  disabled={cur.approved}
                />

                {/* ── Note + Actions + Timer ── */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-4 items-start">
                    <div className="space-y-3">
                      {/* Entry note */}
                      <label className="block">
                        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Entry Note / Remarks</span>
                        <input
                          value={cur.note}
                          onChange={e => patchRider({ note: e.target.value })}
                          disabled={cur.approved}
                          placeholder="e.g. RT after fence 6"
                          className="w-full bg-transparent border-b border-border py-1 text-sm outline-none focus:border-primary disabled:opacity-50"
                        />
                      </label>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => { const s = new Date().toISOString(); store.save({ courseInfo, riders, savedAt: s }, { status: "submitted" }); setSavedAt(s); toast.success("Score sheet saved."); }}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                          <Save className="h-3.5 w-3.5" /> Record / Save
                        </button>
                        <button
                          onClick={() => { if (!cur.approved && confirm("Clear this rider's scores?")) { patchRider({ fr: makeRound(), jo: makeRound(), note: "" }); timer.reset(); } }}
                          disabled={cur.approved}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40">
                          <RotateCcw className="h-3.5 w-3.5" /> Clear
                        </button>
                        <button
                          onClick={toggleApprove}
                          className={`inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors ${
                            cur.approved
                              ? "border-green-500/60 bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
                              : "border-border hover:bg-muted"
                          }`}>
                          {cur.approved
                            ? <><Unlock className="h-3.5 w-3.5" /> Unlock</>
                            : <><Lock className="h-3.5 w-3.5" /> Approve & Lock</>
                          }
                        </button>
                      </div>

                      {/* Timer controls */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Timer</span>
                          <button onClick={timer.start} disabled={timer.running}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity">
                            <Play className="h-3 w-3" /> Start
                          </button>
                          <button onClick={stopAndFill} disabled={!timer.running && timer.tenths === 0}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors">
                            Stop
                          </button>
                          <button onClick={timer.running ? timer.stop : timer.start} disabled={timer.tenths === 0 && !timer.running}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors">
                            {timer.running ? <><Pause className="h-3 w-3" /> Pause</> : "Cont."}
                          </button>
                          <button onClick={timer.split} disabled={!timer.running}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors">
                            Split
                          </button>
                          <button onClick={timer.reset}
                            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors" title="Reset timer">
                            <RotateCcw className="h-3 w-3" />
                          </button>
                          {hasJO && (
                            <select value={timerRound} onChange={e => setTimerRound(e.target.value as "fr" | "jo")}
                              className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background outline-none focus:border-primary">
                              <option value="fr">→ FR time</option>
                              <option value="jo">→ JO time</option>
                            </select>
                          )}
                        </div>
                        {timer.splits.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {timer.splits.map((s, i) => (
                              <span key={i} className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
                                S{i + 1}: {fmtTenths(s)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Large timer display */}
                    <div className={`flex items-center justify-center border-2 rounded-2xl p-4 transition-colors ${timerColor}`}>
                      <span className="font-display text-5xl tabular-nums leading-none select-none">
                        {fmtTenths(timer.tenths)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Standings strip (bottom) ── */}
          <div className="border-t border-border bg-card/80 print:hidden shrink-0">
            <div className="px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">Standings</span>
              {placed.filter(r => r.placing !== null).slice(0, 6).map(r => {
                const isCur = r.id === cur?.id;
                const isJO  = r.inJO && r.jo.time !== "";
                return (
                  <button key={r.id}
                    onClick={() => { setCurIdx(riders.findIndex(re => re.id === r.id)); }}
                    className={`shrink-0 flex items-center gap-2 border rounded-lg px-2.5 py-1.5 text-left hover:bg-muted transition-colors ${isCur ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    <span className="font-display text-sm font-bold tabular-nums text-highlight w-4">{r.placing}.</span>
                    <div className="text-xs leading-tight">
                      <div className="font-medium">{r.horse || r.name || `#${r.entryNo}` || "—"}</div>
                      <div className="text-muted-foreground tabular-nums text-[10px]">
                        {isJO
                          ? `${r.jo.time} (${r.joTotal < Infinity ? r.joTotal : "E"}) JO`
                          : `${r.fr.time || "—"} (${r.frTotal < Infinity ? r.frTotal : "E"})`
                        }
                      </div>
                    </div>
                  </button>
                );
              })}
              {placed.filter(r => r.placing !== null).length === 0 && (
                <span className="text-xs text-muted-foreground">No completed rounds yet</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB: Standings ════════════════════════════ */}
      {tab === "standings" && (
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl">Standings</h2>
            <span className="text-xs text-muted-foreground">{riders.length} entries</span>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/40">
                  {["Pos","Entry","Rider","Horse","FR Jump F","FR Time","FR Time F","FR Total","JO Jump F","JO Time","JO Time F","Status","MER"].map((h, i) => (
                    <th key={i} className={`px-3 py-2.5 font-medium ${i > 3 ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {placed.map((r, rowIdx) => {
                  const frJF  = calcJF(r.fr.faults);
                  const frTF  = calcTF(r.fr.time, taSecs, frRate);
                  const frTot = frJF + frTF;
                  const joJF  = calcJF(r.jo.faults);
                  const joTF  = calcTF(r.jo.time, joTaSecs, joRate);
                  const joTot = joJF + joTF;
                  const frOut = isRoundOut(r.fr);
                  const joOut = isRoundOut(r.jo);
                  const frDone = isRoundDone(r.fr);
                  const joDone = isRoundDone(r.jo);
                  const mer   = frDone && !frOut && frJF <= 8;
                  const isCur = r.id === cur?.id;
                  return (
                    <tr key={r.id}
                      onClick={() => { setCurIdx(riders.findIndex(re => re.id === r.id)); setTab("scoring"); }}
                      className={`border-b border-border cursor-pointer transition-colors ${isCur ? "bg-primary/5" : rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20"} hover:bg-accent/40`}>
                      <td className="px-3 py-2.5 text-center font-display">
                        {r.placing
                          ? <span className="text-highlight font-bold tabular-nums">{r.placing}</span>
                          : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs">{r.entryNo || "—"}</td>
                      <td className="px-3 py-2.5 font-medium">{r.name || "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{r.horse || "—"}</td>
                      <td className="px-3 py-2.5 text-center tabular-nums">
                        {frDone ? (frOut ? <span className="text-destructive font-bold">{r.fr.status || "E"}</span> : frJF) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-muted-foreground">{r.fr.time || "—"}</td>
                      <td className="px-3 py-2.5 text-center tabular-nums">{frDone && !frOut ? frTF : "—"}</td>
                      <td className="px-3 py-2.5 text-center tabular-nums font-semibold">
                        {frDone ? (frOut ? <span className="text-destructive">{r.fr.status || "E"}</span> : frTot) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center tabular-nums">
                        {joDone ? (joOut ? <span className="text-destructive font-bold">{r.jo.status || "E"}</span> : joJF) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-muted-foreground">{r.jo.time || "—"}</td>
                      <td className="px-3 py-2.5 text-center tabular-nums">{joDone && !joOut ? joTF : "—"}</td>
                      <td className="px-3 py-2.5 text-center text-xs text-muted-foreground">
                        {r.fr.status || r.jo.status || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {mer
                          ? <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500/15 text-green-600 mx-auto"><Check className="h-3 w-3" /></span>
                          : <span className="text-muted-foreground/30 text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-muted-foreground mt-3">
            MER = ≤ 8 jumping penalties in first round (excluding time penalties). Click any row to open in Live Scoring.
          </p>
        </div>
      )}

      {/* ══════════════════════ TAB: Score Sheet ══════════════════════════ */}
      {tab === "sheet" && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <h2 className="font-display text-2xl">Score Sheet</h2>
            <button onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              <Printer className="h-3.5 w-3.5" /> Export / Print
            </button>
          </div>

          {/* Print header */}
          <div className="bg-primary text-primary-foreground rounded-xl p-4 mb-4 text-center print:rounded-none">
            <div className="font-display text-xl font-bold">
              {courseInfo.eventTitle || config.label}
            </div>
            <div className="text-sm opacity-80 mt-0.5">
              {courseInfo.className}
              {courseInfo.date && ` · ${courseInfo.date}`}
              {courseInfo.judge && ` · Judge: ${courseInfo.judge}`}
            </div>
            {(taSecs > 0 || courseInfo.speed) && (
              <div className="text-xs opacity-60 mt-0.5">
                TA: {courseInfo.timeAllowed}s · TL: {courseInfo.timeLimit || (taSecs * 2) + ""}s
                {courseInfo.speed && ` · Speed: ${courseInfo.speed} m/min`}
                {courseInfo.courseLength && ` · Length: ${courseInfo.courseLength} m`}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-x-auto print:border-none print:rounded-none">
            <table className="w-full text-xs border-collapse" style={{ minWidth: "800px" }}>
              <thead>
                <tr className="text-[9px] uppercase tracking-wider text-muted-foreground bg-muted/40">
                  <Th>Pos</Th>
                  <Th>Entry</Th>
                  <Th cls="text-left min-w-[90px]">Rider</Th>
                  <Th cls="text-left min-w-[80px]">Horse</Th>
                  {frObs.map(o => <Th key={o} cls="w-8">{o}</Th>)}
                  <Th cls="w-10">JF</Th>
                  <Th cls="w-18">Time</Th>
                  <Th cls="w-8">TF</Th>
                  <Th cls="w-12 font-bold">Total</Th>
                  {hasJO && joObs.map(o => <Th key={`jo-${o}`} cls="w-8 bg-primary/5">JO {o}</Th>)}
                  {hasJO && <><Th cls="w-10 bg-primary/5">JO JF</Th><Th cls="w-18 bg-primary/5">JO Time</Th><Th cls="w-8 bg-primary/5">JO TF</Th><Th cls="w-12 bg-primary/5">JO Tot</Th></>}
                  <Th cls="w-20">Note</Th>
                </tr>
              </thead>
              <tbody>
                {placed.map((r, rowIdx) => {
                  const frJF  = calcJF(r.fr.faults);
                  const frTF  = calcTF(r.fr.time, taSecs, frRate);
                  const frTot = frJF + frTF;
                  const joJF  = calcJF(r.jo.faults);
                  const joTF  = calcTF(r.jo.time, joTaSecs, joRate);
                  const joTot = joJF + joTF;
                  const frOut = isRoundOut(r.fr);
                  const joOut = isRoundOut(r.jo);
                  const frDone = isRoundDone(r.fr);
                  return (
                    <tr key={r.id} className={rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="border border-border px-2 py-1.5 text-center font-display font-bold text-highlight">{r.placing ?? "—"}</td>
                      <td className="border border-border px-2 py-1.5 text-center font-mono">{r.entryNo || rowIdx + 1}</td>
                      <td className="border border-border px-2 py-1.5 font-medium">{r.name || "—"}</td>
                      <td className="border border-border px-2 py-1.5 text-muted-foreground">{r.horse || "—"}</td>
                      {frObs.map(o => {
                        const f = r.fr.faults[o] || "";
                        return (
                          <td key={o} className={`border border-border px-0.5 py-1.5 text-center font-mono ${FAULT_BTN_CLS[f as FaultCode]}`}>
                            {FAULT_LABEL[f as FaultCode] ?? "—"}
                          </td>
                        );
                      })}
                      <td className="border border-border px-2 py-1.5 text-center font-semibold tabular-nums bg-muted/40">
                        {frDone ? (frOut ? r.fr.status || "E" : frJF) : "—"}
                      </td>
                      <td className="border border-border px-2 py-1.5 text-center tabular-nums">{r.fr.time || "—"}</td>
                      <td className="border border-border px-2 py-1.5 text-center tabular-nums">{frDone && !frOut ? frTF : "—"}</td>
                      <td className="border border-border px-2 py-1.5 text-center font-bold tabular-nums bg-highlight/10 text-highlight">
                        {frDone ? (frOut ? r.fr.status || "E" : frTot) : "—"}
                      </td>
                      {hasJO && joObs.map(o => {
                        const f = r.jo.faults[o] || "";
                        return (
                          <td key={`jo-${o}`} className={`border border-border px-0.5 py-1.5 text-center font-mono bg-primary/5 ${FAULT_BTN_CLS[f as FaultCode]}`}>
                            {FAULT_LABEL[f as FaultCode] ?? "—"}
                          </td>
                        );
                      })}
                      {hasJO && (
                        <>
                          <td className="border border-border px-2 py-1.5 text-center tabular-nums bg-primary/5 font-semibold">
                            {r.jo.time ? (joOut ? r.jo.status || "E" : joJF) : "—"}
                          </td>
                          <td className="border border-border px-2 py-1.5 text-center tabular-nums bg-primary/5">{r.jo.time || "—"}</td>
                          <td className="border border-border px-2 py-1.5 text-center tabular-nums bg-primary/5">{r.jo.time && !joOut ? joTF : "—"}</td>
                          <td className="border border-border px-2 py-1.5 text-center font-bold tabular-nums bg-primary/10 text-primary">
                            {r.jo.time ? (joOut ? r.jo.status || "E" : joTot) : "—"}
                          </td>
                        </>
                      )}
                      <td className="border border-border px-2 py-1.5 text-muted-foreground max-w-[80px] truncate">{r.note || ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signature line */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Judge's Signature</div>
              <div className="border-b border-dashed border-border h-8" />
              <div className="text-xs text-muted-foreground mt-2">{courseInfo.judge || "—"}</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Date</div>
              <div className="text-sm">{courseInfo.date || "—"}</div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground mt-4 text-center print:block">
            Results compiled by Horsey · Equestrian Scoring Platform · All results are unofficial until signed by the judge.
            EL=Eliminated, RT=Retired, FL=Fall, WD=Withdrew.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Obstacle Grid ────────────────────────────────────────────────────────────

function ObstacleGrid({
  label,
  obstacles,
  faults,
  onCycle,
  disabled,
  variant = "fr",
}: {
  label?: string;
  obstacles: string[];
  faults: Record<string, FaultCode>;
  onCycle: (obs: string) => void;
  disabled: boolean;
  variant?: "fr" | "jo";
}) {
  return (
    <div className={`bg-card border rounded-xl p-3 ${variant === "jo" ? "border-primary/30" : "border-border"}`}>
      {label && (
        <div className={`text-[10px] uppercase tracking-wider font-medium mb-2 ${variant === "jo" ? "text-primary" : "text-muted-foreground"}`}>
          {label}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {obstacles.map(obs => {
          const f = faults[obs] ?? "";
          return (
            <button
              key={obs}
              onClick={() => onCycle(obs)}
              disabled={disabled}
              title={`${obs}: ${FAULT_LABEL[f as FaultCode] ?? "—"} — click to cycle fault`}
              className={`flex flex-col items-center min-w-[2.5rem] px-2 py-1.5 rounded-lg border text-xs transition-all select-none disabled:cursor-not-allowed disabled:opacity-60 hover:scale-105 active:scale-95 ${FAULT_BTN_CLS[f as FaultCode]}`}
            >
              <span className="font-mono font-semibold leading-none">{obs}</span>
              <span className="leading-none mt-1 text-[10px] tabular-nums">{FAULT_LABEL[f as FaultCode]}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[9px] text-muted-foreground mt-2">Click obstacle to cycle: — → 4 → (4)R → 8 → E → —</p>
    </div>
  );
}

// ─── Results Panel ────────────────────────────────────────────────────────────

function ResultsPanel({
  cur, frObs, taSecs, tlSecs, joTaSecs, frRate, joRate, hasJO,
  onPatchFR, onPatchJO, disabled,
}: {
  cur: RiderEntry;
  frObs: string[];
  taSecs: number;
  tlSecs: number;
  joTaSecs: number;
  frRate: number;
  joRate: number;
  hasJO: boolean;
  onPatchFR: (p: Partial<RoundData>) => void;
  onPatchJO: (p: Partial<RoundData>) => void;
  disabled: boolean;
}) {
  const frJF  = calcJF(cur.fr.faults);
  const frTF  = calcTF(cur.fr.time, taSecs, frRate);
  const frOut = isRoundOut(cur.fr);
  const joJF  = calcJF(cur.jo.faults);
  const joTF  = calcTF(cur.jo.time, joTaSecs, joRate);
  const joOut = isRoundOut(cur.jo);

  const frElapsedSecs = parseSecs(cur.fr.time);
  const frOverTA = taSecs > 0 && frElapsedSecs > taSecs;
  const frOverTL = tlSecs > 0 && frElapsedSecs > tlSecs;
  const joElapsedSecs = parseSecs(cur.jo.time);
  const joOverTA = joTaSecs > 0 && joElapsedSecs > joTaSecs;

  const rows = [
    {
      label: "First Round", round: cur.fr, jf: frJF, tf: frTF, out: frOut,
      onPatch: onPatchFR, overTA: frOverTA, overLimit: frOverTL,
    },
    ...(hasJO ? [{
      label: "Jump-off", round: cur.jo, jf: joJF, tf: joTF, out: joOut,
      onPatch: onPatchJO, overTA: joOverTA, overLimit: false,
    }] : []),
  ];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[9px] uppercase tracking-wider text-muted-foreground bg-muted/40">
            <th className="px-3 py-2 text-left w-28">Round</th>
            <th className="px-3 py-2 text-center w-20">Jump Faults</th>
            <th className="px-3 py-2 text-center w-24">Time</th>
            <th className="px-3 py-2 text-center w-24">Time Penalty</th>
            <th className="px-3 py-2 text-center w-20">Time Faults</th>
            <th className="px-3 py-2 text-center w-20 font-bold">Total</th>
            <th className="px-3 py-2 text-left">Status Flags</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, round, jf, tf, out, onPatch, overTA, overLimit }) => (
            <tr key={label} className="border-t border-border">
              <td className="px-3 py-2.5 font-medium text-xs">{label}</td>
              <td className="px-2 py-2 text-center">
                <span className={`font-display tabular-nums text-base ${out ? "text-destructive" : jf > 0 ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`}>
                  {out ? (round.status || "E") : jf || "—"}
                </span>
              </td>
              <td className="px-2 py-2">
                <input
                  value={round.time}
                  onChange={e => onPatch({ time: e.target.value })}
                  disabled={disabled}
                  placeholder="ss.x"
                  className={`w-full bg-transparent border-b py-0.5 text-center tabular-nums text-sm font-mono outline-none focus:border-primary disabled:opacity-50 transition-colors ${
                    overLimit ? "border-destructive text-destructive" :
                    overTA    ? "border-orange-400 text-orange-600" :
                    "border-border"
                  }`}
                />
              </td>
              <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">
                {round.time && !out
                  ? <span className={overTA ? "text-orange-600 font-medium" : ""}>{(Math.max(0, parseSecs(round.time) - (label === "Jump-off" ? joTaSecs : taSecs))).toFixed(1)}s</span>
                  : "—"}
              </td>
              <td className="px-2 py-2 text-center tabular-nums">
                <span className={tf > 0 && !out ? "text-orange-600 dark:text-orange-400 font-semibold" : "text-muted-foreground"}>
                  {!out && round.time ? tf : "—"}
                </span>
              </td>
              <td className="px-2 py-2 text-center">
                <span className={`font-display tabular-nums text-base font-semibold ${out ? "text-destructive" : (jf + tf) > 0 ? "text-highlight" : "text-muted-foreground"}`}>
                  {out ? (round.status || "E") : round.time ? (jf + tf) : "—"}
                </span>
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {STATUS_FLAGS.map(({ key, label: flagLabel }) => (
                    <button
                      key={key}
                      onClick={() => onPatch({ status: round.status === key ? "" : key })}
                      disabled={disabled}
                      title={flagLabel}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors disabled:opacity-40 ${
                        round.status === key
                          ? "bg-destructive text-destructive-foreground border-destructive"
                          : "border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground"
                      }`}>
                      {flagLabel}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tlSecs > 0 && (
        <div className="px-3 pb-2 text-[9px] text-muted-foreground">
          TA = {taSecs}s · TL = {tlSecs}s (exceeding TL: time shown but entry disqualified)
          {hasJO && joTaSecs !== taSecs && ` · JO TA = ${joTaSecs}s`}
        </div>
      )}
    </div>
  );
}

// ─── Small helper ─────────────────────────────────────────────────────────────

function Th({ children, cls = "" }: { children: React.ReactNode; cls?: string }) {
  return (
    <th className={`px-2 py-2 font-medium text-center ${cls}`}>{children}</th>
  );
}
