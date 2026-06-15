import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TEST_CARDS } from "@/lib/dummy-data";
import { listPlacements, type Discipline } from "@/lib/sheets";
import { listCustomSheetCards } from "@/lib/customSheets";
import { SheetPlacementRow } from "./SheetPlacementRow";
import { Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SheetPlacementPage() {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }

  const [placements, customCards] = await Promise.all([listPlacements(), listCustomSheetCards()]);
  const bySlug = new Map(TEST_CARDS.map((c) => [c.slug, c]));
  customCards.forEach((c) => bySlug.set(c.slug, c));
  const TEST_CARDS_ALL = [...bySlug.values()];
  const effective = (slug: string, fallback?: Discipline): Discipline =>
    placements[slug] ?? fallback ?? "dressage";

  const dressageCount = TEST_CARDS_ALL.filter((t) => effective(t.slug, t.discipline) === "dressage").length;
  const sjCount = TEST_CARDS_ALL.length - dressageCount;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <Layers className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl tracking-tight">Scoring sheet placement</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Choose which discipline each scoring sheet appears under. Changes save instantly and apply
        for everyone. ({dressageCount} dressage · {sjCount} show jumping)
      </p>

      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border bg-card">
        {TEST_CARDS_ALL.map((t) => (
          <SheetPlacementRow
            key={t.slug}
            slug={t.slug}
            category={t.category}
            appendix={t.appendix}
            initial={effective(t.slug, t.discipline)}
          />
        ))}
      </div>
    </div>
  );
}
