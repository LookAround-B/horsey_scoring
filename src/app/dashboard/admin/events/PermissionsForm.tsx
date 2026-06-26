"use client";

import { useTransition } from "react";
import { Eye } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { setVisibilityAction } from "./actions";

type Vis = { riders?: boolean; scores?: boolean; judges?: boolean; secretary?: boolean };

export function PermissionsForm({ eventId, vis }: { eventId: string; vis: Vis }) {
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await setVisibilityAction(fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Permissions saved.");
    });
  };

  const keys = ["riders", "scores", "judges", "secretary"] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {keys.map((k) => (
          <label
            key={k}
            className="flex items-center gap-2.5 text-sm capitalize cursor-pointer bg-muted/40 rounded-lg px-3 py-2.5 border border-border hover:bg-muted transition-colors"
          >
            <Checkbox name={k} defaultChecked={vis[k] ?? true} />
            <span>{k === "judges" ? "Officials" : k}</span>
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <Eye className="h-4 w-4" />
        {pending ? "Saving…" : "Save permissions"}
      </button>
    </form>
  );
}
