import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listPlacements } from "@/lib/sheets";

export const dynamic = "force-dynamic";

// Returns { [testSlug]: "dressage" | "showjumping" } for the signed-in app.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({}, { status: 401 });
  }
  return NextResponse.json(await listPlacements());
}
