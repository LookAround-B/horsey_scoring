// Applies db/schema.sql to DATABASE_URL (a psql-free way to run the schema).
//   node scripts/db-push.mjs
import { readFileSync } from "node:fs";
import { Pool } from "pg";

try {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  console.warn("No .env.local found — relying on existing environment variables.");
}

const sql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const client = await pool.connect();
try {
  await client.query(sql);
  console.log("✅ Schema applied.");
} finally {
  client.release();
  await pool.end();
}
