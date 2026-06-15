import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listCustomSheetCards } from "@/lib/customSheets";

export const dynamic = "force-dynamic";

// List custom sheets as cards (for the dashboard Scoring Sheets list).
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });
  return NextResponse.json(await listCustomSheetCards());
}
