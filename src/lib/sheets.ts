import { query } from "@/lib/db";

export type Discipline = "dressage" | "showjumping";

/** Map of test slug -> discipline override set by an admin. */
export async function listPlacements(): Promise<Record<string, Discipline>> {
  const rows = await query<{ test_slug: string; discipline: Discipline }>(
    `select test_slug, discipline from sheet_placements`
  );
  const map: Record<string, Discipline> = {};
  for (const r of rows) map[r.test_slug] = r.discipline;
  return map;
}

export async function setPlacement(slug: string, discipline: Discipline, updatedBy: string) {
  await query(
    `insert into sheet_placements (test_slug, discipline, updated_by, updated_at)
          values ($1, $2, $3, now())
     on conflict (test_slug) do update
          set discipline = excluded.discipline,
              updated_by = excluded.updated_by,
              updated_at = now()`,
    [slug, discipline, updatedBy]
  );
}
