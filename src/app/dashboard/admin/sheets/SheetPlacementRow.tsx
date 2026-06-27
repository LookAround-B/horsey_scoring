"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Eye } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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

  const onChange = (next: string) => {
    const disc = next as Discipline;
    setValue(disc);
    setSaved(false);
    startTransition(async () => {
      await setPlacementAction(slug, disc);
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
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <Check className="h-4 w-4" />
        ) : null}
      </div>

      <a
        href={`/scoring/${encodeURIComponent(slug)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 shrink-0 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
        title="Open scoring sheet"
      >
        <Eye className="h-3.5 w-3.5" /> View
      </a>

      <Select value={value} onValueChange={onChange} disabled={pending}>
        <SelectTrigger className="w-36 bg-background border-border text-sm h-8 rounded-lg disabled:opacity-60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dressage">Dressage</SelectItem>
          <SelectItem value="showjumping">Show Jumping</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
