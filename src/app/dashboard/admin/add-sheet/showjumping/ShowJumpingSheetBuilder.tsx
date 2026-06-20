"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { createShowJumpingSheetAction } from "../actions";
import type { ObstacleType } from "@/lib/customSheets";

type Obstacle = { name: string; type: ObstacleType };

const TYPE_OPTIONS: { value: ObstacleType; label: string }[] = [
  { value: "", label: "— Type" },
  { value: "vertical", label: "Vertical" },
  { value: "oxer", label: "Oxer" },
  { value: "combination", label: "Combination" },
  { value: "water", label: "Water" },
];

const MAX_COLS = 40;
const newObstacle = (): Obstacle => ({ name: "", type: "" });

export function ShowJumpingSheetBuilder() {
  const [label, setLabel] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [colCount, setColCount] = useState(15);
  const [riderRows, setRiderRows] = useState(5);
  const [obstacles, setObstacles] = useState<Obstacle[]>(() =>
    Array.from({ length: 15 }, newObstacle)
  );
  const [error, setError] = useState("");
  const [createdLabel, setCreatedLabel] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Grow/shrink the obstacle list to match the requested column count,
  // preserving any names/types already entered.
  const syncCount = (raw: string) => {
    const n = Math.max(0, Math.min(MAX_COLS, Math.trunc(Number(raw)) || 0));
    setColCount(n);
    setObstacles((prev) => {
      if (n === prev.length) return prev;
      if (n < prev.length) return prev.slice(0, n);
      return [...prev, ...Array.from({ length: n - prev.length }, newObstacle)];
    });
  };

  const setObstacle = (i: number, patch: Partial<Obstacle>) =>
    setObstacles((o) => o.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const submit = () => {
    setError("");
    if (!label.trim()) return setError("Sheet name is required.");
    if (obstacles.length === 0) return setError("Set at least one obstacle column.");

    startTransition(async () => {
      const res = await createShowJumpingSheetAction({
        label,
        appendix: "",
        subtitle,
        obstacles,
        riderRows: Math.max(1, riderRows),
      });
      if (res.error) setError(res.error);
      else if (res.slug) setCreatedLabel(label.trim());
    });
  };

  if (createdLabel) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 grid place-items-center mb-4">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl tracking-tight mb-2">Sheet created</h1>
          <p className="text-sm text-muted-foreground mb-6">
            “{createdLabel}” is now available in Scoring Sheets. Place it in a discipline/event from
            the admin pages.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href="/dashboard/admin/add-sheet"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="font-display text-2xl tracking-tight mb-1">Add show jumping scoring sheet</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Set how many obstacle columns and starting rider rows the sheet has, and name each obstacle.
        Judges add more riders while scoring.
      </p>

      {/* Sheet name */}
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        Sheet name <span className="text-destructive">*</span>
      </label>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="e.g. Jumping Phase — Eventing"
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary mb-5"
      />

      {/* Subtitle */}
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        Subtitle
      </label>
      <input
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="Pony Club · Jumping Phase Score Sheet · Eventing"
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary mb-5"
      />

      {/* Counts */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Obstacle columns
          </label>
          <input
            type="number"
            min={1}
            max={MAX_COLS}
            value={colCount}
            onChange={(e) => syncCount(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <p className="text-[11px] text-muted-foreground mt-1">Number of jumps on the course.</p>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Starting rider rows
          </label>
          <input
            type="number"
            min={1}
            value={riderRows}
            onChange={(e) => setRiderRows(Math.max(0, Math.trunc(Number(e.target.value)) || 0))}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <p className="text-[11px] text-muted-foreground mt-1">More can be added when scoring.</p>
        </div>
      </div>

      {/* Per-column type + name */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
          Obstacle columns ({obstacles.length})
        </h2>
      </div>

      {obstacles.length === 0 ? (
        <p className="text-sm text-muted-foreground border border-dashed border-border rounded-xl px-3 py-6 text-center">
          Set the number of obstacle columns above to name them.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {obstacles.map((o, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-card border border-border rounded-lg px-2.5 py-2"
            >
              <span className="text-xs font-medium text-muted-foreground w-7 shrink-0 text-center">
                {i + 1}
              </span>
              <input
                value={o.name}
                onChange={(e) => setObstacle(i, { name: e.target.value })}
                placeholder={`Jump ${i + 1}`}
                className="min-w-0 flex-1 bg-background border border-border rounded-md px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
              <select
                value={o.type}
                onChange={(e) => setObstacle(i, { type: e.target.value as ObstacleType })}
                className="shrink-0 bg-background border border-border rounded-md px-2 py-1.5 text-sm outline-none focus:border-primary"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mt-4">{error}</p>
      )}

      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={submit}
          disabled={pending}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create sheet"}
        </button>
        <Link
          href="/dashboard/admin/add-sheet"
          className="text-sm px-4 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
