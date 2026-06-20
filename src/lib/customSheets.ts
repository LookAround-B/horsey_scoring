import { query } from "@/lib/db";
import { TEST_CARDS, type TestCard } from "@/lib/dummy-data";
import { TEST_CONFIGS, type TestConfig } from "@/lib/tests";

export type Discipline = "dressage" | "showjumping";

export type SheetMovementInput = {
  no: string;
  letters: string;
  test: string;
  directive: string;
  coefficient: number;
};

export type CreateSheetInput = {
  label: string;
  appendix: string;
  subtitle: string;
  discipline: Discipline;
  movements: SheetMovementInput[];
};

/** TestConfig-shaped object stored in custom_sheets.config. */
type StoredConfig = {
  label: string;
  appendix: string;
  abbr: string;
  subtitle: string;
  movements: SheetMovementInput[];
};

function slugify(name: string): string {
  return (
    name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    `sheet-${Date.now()}`
  );
}

function abbrFrom(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .slice(0, 4) || "CST"
  );
}

/** Card shape consumed by the dashboard + admin lists (matches TestCard). */
export async function listCustomSheetCards(): Promise<TestCard[]> {
  const rows = await query<{
    slug: string;
    label: string;
    appendix: string | null;
    subtitle: string | null;
    discipline: Discipline;
    max_score: number;
  }>(`select slug, label, appendix, subtitle, discipline, max_score from custom_sheets order by created_at desc`);

  return rows.map((r) => ({
    slug: r.slug,
    category: r.label,
    appendix: r.appendix ?? "Custom sheet",
    description: r.subtitle ?? "Custom scoring sheet",
    maxScore: r.max_score,
    discipline: r.discipline,
  }));
}

/** Full config for the scoring page (null when the slug isn't a custom sheet). */
export async function getCustomSheetConfig(slug: string): Promise<StoredConfig | null> {
  const rows = await query<{ config: StoredConfig }>(
    `select config from custom_sheets where slug = $1`,
    [slug]
  );
  return rows[0]?.config ?? null;
}

export async function createCustomSheet(input: CreateSheetInput, createdBy: string): Promise<string> {
  // Build a unique slug, avoiding both built-in and existing custom slugs.
  const taken = new Set<string>(TEST_CARDS.map((t) => t.slug));
  const existing = await query<{ slug: string }>(`select slug from custom_sheets`);
  existing.forEach((r) => taken.add(r.slug));

  const base = slugify(input.label);
  let slug = base;
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;

  const movements = input.movements.map((m, i) => ({
    no: m.no.trim() || String(i + 1),
    letters: m.letters,
    test: m.test,
    directive: m.directive,
    coefficient: Number.isFinite(m.coefficient) && m.coefficient > 0 ? m.coefficient : 1,
  }));

  const config: StoredConfig = {
    label: input.label.trim(),
    appendix: input.appendix.trim(),
    abbr: abbrFrom(input.label),
    subtitle: input.subtitle.trim(),
    movements,
  };

  // movements (10 × coef each) + the default single collective (coef 2 → 20).
  const maxScore = movements.reduce((s, m) => s + 10 * m.coefficient, 0) + 20;

  await query(
    `insert into custom_sheets (slug, label, appendix, subtitle, abbr, discipline, config, max_score, created_by)
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      slug,
      config.label,
      config.appendix,
      config.subtitle,
      config.abbr,
      input.discipline,
      JSON.stringify(config),
      maxScore,
      createdBy,
    ]
  );

  return slug;
}

/* ---------------------------------------------------------------------------
 * Show jumping sheets
 * Each sheet is N obstacle columns (each with a free-text name + optional type)
 * and a starting number of rider rows. Judges add more rows while scoring.
 * ------------------------------------------------------------------------- */

export type ObstacleType = "" | "vertical" | "oxer" | "combination" | "water";

export type ObstacleColumn = {
  name: string;
  type: ObstacleType;
};

export type CreateShowJumpingInput = {
  label: string;
  appendix: string;
  subtitle: string;
  obstacles: ObstacleColumn[];
  riderRows: number;
};

/** Show-jumping config stored in custom_sheets.config (jsonb). */
export type StoredJumpingConfig = {
  label: string;
  appendix: string;
  abbr: string;
  subtitle: string;
  discipline: "showjumping";
  obstacles: ObstacleColumn[];
  riderRows: number;
};

export async function createShowJumpingSheet(
  input: CreateShowJumpingInput,
  createdBy: string
): Promise<string> {
  const taken = new Set<string>(TEST_CARDS.map((t) => t.slug));
  const existing = await query<{ slug: string }>(`select slug from custom_sheets`);
  existing.forEach((r) => taken.add(r.slug));

  const base = slugify(input.label);
  let slug = base;
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;

  const obstacles = input.obstacles.map((o, i) => ({
    name: o.name.trim() || String(i + 1),
    type: o.type,
  }));

  const config: StoredJumpingConfig = {
    label: input.label.trim(),
    appendix: input.appendix.trim(),
    abbr: abbrFrom(input.label),
    subtitle: input.subtitle.trim(),
    discipline: "showjumping",
    obstacles,
    riderRows: Math.max(1, Math.trunc(input.riderRows) || 1),
  };

  await query(
    `insert into custom_sheets (slug, label, appendix, subtitle, abbr, discipline, config, max_score, created_by)
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      slug,
      config.label,
      config.appendix,
      config.subtitle,
      config.abbr,
      "showjumping",
      JSON.stringify(config),
      0, // faults-based; no fixed max score
      createdBy,
    ]
  );

  return slug;
}

