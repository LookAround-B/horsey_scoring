"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createCustomSheet,
  createShowJumpingSheet,
  updateShowJumpingSheet,
  createQualitySheet,
  updateQualitySheet,
  getEditableConfig,
  upsertSheet,
  deleteCustomSheet,
  listCustomSheetCards,
  type SheetMovementInput,
  type ObstacleColumn,
  type QualityInput,
} from "@/lib/customSheets";
import { TEST_CARDS } from "@/lib/dummy-data";
import type { TestConfig } from "@/lib/tests";
import {
  parseAction,
  dressageSheetSchema,
  showJumpingSheetSchema,
  qualitySheetSchema,
} from "@/lib/validation";

export type { ObstacleColumn };

async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }
  return session.user.id;
}

export type CreateDressageInput = {
  label: string;
  appendix: string;
  subtitle: string;
  movements: SheetMovementInput[];
};

export async function createDressageSheetAction(
  input: CreateDressageInput
): Promise<{ slug?: string; error?: string }> {
  const adminId = await requireAdmin();

  const parsed = parseAction(dressageSheetSchema, input);
  if (parsed.error) return { error: parsed.error };
  const d = parsed.parsed!;

  const slug = await createCustomSheet(
    {
      label: d.label,
      appendix: d.appendix,
      subtitle: d.subtitle,
      discipline: "dressage",
      movements: d.movements as SheetMovementInput[],
    },
    adminId
  );

  return { slug };
}

export type CreateShowJumpingFormInput = {
  label: string;
  subtitle: string;
  obstacles: ObstacleColumn[];
  defaultRows: number;
  // Live dashboard optional fields
  jumpoffObstacles?: string[];
  firstRoundObstacles?: string[];
  defaultSpeed?: number;
  defaultCourseLength?: number;
  defaultTimeAllowed?: number;
  defaultTimeLimit?: number;
  defaultJoTimeAllowed?: number;
};

export async function createShowJumpingSheetAction(
  input: CreateShowJumpingFormInput
): Promise<{ slug?: string; error?: string; warning?: string }> {
  const adminId = await requireAdmin();

  const parsed = parseAction(showJumpingSheetSchema, input);
  if (parsed.error) return { error: parsed.error };
  const d = parsed.parsed!;
  const { label, obstacles, defaultRows } = d;
  const riderRows = defaultRows ?? 5;

  // Check for existing sheets with same name
  const existing = await listCustomSheetCards();
  const builtIn = TEST_CARDS;
  const allSheets = [...existing, ...builtIn];
  const duplicate = allSheets.find((s) => s.category?.toLowerCase() === label.toLowerCase());

  const slug = await createShowJumpingSheet(
    {
      label,
      appendix: "",
      subtitle: d.subtitle ?? "",
      obstacles: obstacles as ObstacleColumn[],
      riderRows,
      jumpoffObstacles:     d.jumpoffObstacles,
      firstRoundObstacles:  d.firstRoundObstacles,
      defaultSpeed:         d.defaultSpeed,
      defaultCourseLength:  d.defaultCourseLength,
      defaultTimeAllowed:   d.defaultTimeAllowed,
      defaultTimeLimit:     d.defaultTimeLimit,
      defaultJoTimeAllowed: d.defaultJoTimeAllowed,
    },
    adminId
  );

  return {
    slug,
    warning: duplicate ? `A sheet named "${duplicate.category}" already exists. Your new sheet is saved as "${label}" but may be harder to distinguish.` : undefined
  };
}

export async function updateShowJumpingSheetAction(
  slug: string,
  input: CreateShowJumpingFormInput
): Promise<{ slug?: string; error?: string; warning?: string }> {
  const adminId = await requireAdmin();

  const parsed = parseAction(showJumpingSheetSchema, input);
  if (parsed.error) return { error: parsed.error };
  const d = parsed.parsed!;
  const { label, obstacles, defaultRows } = d;
  const riderRows = defaultRows ?? 5;

  // Check for existing sheets with same name (excluding current one)
  const existing = await listCustomSheetCards();
  const builtIn = TEST_CARDS;
  const allSheets = [...existing, ...builtIn];
  const duplicate = allSheets.find((s) => s.category?.toLowerCase() === label.toLowerCase() && s.slug !== slug);

  await updateShowJumpingSheet(
    slug,
    {
      label,
      appendix: "",
      subtitle: d.subtitle ?? "",
      obstacles: obstacles as ObstacleColumn[],
      riderRows,
      jumpoffObstacles:     d.jumpoffObstacles,
      firstRoundObstacles:  d.firstRoundObstacles,
      defaultSpeed:         d.defaultSpeed,
      defaultCourseLength:  d.defaultCourseLength,
      defaultTimeAllowed:   d.defaultTimeAllowed,
      defaultTimeLimit:     d.defaultTimeLimit,
      defaultJoTimeAllowed: d.defaultJoTimeAllowed,
    },
    adminId
  );

  return {
    slug,
    warning: duplicate ? `A sheet named "${duplicate.category}" already exists. Your sheet is saved as "${label}" but may be harder to distinguish.` : undefined
  };
}

export async function updateSheetAction(
  slug: string,
  input: CreateDressageInput
): Promise<{ slug?: string; error?: string }> {
  const adminId = await requireAdmin();

  const base = await getEditableConfig(slug);
  if (!base) return { error: "Sheet not found." };

  const parsed = parseAction(dressageSheetSchema, input);
  if (parsed.error) return { error: parsed.error };
  const d = parsed.parsed!;

  const movements = d.movements.map((m, i) => ({
    no: (m.no ?? "").trim() || String(i + 1),
    letters: m.letters ?? "",
    test: m.test,
    directive: m.directive ?? "",
    coefficient: Number.isFinite(m.coefficient) && m.coefficient > 0 ? m.coefficient : 1,
  }));

  const merged: TestConfig = {
    ...(base.config as TestConfig),
    label: d.label,
    appendix: d.appendix,
    subtitle: d.subtitle,
    movements,
  };

  await upsertSheet(slug, merged, base.discipline, adminId);
  return { slug };
}

// ---- Dressage quality marking sheet ---------------------------------------

export async function createQualitySheetAction(
  input: QualityInput
): Promise<{ slug?: string; error?: string }> {
  const adminId = await requireAdmin();
  const parsed = parseAction(qualitySheetSchema, input);
  if (parsed.error) return { error: parsed.error };
  const slug = await createQualitySheet(parsed.parsed! as QualityInput, adminId);
  return { slug };
}

export async function updateQualitySheetAction(
  slug: string,
  input: QualityInput
): Promise<{ slug?: string; error?: string }> {
  const adminId = await requireAdmin();
  const base = await getEditableConfig(slug);
  if (!base) return { error: "Sheet not found." };
  const parsed = parseAction(qualitySheetSchema, input);
  if (parsed.error) return { error: parsed.error };
  await updateQualitySheet(slug, parsed.parsed! as QualityInput, adminId);
  return { slug };
}

/**
 * Deletes the DB row for a slug. For a custom sheet this removes it entirely;
 * for a built-in this drops the override and restores the original code version.
 */
export async function deleteSheetAction(slug: string): Promise<{ error?: string }> {
  await requireAdmin();
  if (!slug) return { error: "Missing sheet." };
  await deleteCustomSheet(slug);
  return {};
}
