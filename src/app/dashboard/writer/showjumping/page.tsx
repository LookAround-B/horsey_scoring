"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Construction } from "lucide-react";

export default function ShowjumpingWriterDashboard() {
  const { user } = useAuth();
  if (!user || user.role !== "showjumping_writer") return null;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Showjumping Writer</div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          Writer <span className="italic text-highlight">Dashboard</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome, {user.name}</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-10 shadow-soft flex flex-col items-center text-center gap-4">
        <Construction className="h-10 w-10 text-muted-foreground" />
        <div>
          <div className="font-display text-xl mb-2">Showjumping Scoring — Coming Soon</div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Showjumping score entry for writers is currently in development.
          </p>
        </div>
      </div>
    </div>
  );
}
