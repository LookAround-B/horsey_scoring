// Seeds (or updates) the super admin account with a bcrypt-hashed password.
//
//   1. Make sure db/schema.sql has been applied to the database.
//   2. Set ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME (and DATABASE_URL) in .env.local
//   3. Run:  node scripts/create-admin.mjs
//
import { readFileSync } from "node:fs";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// minimal .env.local loader (no extra deps)
try {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  console.warn("No .env.local found — relying on existing environment variables.");
}

const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD || "";
const name = process.env.ADMIN_NAME || "Super Admin";

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local first.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const hash = await bcrypt.hash(password, 10);

const { rows } = await pool.query(
  `insert into users (name, email, role, status, password_hash, "emailVerified", approved_at)
       values ($1, $2, 'super_admin', 'approved', $3, now(), now())
   on conflict (email) do update
       set role = 'super_admin',
           status = 'approved',
           password_hash = excluded.password_hash,
           name = excluded.name,
           approved_at = now()
   returning id, email`,
  [name, email, hash]
);

console.log("✅ Super admin ready:", rows[0].email);
await pool.end();
