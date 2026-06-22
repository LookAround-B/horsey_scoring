"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { PaginationBar, PAGE_SIZE } from "@/components/PaginationBar";
import { removeParticipantAction } from "../actions";
import { ROLE_LABELS, type UserRole } from "@/lib/roles";
import { sanitizeImageSrc } from "@/lib/validation";

type OfficialRow = {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  image_url: string | null;
  role_at_event: string | null;
  joined_at: string | null;
};

const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : null;

function Avatar({ name, image }: { name: string; image: string | null }) {
  const safeSrc = sanitizeImageSrc(image);
  if (safeSrc) return <img src={safeSrc} alt={name} className="h-8 w-8 rounded-full object-cover shrink-0" />;
  return (
    <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-[10px] font-semibold shrink-0">
      {name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
    </div>
  );
}

export function OfficialsListClient({ officials, eventId }: { officials: OfficialRow[]; eventId: string }) {
  const [page, setPage] = useState(0);
  if (officials.length === 0) return <p className="text-sm text-muted-foreground py-3">No officials yet.</p>;

  const pageItems = officials.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="divide-y divide-border">
        {pageItems.map((p) => (
          <div key={p.id} className="flex items-center gap-3 py-2">
            <Avatar name={p.name ?? p.email ?? "?"} image={p.image_url} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{p.name ?? p.email}</div>
              <div className="text-xs text-muted-foreground truncate">
                {p.role_at_event ? (ROLE_LABELS[p.role_at_event as UserRole] ?? p.role_at_event) : "—"}
                {" · "}
                {p.joined_at ? `Joined ${fmtDateTime(p.joined_at)}` : "Invited (not joined)"}
              </div>
            </div>
            <form action={removeParticipantAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="participantId" value={p.id} />
              <button className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-muted transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </form>
          </div>
        ))}
      </div>
      <PaginationBar page={page} total={officials.length} onPageChange={setPage} />
    </div>
  );
}
