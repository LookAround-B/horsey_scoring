"use client";

import { useState } from "react";
import { PaginationBar, PAGE_SIZE } from "@/components/PaginationBar";
import { SheetPlacementRow } from "./SheetPlacementRow";
import type { Discipline } from "@/lib/sheets";

type SheetItem = {
  slug: string;
  category: string;
  appendix: string;
  initial: Discipline;
};

export function SheetsListClient({ sheets }: { sheets: SheetItem[] }) {
  const [page, setPage] = useState(0);
  const pageItems = sheets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border bg-card">
        {pageItems.map((t) => (
          <SheetPlacementRow
            key={t.slug}
            slug={t.slug}
            category={t.category}
            appendix={t.appendix}
            initial={t.initial}
          />
        ))}
      </div>
      <PaginationBar page={page} total={sheets.length} onPageChange={setPage} />
    </div>
  );
}
