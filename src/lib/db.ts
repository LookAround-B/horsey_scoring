import { Pool, types } from "pg";

// Return DATE (OID 1082) columns as the raw "yyyy-MM-dd" string instead of a JS
// Date. Every consumer (and our types) treats start_date/end_date as `string`;
// the default Date object broke date-fns `parse()` ("t.match is not a function").
types.setTypeParser(1082, (v) => v);

declare global {
  var __horseyPool: Pool | undefined;
}

export const pool =
  global.__horseyPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
    statement_timeout: 10_000,
    query_timeout: 10_000,
  });

pool.on("error", (err) => {
  console.error("[pg pool] idle client error:", err.message);
});

if (process.env.NODE_ENV !== "production") global.__horseyPool = pool;

const TRANSIENT = /ECONNRESET|ETIMEDOUT|Connection terminated|57P01/i;

function isTransient(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as Error & { code?: string }).code ?? "";
  return TRANSIENT.test(err.message) || TRANSIENT.test(code);
}

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  try {
    const res = await pool.query(text, params);
    return res.rows as T[];
  } catch (err) {
    if (isTransient(err)) {
      await new Promise((r) => setTimeout(r, 150));
      const res = await pool.query(text, params);
      return res.rows as T[];
    }
    throw err;
  }
}
