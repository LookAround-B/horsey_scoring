"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createCustomSheet,
  createShowJumpingSheet,
  getEditableConfig,
  upsertSheet,
  deleteCustomSheet,
  type SheetMovementInput,
  type ObstacleColumn,
} from "@/lib/customSheets";

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
  appendix: string;
  subtitle: string;
  obstacles: ObstacleColumn[];
  riderRows: number;
};

export async function createShowJumpingSheetAction(
  input: CreateShowJumpingFormInput
): Promise<{ slug?: string; error?: string }> {
  const adminId = await requireAdmin();

  const label = input.label?.trim();
  if (!label) return { error: "Sheet name is required." };

  const obstacles = (input.obstacles ?? []).slice();
  if (obstacles.length === 0) return { error: "Set at least one obstacle column." };

  const slug = await createShowJumpingSheet(
    {
      label,
      appendix: input.appendix ?? "",
      subtitle: input.subtitle ?? "",
      obstacles,
      riderRows: input.riderRows,
    },
    adminId
  );

  return { slug };
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
  const merged = {
    ...base.config,
    label,
    appendix: input.appendix ?? "",
    subtitle: input.subtitle ?? "",
    movements,
  };

  await upsertSheet(slug, merged, base.discipline, adminId);
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
