"use client";

import * as React from "react";
import { useMemo, useState, useEffect, useRef, useCallback, KeyboardEvent } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { type Rider, DUMMY_RIDERS } from "@/lib/dummy-data";
import { useAuth } from "@/contexts/AuthContext";
import { TEST_CONFIGS, COURSE_ERRORS, type Movement, type CollectiveCriteria, type TestConfig } from "@/lib/tests";
import { isShowJumping, isQuality } from "@/lib/sheetTypes";
import { ShowJumpingSheet } from "./ShowJumpingSheet";
import { QualityScoringSheet } from "./QualityScoringSheet";
import { useScoreStore } from "@/lib/useScoreStore";
import { ChevronDown, Check, Calendar as CalendarIcon } from "lucide-react";
import { EventTimer } from "@/components/EventTimer";
import { format, parse } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/* ---------- dummy option lists for the sheet header dropdowns ---------- */
const JUDGE_OPTIONS = [
  "Dr. Sarah Chen", "Mark Johnson", "Elena Petrova",
  "Hiroshi Tanaka", "Maria Gonzalez", "David Thompson", "Anneke Visser",
];
const RIDER_OPTIONS = DUMMY_RIDERS.map((r) => r.name);
const HORSE_OPTIONS = DUMMY_RIDERS.map((r) => r.horse);
const POSITION_OPTIONS = Array.from({ length: 10 }, (_, i) => String(i + 1));

