"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Check } from "lucide-react";
import { importRidersAction } from "./actions";

type Parsed = { name: string; competitorNo: string; nf: string; horse: string; horseNo: string };

function parseCsv(text: string): Parsed[] {
  const out: Parsed[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const cells = line.split(",").map((c) => c.trim());
    // skip a header row
    if (out.length === 0 && /name/i.test(cells[0]) && /no|comp|nf|horse/i.test(line)) continue;
    const [name, competitorNo = "", nf = "", horse = "", horseNo = ""] = cells;
    if (!name) continue;
    out.push({ name, competitorNo, nf, horse, horseNo });
  }
  return out;
}

export function BulkRiderImport({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(0);
  const [pending, startTransition] = useTransition();

  const parsed = useMemo(() => parseCsv(text), [text]);

  const submit = () => {
    setError("");
    if (parsed.length === 0) {
      setError("No valid rows found.");
      return;
    }
    startTransition(async () => {
      const res = await importRidersAction(eventId, parsed);
      if (res.error) setError(res.error);
      else {
        setDone(res.count ?? 0);
        setText("");
        router.refresh();
        setTimeout(() => {
          setDone(0);
          setOpen(false);
        }, 1800);
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors mb-4"
      >
        <Upload className="h-3.5 w-3.5" /> Bulk import (CSV)
      </button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-4">
      <div className="text-xs text-muted-foreground mb-2">
        Paste one rider per line: <code className="font-mono">Name, Competitor No, NF, Horse, Horse No</code>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={"Sophia Patel, 101, IND, Black Beauty, H01\nAisha Khan, 102, IND, Thunder, H02"}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-primary resize-y"
      />
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={submit}
          disabled={pending || parsed.length === 0}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {done ? <><Check className="h-4 w-4" /> Imported {done}</> : pending ? "Importing…" : `Import ${parsed.length} rider${parsed.length === 1 ? "" : "s"}`}
        </button>
        <button onClick={() => { setOpen(false); setText(""); setError(""); }} className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}
