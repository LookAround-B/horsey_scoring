"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS, type UserRole } from "@/lib/dummy-data";
import {
  Calendar, KeyRound, UserCircle, ClipboardList, Shield, Users, UserCheck,
  FilePlus2, CalendarRange, Layers, Trophy,
} from "lucide-react";

type Action = { label: string; href: string; icon: React.ElementType; hint?: string };

const ACTIONS: Record<UserRole, Action[]> = {
  super_admin: [
    { label: "Admin Panel", href: "/dashboard/admin", icon: Shield },
    { label: "Events", href: "/dashboard/admin/events", icon: CalendarRange },
    { label: "Users", href: "/dashboard/admin/users", icon: Users },
    { label: "Approvals", href: "/dashboard/admin/approvals", icon: UserCheck },
    { label: "Add Sheet", href: "/dashboard/admin/add-sheet", icon: FilePlus2 },
    { label: "Sheet Placement", href: "/dashboard/admin/sheets", icon: Layers },
  ],
  show_secretary: [
    { label: "My Events", href: "/dashboard/events", icon: CalendarRange, hint: "Events you manage" },
    { label: "Secretary", href: "/dashboard/secretary", icon: ClipboardList, hint: "Secretary dashboard" },
  ],
  dressage_judge: officialActions(),
  showjumping_judge: officialActions(),
  dressage_writer: officialActions(),
  showjumping_writer: officialActions(),
  club: [
    { label: "Events", href: "/dashboard/club", icon: CalendarRange, hint: "Browse all events" },
    { label: "Riders", href: "/dashboard/club/riders", icon: Users, hint: "All riders across events" },
    { label: "Scores", href: "/dashboard/club/scores", icon: Trophy, hint: "All recorded scores" },
  ],
  rider: [
    { label: "My Events", href: "/dashboard/events", icon: Calendar, hint: "Events you're entered in" },
    { label: "My Results", href: "/dashboard/rider/results", icon: Trophy, hint: "Your verified scores" },
  ],
};

function officialActions(): Action[] {
  return [
    { label: "My Events", href: "/dashboard/events", icon: Calendar, hint: "Events you've joined" },
    { label: "Join Event", href: "/dashboard/join", icon: KeyRound, hint: "Enter an access code" },
  ];
}

export function RoleHome() {
  const { user } = useAuth();
  if (!user) return null;

  const actions = ACTIONS[user.role] ?? [];
  const first = (user.name || "").split(" ")[0] || "there";

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
          {ROLE_LABELS[user.role]}
        </div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          Welcome, <span className="italic text-highlight">{first}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-prose">
          {user.role === "show_secretary"
            ? "Create events, add riders, invite judges and writers, and share the access code so officials can score."
            : user.role === "super_admin"
              ? "Manage users, events, scoring sheets and approvals across the platform."
              : user.role === "rider"
                ? "View the events you're entered in and keep your profile up to date."
                : user.role === "club"
                  ? "Browse all events, riders and their scores across the platform."
                  : "Join an event with the code your secretary shares, then open its sheets to score."}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.label}
              href={a.href}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 hover:border-foreground/20 transition-colors"
            >
              <Icon className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium">{a.label}</div>
                {a.hint && <div className="text-[11px] text-muted-foreground mt-0.5">{a.hint}</div>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
