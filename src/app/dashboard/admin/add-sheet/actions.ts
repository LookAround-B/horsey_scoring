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

  const label = input.label?.trim();
  if (!label) return { error: "Sheet name is required." };

  const movements = (input.movements ?? []).filter((m) => m.test?.trim());
  if (movements.length === 0) return { error: "Add at least one movement row." };

  const slug = await createCustomSheet(
    {
      label,
      appendix: input.appendix ?? "",
      subtitle: input.subtitle ?? "",
      discipline: "dressage",
      movements,
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
};

export async function createShowJumpingSheetAction(
  input: CreateShowJumpingFormInput
): Promise<{ slug?: string; error?: string; warning?: string }> {
  const adminId = await requireAdmin();

  const label = input.label?.trim();
  if (!label) return { error: "Sheet name is required." };

  const obstacles = (input.obstacles ?? []).filter((o) => o.name?.trim());
  if (obstacles.length === 0) return { error: "Add at least one obstacle column." };

  const riderRows = Math.max(1, Math.min(60, input.defaultRows || 5));

  // Check for existing sheets with same name
  const existing = await listCustomSheetCards();
  const builtIn = TEST_CARDS;
  const allSheets = [...existing, ...builtIn];
  const duplicate = allSheets.find((s) => s.category?.toLowerCase() === label.toLowerCase());

  const slug = await createShowJumpingSheet(
    {
      label,
      appendix: "",
      subtitle: input.subtitle ?? "",
      obstacles,
      riderRows,
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

  const label = input.label?.trim();
  if (!label) return { error: "Sheet name is required." };

  const obstacles = (input.obstacles ?? []).filter((o) => o.name?.trim());
  if (obstacles.length === 0) return { error: "Add at least one obstacle column." };

  const riderRows = Math.max(1, Math.min(60, input.defaultRows || 5));

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
      subtitle: input.subtitle ?? "",
      obstacles,
      riderRows,
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

  const label = input.label?.trim();
  if (!label) return { error: "Sheet name is required." };

  const movements = (input.movements ?? [])
    .filter((m) => m.test?.trim())
    .map((m, i) => ({
      no: m.no.trim() || String(i + 1),
      letters: m.letters,
      test: m.test,
      directive: m.directive,
      coefficient: Number.isFinite(m.coefficient) && m.coefficient > 0 ? m.coefficient : 1,
    }));
  if (movements.length === 0) return { error: "Add at least one movement row." };

  // Preserve advanced fields (collectives, artistic/freestyle, quality, …); only the
  // header and the technical movement rows are editable here.
  const merged: TestConfig = {
    ...(base.config as TestConfig),
    label,
    appendix: input.appendix ?? "",
    subtitle: input.subtitle ?? "",
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
  if (!input.label?.trim()) return { error: "Sheet name is required." };
  if (!input.criteria?.some((c) => c.title.trim())) {
    return { error: "Add at least one assessment row." };
  }
  const slug = await createQualitySheet(input, adminId);
  return { slug };
}

export async function updateQualitySheetAction(
  slug: string,
  input: QualityInput
): Promise<{ slug?: string; error?: string }> {
  const adminId = await requireAdmin();
  const base = await getEditableConfig(slug);
  if (!base) return { error: "Sheet not found." };
  if (!input.label?.trim()) return { error: "Sheet name is required." };
  if (!input.criteria?.some((c) => c.title.trim())) {
    return { error: "Add at least one assessment row." };
  }
  await updateQualitySheet(slug, input, adminId);
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
