import { pool, query } from "@/lib/db";

export type EventRow = { id: string; name: string; slug: string };

export async function listEvents(): Promise<EventRow[]> {
  return query<EventRow>(`select id, name, slug from events order by sort_order, name`);
}

/** test slug -> [event slug, …] — used by the dashboard to filter sheets. */
export async function listMembershipBySlug(): Promise<Record<string, string[]>> {
  const rows = await query<{ test_slug: string; slug: string }>(
    `select se.test_slug, e.slug
       from sheet_events se
       join events e on e.id = se.event_id`
  );
  const map: Record<string, string[]> = {};
  for (const r of rows) (map[r.test_slug] ??= []).push(r.slug);
  return map;
}

/** event id -> [test slug, …] — used by the admin assignment UI. */
export async function listSheetsByEvent(): Promise<Record<string, string[]>> {
  const rows = await query<{ event_id: string; test_slug: string }>(
    `select event_id, test_slug from sheet_events`
  );
  const map: Record<string, string[]> = {};
  for (const r of rows) (map[r.event_id] ??= []).push(r.test_slug);
  return map;
}

export async function createEvent(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const slug =
    trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    `event-${Date.now()}`;
  await query(`insert into events (name, slug) values ($1, $2) on conflict (slug) do nothing`, [
    trimmed,
    slug,
  ]);
}

export async function deleteEvent(id: string) {
  await query(`delete from events where id = $1`, [id]);
}

/** Replace the full set of sheets assigned to an event. */
export async function setEventSheets(eventId: string, slugs: string[]) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`delete from sheet_events where event_id = $1`, [eventId]);
    for (const s of slugs) {
      await client.query(
        `insert into sheet_events (test_slug, event_id) values ($1, $2) on conflict do nothing`,
        [s, eventId]
      );
    }
    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}
