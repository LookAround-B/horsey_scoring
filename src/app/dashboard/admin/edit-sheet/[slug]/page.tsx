import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getEditableConfig } from "@/lib/customSheets";
import { DressageSheetBuilder } from "../../add-sheet/dressage/DressageSheetBuilder";

export const dynamic = "force-dynamic";

export default async function EditSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    redirect("/dashboard");
  }

  const { slug } = await params;
  const base = await getEditableConfig(slug);
  if (!base) notFound();

  const cfg = base.config;
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

  const deletable = base.hasOverride
    ? { mode: base.isBuiltIn ? ("reset" as const) : ("delete" as const) }
    : undefined;

  return (
    <DressageSheetBuilder
      editSlug={slug}
      initial={initial}
      noteBuiltIn={base.isBuiltIn}
      deletable={deletable}
    />
  );
}
