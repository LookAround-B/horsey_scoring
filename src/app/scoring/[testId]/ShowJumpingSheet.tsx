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
import { SJ1_60_70_RIDERS } from "@/lib/startListRiders";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";

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
  category: string;
  scheduledTime: string;
  orderOfGo: number;
  fr: RoundData;
  jo: RoundData;
  note: string;
  approved: boolean;
  advancesToJO: boolean;   // admin decides who goes to the jump-off
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
  organiser: string;     // host club / school
  location: string;      // city, country
  dayLabel: string;      // e.g. "Saturday"
  scoring: string;       // FEI table / article, e.g. "Table A — Art. 238.2.2"
  courseDesigner: string;
  table: string;         // scoring table, e.g. "A"
  height: string;        // fence height, e.g. "60 - 70 CM"
  efforts: string;       // jumping efforts count
  courseWalk: string;    // course walk time
  startTime: string;     // class start time
};

// ─── Constants ────────────────────────────────────────────────────────────────

const FAULT_CYCLE: FaultCode[] = ["", "4", "4R", "8", "E"];

const FAULT_LABEL: Record<FaultCode, string> = {
  "": "✔️", "4": "4", "4R": "(4)R", "8": "8", "E": "E",
};

// Plain-ink labels for the printed score sheet (mirrors the handwritten sheet)
const SHEET_FAULT_LABEL: Record<FaultCode, string> = {
  "": "✓", "4": "4", "4R": "R1", "8": "R2", "E": "E",
};

