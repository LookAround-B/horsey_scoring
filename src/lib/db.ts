import { Pool } from "pg";

// Single shared pool. Survives HMR in dev by stashing on globalThis.
declare global {
  var __horseyPool: Pool | undefined;
}

export const pool =
  global.__horseyPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Self-hosted Postgres usually has no TLS; flip on with DATABASE_SSL=true.
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") global.__horseyPool = pool;

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}
