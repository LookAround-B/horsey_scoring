"use client";

import { useState } from "react";
import { PaginationBar, PAGE_SIZE } from "@/components/PaginationBar";
import { sanitizeImageSrc } from "@/lib/validation";

type RiderRow = {
  id: string;
  name: string;
  competitor_no: string | null;
  horse: string | null;
  nf: string | null;
  image_url: string | null;
};

function Avatar({ name, image }: { name: string; image: string | null }) {
  const safeSrc = sanitizeImageSrc(image);
  if (safeSrc) return <img src={safeSrc} alt={name} className="h-9 w-9 rounded-full object-cover shrink-0" />;
  return (
    <div className="h-9 w-9 rounded-full bg-muted grid place-items-center text-xs font-semibold shrink-0">
      {name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
    </div>
  );
}

export function RidersSectionClient({ riders }: { riders: RiderRow[] }) {
  const [page, setPage] = useState(0);

  if (riders.length === 0) return <p className="text-sm text-muted-foreground py-2">No riders.</p>;

  const pageItems = riders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="divide-y divide-border">
        {pageItems.map((r) => (
          <div key={r.id} className="flex items-center gap-3 py-2">
            <Avatar name={r.name} image={r.image_url} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{r.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {[r.competitor_no && `#${r.competitor_no}`, r.horse, r.nf].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>
          </div>
        ))}
      </div>
      <PaginationBar page={page} total={riders.length} onPageChange={setPage} />
    </div>
  );
}
