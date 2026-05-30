"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DUMMY_SESSIONS, DUMMY_RIDERS, DUMMY_EVENTS, DUMMY_USERS, TEST_NAMES, ScoringSession } from "@/lib/dummy-data";
import { CheckCircle, Flag, Eye } from "lucide-react";

export default function ExaminerDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ScoringSession[]>(DUMMY_SESSIONS);
  const [verifying, setVerifying] = useState<string | null>(null);

  if (!user || user.role !== "examiner") return null;

  const queue    = sessions.filter((s) => s.status === "submitted");
  const verified = sessions.filter((s) => s.status === "verified");

  const handleVerify = (id: string) => {
    setVerifying(id);
    setTimeout(() => {
      setSessions((prev) => prev.map((s) => s.id === id ? { ...s, status: "verified" as const, verifiedBy: user.id } : s));
      setVerifying(null);
    }, 800);
  };

  const handleFlag = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Examiner</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          Examiner <span className="italic text-highlight">Dashboard</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome, {user.name}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Review Queue", value: queue.length,    icon: Eye,         color: "text-highlight" },
          { label: "Verified",     value: verified.length, icon: CheckCircle, color: "text-primary" },
          { label: "In Progress",  value: sessions.filter((s) => s.status === "draft").length, icon: Flag, color: "text-muted-foreground" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card border border-border rounded-xl p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className={`font-display text-3xl tabular-nums ${s.color}`}>{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display text-lg">Review Queue</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {queue.length === 0 ? "All caught up — no sheets awaiting review." : `${queue.length} sheet${queue.length !== 1 ? "s" : ""} awaiting verification`}
          </p>
        </div>
        {queue.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-8 w-8" />
            <span className="text-sm">Queue is empty</span>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {queue.map((s) => {
              const rider = DUMMY_RIDERS.find((r) => r.id === s.riderId);
              const event = DUMMY_EVENTS.find((e) => e.id === s.eventId);
              const judge = DUMMY_USERS.find((u) => u.id === s.judgeId);
              return (
                <div key={s.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{rider?.name}</span>
                      <span className="text-muted-foreground text-sm">·</span>
                      <span className="text-sm text-muted-foreground">{rider?.horse}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {TEST_NAMES[s.testId] ?? s.testId} · {event?.name} · Judge: {judge?.name}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-display tabular-nums text-highlight text-base">{s.percentage.toFixed(2)}%</span>
                      <span className="text-xs text-muted-foreground">Submitted {new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleVerify(s.id)} disabled={verifying === s.id}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      {verifying === s.id ? "Verifying…" : "Verify"}
                    </button>
                    <button onClick={() => handleFlag(s.id)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Flag className="h-3.5 w-3.5" /> Flag
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display text-lg">Verified Sheets</h2>
        </div>
        {verified.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No verified sheets yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Rider / Horse</th>
                <th className="text-left px-5 py-3">Test</th>
                <th className="text-center px-5 py-3">Score</th>
                <th className="text-left px-5 py-3">Verified By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {verified.map((s) => {
                const rider    = DUMMY_RIDERS.find((r) => r.id === s.riderId);
                const verifier = DUMMY_USERS.find((u) => u.id === s.verifiedBy);
                return (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3"><div>{rider?.name}</div><div className="text-xs text-muted-foreground">{rider?.horse}</div></td>
                    <td className="px-5 py-3 text-muted-foreground">{TEST_NAMES[s.testId] ?? s.testId}</td>
                    <td className="px-5 py-3 text-center font-display tabular-nums text-highlight">{s.percentage.toFixed(2)}%</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{verifier?.name ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
