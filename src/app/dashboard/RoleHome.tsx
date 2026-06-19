"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS, type UserRole } from "@/lib/dummy-data";
import {
  Calendar, KeyRound, UserCircle, ClipboardList, Shield, Users, UserCheck,
  FilePlus2, CalendarRange, Layers,
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
    { label: "My Events", href: "/dashboard/admin/events", icon: CalendarRange, hint: "Create & manage shows" },
    { label: "Scoring Sheets", href: "/dashboard", icon: ClipboardList },
    { label: "My Profile", href: "/profile", icon: UserCircle },
  ],
  dressage_judge: officialActions(),
  showjumping_judge: officialActions(),
  dressage_writer: officialActions(),
  showjumping_writer: officialActions(),
  examiner: officialActions(),
  rider: [
    { label: "My Events", href: "/dashboard/events", icon: Calendar },
    { label: "My Profile", href: "/profile", icon: UserCircle },
  ],
};

function officialActions(): Action[] {
  return [
    { label: "My Events", href: "/dashboard/events", icon: Calendar, hint: "Events you've joined" },
    { label: "Join Event", href: "/dashboard/join", icon: KeyRound, hint: "Enter an access code" },
    { label: "My Profile", href: "/profile", icon: UserCircle, hint: "Photo & e-signature" },
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
            ? "Create events, add riders, invite judges and examiners, and share the access code so officials can score."
            : user.role === "super_admin"
              ? "Manage users, events, scoring sheets and approvals across the platform."
              : user.role === "rider"
                ? "View the events you're entered in and keep your profile up to date."
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
