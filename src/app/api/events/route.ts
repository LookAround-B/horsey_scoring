import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listAllEvents, listMembershipBySlug } from "@/lib/events";

export const dynamic = "force-dynamic";

// Returns the event list + which event slugs each scoring sheet belongs to.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ events: [], membership: {} }, { status: 401 });
  }
  const [events, membership] = await Promise.all([listAllEvents(), listMembershipBySlug()]);
  return NextResponse.json({ events, membership });
}
