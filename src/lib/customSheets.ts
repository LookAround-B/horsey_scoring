import { query } from "@/lib/db";
import { TEST_CARDS, type TestCard } from "@/lib/dummy-data";
import { TEST_CONFIGS, type TestConfig } from "@/lib/tests";
import type { ShowJumpingConfig, QualityConfig } from "@/lib/sheetTypes";

export type Discipline = "dressage" | "showjumping";

export type SheetMovementInput = {
  no: string;
  letters: string;
  test: string;
  directive: string;
  coefficient: number;
  maxMarks?: number;
  mark?: string;
  correction?: string;
  finalMark?: string;
  remarks?: string;
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
    kind: string | null;
  }>(`select slug, label, appendix, subtitle, discipline, max_score, config->>'kind' as kind from custom_sheets order by created_at desc`);

  return rows.map((r) => ({
    slug: r.slug,
    category: r.label,
    appendix: r.appendix ?? "Custom sheet",
    description: r.subtitle ?? "Custom scoring sheet",
    maxScore: r.max_score,
    discipline: r.discipline,
    hidden: r.kind === "hidden",
  }));
}

/** Insert or update a tombstone so a built-in sheet is hidden from the dashboard. */
export async function upsertTombstone(slug: string) {
  await query(
    `insert into custom_sheets (slug, label, appendix, subtitle, abbr, discipline, config, max_score, created_by)
     values ($1, $1, '', '', '', 'dressage', '{"kind":"hidden"}', 0, 'system')
     on conflict (slug) do update set config = '{"kind":"hidden"}'`,
    [slug]
  );
}

/** Full config for the scoring page (null when the slug isn't a custom sheet). */
export async function getCustomSheetConfig(slug: string): Promise<StoredConfig | null> {
  const rows = await query<{ config: StoredConfig }>(
    `select config from custom_sheets where slug = $1`,
    [slug]
  );
  return rows[0]?.config ?? null;
}

async function uniqueSlug(label: string): Promise<string> {
  const taken = new Set<string>(TEST_CARDS.map((t) => t.slug));
  const existing = await query<{ slug: string }>(`select slug from custom_sheets`);
  existing.forEach((r) => taken.add(r.slug));
  const base = slugify(label);
  let slug = base;
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;
  return slug;
}

export type QualityInput = {
  label: string;
  subtitle: string;
  criteria: { title: string; description: string }[];
};

function buildQualityConfig(input: QualityInput): QualityConfig {
  return {
    kind: "quality",
    label: (input.label ?? "").trim(),
    subtitle: (input.subtitle ?? "").trim(),
    criteria: (input.criteria ?? [])
      .filter((c) => (c.title ?? "").trim())
      .map((c) => ({ title: (c.title ?? "").trim(), description: (c.description ?? "").trim() })),
  };
}

export async function createQualitySheet(input: QualityInput, createdBy: string): Promise<string> {
  const slug = await uniqueSlug(input.label);
  const config = buildQualityConfig(input);
  const maxScore = config.criteria.length * 10;
  await query(
    `insert into custom_sheets (slug, label, appendix, subtitle, abbr, discipline, config, max_score, created_by)
          values ($1, $2, '', $3, $4, 'dressage', $5, $6, $7)`,
    [slug, config.label, config.subtitle, abbrFrom(config.label), JSON.stringify(config), maxScore, createdBy]
  );
  return slug;
}

export async function updateQualitySheet(slug: string, input: QualityInput, updatedBy: string) {
  const config = buildQualityConfig(input);
  const maxScore = config.criteria.length * 10;
  await query(
    `insert into custom_sheets (slug, label, appendix, subtitle, abbr, discipline, config, max_score, created_by)
          values ($1, $2, '', $3, $4, 'dressage', $5, $6, $7)
     on conflict (slug) do update
          set label = excluded.label,
              subtitle = excluded.subtitle,
              abbr = excluded.abbr,
              discipline = 'dressage',
              config = excluded.config,
              max_score = excluded.max_score`,
    [slug, config.label, config.subtitle, abbrFrom(config.label), JSON.stringify(config), maxScore, updatedBy]
  );
}

export async function createCustomSheet(input: CreateSheetInput, createdBy: string): Promise<string> {
  const slug = await uniqueSlug(input.label);

  const movements = input.movements.map((m, i) => ({
    no: m.no.trim() || String(i + 1),
    letters: m.letters,
    test: m.test,
    directive: m.directive,
    coefficient: Number.isFinite(m.coefficient) && m.coefficient > 0 ? m.coefficient : 1,
    maxMarks: Number.isFinite(m.maxMarks) && (m.maxMarks ?? 0) > 0 ? m.maxMarks : 10,
    mark: m.mark ?? "",
    correction: m.correction ?? "",
    finalMark: m.finalMark ?? "",
    remarks: m.remarks ?? "",
  }));

  const config: StoredConfig = {
    label: input.label.trim(),
    appendix: input.appendix.trim(),
    abbr: abbrFrom(input.label),
    subtitle: input.subtitle.trim(),
    movements,
  };

  // movements (maxMarks × coef each) + the default single collective (coef 2 → 20).
  const maxScore = movements.reduce((s, m) => s + (m.maxMarks || 10) * m.coefficient, 0) + 20;

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
  // Live dashboard optional fields
  jumpoffObstacles?: string[];
  firstRoundObstacles?: string[];
  defaultSpeed?: number;
  defaultCourseLength?: number;
  defaultTimeAllowed?: number;
  defaultTimeLimit?: number;
  defaultJoTimeAllowed?: number;
};

