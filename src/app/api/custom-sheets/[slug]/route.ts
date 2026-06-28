import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCustomSheetConfig, deleteCustomSheet, upsertTombstone } from "@/lib/customSheets";
import { TEST_CARDS } from "@/lib/dummy-data";

export const dynamic = "force-dynamic";

// Full config for one custom sheet (used by the scoring page).
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json(null, { status: 401 });

  const { slug } = await params;
  const config = await getCustomSheetConfig(slug);
  if (!config) return NextResponse.json(null, { status: 404 });

  return NextResponse.json({ config });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "super_admin" || session.user.status !== "approved") {
    return NextResponse.json(null, { status: 403 });
  }
  const { slug } = await params;
  const isBuiltIn = TEST_CARDS.some((c) => c.slug === slug);
  if (isBuiltIn) {
    await upsertTombstone(slug);
  } else {
    await deleteCustomSheet(slug);
  }
  return NextResponse.json({ ok: true });
}
