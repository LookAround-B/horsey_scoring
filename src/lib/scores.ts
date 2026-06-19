import { query } from "@/lib/db";

export type ScoreStatus = "draft" | "submitted" | "verified";

export type ScoreRecord = {
  id: string;
  event_id: string;
  test_slug: string;
  rider_id: string | null;
  data: Record<string, unknown>;
  status: ScoreStatus;
  result: number | null;
  signature: string | null;
  updated_at: string;
  updated_by: string | null;
};

/** True if the user may read/write scores for this event. */
export async function canAccessEvent(userId: string, role: string | null, eventId: string): Promise<boolean> {
  if (role === "super_admin") return true;
  const rows = await query<{ ok: number }>(
    `select 1 as ok from events e
       where e.id = $1
         and (e.secretary_id = $2
              or exists (select 1 from event_participants p
                          where p.event_id = e.id and p.user_id = $2 and p.joined_at is not null))
       limit 1`,
    [eventId, userId]
  );
  return rows.length > 0;
}

export async function getScore(
  eventId: string,
  slug: string,
  riderId: string | null
): Promise<ScoreRecord | null> {
  const rows = await query<ScoreRecord>(
    `select * from scores
      where event_id = $1 and test_slug = $2
        and rider_id is not distinct from $3
      limit 1`,
    [eventId, slug, riderId]
  );
  return rows[0] ?? null;
}

export async function saveScore(
  input: {
    eventId: string;
    slug: string;
    riderId: string | null;
    data: Record<string, unknown>;
    status?: ScoreStatus;
    result?: number | null;
    signature?: string | null;
  },
  userId: string
): Promise<void> {
  const existing = await getScore(input.eventId, input.slug, input.riderId);
  if (existing) {
    await query(
      `update scores
          set data = $2, status = coalesce($3, status), result = $4, signature = $5,
              updated_by = $6, updated_at = now()
        where id = $1`,
      [
        existing.id,
        JSON.stringify(input.data),
        input.status ?? null,
        input.result ?? null,
        input.signature ?? null,
        userId,
      ]
    );
  } else {
    await query(
      `insert into scores (event_id, test_slug, rider_id, data, status, result, signature, scored_by, updated_by)
            values ($1,$2,$3,$4,coalesce($5,'draft'),$6,$7,$8,$8)`,
      [
        input.eventId,
        input.slug,
        input.riderId,
        JSON.stringify(input.data),
        input.status ?? null,
        input.result ?? null,
        input.signature ?? null,
        userId,
      ]
    );
  }
}

/** Lightweight rows for the event dashboard (no full data blob). */
export async function listScoresForEvent(eventId: string): Promise<
  { test_slug: string; rider_id: string | null; status: ScoreStatus; result: number | null; updated_at: string }[]
> {
  return query(
    `select test_slug, rider_id, status, result, updated_at
       from scores where event_id = $1`,
    [eventId]
  );
}
