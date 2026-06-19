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

// ===========================================================================
// Full events (shows)
// ===========================================================================

export type EventStatus = "upcoming" | "active" | "completed";
export type EventVisibility = {
  riders?: boolean;
  scores?: boolean;
  judges?: boolean;
  secretary?: boolean;
};

export type EventSummary = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  status: EventStatus;
  access_code: string | null;
  secretary_id: string | null;
  secretary_name: string | null;
  rider_count: number;
  participant_count: number;
  created_at: string;
};

export type EventRider = {
  id: string;
  event_id: string;
  name: string;
  nf: string | null;
  competitor_no: string | null;
  horse: string | null;
  horse_no: string | null;
  image_url: string | null;
  created_at: string;
};

export type EventParticipant = {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  image_url: string | null;
  role_at_event: string | null;
  invited_at: string;
  joined_at: string | null;
};

export type EventFull = EventSummary & {
  visibility: EventVisibility;
  riders: EventRider[];
  participants: EventParticipant[];
};

function genCode(len = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function uniqueEventSlug(name: string): Promise<string> {
  const base =
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `event-${Date.now()}`;
  const rows = await query<{ slug: string }>(`select slug from events`);
  const taken = new Set(rows.map((r) => r.slug));
  let slug = base;
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;
  return slug;
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = genCode();
    const rows = await query(`select 1 from events where access_code = $1`, [code]);
    if (rows.length === 0) return code;
  }
  return genCode(8);
}

export type CreateEventInput = {
  name: string;
  location?: string;
  startDate?: string | null;
  endDate?: string | null;
  secretaryId?: string | null;
};

export async function createFullEvent(input: CreateEventInput, createdBy: string): Promise<string> {
  const slug = await uniqueEventSlug(input.name);
  const code = await uniqueCode();
  const rows = await query<{ id: string }>(
    `insert into events (name, slug, location, start_date, end_date, secretary_id, access_code, status, visibility, created_by, updated_at)
          values ($1, $2, $3, $4, $5, $6, $7, 'upcoming',
                  '{"riders":true,"scores":true,"judges":true,"secretary":true}'::jsonb, $8, now())
       returning id`,
    [
      input.name.trim(),
      slug,
      input.location?.trim() || null,
      input.startDate || null,
      input.endDate || null,
      input.secretaryId || null,
      code,
      createdBy,
    ]
  );
  return rows[0].id;
}

export async function updateEventMeta(
  id: string,
  input: { name: string; location?: string; startDate?: string | null; endDate?: string | null; status?: EventStatus; secretaryId?: string | null }
) {
  await query(
    `update events
        set name = $2, location = $3, start_date = $4, end_date = $5,
            status = coalesce($6, status), secretary_id = $7, updated_at = now()
      where id = $1`,
    [id, input.name.trim(), input.location?.trim() || null, input.startDate || null, input.endDate || null, input.status || null, input.secretaryId || null]
  );
}

export async function setEventVisibility(id: string, visibility: EventVisibility) {
  await query(`update events set visibility = $2, updated_at = now() where id = $1`, [
    id,
    JSON.stringify(visibility),
  ]);
}

export async function regenerateAccessCode(id: string): Promise<string> {
  const code = await uniqueCode();
  await query(`update events set access_code = $2, updated_at = now() where id = $1`, [id, code]);
  return code;
}

const SUMMARY_SELECT = `
  select e.id, e.name, e.slug, e.location, e.start_date, e.end_date,
         e.status, e.access_code, e.secretary_id, s.name as secretary_name,
         e.created_at,
         (select count(*) from event_riders r where r.event_id = e.id)::int as rider_count,
         (select count(*) from event_participants p where p.event_id = e.id)::int as participant_count
    from events e
    left join users s on s.id = e.secretary_id`;

export async function listAllEvents(): Promise<EventSummary[]> {
  return query<EventSummary>(`${SUMMARY_SELECT} order by e.created_at desc`);
}

export async function listEventsForSecretary(userId: string): Promise<EventSummary[]> {
  return query<EventSummary>(`${SUMMARY_SELECT} where e.secretary_id = $1 order by e.created_at desc`, [
    userId,
  ]);
}

export async function listEventsForParticipant(userId: string): Promise<EventSummary[]> {
  return query<EventSummary>(
    `${SUMMARY_SELECT}
      where e.id in (select event_id from event_participants where user_id = $1 and joined_at is not null)
      order by e.created_at desc`,
    [userId]
  );
}

export async function getEventById(id: string): Promise<EventFull | null> {
  const rows = await query<EventSummary & { visibility: EventVisibility }>(
    `${SUMMARY_SELECT} where e.id = $1`,
    [id]
  );
  // visibility isn't in SUMMARY_SELECT; fetch separately to keep that select reusable
  if (rows.length === 0) return null;
  const visRows = await query<{ visibility: EventVisibility }>(
    `select visibility from events where id = $1`,
    [id]
  );
  const riders = await query<EventRider>(
    `select * from event_riders where event_id = $1 order by created_at`,
    [id]
  );
  const participants = await query<EventParticipant>(
    `select p.id, p.user_id, u.name, u.email, u.image_url, p.role_at_event, p.invited_at, p.joined_at
       from event_participants p join users u on u.id = p.user_id
      where p.event_id = $1 order by p.invited_at`,
    [id]
  );
  return { ...rows[0], visibility: visRows[0]?.visibility ?? {}, riders, participants };
}

// ---- Riders ----
export type RiderInput = {
  name: string;
  nf?: string;
  competitorNo?: string;
  horse?: string;
  horseNo?: string;
  imageUrl?: string;
};

export async function addRider(eventId: string, r: RiderInput) {
  await query(
    `insert into event_riders (event_id, name, nf, competitor_no, horse, horse_no, image_url)
          values ($1,$2,$3,$4,$5,$6,$7)`,
    [eventId, r.name.trim(), r.nf || null, r.competitorNo || null, r.horse || null, r.horseNo || null, r.imageUrl || null]
  );
}

export async function deleteRider(riderId: string) {
  await query(`delete from event_riders where id = $1`, [riderId]);
}

// ---- Participants (judges/writers/etc.) ----
export async function addParticipant(eventId: string, userId: string, roleAtEvent: string) {
  await query(
    `insert into event_participants (event_id, user_id, role_at_event)
          values ($1,$2,$3)
     on conflict (event_id, user_id) do update set role_at_event = excluded.role_at_event`,
    [eventId, userId, roleAtEvent]
  );
}

export async function removeParticipant(participantId: string) {
  await query(`delete from event_participants where id = $1`, [participantId]);
}

/** Judge/writer enters the event's shared code to gain access. */
export async function joinByCode(
  userId: string,
  code: string
): Promise<{ eventId: string } | { error: string }> {
  const rows = await query<{ id: string }>(
    `select id from events where upper(access_code) = upper($1)`,
    [code.trim()]
  );
  if (rows.length === 0) return { error: "Invalid event code." };
  const eventId = rows[0].id;
  await query(
    `insert into event_participants (event_id, user_id, joined_at)
          values ($1, $2, now())
     on conflict (event_id, user_id) do update set joined_at = now()`,
    [eventId, userId]
  );
  return { eventId };
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
