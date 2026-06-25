"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Check } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/roles";
import { createUserAction } from "./actions";

export function AddUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [role, setRole] = useState<string>(ASSIGNABLE_ROLES[0]);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransition(async () => {
      const res = await createUserAction(fd);
      if (res.error) setError(res.error);
      else {
        setSaved(true);
        form.reset();
        setRole(ASSIGNABLE_ROLES[0]);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity mb-4"
      >
        <UserPlus className="h-3.5 w-3.5" /> Add user
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Name</label>
        <input name="name" required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Email</label>
        <input name="email" type="email" required className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Role</label>
        <input type="hidden" name="role" value={role} />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-full bg-background border-border text-sm h-9 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSIGNABLE_ROLES.map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Temp password</label>
        <input name="password" required minLength={6} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
      </div>
      {error && <p className="sm:col-span-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
      <div className="sm:col-span-2 flex items-center gap-2">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {saved ? <><Check className="h-4 w-4" /> Created</> : pending ? "Creating…" : "Create user"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors">Cancel</button>
        <span className="text-[11px] text-muted-foreground">User is approved immediately; share the temp password.</span>
      </div>
    </form>
  );
}
