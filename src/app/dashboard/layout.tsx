"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS, UserRole } from "@/lib/dummy-data";
import {
  LayoutDashboard, Calendar, Users, FileText, ClipboardCheck,
  BookOpen, Trophy, Settings, LogOut, Menu, ChevronRight,
  UserCircle, Pen, Eye, Shield, UserCheck, Layers, FilePlus2, KeyRound,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: React.ElementType };

const HOME_ITEM: NavItem = { label: "Home", href: "/dashboard", icon: LayoutDashboard };

const NAV: Record<UserRole, NavItem[]> = {
  super_admin: [
    HOME_ITEM,
    { label: "Admin Panel",    href: "/dashboard/admin",     icon: Shield },
    { label: "Approvals",      href: "/dashboard/admin/approvals", icon: UserCheck },
    { label: "Add Sheet",      href: "/dashboard/admin/add-sheet", icon: FilePlus2 },
    { label: "Sheet Placement", href: "/dashboard/admin/sheets", icon: Layers },
    { label: "Events",         href: "/dashboard/admin/events", icon: Calendar },
    { label: "Users",          href: "/dashboard/admin/users", icon: Users },
    { label: "Profile Fields", href: "/dashboard/admin/profile-fields", icon: Settings },
  ],
  show_secretary: [
    HOME_ITEM,
    { label: "Events",         href: "/dashboard/admin/events", icon: Calendar },
    { label: "Secretary",      href: "/dashboard/secretary", icon: ClipboardCheck },
    { label: "Riders",         href: "/dashboard/secretary", icon: Users },
    { label: "Results",        href: "/dashboard/secretary", icon: Trophy },
  ],
  dressage_judge: [
    HOME_ITEM,
    { label: "My Events",      href: "/dashboard/events",             icon: Calendar },
    { label: "Join Event",     href: "/dashboard/join",               icon: KeyRound },
    { label: "Judge Panel",    href: "/dashboard/judge/dressage",     icon: ClipboardCheck },
  ],
  showjumping_judge: [
    HOME_ITEM,
    { label: "My Events",      href: "/dashboard/events",             icon: Calendar },
    { label: "Join Event",     href: "/dashboard/join",               icon: KeyRound },
    { label: "Judge Panel",    href: "/dashboard/judge/showjumping",  icon: ClipboardCheck },
  ],
  dressage_writer: [
    HOME_ITEM,
    { label: "My Events",      href: "/dashboard/events",             icon: Calendar },
    { label: "Join Event",     href: "/dashboard/join",               icon: KeyRound },
    { label: "Writer Panel",   href: "/dashboard/writer/dressage",    icon: Pen },
  ],
  showjumping_writer: [
    HOME_ITEM,
    { label: "My Events",      href: "/dashboard/events",             icon: Calendar },
    { label: "Join Event",     href: "/dashboard/join",               icon: KeyRound },
    { label: "Writer Panel",   href: "/dashboard/writer/showjumping", icon: Pen },
  ],
  examiner: [
    HOME_ITEM,
    { label: "My Events",      href: "/dashboard/events",             icon: Calendar },
    { label: "Join Event",     href: "/dashboard/join",               icon: KeyRound },
    { label: "Examiner Panel", href: "/dashboard/examiner",           icon: Eye },
  ],
  rider: [
    HOME_ITEM,
    { label: "My Entries",     href: "/dashboard/rider",              icon: BookOpen },
    { label: "My Results",     href: "/dashboard/rider",              icon: Trophy },
    { label: "My Profile",     href: "/dashboard/rider",              icon: UserCircle },
  ],
};

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin:        "bg-destructive text-destructive-foreground",
  show_secretary:     "bg-highlight text-background",
  dressage_judge:     "bg-primary text-primary-foreground",
  showjumping_judge:  "bg-primary text-primary-foreground",
  dressage_writer:    "bg-secondary text-secondary-foreground",
  showjumping_writer: "bg-secondary text-secondary-foreground",
  examiner:           "bg-accent text-accent-foreground",
  rider:              "bg-muted text-muted-foreground",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = NAV[user.role] ?? [];
  const roleColor = ROLE_COLORS[user.role] ?? "bg-muted text-muted-foreground";
  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 shrink-0 rounded-md bg-primary text-primary-foreground grid place-items-center font-display font-semibold text-sm">H</div>
          <div className="min-w-0">
            <div className="font-display text-base leading-tight">Horsey</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">Dressage Platform</div>
          </div>
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3 border-b border-border">
        <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full ${roleColor}`}>
          <Shield className="h-2.5 w-2.5" />
          {ROLE_LABELS[user.role]}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="h-3 w-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-muted grid place-items-center font-display text-sm font-semibold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
          </div>
        </div>
        <Link
          href="/profile"
          onClick={() => setSidebarOpen(false)}
          className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-muted transition-colors mb-0.5"
        >
          <UserCircle className="h-3.5 w-3.5" />
          My profile
        </Link>
        <button
          onClick={() => { logout(); router.push("/login"); }}
          className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-muted transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-card border-r border-border flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-base">{ROLE_LABELS[user.role]}</span>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-7 w-7 rounded-full bg-muted grid place-items-center font-semibold text-xs">{initials}</div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