export default function ScoringPage() {
  const params = useParams();
  const search = useSearchParams();
  const { user } = useAuth();
  const eventId = search.get("event");
  const riderId = search.get("rider");
  const testId = (params?.testId as string) ?? "young-rider";
  const staticConfig = TEST_CONFIGS[testId] as TestConfig | undefined;
  // `override`: undefined = still checking the DB, null = no override, object = DB override.
  const [override, setOverride] = useState<TestConfig | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    setOverride(undefined);
    fetch(`/api/custom-sheets/${encodeURIComponent(testId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (live) setOverride((d?.config as TestConfig) ?? null);
      })
      .catch(() => {
        if (live) setOverride(null);
      });
    return () => {
      live = false;
    };
  }, [testId]);

  // A DB override (an admin edit, or a fully custom sheet) always wins over the built-in.
  const resolved: TestConfig | null = override ?? staticConfig ?? null;

  if (!resolved) {
    // Built-in renders instantly; a custom-only slug waits for the DB check.
    if (override === undefined) {
      return (
        <div className="min-h-screen bg-background grid place-items-center">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background grid place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-2xl mb-2">Sheet not found</h1>
          <p className="text-sm text-muted-foreground mb-4">
            This scoring sheet doesn’t exist or was removed.
          </p>
          <Link href="/dashboard" className="text-sm text-primary hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }
  if (isShowJumping(resolved)) {
    return <ShowJumpingSheet config={resolved} slug={testId} eventId={eventId} isAdmin={user?.role === "super_admin"} />;
  }
  if (isQuality(resolved)) {
    return <QualityScoringSheet config={resolved} slug={testId} eventId={eventId} riderId={riderId} />;
  }
  return <ScoringSheet config={resolved} testId={testId} eventId={eventId} riderId={riderId} />;
}

function ScoringSheet({
  config,
  testId,
  eventId,
  riderId,
}: {
  config: TestConfig;
  testId: string;
  eventId?: string | null;
  riderId?: string | null;
}) {
  const { user } = useAuth();
  const info = config;
  const MOVEMENTS = config.movements;
  const TOTAL_MAX = MOVEMENTS.reduce((sum, m) => sum + 10 * m.coefficient, 0);
  const COLLECTIVES: CollectiveCriteria[] = config.collectives ?? [
    { no: "1", label: "Rider's position and seat; correctness and effect of the aids", coefficient: 2 },
  ];
  const collectivesMax = COLLECTIVES.reduce((sum, c) => sum + 10 * c.coefficient, 0);
  const GRAND_TOTAL_MAX = config.hasCollective !== false ? TOTAL_MAX + collectivesMax : TOTAL_MAX;
  const OTHER_ERROR_PENALTY = config.otherErrorPenalty ?? 2;
  const STORAGE_KEY = `scoring-draft-v1:${testId}`;
  const store = useScoreStore({ slug: testId, eventId, riderId, localKey: STORAGE_KEY });
  const { confirm, dialog: confirmDialog } = useConfirm();
  const EFFECTIVE_COURSE_ERRORS = config.courseErrors ?? COURSE_ERRORS;

  const ARTISTIC_MOVEMENTS = config.artisticMovements ?? [];
  const ARTISTIC_MAX = ARTISTIC_MOVEMENTS.reduce((sum, m) => sum + 10 * m.coefficient, 0);
  const isFreestyle = ARTISTIC_MOVEMENTS.length > 0;

  const [meta, setMeta] = useState({
    event: "",
    date: "",
    judge: "",
    position: "",
    competitorNo: "",
    name: "",
    nf: "",
    horse: "",
    hno: "",
  });

  const [scores, setScores] = useState<Record<string, string>>({});
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [coefficients, setCoefficients] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [collectiveScores, setCollectiveScores] = useState<Record<string, string>>({});
  const [collectiveCorrections, setCollectiveCorrections] = useState<Record<string, string>>({});
  const [collectiveRemarksMap, setCollectiveRemarksMap] = useState<Record<string, string>>({});
  const [artisticScores, setArtisticScores] = useState<Record<string, string>>({});
  const [artisticCorrections, setArtisticCorrections] = useState<Record<string, string>>({});
  const [courseError, setCourseError] = useState<number>(0);
  const [otherErrors, setOtherErrors] = useState<number>(0);
  const [organisers, setOrganisers] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [technicalScore, setTechnicalScore] = useState<string>("");

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveRiderId, setSaveRiderId] = useState("_meta");
  const [saveStatus, setSaveStatus] = useState<"submitted" | "draft">("submitted");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [allRidersList, setAllRidersList] = useState<Rider[]>([]);

  const getEffective = (raw: string, correction: string) => {
    const c = parseFloat(correction);
    if (!isNaN(c)) return c;
    const r = parseFloat(raw);
    return isNaN(r) ? 0 : r;
  };

  const getCoef = (m: Movement) => {
    const c = parseFloat(coefficients[m.no] ?? "");
    return isNaN(c) ? m.coefficient : c;
  };

  const finalMarks = useMemo(() => {
    const map: Record<string, number> = {};
    MOVEMENTS.forEach((m) => {
      map[m.no] = getEffective(scores[m.no] || "", corrections[m.no] || "") * getCoef(m);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores, corrections, coefficients]);

  const artisticFinalMarks = useMemo(() => {
    const map: Record<string, number> = {};
    ARTISTIC_MOVEMENTS.forEach((m) => {
      const eff = getEffective(artisticScores[m.no] || "", artisticCorrections[m.no] || "");
      map[m.no] = eff * m.coefficient;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artisticScores, artisticCorrections]);

  const artisticTotal = useMemo(
    () => Object.values(artisticFinalMarks).reduce((a, b) => a + b, 0),
    [artisticFinalMarks]
  );

  const filledCount = useMemo(() => {
    const techFilled = MOVEMENTS.filter((m) => (scores[m.no] || corrections[m.no] || "").toString().trim() !== "").length;
    const artFilled = ARTISTIC_MOVEMENTS.filter((m) => (artisticScores[m.no] || artisticCorrections[m.no] || "").toString().trim() !== "").length;
    return techFilled + artFilled;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores, corrections, artisticScores, artisticCorrections]);

  const movementsTotal = useMemo(
    () => Object.values(finalMarks).reduce((a, b) => a + b, 0),
    [finalMarks]
  );

  const collectiveFinal = useMemo(() => {
    return COLLECTIVES.reduce((sum, c) => {
      const corr = parseFloat(collectiveCorrections[c.no] ?? "");
      const score = parseFloat(collectiveScores[c.no] ?? "");
      const base = !isNaN(corr) ? corr : isNaN(score) ? 0 : score;
      return sum + base * c.coefficient;
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectiveScores, collectiveCorrections]);

  const grandTotal = movementsTotal + collectiveFinal;
  const eliminated = courseError === -1;

  const qualityPct = useMemo(() => {
    if (eliminated) return 0;
    return (grandTotal / GRAND_TOTAL_MAX) * 100;
  }, [grandTotal, GRAND_TOTAL_MAX, eliminated]);

  const percentage = useMemo(() => {
    if (eliminated) return 0;
    let base: number;
    if (isFreestyle) {
      const techPct = TOTAL_MAX > 0 ? (movementsTotal / TOTAL_MAX) * 100 : 0;
      const artPct  = ARTISTIC_MAX > 0 ? (artisticTotal / ARTISTIC_MAX) * 100 : 0;
      base = (techPct + artPct) / 2;
    } else {
      const techNum = parseFloat(technicalScore);
      base = config.technicalCombined && !isNaN(techNum)
        ? (techNum + qualityPct) / 2
        : qualityPct;
    }
    return Math.max(0, base - courseError - otherErrors * OTHER_ERROR_PENALTY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qualityPct, courseError, otherErrors, eliminated, technicalScore, config.technicalCombined, isFreestyle, movementsTotal, artisticTotal, TOTAL_MAX, ARTISTIC_MAX]);

  const handleScore = (no: string, val: string) => {
    if (val !== "" && (parseFloat(val) < 0 || parseFloat(val) > 10)) return;
    setScores((s) => ({ ...s, [no]: val }));
  };
  const handleCorrection = (no: string, val: string) => {
    if (val !== "" && (parseFloat(val) < 0 || parseFloat(val) > 10)) return;
    setCorrections((s) => ({ ...s, [no]: val }));
  };

  const reset = async () => {
    const ok = await confirm({
      title: "Reset all scores and entries?",
      description: "Every score, correction and remark on this sheet will be cleared. This cannot be undone.",
      confirmText: "Reset",
      destructive: true,
    });
    if (!ok) return;
    setScores({});
    setCorrections({});
    setCoefficients({});
    setRemarks({});
    setCollectiveScores({});
    setCollectiveCorrections({});
    setCollectiveRemarksMap({});
    setArtisticScores({});
    setArtisticCorrections({});
    setCourseError(0);
    setOtherErrors(0);
    setTechnicalScore("");
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setHasDraft(false);
    setSavedAt(null);
    toast.success("Scores reset.");
  };

  const totalMovementCount = MOVEMENTS.length + ARTISTIC_MOVEMENTS.length;
  const progressPct = totalMovementCount > 0 ? (filledCount / totalMovementCount) * 100 : 0;

  /* ---------- autosave ---------- */
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  // Gate the interactive sheet to client-only render: the server HTML is a neutral
  // placeholder, so React never hydration-diffs the form controls (which browser
  // extensions tag with attributes like fdprocessedid before React loads).
  const [mounted, setMounted] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHasDraft(true);
    } catch {}
    hydrated.current = true;
    setAllRidersList(DUMMY_RIDERS);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const payload = {
      meta, scores, corrections, coefficients, remarks,
      collectiveScores, collectiveCorrections, collectiveRemarksMap,
      artisticScores, artisticCorrections,
      courseError, otherErrors, organisers, technicalScore, signature,
      ts: Date.now(),
    };
    const t = setTimeout(() => {
      store.save(payload, { result: eliminated ? -1 : percentage, signature });
      setSavedAt(Date.now());
      setHasDraft(true);
    }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta, scores, corrections, coefficients, remarks, collectiveScores, collectiveCorrections, collectiveRemarksMap, artisticScores, artisticCorrections, courseError, otherErrors, organisers, technicalScore, signature]);

  // Populate every field of the sheet from a saved payload (used by both draft restore and "Open" from a saved score).
  const applySheet = (d: Record<string, unknown> | null | undefined) => {
    if (!d) return;
    setMeta((d.meta as typeof meta) ?? meta);
    setScores((d.scores as Record<string, string>) ?? {});
    setCorrections((d.corrections as Record<string, string>) ?? {});
    setCoefficients((d.coefficients as Record<string, string>) ?? {});
    setRemarks((d.remarks as Record<string, string>) ?? {});
    if (d.collectiveScores !== undefined) {
      setCollectiveScores((d.collectiveScores as Record<string, string>) ?? {});
      setCollectiveCorrections((d.collectiveCorrections as Record<string, string>) ?? {});
      setCollectiveRemarksMap((d.collectiveRemarksMap as Record<string, string>) ?? {});
    } else if (d.collective !== undefined) {
      setCollectiveScores({ "1": d.collective as string });
      setCollectiveCorrections({ "1": (d.collectiveCorrection as string) ?? "" });
      setCollectiveRemarksMap({ "1": (d.collectiveRemarks as string) ?? "" });
    }
    setCourseError((d.courseError as number) ?? 0);
    setOtherErrors((d.otherErrors as number) ?? 0);
    setOrganisers((d.organisers as string) ?? "");
    setSignature((d.signature as string) ?? "");
    setTechnicalScore((d.technicalScore as string) ?? "");
    setArtisticScores((d.artisticScores as Record<string, string>) ?? {});
    setArtisticCorrections((d.artisticCorrections as Record<string, string>) ?? {});
  };

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) applySheet(JSON.parse(raw));
    } catch {}
  };

  // In event context, hydrate the shared DB record (judge + writer see the same sheet).
  useEffect(() => {
    if (!store.db) return;
    let live = true;
    store.load().then((d) => {
      if (live && d) applySheet(d);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, eventId, riderId]);

  // When opened from a saved score card (?session=<id>), restore that whole sheet.
  useEffect(() => {
    try {
      const sid = new URLSearchParams(window.location.search).get("session");
      if (!sid) return;
      const arr = JSON.parse(localStorage.getItem("saved-sessions") ?? "[]") as Array<{ id: string; sheet?: Record<string, unknown> }>;
      const found = arr.find((s) => s.id === sid);
      if (found?.sheet) {
        applySheet(found.sheet);
      } else {
        // Legacy save without a full snapshot: fall back to this test's autosaved draft.
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) applySheet(JSON.parse(raw));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- keyboard nav for score inputs ---------- */
  const handleGridKey = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    const row = parseInt(target.dataset.row || "0", 10);
    const col = parseInt(target.dataset.col || "0", 10);
    const move = (r: number, c: number) => {
      const sel = document.querySelector<HTMLInputElement>(`input[data-grid="1"][data-row="${r}"][data-col="${c}"]`);
      if (sel) { e.preventDefault(); sel.focus(); sel.select(); }
    };
    if (e.key === "ArrowDown" || e.key === "Enter") move(row + 1, col);
    else if (e.key === "ArrowUp") move(row - 1, col);
    else if (e.key === "ArrowRight" && (target.selectionStart ?? 0) >= target.value.length) move(row, col + 1);
    else if (e.key === "ArrowLeft" && (target.selectionStart ?? 0) === 0) move(row, col - 1);
    else if ((e.key === "n" || e.key === "N") && (e.metaKey || e.ctrlKey)) {
      const next = MOVEMENTS.findIndex((m, i) => i > row && !(scores[m.no] || corrections[m.no]));
      if (next >= 0) move(next, 0);
    }
  }, [scores, corrections]);

  const jumpToNextEmpty = () => {
    const idx = MOVEMENTS.findIndex((m) => !(scores[m.no] || corrections[m.no]));
    if (idx >= 0) {
      const sel = document.querySelector<HTMLInputElement>(`input[data-grid="1"][data-row="${idx}"][data-col="0"]`);
      sel?.focus(); sel?.select();
    }
  };

  /* ---------- export / print ---------- */
  const exportPdf = () => {
    const safe = (s: string) => s.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "untitled";
    const fname = `${testId}_${safe(meta.event || "event")}_${safe(meta.date || "date")}`;
    const prev = document.title;
    document.title = fname;
    window.print();
    setTimeout(() => { document.title = prev; }, 1000);
  };

  const savedLabel = savedAt
    ? `Saved · ${new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Not saved yet";

  const openSaveModal = () => {
    setSaveRiderId("_meta");
    setSaveStatus("submitted");
    setShowSaveModal(true);
  };

  const handleSaveScore = () => {
    const riderId = saveRiderId !== "_meta" ? saveRiderId : null;
    const rider = riderId ? allRidersList.find((x) => x.id === riderId) : null;
    const session = {
      id: `session-${Date.now()}`,
      riderId,
      testId,
      testName: info.label,
      judgeId: user?.id ?? null,
      judgeName: user?.name ?? meta.judge ?? null,
      riderName: rider ? rider.name : (meta.name || ""),
      competitorNo: rider ? rider.competitorNo : (meta.competitorNo || ""),
      horse: rider ? rider.horse : (meta.horse || ""),
      nf: rider ? rider.nf : (meta.nf || ""),
      event: meta.event || "",
      eventDate: meta.date || "",
      scores,
      corrections,
      collectiveScores,
      percentage: eliminated ? 0 : parseFloat(percentage.toFixed(3)),
      eliminated,
      grandTotal: parseFloat(grandTotal.toFixed(1)),
      grandTotalMax: GRAND_TOTAL_MAX,
      status: saveStatus,
      savedAt: new Date().toISOString(),
      // Full sheet snapshot so "Open" from the saved score card can restore everything.
      sheet: {
        meta, scores, corrections, coefficients, remarks,
        collectiveScores, collectiveCorrections, collectiveRemarksMap,
        artisticScores, artisticCorrections,
        courseError, otherErrors, organisers, technicalScore,
      },
    };
    try {
      const existing = JSON.parse(localStorage.getItem("saved-sessions") ?? "[]");
      localStorage.setItem("saved-sessions", JSON.stringify([...existing, session]));
    } catch {}
    setShowSaveModal(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {confirmDialog}
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md print:hidden">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Back to tests"
              title="Back to tests"
            >
              ←
            </Link>
            <div className="h-8 w-8 shrink-0 rounded-md bg-primary text-primary-foreground grid place-items-center font-display font-semibold text-sm">
              {info.abbr}
            </div>
            <div className="min-w-0">
              <div className="font-display text-base sm:text-lg leading-tight truncate">{info.label}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground tracking-wide uppercase truncate">
                {info.appendix} · Scoring
              </div>
            </div>
          </div>

          {/* Mobile: compact percentage */}
          <div className="md:hidden font-display text-lg tabular-nums shrink-0">
            {eliminated ? (
              <span className="text-destructive text-sm">Elim.</span>
            ) : (
              <>
                <span className="text-highlight">{percentage.toFixed(1)}</span>
                <span className="text-muted-foreground text-xs">%</span>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title={savedLabel}>
              <span className={`h-1.5 w-1.5 rounded-full ${savedAt ? "bg-highlight" : "bg-muted-foreground/40"}`} />
              <span className="tabular-nums hidden lg:inline">{savedLabel}</span>
            </div>
            <div className="text-right ml-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Current</div>
              <div className="font-display text-2xl tabular-nums">
                {eliminated ? (
                  <span className="text-destructive text-base">Eliminated</span>
                ) : (
                  <>
                    <span className="text-highlight">{percentage.toFixed(3)}</span>
                    <span className="text-muted-foreground text-base">%</span>
                  </>
                )}
              </div>
            </div>
            {hasDraft && (
              <button
                onClick={loadDraft}
                className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
                title="Load last saved draft"
              >
                Load draft
              </button>
            )}
            <button
              onClick={reset}
              className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
            >
              Reset
            </button>
            <button
              onClick={openSaveModal}
              className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
                savedSuccess
                  ? "border-highlight bg-highlight/10 text-highlight"
                  : "border-highlight bg-highlight text-background hover:opacity-90"
              }`}
            >
              {savedSuccess ? "Saved ✓" : "Save Score"}
            </button>
            <EventTimer discipline="dressage" />
            <button
              onClick={exportPdf}
              className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Export PDF
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-muted">
          <div
            className="h-full bg-highlight transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-6 sm:py-8 print:px-4 print:py-2">
        {/* Hero / Meta card */}
        <section className="mb-6 sm:mb-8 print:mb-4">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">FEI · Dressage Test</div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.05]">
                {info.label} <span className="italic text-highlight">scoring</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-prose">
                {config.subtitle}
              </p>
            </div>
            <div className="hidden lg:block text-right shrink-0 pt-1">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Movements</div>
              <div className="font-display text-3xl tabular-nums mt-1 leading-none">
                {filledCount}<span className="text-muted-foreground">/{MOVEMENTS.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-soft">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              <Field label="Event" value={meta.event} onChange={(v) => setMeta({ ...meta, event: v })} />
              <DateField label="Date" value={meta.date} onChange={(v) => setMeta({ ...meta, date: v })} />
              <SelectField label="Judge" value={meta.judge} onChange={(v) => setMeta({ ...meta, judge: v })} options={JUDGE_OPTIONS} placeholder="Select judge" />
              <Field label="Competitor No." value={meta.competitorNo} onChange={(v) => setMeta({ ...meta, competitorNo: v })} />
              <SelectField label="Rider" value={meta.name} onChange={(v) => setMeta({ ...meta, name: v })} options={RIDER_OPTIONS} placeholder="Select rider" />
              <Field label={config.nfLabel ?? "NF"} value={meta.nf} onChange={(v) => setMeta({ ...meta, nf: v })} />
              {config.showHno && (
                <Field label="H.No" value={meta.hno} onChange={(v) => setMeta({ ...meta, hno: v })} />
              )}
              <SelectField label="Horse" value={meta.horse} onChange={(v) => setMeta({ ...meta, horse: v })} options={HORSE_OPTIONS} placeholder="Select horse" />
              <SelectField label="Position" value={meta.position} onChange={(v) => setMeta({ ...meta, position: v })} options={POSITION_OPTIONS} placeholder="Select position" />
            </div>
          </div>
        </section>

        {/* Movements */}
        <section className="mb-6 sm:mb-8 print:mb-4">
          <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
            <SectionTitle index="01" title="Movements" subtitle="Score 0–10 · ↑↓ rows · → field · Enter next" />
            <button
              onClick={jumpToNextEmpty}
              className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors print:hidden"
            >
              Jump to next empty ↵
            </button>
          </div>

          {/* Desktop / large-tablet table */}
          <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden shadow-soft">
            <div className="overflow-x-auto max-h-[70vh] print:max-h-none print:overflow-visible">
              <table className="w-full text-sm table-fixed">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted text-[11px] uppercase tracking-wider text-muted-foreground shadow-soft">
                    <Th className="w-12 text-center">No.</Th>
                    <Th className="w-20 text-center">Letters</Th>
                    <Th className="w-auto">Test</Th>
                    <Th className="w-20 text-center">Mark</Th>
                    <Th className="w-20 text-center">Correction</Th>
                    <Th className="w-16 text-center">Coeff.</Th>
                    <Th className="w-20 text-center">Final</Th>
                    <Th className="w-[26%]">Directive Ideas</Th>
                    <Th className="w-44">Remarks</Th>
                  </tr>
                </thead>
                <tbody>
                  {MOVEMENTS.map((m, i) => {
                    const final = finalMarks[m.no];
                    const hasValue = final > 0;
                    return (
                      <tr
                        key={m.no}
                        className={`border-t border-border transition-colors ${
                          i % 2 === 0 ? "bg-background" : "bg-muted/20"
                        } hover:bg-accent/40 focus-within:bg-accent/60`}
                      >
                        <td className="px-3 py-3 text-center">
                          <span className="inline-grid place-items-center h-7 w-7 rounded-full border border-border font-display text-xs tabular-nums">
                            {m.no}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-xs whitespace-pre-line text-muted-foreground">
                          {m.letters}
                        </td>
                        <td className="px-3 py-3 whitespace-pre-line leading-snug">{m.test}</td>
                        <td className="px-1 py-2">
                          <NumInput
                            value={scores[m.no] || ""}
                            onChange={(v) => handleScore(m.no, v)}
                            placeholder="—"
                            accent
                            data-grid="1"
                            data-row={i}
                            data-col={0}
                            onKeyDown={handleGridKey}
                          />
                        </td>
                        <td className="px-1 py-2">
                          <NumInput
                            value={corrections[m.no] || ""}
                            onChange={(v) => handleCorrection(m.no, v)}
                            placeholder="—"
                            bordered
                            data-grid="1"
                            data-row={i}
                            data-col={1}
                            onKeyDown={handleGridKey}
                          />
                        </td>
                        <td className="px-1 py-2">
                          <NumInput
                            value={coefficients[m.no] ?? ""}
                            onChange={(v) => {
                              if (v !== "" && (parseFloat(v) < 1 || parseFloat(v) > 10)) return;
                              setCoefficients((c) => ({ ...c, [m.no]: v }));
                            }}
                            placeholder="—"
                            bordered
                            min={1}
                            step={1}
                          />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`font-display tabular-nums text-base ${
                              hasValue ? "text-highlight" : "text-muted-foreground/40"
                            }`}
                          >
                            {hasValue ? final.toFixed(1) : "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs leading-snug text-muted-foreground">
                          {m.directive}
                        </td>
                        <td className="px-1 py-2">
                          <Input
                            className="w-full bg-transparent border border-border rounded-md px-2 py-1.5 text-xs outline-none focus:bg-background focus:ring-1 focus:ring-ring transition-all"
                            value={remarks[m.no] || ""}
                            onChange={(e) => setRemarks((r) => ({ ...r, [m.no]: e.target.value }))}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-foreground/20 bg-muted/40">
                    <td colSpan={3} className="px-3 py-3 font-display text-sm uppercase tracking-wider">
                      Subtotal
                    </td>
                    <td colSpan={3}></td>
                    <td className="px-3 py-3 text-center font-display text-lg tabular-nums text-highlight whitespace-nowrap">
                      {movementsTotal.toFixed(1)}
                      <span className="text-xs text-muted-foreground ml-1">/ {TOTAL_MAX}</span>
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / tablet card list */}
          <div className="lg:hidden space-y-3">
            {MOVEMENTS.map((m, i) => {
              const final = finalMarks[m.no];
              const hasValue = final > 0;
              return (
                <div
                  key={m.no}
                  className="bg-card border border-border rounded-xl shadow-soft p-4 focus-within:border-highlight/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-grid place-items-center h-8 w-8 shrink-0 rounded-full border border-border font-display text-xs tabular-nums">
                        {m.no}
                      </span>
                      <div className="min-w-0">
                        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground whitespace-pre-line">
                          {m.letters || "—"}
                        </div>
                        <div className="text-sm leading-snug whitespace-pre-line mt-0.5">{m.test}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Final</div>
                      <div className={`font-display tabular-nums text-lg ${hasValue ? "text-highlight" : "text-muted-foreground/40"}`}>
                        {hasValue ? final.toFixed(1) : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Mark</span>
                      <NumInput
                        value={scores[m.no] || ""}
                        onChange={(v) => handleScore(m.no, v)}
                        placeholder="—"
                        accent
                      />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Corr.</span>
                      <NumInput
                        value={corrections[m.no] || ""}
                        onChange={(v) => handleCorrection(m.no, v)}
                        placeholder="—"
                        bordered
                      />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Coeff.</span>
                      <NumInput
                        value={coefficients[m.no] ?? ""}
                        onChange={(v) => {
                          if (v !== "" && (parseFloat(v) < 1 || parseFloat(v) > 10)) return;
                          setCoefficients((c) => ({ ...c, [m.no]: v }));
                        }}
                        placeholder={String(m.coefficient)}
                        bordered
                        min={1}
                        step={1}
                      />
                    </label>
                  </div>

                  <details className="group">
                    <summary className="cursor-pointer text-[11px] uppercase tracking-wider text-muted-foreground list-none flex items-center gap-1 select-none">
                      <span className="group-open:rotate-90 transition-transform">›</span>
                      Directive & remarks
                    </summary>
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-muted-foreground leading-snug">{m.directive}</p>
                      <Input
                        className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring transition-all"
                        placeholder="Remarks"
                        value={remarks[m.no] || ""}
                        onChange={(e) => setRemarks((r) => ({ ...r, [m.no]: e.target.value }))}
                      />
                    </div>
                  </details>
                </div>
              );
            })}
            <div className="bg-muted/40 border border-border rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="font-display text-sm uppercase tracking-wider">Subtotal</span>
              <div className="text-right">
                <span className="font-display text-lg tabular-nums text-highlight">{movementsTotal.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground tabular-nums ml-1">/ {TOTAL_MAX}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Artistic Marks – Freestyle Only */}
        {isFreestyle && (
          <section className="mb-6 sm:mb-8 print:mb-4">
            <div className="mb-3">
              <SectionTitle index="02" title="Artistic Marks" subtitle="Music, choreography & harmony · Score 0–10" />
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block bg-card border border-border rounded-xl overflow-hidden shadow-soft">
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="bg-muted text-[11px] uppercase tracking-wider text-muted-foreground shadow-soft">
                      <Th className="w-12 text-center">No.</Th>
                      <Th className="w-auto">Criterion</Th>
                      <Th className="w-20 text-center">Mark</Th>
                      <Th className="w-20 text-center">Correction</Th>
                      <Th className="w-16 text-center">Coeff.</Th>
                      <Th className="w-20 text-center">Final</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {ARTISTIC_MOVEMENTS.map((m, i) => {
                      const final = artisticFinalMarks[m.no];
                      const hasValue = final > 0;
                      return (
                        <tr key={m.no} className={`border-t border-border ${i % 2 === 0 ? "bg-background" : "bg-muted/20"} hover:bg-accent/40`}>
                          <td className="px-3 py-3 text-center">
                            <span className="inline-grid place-items-center h-7 w-7 rounded-full border border-border font-display text-xs tabular-nums">{m.no}</span>
                          </td>
                          <td className="px-3 py-3 leading-snug">{m.test}</td>
                          <td className="px-1 py-2">
                            <NumInput
                              value={artisticScores[m.no] || ""}
                              onChange={(v) => { if (v !== "" && (parseFloat(v) < 0 || parseFloat(v) > 10)) return; setArtisticScores((s) => ({ ...s, [m.no]: v })); }}
                              placeholder="—"
                              accent
                            />
                          </td>
                          <td className="px-1 py-2">
                            <NumInput
                              value={artisticCorrections[m.no] || ""}
                              onChange={(v) => { if (v !== "" && (parseFloat(v) < 0 || parseFloat(v) > 10)) return; setArtisticCorrections((s) => ({ ...s, [m.no]: v })); }}
                              placeholder="—"
                              bordered
                            />
                          </td>
                          <td className="px-3 py-3 text-center text-muted-foreground text-xs">×{m.coefficient}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={`font-display tabular-nums text-base ${hasValue ? "text-highlight" : "text-muted-foreground/40"}`}>
                              {hasValue ? final.toFixed(1) : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-foreground/20 bg-muted/40">
                      <td colSpan={2} className="px-3 py-3 font-display text-sm uppercase tracking-wider">Artistic Subtotal</td>
                      <td colSpan={3}></td>
                      <td className="px-3 py-3 text-center font-display text-lg tabular-nums text-highlight whitespace-nowrap">
                        {artisticTotal.toFixed(1)}
                        <span className="text-xs text-muted-foreground ml-1">/ {ARTISTIC_MAX}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {ARTISTIC_MOVEMENTS.map((m) => {
                const final = artisticFinalMarks[m.no];
                const hasValue = final > 0;
                return (
                  <div key={m.no} className="bg-card border border-border rounded-xl shadow-soft p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="inline-grid place-items-center h-8 w-8 shrink-0 rounded-full border border-border font-display text-xs">{m.no}</span>
                        <div className="text-sm leading-snug">{m.test}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Final</div>
                        <div className={`font-display tabular-nums text-lg ${hasValue ? "text-highlight" : "text-muted-foreground/40"}`}>
                          {hasValue ? final.toFixed(1) : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Mark</span>
                        <NumInput value={artisticScores[m.no] || ""} onChange={(v) => { if (v !== "" && (parseFloat(v) < 0 || parseFloat(v) > 10)) return; setArtisticScores((s) => ({ ...s, [m.no]: v })); }} placeholder="—" accent />
                      </label>
                      <label className="block">
                        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Corr.</span>
                        <NumInput value={artisticCorrections[m.no] || ""} onChange={(v) => { if (v !== "" && (parseFloat(v) < 0 || parseFloat(v) > 10)) return; setArtisticCorrections((s) => ({ ...s, [m.no]: v })); }} placeholder="—" bordered />
                      </label>
                    </div>
                  </div>
                );
              })}
              <div className="bg-muted/40 border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="font-display text-sm uppercase tracking-wider">Artistic Subtotal</span>
                <div className="text-right">
                  <span className="font-display text-lg tabular-nums text-highlight">{artisticTotal.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground tabular-nums ml-1">/ {ARTISTIC_MAX}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Collective */}
        {config.hasCollective !== false && (
          <section className="mb-8 print:mb-4">
            <div className="mb-3">
              <SectionTitle
                index="02"
                title="Collective Mark"
                subtitle={config.collectives ? "Score each criterion 0–10" : "Rider position, seat & effect of aids"}
              />
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-soft">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <tbody>
                    {COLLECTIVES.map((c) => {
                      const rawScore = collectiveScores[c.no] ?? "";
                      const rawCorr = collectiveCorrections[c.no] ?? "";
                      const corrVal = parseFloat(rawCorr);
                      const scoreVal = parseFloat(rawScore);
                      const base = !isNaN(corrVal) ? corrVal : isNaN(scoreVal) ? 0 : scoreVal;
                      const rowFinal = base * c.coefficient;
                      const hasVal = base > 0;
                      return (
                        <tr key={c.no} className="border-t border-border first:border-t-0">
                          <td className="px-3 py-4 w-12 text-center">
                            <span className="inline-grid place-items-center h-7 w-7 rounded-full border border-border font-display text-xs">{c.no}</span>
                          </td>
                          <td className="px-3 py-4">{c.label}</td>
                          <td className="px-1 py-2 w-24">
                            <NumInput
                              value={rawScore}
                              onChange={(v) => setCollectiveScores((s) => ({ ...s, [c.no]: v }))}
                              placeholder="Mark"
                              accent
                            />
                          </td>
                          <td className="px-1 py-2 w-24">
                            <NumInput
                              value={rawCorr}
                              onChange={(v) => setCollectiveCorrections((s) => ({ ...s, [c.no]: v }))}
                              placeholder="Corr."
                              bordered
                            />
                          </td>
                          <td className="px-3 py-4 w-16 text-center text-muted-foreground text-xs">×{c.coefficient}</td>
                          <td className="px-3 py-4 w-24 text-center font-display text-lg text-highlight tabular-nums">
                            {hasVal ? rowFinal.toFixed(1) : "—"}
                          </td>
                          <td className="px-1 py-2 w-44">
                            <Input
                              className="w-full bg-transparent border border-border rounded-md px-2 py-1.5 text-xs outline-none focus:bg-background focus:ring-1 focus:ring-ring transition-all"
                              placeholder="Remarks"
                              value={collectiveRemarksMap[c.no] ?? ""}
                              onChange={(e) => setCollectiveRemarksMap((r) => ({ ...r, [c.no]: e.target.value }))}
                            />
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-foreground/20 bg-muted/40">
                      <td colSpan={2} className="px-3 py-3 font-display text-sm uppercase tracking-wider">Total</td>
                      <td colSpan={3}></td>
                      <td className="px-3 py-3 text-center font-display text-lg text-highlight tabular-nums whitespace-nowrap">
                        {grandTotal.toFixed(1)}
                        <span className="text-xs text-muted-foreground ml-1">/ {GRAND_TOTAL_MAX}</span>
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Penalties + Score */}
        <section className="mb-8 print:mb-4">
          <div className="mb-3">
            <SectionTitle index="03" title="Penalties & Final Score" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
            <div className="lg:col-span-3 bg-card border border-border rounded-xl p-4 sm:p-6 shadow-soft">
              <h3 className="font-display text-lg mb-4">Deductions</h3>
              <ul className="text-xs text-muted-foreground space-y-1 mb-5 leading-relaxed">
                <li>• 1st course error = −0.5 percentage point</li>
                <li>• 2nd course error = −1 percentage point</li>
                <li>• 3rd course error = Elimination</li>
                <li>• {config.otherErrorPenalty !== undefined ? `Technical faults = −${config.otherErrorPenalty}% each` : "Other errors = −2 points each"}</li>
              </ul>

              <div className="space-y-4">
                {config.technicalCombined && (
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                      Technical Score (%)
                    </label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step={0.001}
                        value={technicalScore}
                        onChange={(e) => setTechnicalScore(e.target.value)}
                        placeholder="Enter technical %"
                        className="w-48 text-center tabular-nums rounded-md py-1.5 px-3 text-sm outline-none transition-all bg-transparent border border-border focus:border-highlight focus:bg-background focus:ring-2 focus:ring-highlight/20"
                      />
                      <span className="text-xs text-muted-foreground">
                        Quality: <span className="tabular-nums text-foreground">{qualityPct.toFixed(3)}%</span>
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Course error
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {EFFECTIVE_COURSE_ERRORS.map((c) => (
                      <button
                        key={c.label}
                        onClick={() => setCourseError(c.value)}
                        className={`text-xs px-3 py-2 rounded-md border transition-all ${
                          courseError === c.value
                            ? c.value === -1
                              ? "bg-destructive text-destructive-foreground border-destructive"
                              : "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-foreground/30 bg-background"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    {config.otherErrorPenalty !== undefined ? "Technical faults" : "Other errors"}
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setOtherErrors(Math.max(0, otherErrors - 1))}
                      className="h-9 w-9 rounded-md border border-border hover:bg-muted transition-colors"
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <div className="font-display text-2xl tabular-nums w-12 text-center">{otherErrors}</div>
                    <button
                      onClick={() => setOtherErrors(otherErrors + 1)}
                      className="h-9 w-9 rounded-md border border-border hover:bg-muted transition-colors"
                      aria-label="Increase"
                    >
                      +
                    </button>
                    <span className="text-xs text-muted-foreground">× −{OTHER_ERROR_PENALTY} pts = −{(otherErrors * OTHER_ERROR_PENALTY).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Score card */}
            <div className="lg:col-span-2">
              <div className="relative overflow-hidden bg-primary text-primary-foreground rounded-xl p-5 sm:p-6 shadow-card h-full flex flex-col justify-between">
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-highlight/20 blur-2xl" />
                <div className="relative">
                  <div className="text-[10px] uppercase tracking-[0.25em] opacity-70">Total Score</div>
                  <div className="font-display text-5xl sm:text-6xl mt-3 tabular-nums leading-none whitespace-nowrap">
                    {eliminated ? (
                      <span className="text-destructive-foreground">—</span>
                    ) : (
                      <>
                        {percentage.toFixed(3)}
                        <span className="text-2xl opacity-60 align-top ml-1">%</span>
                      </>
                    )}
                  </div>
                  {eliminated && (
                    <div className="mt-3 inline-block px-2 py-1 bg-destructive text-destructive-foreground text-xs uppercase tracking-wider rounded">
                      Eliminated
                    </div>
                  )}
                </div>
                <div className="relative mt-6 pt-4 border-t border-primary-foreground/20 text-xs opacity-70 grid grid-cols-2 gap-2">
                  {isFreestyle ? (
                    <>
                      <div>
                        <div className="opacity-70">Technical %</div>
                        <div className="font-display text-base tabular-nums opacity-100 mt-0.5">
                          {TOTAL_MAX > 0 ? `${((movementsTotal / TOTAL_MAX) * 100).toFixed(3)}%` : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="opacity-70">Artistic %</div>
                        <div className="font-display text-base tabular-nums opacity-100 mt-0.5">
                          {ARTISTIC_MAX > 0 ? `${((artisticTotal / ARTISTIC_MAX) * 100).toFixed(3)}%` : "—"}
                        </div>
                      </div>
                    </>
                  ) : config.technicalCombined ? (
                    <>
                      <div>
                        <div className="opacity-70">Quality %</div>
                        <div className="font-display text-base tabular-nums opacity-100 mt-0.5">
                          {qualityPct.toFixed(3)}%
                        </div>
                      </div>
                      <div>
                        <div className="opacity-70">Technical %</div>
                        <div className="font-display text-base tabular-nums opacity-100 mt-0.5">
                          {technicalScore ? `${parseFloat(technicalScore).toFixed(3)}%` : "—"}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="opacity-70">Raw total</div>
                        <div className="font-display text-base tabular-nums opacity-100 mt-0.5">
                          {grandTotal.toFixed(1)} <span className="opacity-50">/ {GRAND_TOTAL_MAX}</span>
                        </div>
                      </div>
                      <div>
                        <div className="opacity-70">Deductions</div>
                        <div className="font-display text-base tabular-nums opacity-100 mt-0.5">
                          −{(courseError === -1 ? 0 : courseError + otherErrors * OTHER_ERROR_PENALTY).toFixed(1)}%
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer / signatures */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          <div className="bg-card border border-border rounded-xl p-6 shadow-soft">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Organisers</div>
            <Textarea
              rows={3}
              placeholder="Exact address…"
              className="w-full bg-transparent outline-none resize-none text-sm focus:ring-1 focus:ring-ring rounded-md p-2 -m-2"
              value={organisers}
              onChange={(e) => setOrganisers(e.target.value)}
            />
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-soft">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Signature of Judge</div>
            <Input
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Type signature…"
              className="w-full bg-transparent border-b border-dashed border-border py-1 text-sm outline-none focus:border-primary font-display italic"
            />
            <div className="text-xs text-muted-foreground mt-2 italic">{meta.judge || "—"}</div>
          </div>
        </section>
      </main>

      {/* Mobile sticky action bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur-md print:hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground" title={savedLabel}>
            <span className={`h-1.5 w-1.5 rounded-full ${savedAt ? "bg-highlight" : "bg-muted-foreground/40"}`} />
            <span className="tabular-nums">{savedAt ? "Saved" : "—"}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {hasDraft && (
              <button
                onClick={loadDraft}
                className="text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
              >
                Load
              </button>
            )}
            <button
              onClick={reset}
              className="text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
            >
              Reset
            </button>
            <button
              onClick={openSaveModal}
              className="text-xs px-2.5 py-1.5 rounded-md bg-highlight text-background hover:opacity-90 transition-opacity"
            >
              {savedSuccess ? "Saved ✓" : "Save"}
            </button>
            <button
              onClick={exportPdf}
              className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      <footer className="border-t border-border py-6 pb-20 md:pb-6 text-center text-xs text-muted-foreground print:hidden">
        {info.label} · {info.appendix} · Interactive Scoring Sheet
      </footer>

      {/* ── SAVE SCORE MODAL ─────────────────────────────── */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="max-w-md p-0 gap-0 print:hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-display text-lg">Save Score Sheet</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{info.label} · {info.appendix}</p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Score summary */}
              <div className="bg-muted/50 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</div>
                  <div className="font-display text-2xl tabular-nums text-highlight mt-0.5">
                    {eliminated ? "Eliminated" : `${percentage.toFixed(3)}%`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Raw total</div>
                  <div className="font-display text-base tabular-nums mt-0.5">
                    {grandTotal.toFixed(1)} <span className="text-muted-foreground text-xs">/ {GRAND_TOTAL_MAX}</span>
                  </div>
                </div>
              </div>

              {/* Rider picker */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                  Rider
                </label>
                <Select value={saveRiderId} onValueChange={setSaveRiderId}>
                  <SelectTrigger className="w-full bg-background border-border text-sm h-10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_meta">
                      {meta.name ? `${meta.name}${meta.competitorNo ? ` (#${meta.competitorNo})` : ""}` : "— From sheet info —"}
                    </SelectItem>
                    {allRidersList.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Registered riders</SelectLabel>
                        {allRidersList.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name} (#{r.competitorNo}) · {r.horse}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>

                {/* Rider info preview */}
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(() => {
                    const r = saveRiderId === "_meta"
                      ? null
                      : allRidersList.find((x) => x.id === saveRiderId);
                    const name  = r ? r.name  : meta.name  || "—";
                    const no    = r ? r.competitorNo : meta.competitorNo || "—";
                    const horse = r ? r.horse : meta.horse || "—";
                    return (
                      <>
                        <div className="bg-background border border-border rounded-lg px-3 py-2">
                          <div className="text-[10px] text-muted-foreground">Rider</div>
                          <div className="text-xs font-medium truncate mt-0.5">{name}</div>
                        </div>
                        <div className="bg-background border border-border rounded-lg px-3 py-2">
                          <div className="text-[10px] text-muted-foreground">No.</div>
                          <div className="text-xs font-medium mt-0.5">{no}</div>
                        </div>
                        <div className="bg-background border border-border rounded-lg px-3 py-2">
                          <div className="text-[10px] text-muted-foreground">Horse</div>
                          <div className="text-xs font-medium truncate mt-0.5">{horse}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Status</label>
                <div className="flex gap-2">
                  {(["submitted", "draft"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSaveStatus(s)}
                      className={`flex-1 text-sm py-2 rounded-lg border transition-colors capitalize ${
                        saveStatus === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScore}
                className="text-sm px-5 py-2 rounded-lg bg-highlight text-background hover:opacity-90 transition-opacity font-medium"
              >
                Save Score →
              </button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- small components ---------- */

const Field = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <label className="block">
    <span className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
      {label}
    </span>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      suppressHydrationWarning
      className="w-full bg-transparent border-b border-border focus:border-highlight outline-none py-1.5 text-sm transition-colors"
    />
  </label>
);

const DateField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const selected = parsed && !isNaN(parsed.getTime()) ? parsed : undefined;

  return (
    <div className="block">
      <span className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
        {label}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            suppressHydrationWarning
            className={`w-full flex items-center justify-between gap-2 bg-transparent border-b py-1.5 pr-0.5 text-sm text-left outline-none transition-colors ${
              open ? "border-highlight" : "border-border hover:border-foreground/40"
            } ${selected ? "text-foreground" : "text-muted-foreground"}`}
          >
            <span className="truncate">{selected ? format(selected, "d MMM yyyy") : "Select date"}</span>
            <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(d) => {
              if (d) {
                onChange(format(d, "yyyy-MM-dd"));
                setOpen(false);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

const SelectField = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="block" ref={ref}>
      <span className="block text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => setOpen((o) => !o)}
          className={`w-full flex items-center justify-between gap-2 bg-transparent border-b py-1.5 pr-0.5 text-sm text-left outline-none transition-colors ${
            open ? "border-highlight" : "border-border hover:border-foreground/40"
          } ${value ? "text-foreground" : "text-muted-foreground"}`}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute left-0 right-0 z-40 mt-1.5 max-h-56 overflow-auto rounded-xl border border-border bg-card py-1 shadow-lg ring-1 ring-black/5">
            <button
              type="button"
              onClick={() => select("")}
              className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              <span className="truncate">{placeholder}</span>
              {!value && <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            </button>
            {options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => select(o)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
                  o === value ? "bg-highlight/5 font-medium text-highlight" : "text-foreground"
                }`}
              >
                <span className="truncate">{o}</span>
                {o === value && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SectionTitle = ({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 min-w-0">
    <span className="font-mono text-xs text-muted-foreground tabular-nums">{index}</span>
    <h2 className="font-display text-xl sm:text-2xl tracking-tight leading-none">{title}</h2>
    {subtitle && (
      <span className="text-xs text-muted-foreground hidden md:block">{subtitle}</span>
    )}
  </div>
);

const Th = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-3 py-3 text-left font-medium ${className}`}>{children}</th>
);

type NumInputProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  accent?: boolean;
  bordered?: boolean;
  min?: number;
  step?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "min" | "step" | "placeholder">;

const NumInput = ({
  value,
  onChange,
  placeholder,
  accent = false,
  bordered = false,
  min = 0,
  step = 0.5,
  className,
  ...rest
}: NumInputProps) => (
  <Input
    type="number"
    inputMode="decimal"
    suppressHydrationWarning
    min={min}
    max={10}
    step={step}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full text-center tabular-nums rounded-md py-1.5 text-sm outline-none transition-all bg-transparent border ${
      accent
        ? "border-border focus:border-highlight focus:bg-background focus:ring-2 focus:ring-highlight/20"
        : bordered
        ? "border-border focus:border-ring focus:bg-background"
        : "border-transparent hover:border-border focus:border-ring focus:bg-background"
    } ${className ?? ""}`}
    {...rest}
  />
);
