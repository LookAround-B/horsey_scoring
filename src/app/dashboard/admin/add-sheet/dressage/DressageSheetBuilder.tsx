"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, GripVertical, Check, ExternalLink, RotateCcw } from "lucide-react";
import { createDressageSheetAction, updateSheetAction, deleteSheetAction } from "../../add-sheet/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type Row = { no: string; letters: string; test: string; directive: string; coefficient: string };

const emptyRow = (): Row => ({ no: "", letters: "", test: "", directive: "", coefficient: "1" });

export function DressageSheetBuilder({
  editSlug,
  initial,
  noteBuiltIn,
  deletable,
}: {
  editSlug?: string;
  initial?: { label: string; appendix: string; subtitle: string; rows: Row[] };
  noteBuiltIn?: boolean;
  deletable?: { mode: "reset" | "delete" };
} = {}) {
  const router = useRouter();
  const isEdit = !!editSlug;
  const [label, setLabel] = useState(initial?.label ?? "");
  const [appendix, setAppendix] = useState(initial?.appendix ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [rows, setRows] = useState<Row[]>(
    initial?.rows?.length ? initial.rows : [emptyRow(), emptyRow(), emptyRow()]
  );
  const [error, setError] = useState("");
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, startDelete] = useTransition();

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, emptyRow()]);
  const removeRow = (i: number) => setRows((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs));

  const filledRows = rows.filter((r) => r.test.trim());

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

  const submit = () => {
    setError("");
    if (!label.trim()) return setError("Sheet name is required.");
    if (filledRows.length === 0) return setError("Add at least one movement (the Movement column).");

    const payload = {
      label,
      appendix,
      subtitle,
      movements: filledRows.map((r) => ({
        no: r.no,
        letters: r.letters,
        test: r.test,
        directive: r.directive,
        coefficient: parseFloat(r.coefficient) || 1,
      })),
    };

    startTransition(async () => {
      const res = isEdit
        ? await updateSheetAction(editSlug!, payload)
        : await createDressageSheetAction(payload);
      if (res.error) setError(res.error);
      else if (res.slug) setCreatedSlug(res.slug);
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
            “{label}” {isEdit ? "has been updated." : "is now available in Scoring Sheets."} You can
            place it in a discipline/event from the admin pages.
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
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href="/dashboard/admin/add-sheet"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="font-display text-2xl tracking-tight mb-1">
        {isEdit ? "Edit scoring sheet" : "Add dressage scoring sheet"}
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        The columns are fixed. Fill in the sheet details and add a row per movement.
      </p>
      {noteBuiltIn && (
        <p className="text-xs text-highlight bg-highlight/10 rounded-lg px-3 py-2 mb-6">
          This is a built-in sheet. Editing creates an override (the original code stays intact).
          Advanced parts (collective marks, freestyle/quality sections) are preserved but not editable
          here.
        </p>
      )}

      {/* Header fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="sm:col-span-1">
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Sheet name <span className="text-destructive">*</span>
          </label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Novice 2025"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Appendix</label>
          <Input
            value={appendix}
            onChange={(e) => setAppendix(e.target.value)}
            placeholder="e.g. Appendix A"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Subtitle</label>
          <Input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g. Time 5 min · Min age of horse: 6 years"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Movement rows */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
          Movements ({filledRows.length})
        </h2>
        <button
          onClick={addRow}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add row
        </button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        {/* header */}
        <div className="hidden md:grid grid-cols-[40px_70px_1fr_1fr_70px_36px] gap-2 px-3 py-2 bg-muted text-[10px] uppercase tracking-wider text-muted-foreground">
          <div>No.</div>
          <div>Letters</div>
          <div>Movement</div>
          <div>Directive ideas</div>
          <div>Coef.</div>
          <div />
        </div>
        <div className="divide-y divide-border">
          {rows.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-2 md:grid-cols-[40px_70px_1fr_1fr_70px_36px] gap-2 px-3 py-2 items-start"
            >
              <Input
                value={r.no}
                onChange={(e) => setRow(i, { no: e.target.value })}
                placeholder={String(i + 1)}
                className="bg-background border border-border rounded-md px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
              <Input
                value={r.letters}
                onChange={(e) => setRow(i, { letters: e.target.value })}
                placeholder="A X"
                className="bg-background border border-border rounded-md px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
              <Textarea
                value={r.test}
                onChange={(e) => setRow(i, { test: e.target.value })}
                placeholder="Movement description"
                rows={2}
                className="col-span-2 md:col-span-1 bg-background border border-border rounded-md px-2 py-1.5 text-sm outline-none focus:border-primary resize-y"
              />
              <Textarea
                value={r.directive}
                onChange={(e) => setRow(i, { directive: e.target.value })}
                placeholder="Directive ideas"
                rows={2}
                className="col-span-2 md:col-span-1 bg-background border border-border rounded-md px-2 py-1.5 text-sm outline-none focus:border-primary resize-y"
              />
              <Input
                type="number"
                min="1"
                step="1"
                value={r.coefficient}
                onChange={(e) => setRow(i, { coefficient: e.target.value })}
                className="bg-background border border-border rounded-md px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={() => removeRow(i)}
                title="Remove row"
                className="grid place-items-center h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
        <GripVertical className="h-3 w-3" /> Marks, corrections, final score and collective marks are
        added automatically on the scoring page.
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

      {confirmingDelete && deletable && (
        <p className="text-xs text-muted-foreground mt-2 text-right">
          {deletable.mode === "reset"
            ? "This removes your edits and restores the built-in sheet."
            : "This permanently deletes the sheet."}
        </p>
      )}
    </div>
  );
}
