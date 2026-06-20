import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessEvent, getScore, saveScore } from "@/lib/scores";
import {
  parseOr400,
  readJsonLimited,
  scoreGetSchema,
  scoreSubmitSchema,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.status !== "approved") {
    return NextResponse.json(null, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = parseOr400(scoreGetSchema, {
    event: searchParams.get("event"),
    slug: searchParams.get("slug"),
    rider: searchParams.get("rider") ?? undefined,
  });
  if (parsed instanceof NextResponse) return parsed;
  const { event: eventId, slug, rider: riderId } = parsed.parsed;

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

  const bodyResult = await readJsonLimited(request);
  if (bodyResult instanceof NextResponse) return bodyResult;

  const parsed = parseOr400(scoreSubmitSchema, bodyResult.data);
  if (parsed instanceof NextResponse) return parsed;
  const body = parsed.parsed;

  if (!(await canAccessEvent(session.user.id, session.user.role, body.eventId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await saveScore(
    {
      eventId: body.eventId,
      slug: body.slug,
      riderId: body.riderId ?? null,
      data: body.data ?? {},
      status: body.status,
      result: body.result ?? null,
      signature: body.signature ?? null,
    },
    session.user.id
  );
  return NextResponse.json({ ok: true });
}
