"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Save, Printer, ChevronDown, Check } from "lucide-react";
import type { QualityConfig } from "@/lib/sheetTypes";
import { useScoreStore } from "@/lib/useScoreStore";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DUMMY_RIDERS, type Rider } from "@/lib/dummy-data";

type EventRiderApi = {
  id: string;
  name: string;
  nf: string | null;
  competitor_no: string | null;
  horse: string | null;
  horse_no: string | null;
};

type Header = {
  competitorNo: string;
  name: string;
  zone: string;
  horse: string;
  judge: string;
  organisers: string;
  signature: string;
};

const emptyHeader = (): Header => ({
  competitorNo: "",
  name: "",
  zone: "",
  horse: "",
  judge: "",
  organisers: "",
  signature: "",
});

const JUDGE_OPTIONS = [
  "Dr. Sarah Chen", "Mark Johnson", "Elena Petrova",
  "Hiroshi Tanaka", "Maria Gonzalez", "David Thompson", "Anneke Visser",
];

/* Penalty levels — matches physical doc rows */
const PENALTY_ROWS = [
  { label: "1st error of course : 0.5 percentage point", value: 0.5 },
  { label: "2nd error of course : 1.0 percentage point", value: 1 },
  { label: "3rd error of course : Elimination", value: -1 },
];

const num = (s: string) => {
  const v = parseFloat(s);
  return isNaN(v) ? 0 : v;
};

const pct = (v: number) => (isFinite(v) ? `${v.toFixed(2)}%` : "—");

