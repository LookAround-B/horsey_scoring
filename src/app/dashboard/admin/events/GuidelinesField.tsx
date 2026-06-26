"use client";

import { useState, useTransition } from "react";
import { BookmarkPlus, Check } from "lucide-react";
import { saveGuidelineTemplateAction } from "./actions";
import type { GuidelineTemplate } from "@/lib/events";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export function GuidelinesField({
  initial,
  templates,
}: {
  initial?: string | null;
  templates: GuidelineTemplate[];
}) {
  const [text, setText] = useState(initial ?? "");
  const [title, setTitle] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const saveTemplate = () => {
    setError("");
    startTransition(async () => {
      const res = await saveGuidelineTemplateAction(title, text);
      if (res.error) setError(res.error);
      else {
        setSaved(true);
        setTitle("");
        setShowSave(false);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Guidelines</label>
        {templates.length > 0 && (
          <Select
            value=""
            onValueChange={(v) => {
              const t = templates.find((x) => x.id === v);
              if (t) setText(t.body);
            }}
          >
            <SelectTrigger className="h-7 text-xs bg-background border-border rounded-md px-2 w-auto gap-1">
              <SelectValue placeholder="Load saved guideline…" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <Textarea
        name="guidelines"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Event guidelines, rules, schedule notes…"
        className="resize-y"
      />

      <div className="mt-2">
        {showSave ? (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Template name"
              className="flex-1 min-w-[140px] bg-background border border-border rounded-md px-2 py-1.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={saveTemplate}
              disabled={pending}
              className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save template"}
            </button>
            <button type="button" onClick={() => setShowSave(false)} className="text-xs px-2 py-1.5 text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowSave(true)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            {saved ? <><Check className="h-3.5 w-3.5 text-primary" /> Saved for future events</> : <><BookmarkPlus className="h-3.5 w-3.5" /> Save these guidelines for future events</>}
          </button>
        )}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    </div>
  );
}