/** Show-jumping config stored in custom_sheets.config (jsonb). */
export type StoredJumpingConfig = {
  kind: "showjumping";
  label: string;
  appendix: string;
  abbr: string;
  subtitle: string;
  discipline: "showjumping";
  obstacles: ObstacleColumn[];
  riderRows: number;
  // Live dashboard optional fields (backward-compatible)
  jumpoffObstacles?: string[];
  firstRoundObstacles?: string[];
  defaultSpeed?: number;
  defaultCourseLength?: number;
  defaultTimeAllowed?: number;
  defaultTimeLimit?: number;
  defaultJoTimeAllowed?: number;
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
    kind: "showjumping",
    label: input.label.trim(),
    appendix: input.appendix.trim(),
    abbr: abbrFrom(input.label),
    subtitle: input.subtitle.trim(),
    discipline: "showjumping",
    obstacles,
    riderRows: Math.max(1, Math.trunc(input.riderRows) || 1),
    ...(input.jumpoffObstacles?.length   ? { jumpoffObstacles:    input.jumpoffObstacles   } : {}),
    ...(input.firstRoundObstacles?.length? { firstRoundObstacles: input.firstRoundObstacles } : {}),
    ...(input.defaultSpeed        != null ? { defaultSpeed:        input.defaultSpeed        } : {}),
    ...(input.defaultCourseLength != null ? { defaultCourseLength: input.defaultCourseLength } : {}),
    ...(input.defaultTimeAllowed  != null ? { defaultTimeAllowed:  input.defaultTimeAllowed  } : {}),
    ...(input.defaultTimeLimit    != null ? { defaultTimeLimit:    input.defaultTimeLimit    } : {}),
    ...(input.defaultJoTimeAllowed!= null ? { defaultJoTimeAllowed:input.defaultJoTimeAllowed} : {}),
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

export async function updateShowJumpingSheet(
  slug: string,
  input: CreateShowJumpingInput,
  updatedBy: string
): Promise<void> {
  const obstacles = input.obstacles.map((o, i) => ({
    name: o.name.trim() || String(i + 1),
    type: o.type,
  }));

  const config: StoredJumpingConfig = {
    kind: "showjumping",
    label: input.label.trim(),
    appendix: input.appendix.trim(),
    abbr: abbrFrom(input.label),
    subtitle: input.subtitle.trim(),
    discipline: "showjumping",
    obstacles,
    riderRows: Math.max(1, Math.trunc(input.riderRows) || 1),
    ...(input.jumpoffObstacles?.length   ? { jumpoffObstacles:    input.jumpoffObstacles   } : {}),
    ...(input.firstRoundObstacles?.length? { firstRoundObstacles: input.firstRoundObstacles } : {}),
    ...(input.defaultSpeed        != null ? { defaultSpeed:        input.defaultSpeed        } : {}),
    ...(input.defaultCourseLength != null ? { defaultCourseLength: input.defaultCourseLength } : {}),
    ...(input.defaultTimeAllowed  != null ? { defaultTimeAllowed:  input.defaultTimeAllowed  } : {}),
    ...(input.defaultTimeLimit    != null ? { defaultTimeLimit:    input.defaultTimeLimit    } : {}),
    ...(input.defaultJoTimeAllowed!= null ? { defaultJoTimeAllowed:input.defaultJoTimeAllowed} : {}),
  };

  await query(
    `insert into custom_sheets (slug, label, appendix, subtitle, abbr, discipline, config, max_score, created_by)
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     on conflict (slug) do update
          set label = excluded.label,
              appendix = excluded.appendix,
              subtitle = excluded.subtitle,
              abbr = excluded.abbr,
              config = excluded.config`,
    [
      slug,
      config.label,
      config.appendix,
      config.subtitle,
      config.abbr,
      "showjumping",
      JSON.stringify(config),
      0,
      updatedBy,
    ]
  );
}

export async function deleteCustomSheet(slug: string) {
  await query(`delete from custom_sheets where slug = $1`, [slug]);
}

/** Full config + meta for editing — DB override if present, otherwise the built-in. */
export async function getEditableConfig(
  slug: string
): Promise<{
  config: TestConfig | ShowJumpingConfig | QualityConfig;
  discipline: Discipline;
  isBuiltIn: boolean;
  hasOverride: boolean;
} | null> {
  const rows = await query<{
    config: TestConfig | ShowJumpingConfig | QualityConfig;
    discipline: Discipline;
  }>(
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
  const mv = (config.movements ?? []).reduce((s, m) => s + (m.maxMarks === undefined ? 10 : m.maxMarks) * (m.coefficient || 1), 0);
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
