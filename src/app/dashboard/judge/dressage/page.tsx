"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { DUMMY_EVENTS, DUMMY_RIDERS, DUMMY_SESSIONS, DUMMY_ENTRIES, DUMMY_USERS, TEST_NAMES, ScoringSession } from "@/lib/dummy-data";
import { ExternalLink, CheckCircle, Clock, FileEdit } from "lucide-react";

function statusIcon(status: ScoringSession["status"]) {
  if (status === "verified")  return <CheckCircle className="h-4 w-4 text-highlight" />;
  if (status === "submitted") return <Clock className="h-4 w-4 text-muted-foreground" />;
  return <FileEdit className="h-4 w-4 text-muted-foreground/50" />;
}

export default function DressageJudgeDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"today" | "history">("today");

  if (!user || user.role !== "dressage_judge") return null;

  const activeEvent  = DUMMY_EVENTS.find((e) => e.status === "active");
  const myClasses    = activeEvent?.classes.filter((c) => c.judgeId === user.id && c.type === "dressage") ?? [];
  const mySessions   = DUMMY_SESSIONS.filter((s) => s.judgeId === user.id);
  const todaySessions = mySessions.filter((s) => s.eventId === activeEvent?.id);

  const writer = activeEvent?.classes[0]?.writerId
    ? DUMMY_USERS.find((u) => u.id === activeEvent.classes[0].writerId)
    : null;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Dressage Judge</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          Judge <span className="italic text-highlight">Dashboard</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome, {user.name}</p>
      </div>

      {activeEvent && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-primary mb-1">Active Event</div>
            <div className="font-display text-lg">{activeEvent.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {activeEvent.date} · {myClasses.length} class{myClasses.length !== 1 ? "es" : ""} assigned
              {writer && <> · Writer: {writer.name}</>}
            </div>
          </div>
          <span className="shrink-0 text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full bg-highlight/20 text-highlight">Live</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Today's Riders", value: DUMMY_ENTRIES[myClasses[0]?.id ?? ""]?.length ?? 0 },
          { label: "Scored",         value: todaySessions.filter((s) => s.status !== "draft").length },
          { label: "Verified",       value: mySessions.filter((s) => s.status === "verified").length },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5 shadow-soft text-center">
            <div className="font-display text-3xl tabular-nums">{s.value}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 border-b border-border">
        {(["today", "history"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm border-b-2 transition-colors -mb-px ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t === "today" ? "Today's Rides" : "History"}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <div className="space-y-4">
          {myClasses.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">No classes assigned to you in the active event.</p>
          )}
          {myClasses.map((cls) => {
            const entries = DUMMY_ENTRIES[cls.id] ?? [];
            return (
              <div key={cls.id} className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <div className="font-display text-lg">{cls.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{cls.startTime} · {TEST_NAMES[cls.testId] ?? cls.testId}</div>
                  </div>
                  <Link href={`/scoring/${cls.testId}`} target="_blank"
                    className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    Open Scoring Sheet <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <div className="divide-y divide-border">
                  {entries.map((rid, idx) => {
                    const rider = DUMMY_RIDERS.find((r) => r.id === rid);
                    const session = DUMMY_SESSIONS.find((s) => s.riderId === rid && s.classId === cls.id);
                    return (
                      <div key={rid} className="px-5 py-3.5 flex items-center gap-4">
                        <span className="font-mono text-xs text-muted-foreground w-5">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{rider?.name}</div>
                          <div className="text-xs text-muted-foreground">{rider?.horse} · #{rider?.competitorNo}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          {session?.percentage ? (
                            <span className="font-display tabular-nums text-highlight text-base">{session.percentage.toFixed(2)}%</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not scored</span>
                          )}
                          {statusIcon(session?.status ?? "draft")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "history" && (
        <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
          {mySessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No completed sessions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3">Rider / Horse</th>
                  <th className="text-left px-5 py-3">Test</th>
                  <th className="text-left px-5 py-3">Event</th>
                  <th className="text-center px-5 py-3">Score</th>
                  <th className="text-center px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mySessions.map((s) => {
                  const rider = DUMMY_RIDERS.find((r) => r.id === s.riderId);
                  const event = DUMMY_EVENTS.find((e) => e.id === s.eventId);
                  return (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-5 py-3"><div>{rider?.name}</div><div className="text-xs text-muted-foreground">{rider?.horse}</div></td>
                      <td className="px-5 py-3 text-muted-foreground">{TEST_NAMES[s.testId] ?? s.testId}</td>
                      <td className="px-5 py-3 text-muted-foreground text-xs max-w-[160px] truncate">{event?.name}</td>
                      <td className="px-5 py-3 text-center font-display tabular-nums text-highlight">
                        {s.percentage > 0 ? `${s.percentage.toFixed(2)}%` : "—"}
                      </td>
                      <td className="px-5 py-3 text-center">{statusIcon(s.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
