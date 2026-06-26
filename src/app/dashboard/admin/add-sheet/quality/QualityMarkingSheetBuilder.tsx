"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Check, ExternalLink, RotateCcw } from "lucide-react";
import {
  createQualitySheetAction,
  updateQualitySheetAction,
  deleteSheetAction,
} from "../actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Row = { title: string; description: string };

const emptyRow = (): Row => ({ title: "", description: "" });

export function QualityMarkingSheetBuilder({
  editSlug,
  initial,
  noteBuiltIn,
  deletable,
}: {
  editSlug?: string;
  initial?: { label: string; subtitle: string; rows: Row[] };
  noteBuiltIn?: boolean;
  deletable?: { mode: "reset" | "delete" };
} = {}) {
  const router = useRouter();
  const isEdit = !!editSlug;
  const [label, setLabel] = useState(initial?.label ?? "");
  const [subtitle, setSubtitle] = useState(
    initial?.subtitle ?? "Children Quality Marking Sheet – Including Directives"
  );
  const [rows, setRows] = useState<Row[]>(
    initial?.rows?.length
      ? initial.rows
      : [
          { title: "Rider's position and seat", description: "" },
          { title: "Effectiveness of aids", description: "" },
          { title: "Precision", description: "" },
          { title: "General impression", description: "" },
        ]
  );
  const [error, setError] = useState("");
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, startDelete] = useTransition();

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, emptyRow()]);
  const removeRow = (i: number) =>
    setRows((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs));

  const filled = rows.filter((r) => r.title.trim());

  const submit = () => {
    setError("");
    if (!label.trim()) return setError("Sheet name is required.");
    if (filled.length === 0) return setError("Add at least one assessment row.");

    const payload = { label, subtitle, criteria: filled };
    startTransition(async () => {
      const res = isEdit
        ? await updateQualitySheetAction(editSlug!, payload)
        : await createQualitySheetAction(payload);
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
            “{label}” {isEdit ? "has been updated." : "is now available in Scoring Sheets."}
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
    <div className="p-6 max-w-3xl mx-auto">
      <Link
        href="/dashboard/admin/add-sheet"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="font-display text-2xl tracking-tight mb-1">
        {isEdit ? "Edit quality marking sheet" : "Add dressage quality marking sheet"}
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        Columns are fixed (Assessment of individual tasks · Commentary · Mark). Add an assessment row
        for each criterion.
      </p>

      {noteBuiltIn && (
        <p className="text-xs text-highlight bg-highlight/10 rounded-lg px-3 py-2 mb-6">
          This is a built-in sheet. Editing creates an override; the original stays intact.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Sheet name <span className="text-destructive">*</span>
          </label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Children Quality 2025"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Subtitle</label>
          <Input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
          Assessment rows ({filled.length})
        </h2>
        <button
          onClick={addRow}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add row
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xs text-muted-foreground tabular-nums mt-2.5 w-5 text-right">
                {i + 1}.
              </span>
              <div className="flex-1 space-y-2">
                <Input
                  value={r.title}
                  onChange={(e) => setRow(i, { title: e.target.value })}
                  placeholder="Criterion title (e.g. Rider's position and seat)"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-medium outline-none focus:border-primary"
                />
                <Textarea
                  value={r.description}
                  onChange={(e) => setRow(i, { description: e.target.value })}
                  placeholder="Description / directives (optional, one idea per line)"
                  rows={2}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary resize-y"
                />
              </div>
              <button
                onClick={() => removeRow(i)}
                title="Remove row"
                className="grid place-items-center h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors mt-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground mt-3">
        Each row is marked 0–10 when scoring. Quality % = total ÷ (rows × 10), then combined with the
        technical score and penalties for the final %.
      </p>

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
