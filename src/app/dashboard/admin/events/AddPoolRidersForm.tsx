"use client";

import { useState, useTransition } from "react";
import { toast } from "@/components/ui/sonner";
import { addExistingRidersAction } from "./actions";
import { Plus } from "lucide-react";
import type { Rider } from "@/lib/events";

export function AddPoolRidersForm({
  eventId,
  allRiders,
  eventRiderIds,
}: {
  eventId: string;
  allRiders: Rider[];
  eventRiderIds: Set<string>;
}) {
  const [pending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const availableRiders = allRiders.filter((r) => !eventRiderIds.has(r.id));

  const handleToggle = (riderId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(riderId)) {
      newSet.delete(riderId);
    } else {
      newSet.add(riderId);
    }
    setSelectedIds(newSet);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedIds.size === 0) {
      toast.error("Select at least one rider.");
      return;
    }
    startTransition(async () => {
      const res = await addExistingRidersAction(eventId, Array.from(selectedIds));
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Added ${res.count} rider(s)!`);
        setSelectedIds(new Set());
      }
    });
  };

  if (availableRiders.length === 0) {
    return (
      <p className="text-xs text-muted-foreground mb-3">
        All available riders are already in this event.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-3 bg-muted rounded-lg border border-border">
      <p className="text-xs text-muted-foreground mb-2">
        Add existing riders from the global pool:
      </p>
      <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
        {availableRiders.map((rider) => (
          <label key={rider.id} className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={selectedIds.has(rider.id)}
              onChange={() => handleToggle(rider.id)}
              className="rounded border border-border"
            />
            <span className="font-medium">{rider.name}</span>
            {rider.competitor_no && <span className="text-xs text-muted-foreground">#{rider.competitor_no}</span>}
            {rider.horse && <span className="text-xs text-muted-foreground">{rider.horse}</span>}
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={pending || selectedIds.size === 0}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="h-3.5 w-3.5" />
        {pending ? "Adding…" : `Add (${selectedIds.size})`}
      </button>
    </form>
  );
}
