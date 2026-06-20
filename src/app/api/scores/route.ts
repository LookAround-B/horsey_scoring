import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessEvent, getScore, saveScore, type ScoreStatus } from "@/lib/scores";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.status !== "approved") {
    return NextResponse.json(null, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event");
  const slug = searchParams.get("slug");
  const riderId = searchParams.get("rider");
  if (!eventId || !slug) return NextResponse.json(null, { status: 400 });

  if (!(await canAccessEvent(session.user.id, session.user.role, eventId))) {
    return NextResponse.json(null, { status: 403 });
  }
  return NextResponse.json(await getScore(eventId, slug, riderId || null));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.status !== "approved") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.eventId || !body?.slug) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!(await canAccessEvent(session.user.id, session.user.role, body.eventId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await saveScore(
    {
      eventId: body.eventId,
      slug: body.slug,
      riderId: body.riderId || null,
      data: body.data ?? {},
      status: (body.status as ScoreStatus) || undefined,
      result: typeof body.result === "number" ? body.result : null,
      signature: typeof body.signature === "string" ? body.signature : null,
    },
    session.user.id
  );
  return NextResponse.json({ ok: true });
}
