// Seeds one approved demo user per role. All share the password "demo123".
//   node scripts/seed-roles.mjs
import { readFileSync } from "node:fs";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

try {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  console.warn("No .env.local found — relying on existing environment variables.");
}

const PASSWORD = "demo123";

const MEMBERS = [
  { role: "super_admin", name: "Super Admin" },
  { role: "show_secretary", name: "Show Secretary" },
  { role: "dressage_judge", name: "Dressage Judge" },
  { role: "showjumping_judge", name: "Showjumping Judge" },
  { role: "dressage_writer", name: "Dressage Writer" },
  { role: "showjumping_writer", name: "Showjumping Writer" },
  { role: "examiner", name: "Examiner" },
  { role: "rider", name: "Rider" },
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const hash = await bcrypt.hash(PASSWORD, 10);

for (const m of MEMBERS) {
  const email = `${m.role}@horsey.app`;
  await pool.query(
    `insert into users (name, email, role, status, password_hash, "emailVerified", approved_at)
          values ($1, $2, $3, 'approved', $4, now(), now())
     on conflict (email) do update
          set role = excluded.role,
              status = 'approved',
              password_hash = excluded.password_hash,
              name = excluded.name,
              approved_at = now()`,
    [m.name, email, m.role, hash]
  );
  console.log(`✅ ${email}  (${m.role})`);
}

console.log(`\nAll seeded. Password for every account: ${PASSWORD}`);
await pool.end();
