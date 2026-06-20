"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Timer, X } from "lucide-react";

function parseSeconds(s: string): number {
  if (!s.trim()) return 0;
  if (s.includes(":")) {
    const parts = s.split(":");
    return parseInt(parts[0]) * 60 + parseFloat(parts[1] || "0");
  }
  return parseFloat(s) || 0;
}

function fmtTime(tenths: number) {
  const total = tenths / 10;
  const m = Math.floor(total / 60);
  const s = total % 60;
  const sPad = s < 10 ? "0" + s.toFixed(1) : s.toFixed(1);
  return m > 0 ? `${m}:${sPad}` : s.toFixed(1);
}

export function EventTimer({
  timeAllowed = "",
  timeLimit = "",
  discipline = "showjumping",
}: {
  timeAllowed?: string;
  timeLimit?: string;
  discipline?: "dressage" | "showjumping";
}) {
  const [tenths, setTenths] = useState(0);
  const [running, setRunning] = useState(false);
  const [open, setOpen] = useState(false);
  const [splits, setSplits] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const taSec = parseSeconds(timeAllowed);
  const tlSec = parseSeconds(timeLimit) || (taSec > 0 ? taSec * 2 : 0);
  const elapsed = tenths / 10;

  const taExceeded = taSec > 0 && elapsed > taSec;
  const tlExceeded = tlSec > 0 && elapsed > tlSec;
  const taWarning = taSec > 0 && !taExceeded && elapsed >= taSec * 0.85;

  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    intervalRef.current = setInterval(() => setTenths((t) => t + 1), 100);
  }, [running]);

  const pause = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTenths(0);
    setSplits([]);
  }, []);

  const split = useCallback(() => {
    setSplits((s) => [...s, tenths]);
  }, [tenths]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const colorCls = tlExceeded
    ? "text-destructive bg-destructive/10 border-destructive/30"
    : taExceeded
    ? "text-destructive bg-destructive/5 border-destructive/20"
    : taWarning
    ? "text-highlight bg-highlight/5 border-highlight/30"
    : "text-foreground bg-muted/40 border-transparent";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Open stopwatch"
        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors print:hidden ${
          running
            ? "border-highlight bg-highlight/10 text-highlight"
            : "border-border hover:bg-muted"
        }`}
      >
        <Timer className="h-3.5 w-3.5" />
        {tenths > 0 ? fmtTime(tenths) : "Timer"}
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-card border border-border rounded-2xl shadow-xl p-4 w-60 print:hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {discipline === "dressage" ? "Dressage" : "Show Jumping"} · Timer
        </span>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-0.5 rounded">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Display */}
      <div className={`font-display text-5xl tabular-nums text-center py-3 rounded-xl border mb-2 transition-colors ${colorCls}`}>
        {fmtTime(tenths)}
      </div>

      {/* Status */}
      {(taSec > 0 || tlSec > 0) && (
        <div className="text-[10px] text-center text-muted-foreground mb-2 space-y-0.5">
          {taSec > 0 && (
            <div>
              TA <span className="tabular-nums font-medium">{fmtTime(taSec * 10)}</span>
              {taExceeded && <span className="text-destructive ml-1">· Time fault!</span>}
            </div>
          )}
          {tlSec > 0 && (
            <div>
              TL <span className="tabular-nums font-medium">{fmtTime(tlSec * 10)}</span>
              {tlExceeded && <span className="text-destructive ml-1">· Eliminated!</span>}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-1.5 mb-2">
        {running ? (
          <button
            onClick={pause}
            className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-medium"
          >
            <Pause className="h-3.5 w-3.5" /> Pause
          </button>
        ) : (
          <button
            onClick={start}
            className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-medium"
          >
            <Play className="h-3.5 w-3.5" /> {tenths > 0 ? "Resume" : "Start"}
          </button>
        )}
        <button
          onClick={split}
          disabled={!running && tenths === 0}
          className="px-3 py-2 text-xs border border-border rounded-lg hover:bg-muted disabled:opacity-40 transition-colors"
          title="Split"
        >
          Split
        </button>
        <button
          onClick={reset}
          className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"
          title="Reset"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Splits */}
      {splits.length > 0 && (
        <div className="border-t border-border pt-2 space-y-0.5 max-h-28 overflow-y-auto">
          {splits.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Split {i + 1}</span>
              <span className="tabular-nums font-medium">{fmtTime(s)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
