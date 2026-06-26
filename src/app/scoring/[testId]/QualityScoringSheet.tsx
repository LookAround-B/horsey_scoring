"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Save, Printer } from "lucide-react";
import type { QualityConfig } from "@/lib/sheetTypes";
import { useScoreStore } from "@/lib/useScoreStore";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Header = { efiRegNo: string; name: string; horse: string; organisers: string; signature: string };

const emptyHeader = (): Header => ({ efiRegNo: "", name: "", horse: "", organisers: "", signature: "" });

const PENALTIES = [
  { label: "No course error", value: 0 },
  { label: "1st error · −0.5%", value: 0.5 },
  { label: "2nd error · −1.0%", value: 1 },
  { label: "3rd error · Elimination", value: -1 },
];

const num = (s: string) => {
  const v = parseFloat(s);
  return isNaN(v) ? 0 : v;
};

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
  const [penalty, setPenalty] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    let live = true;
    store.load().then((d) => {
      if (live && d) {
        if (d.header) setHeader({ ...emptyHeader(), ...(d.header as object) });
        if (d.marks) setMarks(d.marks as Record<number, string>);
        if (d.comments) setComments(d.comments as Record<number, string>);
        if (typeof d.technical === "string") setTechnical(d.technical);
        if (typeof d.penalty === "number") setPenalty(d.penalty);
        if (typeof d.savedAt === "string") setSavedAt(d.savedAt);
      }
      if (live) setLoaded(true);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, eventId, riderId]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      const stamp = new Date().toISOString();
      const total = criteria.reduce((s, _, i) => s + num(marks[i] || ""), 0);
      const qPct = (total / (n * 10)) * 100;
      const tPct = num(technical);
      const result = penalty < 0 ? -1 : Math.max(0, (tPct + qPct) / 2 - penalty);
      store.save(
        { header, marks, comments, technical, penalty, savedAt: stamp },
        { result, signature: header.signature }
      );
      setSavedAt(stamp);
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [header, marks, comments, technical, penalty, loaded]);

  const totalMarks = useMemo(
    () => criteria.reduce((s, _, i) => s + num(marks[i] || ""), 0),
    [criteria, marks]
  );
  const maxMarks = n * 10;
  const qualityScore = totalMarks / n; // 0–10 average
  const qualityPct = (totalMarks / maxMarks) * 100;
  const technicalPct = num(technical);
  const totalPct = (technicalPct + qualityPct) / 2;
  const eliminated = penalty < 0;
  const finalPct = eliminated ? 0 : Math.max(0, totalPct - penalty);

  const savedLabel = useMemo(() => {
    if (!savedAt) return "";
    const d = new Date(savedAt);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [savedAt]);

  const reset = async () => {
    const ok = await confirm({
      title: "Clear this sheet?",
      description: "All marks, comments and penalties on this sheet will be reset.",
      confirmText: "Clear",
      destructive: true,
    });
    if (!ok) return;
    setHeader(emptyHeader());
    setMarks({});
    setComments({});
    setTechnical("");
    setPenalty(0);
    toast.success("Sheet cleared.");
  };

  const setH = (patch: Partial<Header>) => setHeader((h) => ({ ...h, ...patch }));
  const pct = (v: number) => (isFinite(v) ? `${v.toFixed(2)}%` : "—");

  const summaryRow = (labelText: string, value: string, strong = false) => (
    <div className={`flex items-center justify-between px-4 py-2.5 ${strong ? "bg-highlight/10" : ""}`}>
      <span className={`text-sm ${strong ? "font-semibold" : "text-muted-foreground"}`}>{labelText}</span>
      <span className={`tabular-nums ${strong ? "font-display text-lg text-highlight" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white">
      {confirmDialog}
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
                { header, marks, comments, technical, penalty, savedAt: stamp },
                { result: eliminated ? -1 : finalPct, signature: header.signature, status: "submitted" }
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
        <div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">{config.label}</h1>
          <p className="text-sm text-muted-foreground mt-1">{config.subtitle}</p>
        </div>

        {/* Header fields */}
        <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
          <div className="sm:col-span-1">
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">EFI Registration No</label>
            <input value={header.efiRegNo} onChange={(e) => setH({ efiRegNo: e.target.value })} className="w-full bg-transparent border-b border-border py-1 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Name</label>
            <input value={header.name} onChange={(e) => setH({ name: e.target.value })} className="w-full bg-transparent border-b border-border py-1 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Horse</label>
            <input value={header.horse} onChange={(e) => setH({ horse: e.target.value })} className="w-full bg-transparent border-b border-border py-1 text-sm outline-none focus:border-primary" />
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
                    <div className="font-medium">{c.title}</div>
                    {c.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line leading-snug">
                        {c.description}
                      </div>
                    )}
                  </td>
                  <td className="border border-border px-1 py-1">
                    <textarea
                      value={comments[i] ?? ""}
                      onChange={(e) => setComments((m) => ({ ...m, [i]: e.target.value }))}
                      rows={2}
                      className="w-full bg-transparent text-sm outline-none focus:bg-primary/5 rounded px-2 py-1 resize-y"
                    />
                  </td>
                  <td className="border border-border px-1 py-1">
                    <input
                      inputMode="decimal"
                      value={marks[i] ?? ""}
                      onChange={(e) => setMarks((m) => ({ ...m, [i]: e.target.value }))}
                      className="w-full bg-transparent text-center text-sm outline-none focus:bg-primary/5 rounded px-1 py-1"
                    />
                  </td>
                </tr>
              ))}
              <tr>
                <td className="border border-border px-3 py-2 font-medium" colSpan={2}>
                  Total marks (max {maxMarks})
                </td>
                <td className="border border-border px-1 py-2 text-center font-medium tabular-nums bg-muted/40">
                  {totalMarks || "—"}
                </td>
              </tr>
              <tr>
                <td className="border border-border px-3 py-2 font-medium" colSpan={2}>
                  Divided by {n} = Total Quality Score
                </td>
                <td className="border border-border px-1 py-2 text-center tabular-nums">
                  {totalMarks ? qualityScore.toFixed(2) : "—"}
                </td>
              </tr>
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

        {/* Combination + penalties + final */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-muted-foreground">Technical score in %</span>
              <input
                inputMode="decimal"
                value={technical}
                onChange={(e) => setTechnical(e.target.value)}
                placeholder="0.00"
                className="w-24 bg-background border border-border rounded-md px-2 py-1 text-sm text-right outline-none focus:border-primary"
              />
            </div>
            {summaryRow("Quality score in %", totalMarks ? pct(qualityPct) : "—")}
            {summaryRow("TOTAL score in % (Tech + Quality ÷ 2)", pct(totalPct))}
          </div>

          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            <div className="px-4 py-2.5">
              <div className="text-sm text-muted-foreground mb-1.5">To be deducted / penalty points</div>
              <Select
                value={String(penalty)}
                onValueChange={(v) => setPenalty(parseFloat(v))}
              >
                <SelectTrigger className="w-full bg-background border-border text-sm h-9 rounded-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PENALTIES.map((p) => (
                    <SelectItem key={p.label} value={String(p.value)}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {summaryRow(
              "FINAL SCORE in %",
              eliminated ? "Eliminated" : pct(finalPct),
              true
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Organisers (exact address)</div>
            <textarea
              value={header.organisers}
              onChange={(e) => setH({ organisers: e.target.value })}
              rows={2}
              className="w-full bg-transparent text-sm outline-none resize-y"
            />
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Signature of Judge</div>
            <input
              value={header.signature}
              onChange={(e) => setH({ signature: e.target.value })}
              className="w-full bg-transparent border-b border-dashed border-border py-1 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
