"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DUMMY_USERS, DUMMY_EVENTS, DUMMY_SESSIONS, DUMMY_RIDERS, ROLE_LABELS, TEST_NAMES } from "@/lib/dummy-data";
import { Users, Calendar, FileText, Shield, X } from "lucide-react";

function Stat({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: React.ElementType }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="font-display text-3xl tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

const STATUS_CHIP: Record<string, string> = {
  upcoming:  "bg-muted text-muted-foreground",
  active:    "bg-highlight/20 text-highlight",
  completed: "bg-primary/10 text-primary",
  draft:     "bg-muted text-muted-foreground",
  submitted: "bg-highlight/20 text-highlight",
  verified:  "bg-primary/10 text-primary",
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: "", date: "", location: "" });

  if (!user || user.role !== "super_admin") return null;

  const verified  = DUMMY_SESSIONS.filter((s) => s.status === "verified").length;
  const submitted = DUMMY_SESSIONS.filter((s) => s.status === "submitted").length;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Super Admin</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          Platform <span className="italic text-highlight">Overview</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, {user.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Users"  value={DUMMY_USERS.length}    sub="across all roles"  icon={Users} />
        <Stat label="Total Events" value={DUMMY_EVENTS.length}   sub={`${DUMMY_EVENTS.filter((e) => e.status === "active").length} active`} icon={Calendar} />
        <Stat label="Total Riders" value={DUMMY_RIDERS.length}   sub="registered"        icon={Shield} />
        <Stat label="Sessions"     value={DUMMY_SESSIONS.length} sub={`${verified} verified · ${submitted} pending`} icon={FileText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events */}
        <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display text-lg">Events</h2>
            <button onClick={() => setShowNewEvent(true)} className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
              + New Event
            </button>
          </div>
          <div className="divide-y divide-border">
            {DUMMY_EVENTS.map((ev) => (
              <div key={ev.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{ev.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{ev.date} · {ev.location}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{ev.classes.length} classes</div>
                </div>
                <span className={`shrink-0 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${STATUS_CHIP[ev.status]}`}>
                  {ev.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Users */}
        <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display text-lg">Users</h2>
            <span className="text-xs text-muted-foreground">{DUMMY_USERS.length} registered</span>
          </div>
          <div className="divide-y divide-border">
            {DUMMY_USERS.map((u) => (
              <div key={u.id} className="px-5 py-3 flex items-center gap-3">
                <div className="h-7 w-7 shrink-0 rounded-full bg-muted grid place-items-center font-display text-xs font-semibold">
                  {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{u.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                </div>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {ROLE_LABELS[u.role].split(" ").pop()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display text-lg">Recent Scoring Sessions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Rider</th>
                <th className="text-left px-5 py-3">Test</th>
                <th className="text-left px-5 py-3">Event</th>
                <th className="text-left px-5 py-3">Judge</th>
                <th className="text-center px-5 py-3">%</th>
                <th className="text-center px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {DUMMY_SESSIONS.map((s) => {
                const rider = DUMMY_RIDERS.find((r) => r.id === s.riderId);
                const event = DUMMY_EVENTS.find((e) => e.id === s.eventId);
                const judge = DUMMY_USERS.find((u) => u.id === s.judgeId);
                return (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">{rider?.name ?? "—"}<div className="text-xs text-muted-foreground">{rider?.horse}</div></td>
                    <td className="px-5 py-3 text-muted-foreground">{TEST_NAMES[s.testId] ?? s.testId}</td>
                    <td className="px-5 py-3 text-muted-foreground truncate max-w-[160px]">{event?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{judge?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-center font-display tabular-nums text-highlight">
                      {s.percentage > 0 ? `${s.percentage.toFixed(2)}%` : "—"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${STATUS_CHIP[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Event Modal (UI only) */}
      {showNewEvent && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl">New Event</h2>
              <button onClick={() => setShowNewEvent(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Event Name</label>
                <input value={newEvent.name} onChange={(e) => setNewEvent((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="Spring Dressage Championship" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Date</label>
                <input value={newEvent.date} onChange={(e) => setNewEvent((p) => ({ ...p, date: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="2025-06-15" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Location</label>
                <input value={newEvent.location} onChange={(e) => setNewEvent((p) => ({ ...p, location: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="Wellington Arena" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowNewEvent(false)} className="flex-1 border border-border rounded-lg py-2.5 text-sm hover:bg-muted transition-colors">Cancel</button>
                <button onClick={() => setShowNewEvent(false)} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity">
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
