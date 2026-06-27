"use client";

import { useMemo, useState, useTransition } from "react";
import { Users } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { saveSheetRidersAction } from "./actions";
import type { EventRider } from "@/lib/events";

export function SheetRidersForm({
  eventId,
  testSlug,
  label,
  riders,
  selectedIds,
}: {
  eventId: string;
  testSlug: string;
  label: string;
  riders: EventRider[];
  selectedIds: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState("");
  // Local checked state, seeded from saved selection; reset each time the dialog opens.
  const [checked, setChecked] = useState<Set<string>>(() => new Set(selectedIds));
  const [savedCount, setSavedCount] = useState(selectedIds.size);

  const onOpenChange = (next: boolean) => {
    if (next) {
      setChecked(new Set(selectedIds));
      setFilter("");
    }
    setOpen(next);
  };

  const toggle = (id: string, on: boolean) =>
    setChecked((prev) => {
      const s = new Set(prev);
      if (on) s.add(id);
      else s.delete(id);
      return s;
    });

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return riders;
    return riders.filter((r) =>
      [r.name, r.competitor_no, r.horse].some((v) => v?.toLowerCase().includes(q))
    );
  }, [riders, filter]);

  const allFilteredChecked =
    filtered.length > 0 && filtered.every((r) => checked.has(r.id));

  const toggleAll = () =>
    setChecked((prev) => {
      const s = new Set(prev);
      if (allFilteredChecked) filtered.forEach((r) => s.delete(r.id));
      else filtered.forEach((r) => s.add(r.id));
      return s;
    });

  const save = () => {
    const fd = new FormData();
    fd.set("eventId", eventId);
    fd.set("testSlug", testSlug);
    checked.forEach((id) => fd.append("riderId", id));
    startTransition(async () => {
      const res = await saveSheetRidersAction(fd);
      if (res?.error) toast.error(res.error);
      else {
        setSavedCount(checked.size);
        toast.success("Riders saved.");
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition-colors shrink-0"
        >
          <Users className="h-3.5 w-3.5" /> Riders ({savedCount})
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Riders on this sheet</DialogTitle>
          <DialogDescription className="truncate">{label}</DialogDescription>
        </DialogHeader>

        {riders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No riders in this event yet. Add riders in the Riders section above first.
          </p>
        ) : (
          <>
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter riders…"
              className="text-sm"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
              <button type="button" onClick={toggleAll} className="hover:text-foreground">
                {allFilteredChecked ? "Clear all" : "Select all"}
              </button>
              <span>{checked.size} selected</span>
            </div>
            <div className="max-h-72 overflow-y-auto pr-1 -mr-1 divide-y divide-border">
              {filtered.map((r) => (
                <label
                  key={r.id}
                  className="flex items-center gap-2.5 py-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={checked.has(r.id)}
                    onCheckedChange={(v) => toggle(r.id, v === true)}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="font-medium">{r.name}</span>
                    {r.horse ? (
                      <span className="text-muted-foreground"> · {r.horse}</span>
                    ) : null}
                  </span>
                  {r.competitor_no ? (
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      #{r.competitor_no}
                    </span>
                  ) : null}
                </label>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground py-3">No matches.</p>
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <button
              type="button"
              className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </DialogClose>
          <button
            type="button"
            onClick={save}
            disabled={pending || riders.length === 0}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save riders"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
