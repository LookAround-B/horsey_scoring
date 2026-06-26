"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS, type UserRole } from "@/lib/roles";
import { addParticipantAction } from "../actions";

type Invitable = { id: string; name: string | null; email: string; role: UserRole | null };

export function AddOfficialForm({
  eventId,
  invitable,
  roles,
}: {
  eventId: string;
  invitable: Invitable[];
  roles: UserRole[];
}) {
  const [userId, setUserId] = useState("");
  const [roleAtEvent, setRoleAtEvent] = useState<string>(roles[0] ?? "");

  return (
    <form
      action={async (fd) => {
        await addParticipantAction(fd);
        setUserId("");
        setRoleAtEvent(roles[0] ?? "");
      }}
      className="flex flex-wrap items-end gap-2 mb-4"
    >
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="roleAtEvent" value={roleAtEvent} />

      <div className="flex-1 min-w-[160px]">
        <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Person</label>
        <Select value={userId} onValueChange={setUserId} required>
          <SelectTrigger className="w-full bg-background border-border text-sm h-9 rounded-lg">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {invitable.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name ?? u.email}{u.role ? ` (${ROLE_LABELS[u.role]})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Role at event</label>
        <Select value={roleAtEvent} onValueChange={setRoleAtEvent}>
          <SelectTrigger className="bg-background border-border text-sm h-9 rounded-lg min-w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <button className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
        <Plus className="h-3.5 w-3.5" /> Invite
      </button>
    </form>
  );
}