export function QualityScoringSheet({
  config,
  slug,
  eventId,
  riderId,
}: {
  config: QualityConfig;
  slug: string;
  eventId?: string | null;
  riderId?: string | null;
}) {
  const criteria = config.criteria;
  const n = criteria.length || 1;
  const STORAGE_KEY = `quality-scoring-v1:${slug}`;
  const store = useScoreStore({ slug, eventId, riderId, localKey: STORAGE_KEY });
  const { confirm, dialog: confirmDialog } = useConfirm();

  const [header, setHeader] = useState<Header>(emptyHeader());
  const [marks, setMarks] = useState<Record<number, string>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [technical, setTechnical] = useState("");
  /* null = no error selected, -1 = eliminated, 0.5/1 = deductions */
  const [penaltyValue, setPenaltyValue] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [allRidersList, setAllRidersList] = useState<Rider[]>([]);

  /* Load riders */
  useEffect(() => {
    if (eventId) {
      const qs = new URLSearchParams({ event: eventId, slug });
      fetch(`/api/sheet-riders?${qs.toString()}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((rows: EventRiderApi[]) =>
          setAllRidersList(
            rows.map((r) => ({
              id: r.id,
              name: r.name,
              nf: r.nf ?? "",
              competitorNo: r.competitor_no ?? "",
              horse: r.horse ?? "",
              horseNo: r.horse_no ?? "",
              club: "",
              category: "",
            }))
          )
        )
        .catch(() => setAllRidersList([]));
    } else {
      setAllRidersList(DUMMY_RIDERS);
    }
  }, [eventId, slug]);

  /* Restore saved state */
  useEffect(() => {
    let live = true;
    store.load().then((d) => {
      if (live && d) {
        if (d.header) setHeader({ ...emptyHeader(), ...(d.header as object) });
        if (d.marks) setMarks(d.marks as Record<number, string>);
        if (d.comments) setComments(d.comments as Record<number, string>);
        if (typeof d.technical === "string") setTechnical(d.technical);
        if (typeof d.penaltyValue === "number") setPenaltyValue(d.penaltyValue);
        if (d.penaltyValue === null) setPenaltyValue(null);
        if (typeof d.savedAt === "string") setSavedAt(d.savedAt);
      }
      if (live) setLoaded(true);
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, eventId, riderId]);

  /* Autosave */
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      const stamp = new Date().toISOString();
      const total = criteria.reduce((s, _, i) => s + num(marks[i] || ""), 0);
      const qPct = (total / (n * 10)) * 100;
      const tPct = num(technical);
      const combined = (tPct + qPct) / 2;
      const result =
        penaltyValue === -1 ? -1
        : penaltyValue === null ? combined
        : Math.max(0, combined - penaltyValue);
      store.save(
        { header, marks, comments, technical, penaltyValue, savedAt: stamp },
        { result, signature: header.signature }
      );
      setSavedAt(stamp);
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [header, marks, comments, technical, penaltyValue, loaded]);

  /* Derived scores */
  const totalMarks = useMemo(
    () => criteria.reduce((s, _, i) => s + num(marks[i] || ""), 0),
    [criteria, marks]
  );
  const maxMarks = n * 10;
  const qualityScore = totalMarks / n;
  const qualityPct = (totalMarks / maxMarks) * 100;
  const technicalPct = num(technical);
  const totalPct = (technicalPct + qualityPct) / 2;
  const eliminated = penaltyValue === -1;
  const finalPct = eliminated
    ? null
    : penaltyValue === null
    ? totalPct
    : Math.max(0, totalPct - penaltyValue);

  const savedLabel = useMemo(() => {
    if (!savedAt) return "";
    const d = new Date(savedAt);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [savedAt]);

  const reset = async () => {
    const ok = await confirm({
      title: "Clear this sheet?",
      description: "All marks, comments and penalties will be reset.",
      confirmText: "Clear",
      destructive: true,
    });
    if (!ok) return;
    setHeader(emptyHeader());
    setMarks({});
    setComments({});
    setTechnical("");
    setPenaltyValue(null);
    toast.success("Sheet cleared.");
  };

  const setH = (patch: Partial<Header>) => setHeader((h) => ({ ...h, ...patch }));

  const handleRiderSelect = (name: string) => {
    const rider = allRidersList.find((r) => r.name === name);
    if (rider) {
      setH({ name: rider.name, horse: rider.horse, competitorNo: rider.competitorNo });
    } else {
      setH({ name });
    }
  };

  const riderNames = allRidersList.map((r) => r.name);
  const horseNames = allRidersList.map((r) => r.horse).filter(Boolean);

  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white">
      {confirmDialog}

      {/* Top nav */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-border bg-card/90 backdrop-blur print:hidden">
        <Link href="/dashboard" className="p-1.5 rounded-md hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-display text-xs font-semibold">
          Q
        </div>
        <div className="min-w-0">
          <div className="font-display text-sm leading-tight truncate">{config.label}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Quality · Scoring</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {savedLabel && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Saved · {savedLabel}
            </span>
          )}
          <button onClick={reset} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors">
            <Printer className="h-3.5 w-3.5" /> Export PDF
          </button>
          <button
            onClick={() => {
              const stamp = new Date().toISOString();
              store.save(
                { header, marks, comments, technical, penaltyValue, savedAt: stamp },
                { result: eliminated ? -1 : (finalPct ?? 0), signature: header.signature, status: "submitted" }
              );
              setSavedAt(stamp);
            }}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Save className="h-3.5 w-3.5" /> Save Sheet
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Title */}
        <div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">{config.label}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-semibold uppercase tracking-wider">{config.subtitle}</p>
        </div>

        {/* Header — matches physical doc layout */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          {/* Row 1: Competitor No | Name | Zone | Horse */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-6 gap-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Competitor No</label>
              <Input
                value={header.competitorNo}
                onChange={(e) => setH({ competitorNo: e.target.value })}
                className="w-full bg-transparent border-b border-border py-1 text-sm outline-none focus:border-primary rounded-none"
              />
            </div>
            <div>
              <QSelectField
                label="Name"
                value={header.name}
                onChange={handleRiderSelect}
                options={riderNames}
                placeholder="Select rider"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Zone</label>
              <Input
                value={header.zone}
                onChange={(e) => setH({ zone: e.target.value })}
                className="w-full bg-transparent border-b border-border py-1 text-sm outline-none focus:border-primary rounded-none"
              />
            </div>
            <div>
              <QSelectField
                label="Horse"
                value={header.horse}
                onChange={(v) => setH({ horse: v })}
                options={horseNames}
                placeholder="Select horse"
              />
            </div>
          </div>

          {/* Row 2: Judge (full width) */}
          <div>
            <QSelectField
              label="Judge"
              value={header.judge}
              onChange={(v) => setH({ judge: v })}
              options={JUDGE_OPTIONS}
              placeholder="Select judge"
            />
          </div>
        </div>

        {/* Assessment table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted">
                <th className="border border-border px-3 py-2 text-left">Assessment of individual Tasks</th>
                <th className="border border-border px-3 py-2 text-left w-[40%]">Commentary</th>
                <th className="border border-border px-3 py-2 text-center w-20">Mark</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((c, i) => (
                <tr key={i} className="align-top">
                  <td className="border border-border px-3 py-2">
                    <div className="font-semibold">{c.title}</div>
                    {c.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line leading-snug">
                        {c.description}
                      </div>
                    )}
                  </td>
                  <td className="border border-border px-1 py-1">
                    <Textarea
                      value={comments[i] ?? ""}
                      onChange={(e) => setComments((m) => ({ ...m, [i]: e.target.value }))}
                      rows={3}
                      className="w-full bg-transparent text-sm outline-none focus:bg-primary/5 rounded px-2 py-1 resize-y"
                    />
                  </td>
                  <td className="border border-border px-1 py-1">
                    <Input
                      inputMode="decimal"
                      value={marks[i] ?? ""}
                      onChange={(e) => setMarks((m) => ({ ...m, [i]: e.target.value }))}
                      className="w-full bg-transparent text-center text-sm outline-none focus:bg-primary/5 rounded px-1 py-1"
                    />
                  </td>
                </tr>
              ))}

              {/* Total marks */}
              <tr>
                <td className="border border-border px-3 py-2 font-medium" colSpan={2}>
                  Total marks (max {maxMarks})
                </td>
                <td className="border border-border px-1 py-2 text-center font-medium tabular-nums bg-muted/40">
                  {totalMarks || "—"}
                </td>
              </tr>

              {/* Divided by n */}
              <tr>
                <td className="border border-border px-3 py-2 font-medium" colSpan={2}>
                  Divided by {n} = Total Quality Score
                </td>
                <td className="border border-border px-1 py-2 text-center tabular-nums">
                  {totalMarks ? qualityScore.toFixed(2) : "—"}
                </td>
              </tr>

              {/* Quality % */}
              <tr>
                <td className="border border-border px-3 py-2 font-medium" colSpan={2}>
                  Quality Score in %
                </td>
                <td className="border border-border px-1 py-2 text-center font-medium tabular-nums">
                  {totalMarks ? pct(qualityPct) : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary + Penalty table — matches physical doc */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {/* Technical score */}
              <tr>
                <td className="border border-border px-3 py-2 text-muted-foreground">Technical score in %:</td>
                <td className="border border-border px-1 py-1 w-40">
                  <Input
                    inputMode="decimal"
                    value={technical}
                    onChange={(e) => setTechnical(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent text-center text-sm outline-none focus:bg-primary/5 rounded px-1 py-1 tabular-nums"
                  />
                </td>
              </tr>

              {/* Quality score */}
              <tr>
                <td className="border border-border px-3 py-2 text-muted-foreground">Quality score in %:</td>
                <td className="border border-border px-3 py-2 text-center tabular-nums font-medium">
                  {totalMarks ? pct(qualityPct) : "—"}
                </td>
              </tr>

              {/* Total score */}
              <tr>
                <td className="border border-border px-3 py-2 text-muted-foreground">
                  TOTAL score in %:<br />
                  <span className="text-xs">(Technical plus Quality divided by two)</span>
                </td>
                <td className="border border-border px-3 py-2 text-center tabular-nums font-medium">
                  {pct(totalPct)}
                </td>
              </tr>

              {/* Penalty header */}
              <tr className="bg-muted/60">
                <td className="border border-border px-3 py-2 font-semibold" colSpan={2}>
                  To be deducted / penalty points
                </td>
              </tr>

              {/* Penalty rows — radio-style, matches physical doc lines */}
              {PENALTY_ROWS.map((p) => {
                const isSelected = penaltyValue === p.value;
                return (
                  <tr
                    key={p.value}
                    onClick={() => setPenaltyValue(isSelected ? null : p.value)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? p.value === -1
                          ? "bg-destructive/10"
                          : "bg-primary/10"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <td className="border border-border px-3 py-2 text-muted-foreground">{p.label}</td>
                    <td className="border border-border px-3 py-2 text-center">
                      {isSelected && (
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${p.value === -1 ? "bg-destructive" : "bg-primary"}`} />
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Final score */}
              <tr className={`font-semibold ${eliminated ? "bg-destructive/10" : "bg-highlight/10"}`}>
                <td className="border border-border px-3 py-3 uppercase tracking-wide">FINAL SCORE in % :</td>
                <td className={`border border-border px-3 py-3 text-center tabular-nums text-base ${eliminated ? "text-destructive" : "text-highlight"}`}>
                  {eliminated
                    ? "Eliminated"
                    : finalPct !== null
                    ? pct(finalPct)
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer: Organisers + Signature — matches physical doc */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Organisers :<br />(exact address)
            </div>
            <Textarea
              value={header.organisers}
              onChange={(e) => setH({ organisers: e.target.value })}
              rows={3}
              className="w-full bg-transparent text-sm outline-none resize-y"
            />
          </div>
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Signature of Judge</div>
              <Input
                value={header.signature}
                onChange={(e) => setH({ signature: e.target.value })}
                className="w-full bg-transparent border-b border-dashed border-border py-1 text-sm outline-none focus:border-primary font-display italic"
              />
            </div>
            <div className="text-xs text-muted-foreground mt-4 italic">{header.judge || "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- QSelectField ---------- */

const QSelectField = ({
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

  const select = (v: string) => { onChange(v); setOpen(false); };

  return (
    <div ref={ref}>
      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`w-full flex items-center justify-between gap-2 bg-transparent border-b py-1 pr-0.5 text-sm text-left outline-none transition-colors ${
            open ? "border-primary" : "border-border hover:border-foreground/40"
          } ${value ? "text-foreground" : "text-muted-foreground"}`}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
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