export async function deleteCustomSheet(slug: string) {
  await query(`delete from custom_sheets where slug = $1`, [slug]);
}

/** Full config + meta for editing — DB override if present, otherwise the built-in. */
export async function getEditableConfig(
  slug: string
): Promise<{
  config: TestConfig;
  discipline: Discipline;
  isBuiltIn: boolean;
  hasOverride: boolean;
} | null> {
  const rows = await query<{ config: TestConfig; discipline: Discipline }>(
    `select config, discipline from custom_sheets where slug = $1`,
    [slug]
  );
  const isBuiltIn = !!TEST_CONFIGS[slug];

  if (rows[0]) {
    return { config: rows[0].config, discipline: rows[0].discipline, isBuiltIn, hasOverride: true };
  }
  const stat = TEST_CONFIGS[slug];
  if (stat) {
    const card = TEST_CARDS.find((c) => c.slug === slug);
    return {
      config: stat,
      discipline: (card?.discipline ?? "dressage") as Discipline,
      isBuiltIn: true,
      hasOverride: false,
    };
  }
  return null;
}

function maxScoreFor(config: TestConfig): number {
  const mv = (config.movements ?? []).reduce((s, m) => s + 10 * (m.coefficient || 1), 0);
  const art = (config.artisticMovements ?? []).reduce((s, m) => s + 10 * (m.coefficient || 1), 0);
  const collFromCfg = config.collectives
    ? config.collectives.reduce((s, c) => s + 10 * (c.coefficient || 0), 0)
    : 20;
  const coll = config.hasCollective === false ? 0 : collFromCfg;
  return mv + art + coll;
}

/** Insert or update an override/custom sheet for a known slug. */
export async function upsertSheet(
  slug: string,
  config: TestConfig,
  discipline: Discipline,
  userId: string
) {
  await query(
    `insert into custom_sheets (slug, label, appendix, subtitle, abbr, discipline, config, max_score, created_by)
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     on conflict (slug) do update
          set label = excluded.label,
              appendix = excluded.appendix,
              subtitle = excluded.subtitle,
              abbr = excluded.abbr,
              discipline = excluded.discipline,
              config = excluded.config,
              max_score = excluded.max_score`,
    [
      slug,
      config.label,
      config.appendix ?? "",
      config.subtitle ?? "",
      config.abbr ?? "",
      discipline,
      JSON.stringify(config),
      maxScoreFor(config),
      userId,
    ]
  );
}
