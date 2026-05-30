"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { DUMMY_EVENTS, DUMMY_RIDERS, DUMMY_SESSIONS, DUMMY_ENTRIES, DUMMY_USERS, TEST_NAMES } from "@/lib/dummy-data";
import { ExternalLink, Pen, Clock, CheckCircle } from "lucide-react";

export default function DressageWriterDashboard() {
  const { user } = useAuth();

  if (!user || user.role !== "dressage_writer") return null;

  const activeEvent   = DUMMY_EVENTS.find((e) => e.status === "active");
  const myClasses     = activeEvent?.classes.filter((c) => c.writerId === user.id && c.type === "dressage") ?? [];
  const mySessions    = DUMMY_SESSIONS.filter((s) => s.writerId === user.id);
  const activeSession = mySessions.find((s) => s.status === "draft" && s.eventId === activeEvent?.id);
  const activeRider   = activeSession ? DUMMY_RIDERS.find((r) => r.id === activeSession.riderId) : null;
  const judge         = activeEvent?.classes[0]?.judgeId
    ? DUMMY_USERS.find((u) => u.id === activeEvent.classes[0].judgeId)
    : null;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Dressage Writer</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          Writer <span className="italic text-highlight">Dashboard</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome, {user.name}</p>
      </div>

      {activeSession && activeRider ? (
        <div className="relative overflow-hidden bg-primary text-primary-foreground rounded-xl p-6 shadow-card">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-highlight/20 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Pen className="h-4 w-4 opacity-70" />
              <span className="text-xs uppercase tracking-wider opacity-70">Active Session</span>
            </div>
            <div className="font-display text-2xl mb-1">{activeRider.name}</div>
            <div className="text-primary-foreground/70 text-sm mb-1">Horse: {activeRider.horse} · #{activeRider.competitorNo}</div>
            <div className="text-primary-foreground/70 text-sm mb-5">
              Test: {TEST_NAMES[activeSession.testId] ?? activeSession.testId}
              {judge && <> · Judge: {judge.name}</>}
            </div>
            <Link href={`/scoring/${activeSession.testId}`} target="_blank"
              className="inline-flex items-center gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/20 rounded-lg px-4 py-2 text-sm transition-colors"
            >
              Open Scoring Sheet <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 text-center shadow-soft">
          <Pen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <div className="font-display text-lg mb-1">No Active Session</div>
          <p className="text-sm text-muted-foreground">Waiting for the judge to begin a scoring session.</p>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display text-lg">Today&apos;s Ride List</h2>
          {activeEvent && <p className="text-xs text-muted-foreground mt-0.5">{activeEvent.name}</p>}
        </div>
        {myClasses.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No classes assigned.</p>
        ) : (
          <div className="divide-y divide-border">
            {myClasses.map((cls) => {
              const entries = DUMMY_ENTRIES[cls.id] ?? [];
              return (
                <div key={cls.id}>
                  <div className="px-5 py-3 bg-muted/40 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{cls.name}</span>
                      <span className="text-xs text-muted-foreground ml-3">{cls.startTime}</span>
                    </div>
                    <Link href={`/scoring/${cls.testId}`} target="_blank"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
                    >
                      Sheet <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                  {entries.map((rid, idx) => {
                    const rider = DUMMY_RIDERS.find((r) => r.id === rid);
                    const session = DUMMY_SESSIONS.find((s) => s.riderId === rid && s.classId === cls.id);
                    return (
                      <div key={rid} className="px-5 py-3 flex items-center gap-4 hover:bg-muted/20">
                        <span className="font-mono text-xs text-muted-foreground w-5">{idx + 1}</span>
                        <div className="flex-1">
                          <div className="text-sm">{rider?.name}</div>
                          <div className="text-xs text-muted-foreground">{rider?.horse}</div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {session?.status === "verified"  && <><CheckCircle className="h-3.5 w-3.5 text-highlight" /><span className="text-highlight">Verified</span></>}
                          {session?.status === "submitted" && <><Clock className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Submitted</span></>}
                          {(!session || session.status === "draft") && <span className="text-muted-foreground">Pending</span>}
                          {session?.percentage ? <span className="font-display tabular-nums text-highlight ml-2">{session.percentage.toFixed(2)}%</span> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