// Word written across the obstacle row when a round ends early
function statusWord(r: RoundData): string {
  if (r.status === "R") return "RETIRED";
  if (r.status === "W") return "WITHDRAWN";
  if (r.status === "F") return "ELIMINATED";
  if (r.status === "E" || hasElimFault(r.faults)) return "ELIMINATED";
  return "";
}

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
  category: "", scheduledTime: "",
  orderOfGo: n, fr: makeRound(), jo: makeRound(), note: "", approved: false,
  advancesToJO: false,
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
    // Only riders the admin has advanced can enter the jump-off tier.
    const joActive  = r.advancesToJO && (joHasTime || isElimStatus(r.jo.status) || isRetStatus(r.jo.status));
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
  isAdmin = false,
}: {
  config: ShowJumpingConfig;
  slug: string;
  eventId?: string | null;
  isAdmin?: boolean;
}) {
  const frObs: string[] = config.firstRoundObstacles
    ?? config.obstacles.map((o, i) => o.name || String(i + 1));
  const joObs: string[] = config.jumpoffObstacles ?? [];
  const hasJO = joObs.length > 0;
  const frRate = config.timePenaltyRateFR ?? 4;
  const joRate = config.timePenaltyRateJO ?? 1;

  const STORAGE_KEY = `sj-live-v1:${slug}`;
  const store = useScoreStore({ slug, eventId, riderId: null, localKey: STORAGE_KEY });
  const { confirm, dialog: confirmDialog } = useConfirm();

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
    organiser:      "",
    location:       "",
    dayLabel:       "",
    scoring:        "",
    courseDesigner: "",
    table:          "A",
    height:         "",
    efforts:        "",
    courseWalk:     "",
    startTime:      "",
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
    if (round === "jo" && !cur.advancesToJO) return;
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

  const removeRider = async () => {
    if (riders.length <= 1) return;
    const ok = await confirm({
      title: "Remove this rider?",
      description: "This entry and its scores will be removed from the sheet.",
      confirmText: "Remove",
      destructive: true,
    });
    if (!ok) return;
    setRiders(rs => rs.filter((_, i) => i !== curIdx));
    setCurIdx(i => Math.max(0, i - 1));
  };

  const stopAndFill = () => {
    timer.stop();
    if (timer.tenths > 0) {
      const round = timerRound === "jo" && cur?.advancesToJO ? "jo" : "fr";
      patchRound(round, { time: fmtTenths(timer.tenths) });
    }
  };

  const toggleApprove = () => {
    if (!cur) return;
    const next = !cur.approved;
    patchRider({ approved: next });
    toast(next ? `${cur.name || "Rider"} approved & locked.` : "Unlocked for editing.", {
      icon: next ? "🔒" : "🔓",
    });
  };

  const toggleAdvance = () => {
    if (!cur) return;
    const next = !cur.advancesToJO;
    patchRider({ advancesToJO: next });
    toast(
      next
        ? `${cur.name || "Rider"} advanced to the jump-off.`
        : `${cur.name || "Rider"} removed from the jump-off.`,
      { icon: next ? "🏆" : "↩️" }
    );
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
      {confirmDialog}

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
            {([ ["organiser",    "Organiser / Host"          ],
                ["eventTitle",   "Event Title"               ],
                ["location",     "Location (City, Country)"  ],
                ["className",    "Class / Category"          ],
                ["table",        "Table (e.g. A)"            ],
                ["height",       "Height (e.g. 60 - 70 CM)"  ],
                ["scoring",      "Scoring (FEI Table / Art.)"],
                ["efforts",      "Jumping Efforts"           ],
                ["date",         "Date"                      ],
                ["dayLabel",     "Day (e.g. Saturday)"       ],
                ["startTime",    "Start Time"                ],
                ["courseWalk",   "Course Walk"               ],
                ["judge",        "Judge / Ground Jury"       ],
                ["courseDesigner","Course Designer"          ],
                ["speed",        "Speed (m/min)"             ],
                ["courseLength", "Course Length (m)"         ],
                ["timeAllowed",  "Time Allowed — FR (sec)"   ],
                ["timeLimit",    "Time Limit — FR (sec)"     ],
                ["joTimeAllowed","Time Allowed — JO (sec)"   ],
              ] as [keyof CourseInfo, string][]).map(([k, label]) => (
              <label key={k} className="block">
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
                <Input
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
                    <Input
                      value={cur.entryNo}
                      onChange={e => patchRider({ entryNo: e.target.value })}
                      disabled={cur.approved}
                      placeholder="—"
                      className="w-16 bg-transparent border-b border-border py-0.5 text-sm font-mono font-semibold outline-none focus:border-primary disabled:opacity-50"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sched. Time</span>
                    <Input
                      value={cur.scheduledTime}
                      onChange={e => patchRider({ scheduledTime: e.target.value })}
                      disabled={cur.approved}
                      placeholder="To Follow"
                      className="w-24 bg-transparent border-b border-border py-0.5 text-sm font-mono outline-none focus:border-primary disabled:opacity-50"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">Order: <b>{cur.orderOfGo}</b></span>
                  {curPlac != null && (
                    <span className="text-xs">Placing: <b className="font-display text-highlight">{curPlac}</b></span>
                  )}
                  {hasJO && cur.advancesToJO && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                      <Trophy className="h-2.5 w-2.5" /> Jump-off
                    </span>
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
                {/* ── On-course hero (live running score) ── */}
                {(() => {
                  const showJO = hasJO && cur.advancesToJO && (cur.jo.time !== "" || Object.values(cur.jo.faults).some(Boolean));
                  const rd  = showJO ? cur.jo : cur.fr;
                  const jf  = calcJF(rd.faults);
                  const tf  = calcTF(rd.time, showJO ? joTaSecs : taSecs, showJO ? joRate : frRate);
                  const out = isRoundOut(rd);
                  return (
                    <div className="rounded-xl p-4 flex items-center justify-between gap-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-[0.2em] opacity-70 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                          On Course{showJO ? " · Jump-off" : ""}
                        </div>
                        <div className="font-display text-2xl font-bold truncate leading-tight mt-0.5">
                          {cur.name || (cur.entryNo ? `#${cur.entryNo}` : "Rider")}
                        </div>
                        <div className="text-sm opacity-80 truncate">
                          {cur.horse || "—"}{cur.category ? ` · ${cur.category}` : ""}
                        </div>
                      </div>
                      <div className="flex items-stretch gap-4 shrink-0 text-center">
                        <div className="flex flex-col justify-center">
                          <div className="text-[9px] uppercase tracking-wider opacity-60">Jump</div>
                          <div className="font-display text-xl font-bold tabular-nums">{out ? "—" : jf}</div>
                        </div>
                        <div className="flex flex-col justify-center">
                          <div className="text-[9px] uppercase tracking-wider opacity-60">Time Pen</div>
                          <div className="font-display text-xl font-bold tabular-nums">{out || !rd.time ? "—" : tf}</div>
                        </div>
                        <div className="w-px bg-primary-foreground/25" />
                        <div className="flex flex-col justify-center">
                          <div className="text-[9px] uppercase tracking-wider opacity-60">Penalties</div>
                          <div className="font-display text-4xl font-bold tabular-nums leading-none">
                            {out ? (rd.status || "E") : rd.time ? jf + tf : jf}
                          </div>
                        </div>
                        {curPlac != null && (
                          <>
                            <div className="w-px bg-primary-foreground/25" />
                            <div className="flex flex-col justify-center">
                              <div className="text-[9px] uppercase tracking-wider opacity-60">Rank</div>
                              <div className="font-display text-3xl font-bold tabular-nums leading-none text-amber-300">{curPlac}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

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
                    disabled={cur.approved || !cur.advancesToJO}
                    variant="jo"
                    lockedHint={
                      !cur.advancesToJO
                        ? isAdmin
                          ? "Mark this rider as advancing to enable the jump-off."
                          : "This rider is not in the jump-off."
                        : undefined
                    }
                  />
                )}

                {/* ── Rider info ── */}
                <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([
                    ["name",     "Rider"   ],
                    ["horse",    "Horse"   ],
                    ["category", "Category"],
                    ["owner",    "Owner"   ],
                    ["nf",       "Club"    ],
                  ] as [keyof RiderEntry, string][]).map(([k, label]) => (
                    <label key={k} className="block col-span-1">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
                      <Input
                        value={(cur[k] as string) ?? ""}
                        onChange={e => patchRider({ [k]: e.target.value })}
                        disabled={cur.approved}
                        className="w-full bg-transparent border-b border-border py-1 text-sm outline-none focus:border-primary disabled:opacity-50"
                      />
                    </label>
                  ))}

                  {/* ── Start-list picker (EPL 2026 · 60-70cm · 67 riders) ── */}
                  <div className="block col-span-1">
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Start List</span>
                    <Select
                      value={cur.entryNo || undefined}
                      onValueChange={val => {
                        const r = SJ1_60_70_RIDERS.find(x => String(x.sl) === val);
                        if (r) patchRider({
                          entryNo: String(r.sl),
                          name: r.name,
                          horse: r.horse,
                          category: r.category,
                          nf: r.club,
                        });
                      }}
                      disabled={cur.approved}
                    >
                      <SelectTrigger className="w-full border-0 border-b border-border rounded-none bg-transparent px-0 py-1 h-auto text-sm focus:ring-0 focus:border-primary">
                        <SelectValue placeholder="Select rider…" />
                      </SelectTrigger>
                      <SelectContent>
                        {SJ1_60_70_RIDERS.map(r => (
                          <SelectItem key={r.sl} value={String(r.sl)}>
                            {r.sl}. {r.name} — {r.horse}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  joLocked={!cur.advancesToJO}
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
                        <Input
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
                          onClick={async () => {
                            if (cur.approved) return;
                            const ok = await confirm({
                              title: "Clear this rider's scores?",
                              description: "Faults, times and notes for this entry will be reset.",
                              confirmText: "Clear",
                              destructive: true,
                            });
                            if (ok) { patchRider({ fr: makeRound(), jo: makeRound(), note: "" }); timer.reset(); toast.success("Rider scores cleared."); }
                          }}
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
                        {isAdmin && hasJO && (
                          <button
                            onClick={toggleAdvance}
                            className={`inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors ${
                              cur.advancesToJO
                                ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                                : "border-border hover:bg-muted"
                            }`}>
                            <Trophy className="h-3.5 w-3.5" />
                            {cur.advancesToJO ? "In Jump-off — remove" : "Advance to Jump-off"}
                          </button>
                        )}
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
                          {hasJO && cur.advancesToJO && (
                            <Select value={timerRound} onValueChange={v => setTimerRound(v as "fr" | "jo")}>
                              <SelectTrigger className="h-8 text-xs rounded-lg px-2 bg-background w-auto gap-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fr">→ FR time</SelectItem>
                                <SelectItem value="jo">→ JO time</SelectItem>
                              </SelectContent>
                            </Select>
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
      {tab === "standings" && (() => {
        const ranked  = placed.filter(r => r.placing != null);
        const pending = placed.filter(r => r.placing == null);
        const leader  = ranked[0];
        const lFaults = leader ? (leader.inJO ? leader.joTotal : leader.frTotal) : 0;
        const lTime   = leader ? parseSecs(leader.inJO ? leader.jo.time : leader.fr.time) : 0;
        const gridCls = hasJO
          ? "grid-cols-[44px_1fr_56px_56px_84px_76px]"
          : "grid-cols-[44px_1fr_64px_84px_76px]";

        return (
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl leading-none">Live Standings</h2>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Live
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              <b className="text-foreground tabular-nums">{ranked.length}</b> placed · {riders.length} entries
            </div>
          </div>

          {/* Column header */}
          <div className={`hidden sm:grid ${gridCls} gap-2 px-3 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground`}>
            <span className="text-center">Rank</span>
            <span>Rider / Horse</span>
            <span className="text-center">{hasJO ? "R1" : "Pen"}</span>
            {hasJO && <span className="text-center">JO</span>}
            <span className="text-center">Time</span>
            <span className="text-right">Gap</span>
          </div>

          {/* Leaderboard */}
          <div className="space-y-1.5">
            {ranked.map(r => {
              const frOut  = isRoundOut(r.fr);
              const joOut  = isRoundOut(r.jo);
              const out    = r.inJO ? joOut : frOut;
              const eff    = r.inJO ? r.joTotal : r.frTotal;
              const effT   = parseSecs(r.inJO ? r.jo.time : r.fr.time);
              const isLead = r.placing === 1;
              const isCur  = r.id === cur?.id;
              const decTime = r.inJO && r.jo.time ? r.jo.time : (r.fr.time || "—");
              const gap = isLead ? "" : eff === lFaults ? `+${(effT - lTime).toFixed(2)}` : `+${eff - lFaults}`;
              const clear = !out && (r.inJO ? r.joTotal === 0 : r.frTotal === 0);
              const medal =
                r.placing === 1 ? "bg-amber-400 text-amber-950 ring-2 ring-amber-300" :
                r.placing === 2 ? "bg-zinc-300 text-zinc-800 ring-2 ring-zinc-200 dark:bg-zinc-400" :
                r.placing === 3 ? "bg-orange-400 text-orange-950 ring-2 ring-orange-300" :
                "bg-muted text-foreground";
              return (
                <button key={r.id}
                  onClick={() => { setCurIdx(riders.findIndex(re => re.id === r.id)); setTab("scoring"); }}
                  className={`w-full grid ${gridCls} gap-2 items-center rounded-xl border px-3 py-2.5 text-left transition-all ${
                    isLead ? "border-amber-400/60 bg-amber-50/60 dark:bg-amber-950/10"
                    : isCur ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted/40"}`}>
                  <div className="flex justify-center">
                    <span className={`h-8 w-8 shrink-0 rounded-full grid place-items-center font-display font-bold text-sm tabular-nums ${medal}`}>{r.placing}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate flex items-center gap-2">
                      <span className="truncate">{r.name || (r.entryNo ? `#${r.entryNo}` : "—")}</span>
                      {out ? <Pill tone="red">{(r.inJO ? r.jo.status : r.fr.status) || "ELIM"}</Pill>
                       : clear ? <Pill tone="green">CLEAR</Pill> : null}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.horse || "—"}{r.category ? ` · ${r.category}` : ""}
                    </div>
                  </div>
                  <div className="text-center tabular-nums font-semibold">
                    {frOut ? <span className="text-destructive text-xs">{r.fr.status || "E"}</span> : r.frTotal < Infinity ? r.frTotal : "—"}
                  </div>
                  {hasJO && (
                    <div className="text-center tabular-nums font-semibold text-primary">
                      {r.inJO && r.jo.time ? (joOut ? <span className="text-destructive text-xs">{r.jo.status || "E"}</span> : r.joTotal) : "—"}
                    </div>
                  )}
                  <div className="text-center tabular-nums text-sm">{decTime}</div>
                  <div className="text-right tabular-nums text-sm">
                    {isLead ? <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Leader</span>
                            : <span className="text-muted-foreground">{gap}</span>}
                  </div>
                </button>
              );
            })}
            {ranked.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-10 border border-dashed border-border rounded-xl">
                No completed rounds yet — standings update live as riders finish.
              </div>
            )}
          </div>

          {/* Pending / not yet completed */}
          {pending.length > 0 && (
            <>
              <div className="mt-6 mb-2 px-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                Start list · yet to complete ({pending.length})
              </div>
              <div className="space-y-1">
                {pending.map(r => {
                  const frOut = isRoundOut(r.fr);
                  return (
                    <button key={r.id}
                      onClick={() => { setCurIdx(riders.findIndex(re => re.id === r.id)); setTab("scoring"); }}
                      className="w-full flex items-center gap-3 rounded-lg border border-border/60 bg-card/50 px-3 py-2 text-left hover:bg-muted/40 transition-colors">
                      <span className="h-6 w-6 shrink-0 rounded-full bg-muted grid place-items-center text-[10px] font-mono text-muted-foreground">
                        {r.entryNo || r.orderOfGo}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{r.name || "—"}</div>
                        <div className="text-xs text-muted-foreground truncate">{r.horse || "—"}</div>
                      </div>
                      {frOut
                        ? <Pill tone="red">{r.fr.status || "ELIM"}</Pill>
                        : <span className="text-[10px] uppercase tracking-wide text-muted-foreground">To jump</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <p className="text-[10px] text-muted-foreground mt-5 px-3">
            Ranking: fewest penalties, then fastest time{hasJO ? " · jump-off decides clear first rounds" : ""}.
            Penalties — knockdown 4 · 1st refusal 4 · time {frRate}s rule (FR){hasJO ? ` / ${joRate}s (JO)` : ""}. Tap a row to score.
          </p>
        </div>
        );
      })()}

      {/* ══════════════════════ TAB: Score Sheet ══════════════════════════ */}
      {tab === "sheet" && (
        <div className="sj-sheet max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <h2 className="font-display text-2xl">Score Sheet</h2>
            <button onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              <Printer className="h-3.5 w-3.5" /> Export / Print
            </button>
          </div>

          {/* Print rules: landscape, fit-to-page, exact colours */}
          <style>{`
            @media print {
              @page { size: A4 landscape; margin: 8mm; }
              html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff; }
              .sj-sheet { max-width: none !important; padding: 0 !important; }
              .sj-table-wrap { overflow: visible !important; }
              .sj-table { min-width: 0 !important; width: 100% !important; table-layout: fixed; font-size: 7.5px !important; }
              .sj-table td, .sj-table th { padding: 1.5px 2px !important; }
              .sj-banner { break-inside: avoid; }
              .sj-sign { break-inside: avoid; }
              tr { break-inside: avoid; }
            }
          `}</style>

          {/* ── Event banner (matches official EPL sheet) ── */}
          <div className="sj-banner border-[1.5px] border-neutral-900 overflow-hidden mb-3 bg-white text-neutral-900 print:rounded-none">
            {/* Masthead: logo box + green title band */}
            <div className="flex items-stretch border-b-[1.5px] border-neutral-900">
              <div className="border-r-[1.5px] border-neutral-900 px-3 py-2 flex items-center justify-center min-w-[150px] bg-white">
                <EmbassyLogo className="h-9 w-auto" />
              </div>
              <div className="flex-1 bg-[#8cb63c] flex items-center justify-center px-4 py-2.5">
                <div className="font-display font-bold uppercase text-neutral-900 text-center leading-tight text-lg md:text-2xl tracking-tight">
                  {`${courseInfo.eventTitle || "Equestrian Premier League"}${courseInfo.dayLabel ? "  " + courseInfo.dayLabel : ""}${courseInfo.date ? " , " + courseInfo.date : ""}`}
                </div>
              </div>
            </div>

            {/* Info block */}
            <div className="grid grid-cols-2 md:grid-cols-4 text-[11px] divide-x divide-neutral-300">
              <div className="px-3 py-2 space-y-0.5">
                <Info label="Table" value={courseInfo.table} />
                <Info label="Height" value={courseInfo.height} />
                <Info label="Obstacles" value={String(frObs.length)} />
                <Info label="Efforts" value={courseInfo.efforts} />
              </div>
              <div className="px-3 py-2 space-y-0.5">
                <Info label="Date" value={courseInfo.date} />
                <Info label="Judge" value={courseInfo.judge} />
                <Info label="Course Designer" value={courseInfo.courseDesigner} />
              </div>
              <div className="px-3 py-2 space-y-0.5">
                <Info label="Speed" value={courseInfo.speed ? `${courseInfo.speed} m/min` : ""} />
                <Info label="Length" value={courseInfo.courseLength ? `${courseInfo.courseLength} m` : ""} />
                <Info label="Time Allowed" value={taSecs > 0 ? `${taSecs}s` : ""} />
                <Info label="Time Limit" value={tlSecs > 0 ? `${tlSecs}s` : ""} />
              </div>
              <div className="px-3 py-2 space-y-0.5">
                <Info label="Course Walk" value={courseInfo.courseWalk} />
                <Info label="Start Time" value={courseInfo.startTime} />
                {hasJO && <Info label="JO Time Allowed" value={joTaSecs > 0 ? `${joTaSecs}s` : ""} />}
              </div>
            </div>

            {hasJO && (
              <div className="px-3 py-1 border-t border-neutral-300 text-[10px] flex items-center gap-2">
                <span className="font-bold uppercase tracking-wide">Jump-off:</span>
                <span className="text-neutral-600 font-mono">{joObs.join(" · ")}</span>
              </div>
            )}
          </div>

          <div className="sj-table-wrap bg-card border border-border rounded-xl overflow-x-auto print:border-none print:rounded-none">
            <table className="sj-table w-full text-xs border-collapse" style={{ minWidth: "800px" }}>
              {/* Fixed widths for narrow cols; Rider/Horse absorb the leftover space */}
              <colgroup>
                <col style={{ width: "26px" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "13%" }} />
                {frObs.map((o, i) => <col key={`c-${o}-${i}`} style={{ width: "20px" }} />)}
                <col style={{ width: "34px" }} />
                <col style={{ width: "42px" }} />
                <col style={{ width: "34px" }} />
                <col style={{ width: "40px" }} />
                {hasJO && joObs.map((o, i) => <col key={`cjo-${o}-${i}`} style={{ width: "20px" }} />)}
                {hasJO && <><col style={{ width: "34px" }} /><col style={{ width: "42px" }} /><col style={{ width: "34px" }} /><col style={{ width: "40px" }} /></>}
                <col style={{ width: "30px" }} />
              </colgroup>
              <thead>
                <tr className="text-[9px] uppercase tracking-wider text-neutral-700 bg-neutral-100">
                  <Th cls="w-10">No.</Th>
                  <Th cls="text-left min-w-[120px]">Rider Name</Th>
                  <Th cls="text-left min-w-[100px]">Horse</Th>
                  {frObs.map(o => <Th key={o} cls="w-7">{o}</Th>)}
                  <Th cls="w-12">Jump Pen</Th>
                  <Th cls="w-16">Time</Th>
                  <Th cls="w-12">Time Pen</Th>
                  <Th cls="w-14 font-bold">Total Pen</Th>
                  {hasJO && joObs.map(o => <Th key={`jo-${o}`} cls="w-7 bg-primary/5">JO {o}</Th>)}
                  {hasJO && <><Th cls="w-12 bg-primary/5">JO Jump Pen</Th><Th cls="w-16 bg-primary/5">JO Time</Th><Th cls="w-12 bg-primary/5">JO Time Pen</Th><Th cls="w-14 bg-primary/5">JO Total Pen</Th></>}
                  <Th cls="w-12 font-bold">Place</Th>
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
                  // A round only shows marks once the rider has actually gone.
                  const frHasMarks = Object.values(r.fr.faults).some(Boolean);
                  const frStarted  = frDone || frHasMarks;
                  const joHasMarks = Object.values(r.jo.faults).some(Boolean);
                  const joStarted  = r.jo.time !== "" || joOut || joHasMarks;
                  const frWord = statusWord(r.fr);
                  const joWord = statusWord(r.jo);
                  const cell = "border border-neutral-400 px-1 py-1.5 text-center";
                  return (
                    <tr key={r.id} className="bg-white text-neutral-900">
                      <td className={`${cell} font-mono`}>{r.entryNo || rowIdx + 1}</td>
                      <td className={`${cell} !text-left px-2 font-medium`}>{r.name || ""}</td>
                      <td className={`${cell} !text-left px-2`}>{r.horse || ""}</td>

                      {/* First-round obstacles — blank until the rider goes; "ELIMINATED" spans on a DQ */}
                      {frStarted && frWord ? (
                        <td className={`${cell} font-display font-bold uppercase tracking-widest text-destructive`} colSpan={frObs.length}>
                          {frWord}
                        </td>
                      ) : (
                        frObs.map(o => {
                          const f = (r.fr.faults[o] || "") as FaultCode;
                          return (
                            <td key={o} className={`${cell} font-mono ${f === "4R" || f === "8" ? "font-semibold" : ""}`}>
                              {frStarted ? SHEET_FAULT_LABEL[f] : ""}
                            </td>
                          );
                        })
                      )}

                      <td className={`${cell} font-semibold tabular-nums`}>{frStarted && !frOut ? frJF : ""}</td>
                      <td className={`${cell} tabular-nums`}>{r.fr.time || ""}</td>
                      <td className={`${cell} tabular-nums`}>{frStarted && !frOut ? frTF : ""}</td>
                      <td className={`${cell} font-bold tabular-nums`}>{frStarted ? (frOut ? "" : frTot) : ""}</td>

                      {/* Jump-off */}
                      {hasJO && (joStarted && joWord ? (
                        <td className={`${cell} font-display font-bold uppercase tracking-widest text-destructive bg-primary/5`} colSpan={joObs.length}>
                          {joWord}
                        </td>
                      ) : (
                        joObs.map(o => {
                          const f = (r.jo.faults[o] || "") as FaultCode;
                          return (
                            <td key={`jo-${o}`} className={`${cell} font-mono bg-primary/5 ${f === "4R" || f === "8" ? "font-semibold" : ""}`}>
                              {joStarted ? SHEET_FAULT_LABEL[f] : ""}
                            </td>
                          );
                        })
                      ))}
                      {hasJO && (
                        <>
                          <td className={`${cell} tabular-nums bg-primary/5 font-semibold`}>{joStarted && !joOut ? joJF : ""}</td>
                          <td className={`${cell} tabular-nums bg-primary/5`}>{r.jo.time || ""}</td>
                          <td className={`${cell} tabular-nums bg-primary/5`}>{joStarted && !joOut ? joTF : ""}</td>
                          <td className={`${cell} font-bold tabular-nums bg-primary/5`}>{joStarted ? (joOut ? "" : joTot) : ""}</td>
                        </>
                      )}

                      <td className={`${cell} font-display font-bold text-highlight`}>{r.placing ?? ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signature block */}
          <div className="sj-sign mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-neutral-300 rounded-lg p-4 bg-white text-neutral-900">
              <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 mb-6">Judge / President of Ground Jury</div>
              <div className="border-t border-neutral-400 pt-1.5 text-xs font-medium">{courseInfo.judge || " "}</div>
            </div>
            <div className="border border-neutral-300 rounded-lg p-4 bg-white text-neutral-900">
              <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 mb-6">Course Designer</div>
              <div className="border-t border-neutral-400 pt-1.5 text-xs font-medium">{courseInfo.courseDesigner || " "}</div>
            </div>
            <div className="border border-neutral-300 rounded-lg p-4 bg-white text-neutral-900">
              <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 mb-1">Date</div>
              <div className="text-sm font-medium">{courseInfo.date || "—"}</div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 mt-3 mb-1">Status</div>
              <div className="text-xs text-neutral-600">Provisional — unofficial until signed</div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[9px] text-neutral-400 border-t border-neutral-200 pt-2">
            <span>✓ = Clear · 4 = Knockdown · R1 = 1st Refusal · R2 = 2nd Refusal · E / ELIMINATED · RETIRED · WITHDRAWN</span>
            <span className="uppercase tracking-[0.18em]">Compiled by Horsey · Equestrian Scoring Platform</span>
          </div>
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
  lockedHint,
}: {
  label?: string;
  obstacles: string[];
  faults: Record<string, FaultCode>;
  onCycle: (obs: string) => void;
  disabled: boolean;
  variant?: "fr" | "jo";
  lockedHint?: string;
}) {
  const locked = !!lockedHint;
  return (
    <div className={`bg-card border rounded-xl p-3 transition-opacity ${variant === "jo" ? "border-primary/30" : "border-border"} ${locked ? "opacity-60" : ""}`}>
      {label && (
        <div className={`text-[10px] uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5 ${variant === "jo" ? "text-primary" : "text-muted-foreground"}`}>
          {label}
          {locked && <Lock className="h-2.5 w-2.5 opacity-70" />}
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
      <p className="text-[9px] text-muted-foreground mt-2">
        {locked ? lockedHint : "Click obstacle to cycle: — → 4 → (4)R → 8 → E → —"}
      </p>
    </div>
  );
}

// ─── Results Panel ────────────────────────────────────────────────────────────

function ResultsPanel({
  cur, frObs, taSecs, tlSecs, joTaSecs, frRate, joRate, hasJO, joLocked,
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
  joLocked: boolean;
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
      rowDisabled: disabled, locked: false,
    },
    ...(hasJO ? [{
      label: "Jump-off", round: cur.jo, jf: joJF, tf: joTF, out: joOut,
      onPatch: onPatchJO, overTA: joOverTA, overLimit: false,
      rowDisabled: disabled || joLocked, locked: joLocked,
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
          {rows.map(({ label, round, jf, tf, out, onPatch, overTA, overLimit, rowDisabled, locked }) => (
            <tr key={label} className={`border-t border-border transition-opacity ${locked ? "opacity-50" : ""}`}>
              <td className="px-3 py-2.5 font-medium text-xs">
                {label}
                {locked && <span className="block text-[9px] font-normal text-muted-foreground normal-case">not advancing</span>}
              </td>
              <td className="px-2 py-2 text-center">
                <span className={`font-display tabular-nums text-base ${out ? "text-destructive" : jf > 0 ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`}>
                  {out ? (round.status || "E") : jf || "—"}
                </span>
              </td>
              <td className="px-2 py-2">
                <Input
                  value={round.time}
                  onChange={e => onPatch({ time: e.target.value })}
                  disabled={rowDisabled}
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
                      disabled={rowDisabled}
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

// ─── Embassy International Riding School logo ───────────────────────────────────

function EmbassyLogo({ className = "h-11 w-auto" }: { className?: string }) {
  return <img src="/embassy-logo.svg" alt="Embassy International Riding School" className={className} />;
}

// ─── Small helper ─────────────────────────────────────────────────────────────

function Th({ children, cls = "" }: { children: React.ReactNode; cls?: string }) {
  return (
    <th className={`px-2 py-2 font-medium text-center ${cls}`}>{children}</th>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-1 leading-tight">
      <span className="font-bold uppercase tracking-wide shrink-0">{label}:</span>
      <span className="text-neutral-700 truncate">{value || ""}</span>
    </div>
  );
}

function Pill({ tone, children }: { tone: "green" | "red" | "amber"; children: React.ReactNode }) {
  const cls = {
    green: "bg-green-500/15 text-green-700 dark:text-green-400",
    red:   "bg-destructive/15 text-destructive",
    amber: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  }[tone];
  return (
    <span className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${cls}`}>
      {children}
    </span>
  );
}
