import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listRidersForSheet } from "@/lib/events";
import { canAccessEvent } from "@/lib/scores";

export const dynamic = "force-dynamic";

// Riders selected for a given sheet within an event. Drives the scoring sheet's
// rider list (replaces the hardcoded start lists when an event is in context).
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.status !== "approved") {
    return NextResponse.json([], { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event");
  const slug = searchParams.get("slug");
  if (!eventId || !slug) {
    return NextResponse.json([], { status: 400 });
  }

  if (!(await canAccessEvent(session.user.id, session.user.role, eventId))) {
    return NextResponse.json([], { status: 403 });
  }

  const riders = await listRidersForSheet(eventId, slug);
  return NextResponse.json(riders);
}
