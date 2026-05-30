"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Construction } from "lucide-react";

export default function ShowjumpingJudgeDashboard() {
  const { user } = useAuth();
  if (!user || user.role !== "showjumping_judge") return null;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Showjumping Judge</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          Judge <span className="italic text-highlight">Dashboard</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome, {user.name}</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-10 shadow-soft flex flex-col items-center text-center gap-4">
        <Construction className="h-10 w-10 text-muted-foreground" />
        <div>
          <div className="font-display text-xl mb-2">Showjumping Scoring — Coming Soon</div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Showjumping fault tracking, time recording, and jump-off management are
            currently in development. Check back soon.
          </p>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-4 w-full max-w-sm">
          {["Fault Tracking", "Time Recording", "Jump-off"].map((f) => (
            <div key={f} className="bg-muted rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground">{f}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mt-1">Planned</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
