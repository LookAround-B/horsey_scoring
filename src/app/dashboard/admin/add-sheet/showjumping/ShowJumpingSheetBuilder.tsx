"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ExternalLink, Trash2, RotateCcw, Eye } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUnsavedGuard } from "@/hooks/use-unsaved-guard";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  createShowJumpingSheetAction,
  updateShowJumpingSheetAction,
  deleteSheetAction,
  type ObstacleColumn,
} from "../actions";
import { Input } from "@/components/ui/input";

const OBSTACLE_TYPES = [
  { value: "none", label: "None" },
  { value: "vertical", label: "Vertical" },
  { value: "oxer", label: "Oxer" },
  { value: "combination", label: "Combination" },
  { value: "water", label: "Water" },
] as const;

type LiveSettings = {
  speed: string;
  courseLength: string;
  timeAllowed: string;
  timeLimit: string;
  jumpoffStr: string;   // comma-separated obstacle labels for JO
  joTimeAllowed: string;
};

export function ShowJumpingSheetBuilder({
  editSlug,
  initial,
  noteBuiltIn,
  deletable,
}: {
  editSlug?: string;
  initial?: {
    label: string;
    subtitle: string;
    obstacles?: ObstacleColumn[];
    defaultRows: number;
    // live fields pre-populated when editing
    defaultSpeed?: number;
    defaultCourseLength?: number;
    defaultTimeAllowed?: number;
    defaultTimeLimit?: number;
    jumpoffObstacles?: string[];
    defaultJoTimeAllowed?: number;
  };
  noteBuiltIn?: boolean;
  deletable?: { mode: "reset" | "delete" };
} = {}) {
  const router = useRouter();
  const isEdit = !!editSlug;
  const [label, setLabel] = useState(initial?.label ?? "");
  const [subtitle, setSubtitle] = useState(
    initial?.subtitle ?? "Pony Club · Jumping Phase Score Sheet · Eventing"
  );
  const [obstacles, setObstacles] = useState<ObstacleColumn[]>(
    initial?.obstacles ?? Array.from({ length: 15 }, (_, i) => ({ name: `Obstacle ${i + 1}`, type: "" as const }))
  );
  const [defaultRows, setDefaultRows] = useState(String(initial?.defaultRows ?? 5));
  const [live, setLive] = useState<LiveSettings>({
    speed:        initial?.defaultSpeed        != null ? String(initial.defaultSpeed)        : "",
    courseLength: initial?.defaultCourseLength != null ? String(initial.defaultCourseLength) : "",
    timeAllowed:  initial?.defaultTimeAllowed  != null ? String(initial.defaultTimeAllowed)  : "",
    timeLimit:    initial?.defaultTimeLimit    != null ? String(initial.defaultTimeLimit)    : "",
    jumpoffStr:   initial?.jumpoffObstacles?.join(", ") ?? "",
    joTimeAllowed:initial?.defaultJoTimeAllowed!= null ? String(initial.defaultJoTimeAllowed): "",
  });
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, startDelete] = useTransition();

  const patchLive = (patch: Partial<LiveSettings>) => setLive(l => ({ ...l, ...patch }));

  const parseOptNum = (s: string): number | undefined => {
    const n = parseFloat(s);
    return isFinite(n) && n > 0 ? n : undefined;
  };

  const parseObsList = (s: string): string[] =>
    s.split(",").map(x => x.trim()).filter(Boolean);

  const handleObstacleCountChange = (count: number) => {
    const newCount = Math.max(1, Math.min(40, count));
    if (newCount === obstacles.length) return;

    if (newCount > obstacles.length) {
      const added: ObstacleColumn[] = Array.from({ length: newCount - obstacles.length }, (_, i) => ({
        name: `Obstacle ${obstacles.length + i + 1}`,
        type: "" as const,
      }));
      setObstacles([...obstacles, ...added]);
    } else {
      setObstacles(obstacles.slice(0, newCount));
    }
  };

  const updateObstacle = (index: number, field: "name" | "type", value: string) => {
    const updated = [...obstacles];
    updated[index] = { ...updated[index], [field]: value };
    setObstacles(updated);
  };

  const submit = () => {
    setError("");
    setWarning("");
    if (!label.trim()) return setError("Sheet name is required.");
    if (obstacles.length === 0) return setError("Obstacle columns must be at least 1.");
    const rows = parseInt(defaultRows, 10);
    if (!rows || rows < 1) return setError("Starting rows must be at least 1.");

    const joList = parseObsList(live.jumpoffStr);
    const payload = {
      label, subtitle, obstacles, defaultRows: rows,
      jumpoffObstacles:     joList.length > 0 ? joList : undefined,
      defaultSpeed:         parseOptNum(live.speed),
      defaultCourseLength:  parseOptNum(live.courseLength),
      defaultTimeAllowed:   parseOptNum(live.timeAllowed),
      defaultTimeLimit:     parseOptNum(live.timeLimit),
      defaultJoTimeAllowed: joList.length > 0 ? parseOptNum(live.joTimeAllowed) : undefined,
    };
    startTransition(async () => {
      const res = isEdit
        ? await updateShowJumpingSheetAction(editSlug!, payload)
        : await createShowJumpingSheetAction(payload);
      if (res.error) setError(res.error);
      else if (res.warning) setWarning(res.warning);
      if (res.slug) setCreatedSlug(res.slug);
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

  const snapshot = JSON.stringify({ label, subtitle, obstacles, defaultRows, live });
  const initialSnapshot = useRef(snapshot);
  const dirty = !createdSlug && snapshot !== initialSnapshot.current;
  const guard = useUnsavedGuard({ dirty, onSave: submit });
  const cancelHref = isEdit ? "/dashboard" : "/dashboard/admin/add-sheet";

  if (createdSlug) {
    return (
      <div className="p-6 max-w-xl mx-auto animate-fade-in">
        <div className="bg-card border border-border rounded-xl p-8 text-center animate-slide-in-up">
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

  // Preview modal
  if (showPreview) {
    return (
      <Dialog open onOpenChange={(o) => { if (!o) setShowPreview(false); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
            <h2 className="font-display text-lg tracking-tight">{label || "Preview"}</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Pony Club</label>
                  <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm h-9" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Date</label>
                  <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm h-9" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border px-2 py-1 text-left font-medium text-xs">Rider No</th>
                      <th className="border border-border px-2 py-1 text-left font-medium text-xs">Name</th>
                      <th className="border border-border px-2 py-1 text-left font-medium text-xs">Horse</th>
                      {obstacles.map((obs, i) => (
                        <th key={i} className="border border-border px-2 py-1 text-center font-medium text-xs whitespace-nowrap">
                          {obs.name || `Obstacle ${i + 1}`}
                          <br />
                          <span className="text-[10px] text-muted-foreground">{obs.type || "—"}</span>
                        </th>
                      ))}
                      <th className="border border-border px-2 py-1 text-center font-medium text-xs">Jumping Faults</th>
                      <th className="border border-border px-2 py-1 text-center font-medium text-xs">Time Faults</th>
                      <th className="border border-border px-2 py-1 text-center font-medium text-xs">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: parseInt(defaultRows) || 5 }).map((_, rowIdx) => (
                      <tr key={rowIdx}>
                        <td className="border border-border px-2 py-1 bg-card" />
                        <td className="border border-border px-2 py-1 bg-card" />
                        <td className="border border-border px-2 py-1 bg-card" />
                        {obstacles.map((_, colIdx) => (
                          <td key={colIdx} className="border border-border px-2 py-1 bg-card text-center" />
                        ))}
                        <td className="border border-border px-2 py-1 bg-card text-center" />
                        <td className="border border-border px-2 py-1 bg-card text-center" />
                        <td className="border border-border px-2 py-1 bg-card text-center" />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• {obstacles.length} obstacle columns</p>
                <p>• {parseInt(defaultRows) || 5} starting rider rows</p>
                <p>• Obstacle types: {[...new Set(obstacles.map(o => o.type).filter(Boolean))].join(", ") || "None"}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href="/dashboard/admin/add-sheet"
        onClick={guard.intercept("/dashboard/admin/add-sheet")}
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
          <Input
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
          <Input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="e.g. Pony Club · Jumping Phase Score Sheet · Eventing"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Number of obstacle columns <span className="text-destructive">*</span>
          </label>
          <Input
            type="number"
            min="1"
            max="40"
            value={obstacles.length}
            onChange={(e) => handleObstacleCountChange(parseInt(e.target.value, 10))}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <p className="text-[11px] text-muted-foreground mt-1">Number of jumps on the course.</p>
        </div>

        {obstacles.length > 0 && (
          <div className="mt-6">
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Obstacle details
            </label>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {obstacles.map((obstacle, i) => (
                <div key={i} className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Name</label>
                    <Input
                      type="text"
                      value={obstacle.name}
                      onChange={(e) => updateObstacle(i, "name", e.target.value)}
                      placeholder={`Obstacle ${i + 1}`}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Type</label>
                    <Select
                      value={obstacle.type || "none"}
                      onValueChange={(v) => updateObstacle(i, "type", v === "none" ? "" : v)}
                    >
                      <SelectTrigger className="w-full bg-background border-border text-sm h-9 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OBSTACLE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">#{i + 1}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Starting rider rows <span className="text-destructive">*</span>
          </label>
          <Input
            type="number"
            min="1"
            max="60"
            value={defaultRows}
            onChange={(e) => setDefaultRows(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <p className="text-[11px] text-muted-foreground mt-1">More can be added when scoring.</p>
        </div>

        {/* ── Live Scoring Defaults ─────────────────────────────────── */}
        <div className="pt-4 border-t border-border">
          <h3 className="font-display text-base mb-1">Live Scoring Defaults</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Pre-fill the course info panel in the live dashboard. All fields are optional and editable during scoring.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {([
              ["speed",        "Speed (m/min)",        "e.g. 350"],
              ["courseLength", "Course Length (m)",    "e.g. 450"],
              ["timeAllowed",  "Time Allowed — FR (sec)", "e.g. 77"],
              ["timeLimit",    "Time Limit — FR (sec)",   "e.g. 154"],
            ] as [keyof LiveSettings, string, string][]).map(([k, label, ph]) => (
              <label key={k} className="block">
                <span className="block text-xs text-muted-foreground mb-1">{label}</span>
                <Input
                  type="number"
                  min="1"
                  value={live[k]}
                  onChange={e => patchLive({ [k]: e.target.value })}
                  placeholder={ph}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-xs text-muted-foreground mb-1">
              Jump-off obstacles <span className="text-muted-foreground/60">(comma-separated — leave blank for no jump-off)</span>
            </label>
            <Input
              type="text"
              value={live.jumpoffStr}
              onChange={e => patchLive({ jumpoffStr: e.target.value })}
              placeholder="e.g. 1, 2, 4, 5, 6a, 6b"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Use the same labels as your obstacle names above. Enables the jump-off grid and JO standings algorithm.
            </p>
          </div>

          {live.jumpoffStr.trim() && (
            <div className="mt-3">
              <label className="block text-xs text-muted-foreground mb-1">Jump-off Time Allowed (sec)</label>
              <Input
                type="number"
                min="1"
                value={live.joTimeAllowed}
                onChange={e => patchLive({ joTimeAllowed: e.target.value })}
                placeholder="Defaults to FR Time Allowed if blank"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mt-4">{error}</p>
      )}

      {warning && (
        <p className="text-sm text-highlight bg-highlight/10 rounded-lg px-3 py-2 mt-4">{warning}</p>
      )}

      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={submit}
          disabled={pending}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save changes" : "Create sheet"}
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className="inline-flex items-center gap-2 border border-border text-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          <Eye className="h-4 w-4" /> Preview
        </button>
        <Link
          href={cancelHref}
          onClick={guard.intercept(cancelHref)}
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

      {guard.dialog}
    </div>
  );
}
