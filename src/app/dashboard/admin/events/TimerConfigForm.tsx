"use client";

import { useTransition } from "react";
import { Timer } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { setTimerConfigAction } from "./actions";

type TimerConfig = { dressage?: number; showjumping?: number };

export function TimerConfigForm({ eventId, config }: { eventId: string; config: TimerConfig }) {
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await setTimerConfigAction(fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Timer config saved.");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Dressage time allowed (seconds)
          </label>
          <input
            type="number"
            name="dressSec"
            min="0"
            defaultValue={config.dressage ?? ""}
            placeholder="e.g. 90"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Show Jumping time allowed (seconds)
          </label>
          <input
            type="number"
            name="sjSec"
            min="0"
            defaultValue={config.showjumping ?? ""}
            placeholder="e.g. 75"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Time limit (elimination) is automatically set to 2× the time allowed.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <Timer className="h-4 w-4" />
        {pending ? "Saving…" : "Save timer config"}
      </button>
    </form>
  );
}
