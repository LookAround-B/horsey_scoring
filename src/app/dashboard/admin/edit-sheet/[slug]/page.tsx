import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getEditableConfig } from "@/lib/customSheets";
import { isShowJumping, isQuality } from "@/lib/sheetTypes";
import type { TestConfig } from "@/lib/tests";
import { DressageSheetBuilder } from "../../add-sheet/dressage/DressageSheetBuilder";
import { ShowJumpingSheetBuilder } from "../../add-sheet/showjumping/ShowJumpingSheetBuilder";
import { QualityMarkingSheetBuilder } from "../../add-sheet/quality/QualityMarkingSheetBuilder";

export const dynamic = "force-dynamic";

export default async function EditSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }

  const { slug } = await params;
  const base = await getEditableConfig(slug);
  if (!base) notFound();

  const deletable = base.hasOverride
    ? { mode: base.isBuiltIn ? ("reset" as const) : ("delete" as const) }
    : undefined;

  // Quality marking sheets use their own builder.
  if (isQuality(base.config)) {
    const c = base.config;
    return (
      <QualityMarkingSheetBuilder
        editSlug={slug}
        initial={{
          label: c.label ?? "",
          subtitle: c.subtitle ?? "",
          rows: (c.criteria ?? []).map((cr) => ({
            title: cr.title ?? "",
            description: cr.description ?? "",
          })),
        }}
        noteBuiltIn={base.isBuiltIn}
        deletable={deletable}
      />
    );
  }

  // Show jumping sheets use a different builder.
  if (isShowJumping(base.config)) {
    const c = base.config;
    return (
      <ShowJumpingSheetBuilder
        editSlug={slug}
        initial={{
          label: c.label ?? "",
          subtitle: c.subtitle ?? "",
          obstacles: c.obstacles ?? [],
          defaultRows: c.riderRows,
        }}
        noteBuiltIn={base.isBuiltIn}
        deletable={deletable}
      />
    );
  }

  const cfg = base.config as TestConfig;
  const initial = {
    label: cfg.label ?? "",
    appendix: cfg.appendix ?? "",
    subtitle: cfg.subtitle ?? "",
    rows: (cfg.movements ?? []).map((m) => ({
      no: m.no ?? "",
      letters: m.letters ?? "",
      test: m.test ?? "",
      directive: m.directive ?? "",
      coefficient: String(m.coefficient ?? 1),
    })),
  };

  return (
    <DressageSheetBuilder
      editSlug={slug}
      initial={initial}
      noteBuiltIn={base.isBuiltIn}
      deletable={deletable}
    />
  );
}
