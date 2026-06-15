import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCustomSheetConfig } from "@/lib/customSheets";

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
