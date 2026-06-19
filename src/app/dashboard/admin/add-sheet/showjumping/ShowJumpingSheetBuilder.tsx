"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ExternalLink, Trash2, RotateCcw } from "lucide-react";
import {
  createShowJumpingSheetAction,
  updateShowJumpingSheetAction,
  deleteSheetAction,
} from "../actions";

export function ShowJumpingSheetBuilder({
  editSlug,
  initial,
  noteBuiltIn,
  deletable,
}: {
  editSlug?: string;
  initial?: { label: string; subtitle: string; obstacleCount: number; defaultRows: number };
  noteBuiltIn?: boolean;
  deletable?: { mode: "reset" | "delete" };
} = {}) {
  const router = useRouter();
  const isEdit = !!editSlug;
  const [label, setLabel] = useState(initial?.label ?? "");
  const [subtitle, setSubtitle] = useState(
    initial?.subtitle ?? "Pony Club · Jumping Phase Score Sheet · Eventing"
  );
  const [obstacleCount, setObstacleCount] = useState(String(initial?.obstacleCount ?? 15));
  const [defaultRows, setDefaultRows] = useState(String(initial?.defaultRows ?? 5));
  const [error, setError] = useState("");
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, startDelete] = useTransition();

  const submit = () => {
    setError("");
    if (!label.trim()) return setError("Sheet name is required.");
    const obstacles = parseInt(obstacleCount, 10);
    const rows = parseInt(defaultRows, 10);
    if (!obstacles || obstacles < 1) return setError("Obstacle columns must be at least 1.");
    if (!rows || rows < 1) return setError("Starting rows must be at least 1.");

    const payload = { label, subtitle, obstacleCount: obstacles, defaultRows: rows };
    startTransition(async () => {
      const res = isEdit
        ? await updateShowJumpingSheetAction(editSlug!, payload)
        : await createShowJumpingSheetAction(payload);
      if (res.error) setError(res.error);
      else if (res.slug) setCreatedSlug(res.slug);
    });
  };

  const onDelete = () => {
    if (!editSlug) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    startDelete(async () => {
      await deleteSheetAction(editSlug);
      router.push("/dashboard");
      router.refresh();
    });
  };

  if (createdSlug) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 grid place-items-center mb-4">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl tracking-tight mb-2">
            {isEdit ? "Sheet updated" : "Sheet created"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            “{label}” {isEdit ? "has been updated." : "is now available in Scoring Sheets (Show Jumping)."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href={`/scoring/${createdSlug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Open sheet <ExternalLink className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="border border-border rounded-lg px-4 py-2.5 text-sm font-medium hover:border-foreground/30 transition-colors"
            >
              Back to dashboard
            </Link>
          </div>
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

      <h1 className="font-display text-2xl tracking-tight mb-1">
        {isEdit ? "Edit show jumping sheet" : "Add show jumping scoring sheet"}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Set how many obstacle columns and starting rider rows the sheet has. Judges add more riders
        while scoring.
      </p>

      {noteBuiltIn && (
        <p className="text-xs text-highlight bg-highlight/10 rounded-lg px-3 py-2 mb-6">
          This is a built-in sheet. Editing creates an override; the original stays intact.
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Sheet name <span className="text-destructive">*</span>
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Jumping Phase — Eventing"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Subtitle
          </label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g. Pony Club · Jumping Phase Score Sheet · Eventing"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              Obstacle columns
            </label>
            <input
              type="number"
              min="1"
              max="40"
              value={obstacleCount}
              onChange={(e) => setObstacleCount(e.target.value)}
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
              min="1"
              max="60"
              value={defaultRows}
              onChange={(e) => setDefaultRows(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <p className="text-[11px] text-muted-foreground mt-1">More can be added when scoring.</p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mt-4">{error}</p>
      )}

      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={submit}
          disabled={pending}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save changes" : "Create sheet"}
        </button>
        <Link
          href={isEdit ? "/dashboard" : "/dashboard/admin/add-sheet"}
          className="text-sm px-4 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          Cancel
        </Link>

        {deletable && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="ml-auto inline-flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-lg border transition-colors disabled:opacity-50 border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            {deletable.mode === "reset" ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            {deleting
              ? "Working…"
              : confirmingDelete
                ? "Click again to confirm"
                : deletable.mode === "reset"
                  ? "Reset to original"
                  : "Delete sheet"}
          </button>
        )}
      </div>
    </div>
  );
}
