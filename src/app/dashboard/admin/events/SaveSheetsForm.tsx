"use client";

import { useTransition } from "react";
import { toast } from "@/components/ui/sonner";
import { saveEventSheetsAction } from "./actions";

type Sheet = { slug: string; category: string };

export function SaveSheetsForm({
  eventId,
  sheets,
  assignedSlugs,
}: {
  eventId: string;
  sheets: Sheet[];
  assignedSlugs: Set<string>;
}) {
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveEventSheetsAction(fd);
      if (res?.error) toast.error(res.error);
      else toast.success("Scoring sheets saved.");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 max-h-72 overflow-y-auto pr-1 no-scrollbar">
        {sheets.map((t) => (
          <label key={t.slug} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
            <input
              type="checkbox"
              name="slug"
              value={t.slug}
              defaultChecked={assignedSlugs.has(t.slug)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="truncate">{t.category}</span>
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save sheets"}
      </button>
    </form>
  );
}
