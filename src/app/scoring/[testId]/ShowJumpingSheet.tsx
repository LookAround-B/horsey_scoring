"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, RotateCcw, Save, Printer } from "lucide-react";
import type { ShowJumpingConfig } from "@/lib/sheetTypes";
import { useScoreStore } from "@/lib/useScoreStore";
import { EventTimer } from "@/components/EventTimer";

type Row = {
  riderNo: string;
  name: string;
  horse: string;
  obstacles: string[];
  jumpingTime: string;
  timeFaults: string;
};

type Header = {
  ponyClub: string;
  date: string;
  className: string;
  courseDesigner: string;
  judge: string;
  length: string;
  timeAllowed: string;
  timeLimit: string;
};

const emptyHeader = (): Header => ({
  ponyClub: "",
  date: "",
  className: "",
  courseDesigner: "",
  judge: "",
  length: "",
  timeAllowed: "",
  timeLimit: "",
});

const emptyRow = (n: number): Row => ({
  riderNo: "",
  name: "",
  horse: "",
  obstacles: Array.from({ length: n }, () => ""),
  jumpingTime: "",
  timeFaults: "",
});

const num = (s: string) => {
  const v = parseFloat(s);
  return isNaN(v) ? 0 : v;
};

export function ShowJumpingSheet({
  config,
  slug,
  eventId,
}: {
  config: ShowJumpingConfig;
  slug: string;
  eventId?: string | null;
}) {
  const obstacleCount = config.obstacles.length;
  const STORAGE_KEY = `sj-scoring-v1:${slug}`;
  const store = useScoreStore({ slug, eventId, riderId: null, localKey: STORAGE_KEY });

  const [header, setHeader] = useState<Header>(emptyHeader());
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: config.riderRows }, () => emptyRow(obstacleCount))
  );
  const [signature, setSignature] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<string>("");

  // Restore draft
  useEffect(() => {
    let live = true;
    store.load().then((d) => {
      if (live && d) {
        if (d.header) setHeader({ ...emptyHeader(), ...(d.header as object) });
        if (Array.isArray(d.rows)) {
          setRows(
            (d.rows as Partial<Row>[]).map((r) => ({
              ...emptyRow(obstacleCount),
              ...r,
              obstacles: Array.from({ length: obstacleCount }, (_, i) => r.obstacles?.[i] ?? ""),
            }))
          );
        }
        if (typeof d.signature === "string") setSignature(d.signature);
        if (typeof d.savedAt === "string") setSavedAt(d.savedAt);
      }
      if (live) setLoaded(true);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, eventId]);

  // Autosave
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      const stamp = new Date().toISOString();
      store.save({ header, rows, signature, savedAt: stamp });
      setSavedAt(stamp);
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [header, rows, signature, loaded]);

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const setObstacle = (i: number, j: number, val: string) =>
    setRows((rs) =>
      rs.map((r, idx) =>
        idx === i ? { ...r, obstacles: r.obstacles.map((o, k) => (k === j ? val : o)) } : r
      )
    );
  const addRow = () => setRows((rs) => [...rs, emptyRow(obstacleCount)]);
  const removeRow = (i: number) =>
    setRows((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs));

  const jumpingFaults = (r: Row) => r.obstacles.reduce((s, o) => s + num(o), 0);
  const totalFaults = (r: Row) => jumpingFaults(r) + num(r.timeFaults);

  const savedLabel = useMemo(() => {
    if (!savedAt) return "";
    const d = new Date(savedAt);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [savedAt]);

  const reset = () => {
    if (!confirm("Clear this sheet? All entered scores will be removed.")) return;
    setHeader(emptyHeader());
    setRows(Array.from({ length: config.riderRows }, () => emptyRow(obstacleCount)));
    setSignature("");
  };

  const setH = (patch: Partial<Header>) => setHeader((h) => ({ ...h, ...patch }));

  const headerField = (
    labelText: string,
    value: string,
    onChange: (v: string) => void,
    placeholder = ""
  ) => (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {labelText}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-b border-border px-0 py-1 text-sm outline-none focus:border-primary"
      />
    </div>
  );

  const cellCls =
    "w-full bg-transparent text-center text-sm outline-none focus:bg-primary/5 rounded px-0.5 py-1";

  return (
    <div className="min-h-screen bg-background text-foreground print:bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-border bg-card/90 backdrop-blur print:hidden">
        <Link href="/dashboard" className="p-1.5 rounded-md hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-display text-xs font-semibold">
          SJ
        </div>
        <div className="min-w-0">
          <div className="font-display text-sm leading-tight truncate">{config.label}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Show jumping · Scoring
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {savedLabel && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Saved · {savedLabel}
            </span>
          )}
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <EventTimer timeAllowed={header.timeAllowed} timeLimit={header.timeLimit} discipline="showjumping" />
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Export PDF
          </button>
          <button
            onClick={() => {
              const stamp = new Date().toISOString();
              store.save({ header, rows, signature, savedAt: stamp }, { status: "submitted" });
              setSavedAt(stamp);
            }}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Save className="h-3.5 w-3.5" /> Save Sheet
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Title */}
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
            Pony Club · Eventing
          </div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">
            Jumping Phase <span className="italic text-highlight">score sheet</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{config.subtitle}</p>
        </div>

        {/* Header fields */}
        <div className="bg-card border border-border rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          {headerField("Pony Club", header.ponyClub, (v) => setH({ ponyClub: v }))}
          {headerField("Date", header.date, (v) => setH({ date: v }))}
          {headerField("Class", header.className, (v) => setH({ className: v }))}
          {headerField("Course Designer", header.courseDesigner, (v) => setH({ courseDesigner: v }))}
          {headerField("Judge", header.judge, (v) => setH({ judge: v }))}
          {headerField("Length", header.length, (v) => setH({ length: v }))}
          {headerField("Time Allowed", header.timeAllowed, (v) => setH({ timeAllowed: v }))}
          {headerField("Time Limit", header.timeLimit, (v) => setH({ timeLimit: v }))}
        </div>

        {/* Rounds */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl">Rounds</h2>
            <button
              onClick={addRow}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors print:hidden"
            >
              <Plus className="h-3.5 w-3.5" /> Add Rider
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="border border-border px-2 py-2 font-medium text-left w-16">Rider No.</th>
                  <th className="border border-border px-2 py-2 font-medium text-left min-w-[120px]">Name</th>
                  <th className="border border-border px-2 py-2 font-medium text-left min-w-[120px]">Horse</th>
                  <th
                    className="border border-border px-2 py-1 font-medium text-center"
                    colSpan={obstacleCount}
                  >
                    Showjumping Obstacle Numbers
                  </th>
                  <th className="border border-border px-2 py-2 font-medium text-center w-20">Jumping Faults</th>
                  <th className="border border-border px-2 py-2 font-medium text-center w-20">Jumping Time</th>
                  <th className="border border-border px-2 py-2 font-medium text-center w-16">Time Faults</th>
                  <th className="border border-border px-2 py-2 font-medium text-center w-16">Total Faults</th>
                  <th className="border border-border px-1 py-2 w-8 print:hidden" />
                </tr>
                <tr className="text-[10px] text-muted-foreground">
                  <th className="border border-border" />
                  <th className="border border-border" />
                  <th className="border border-border" />
                  {Array.from({ length: obstacleCount }, (_, j) => (
                    <th key={j} className="border border-border px-1 py-1 font-normal text-center w-8">
                      {j + 1}
                    </th>
                  ))}
                  <th className="border border-border" />
                  <th className="border border-border" />
                  <th className="border border-border" />
                  <th className="border border-border" />
                  <th className="border border-border print:hidden" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="border border-border px-1">
                      <input value={r.riderNo} onChange={(e) => setRow(i, { riderNo: e.target.value })} className={cellCls} />
                    </td>
                    <td className="border border-border px-1">
                      <input value={r.name} onChange={(e) => setRow(i, { name: e.target.value })} className="w-full bg-transparent text-sm outline-none focus:bg-primary/5 rounded px-1 py-1" />
                    </td>
                    <td className="border border-border px-1">
                      <input value={r.horse} onChange={(e) => setRow(i, { horse: e.target.value })} className="w-full bg-transparent text-sm outline-none focus:bg-primary/5 rounded px-1 py-1" />
                    </td>
                    {r.obstacles.map((o, j) => (
                      <td key={j} className="border border-border px-0.5">
                        <input
                          inputMode="numeric"
                          value={o}
                          onChange={(e) => setObstacle(i, j, e.target.value)}
                          className={cellCls}
                        />
                      </td>
                    ))}
                    <td className="border border-border px-1 text-center font-medium tabular-nums bg-muted/40">
                      {jumpingFaults(r) || "—"}
                    </td>
                    <td className="border border-border px-1">
                      <input
                        value={r.jumpingTime}
                        onChange={(e) => setRow(i, { jumpingTime: e.target.value })}
                        placeholder="mm:ss"
                        className={`${cellCls} placeholder:text-muted-foreground/50`}
                      />
                    </td>
                    <td className="border border-border px-1">
                      <input
                        inputMode="numeric"
                        value={r.timeFaults}
                        onChange={(e) => setRow(i, { timeFaults: e.target.value })}
                        className={cellCls}
                      />
                    </td>
                    <td className="border border-border px-1 text-center font-semibold tabular-nums bg-highlight/10 text-highlight">
                      {totalFaults(r) || "—"}
                    </td>
                    <td className="border border-border px-0.5 text-center print:hidden">
                      <button
                        onClick={() => removeRow(i)}
                        className="grid place-items-center h-7 w-7 mx-auto rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                        title="Remove rider"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer: course designer + signature */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Course Designer</div>
            <div className="text-sm">{header.courseDesigner || "—"}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Signature of Judge</div>
            <input
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full bg-transparent border-b border-dashed border-border py-1 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
