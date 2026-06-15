"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import type { Discipline } from "@/lib/sheets";
import { setPlacementAction } from "./actions";

export function SheetPlacementRow({
  slug,
  category,
  appendix,
  initial,
}: {
  slug: string;
  category: string;
  appendix: string;
  initial: Discipline;
}) {
  const [value, setValue] = useState<Discipline>(initial);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const onChange = (next: Discipline) => {
    setValue(next);
    setSaved(false);
    startTransition(async () => {
      await setPlacementAction(slug, next);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{category}</div>
        <div className="text-[11px] text-muted-foreground truncate">{appendix}</div>
      </div>

      <div className="w-5 shrink-0 text-primary">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Discipline)}
        disabled={pending}
        className="shrink-0 bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary disabled:opacity-60"
      >
        <option value="dressage">Dressage</option>
        <option value="showjumping">Show Jumping</option>
      </select>
    </div>
  );
}
