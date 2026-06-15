# Horsey — FEI Dressage Scoring

Interactive FEI dressage scoring sheets with live calculations. Open a test,
enter marks, and watch movement totals, collective marks, penalties, and the
final percentage update in real time — then save the sheet and review it from a
role-based dashboard.

Built with **Next.js 15** (App Router), **React 18**, **TypeScript**, and
**Tailwind CSS**.

---

## Prerequisites

- **Node.js 18.18+** (Node 20 LTS recommended)
- **npm** (ships with Node)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Then open **http://localhost:3000**.

> If port 3000 is already in use, Next.js automatically picks the next free
> port (e.g. 3002) and prints the URL in the terminal.

## Available scripts

| Command         | What it does                                     |
| --------------- | ------------------------------------------------ |
| `npm run dev`   | Start the dev server with hot reload             |
| `npm run build` | Create a production build                        |
| `npm run start` | Serve the production build (run `build` first)   |
| `npm run lint`  | Run ESLint                                        |

## Authentication & roles

Auth runs on **Auth.js (NextAuth v5)** backed by a **PostgreSQL** database.

- **Super admin** signs in with **email + password** (seeded once via a script).
- **Everyone else** signs in with **Google**. A new Google account is created as
  `pending` and lands on a "waiting for approval" screen until the super admin
  assigns them a role and approves them (Dashboard → **Approvals**).
- Approved users go straight to their role-specific dashboard on every later
  sign-in.

Access is enforced both in **middleware** (route guards) and in **server
actions** (every admin mutation re-checks the caller's role).

### One-time setup

1. **Configure env** — copy `.env.local.example` to `.env.local` and fill it in:
   ```bash
   cp .env.local.example .env.local
   npx auth secret            # generates AUTH_SECRET
   ```
   Set `DATABASE_URL`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET`.

2. **Create the database tables** — run the schema against your Postgres:
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   ```

3. **Seed the super admin** (uses `ADMIN_*` from `.env.local`):
   ```bash
   node scripts/create-admin.mjs
   ```

4. **Google OAuth** — in Google Cloud Console → Credentials → OAuth client:
   - **Authorized JavaScript origins:** `http://localhost:3000` (+ your prod domain)
   - **Authorized redirect URIs:**
     `http://localhost:3000/api/auth/callback/google` (+ the prod equivalent)

Then `npm run dev` and sign in.

## How it works

1. **Sign in** with a demo account.
2. From the dashboard, open the **Scoring Sheets** tab and click **Open** on a
   test (Young Rider, Junior, Children I/II, Advanced, Freestyle, …).
3. Fill in the sheet header (event, date, judge, rider, horse, position) and
   enter movement marks. Totals, collective marks, penalties, and the final
   score recalculate live as you type.
4. Click **Save Score** in the top bar, pick the rider and a status
   (submitted / draft), and confirm.
5. Back on the dashboard, the **Saved Scores** tab shows each saved sheet as a
   detail card. Click **Open** on a card to reopen and restore the full sheet.

> **Persistence:** scores and drafts are stored in the browser's
> `localStorage`, so saved sheets live on the device/browser you used. There is
> no server-side database in this demo.

## Project structure

```
src/
  app/
    login/                 # Demo login page
    dashboard/             # Hub + role-based dashboards
    scoring/[testId]/      # Interactive scoring sheet (live calculations)
    layout.tsx, providers.tsx
  components/ui/           # Reusable UI primitives (calendar, popover, …)
    auth/pending/          # "Awaiting approval" screen
    api/auth/[...nextauth] # NextAuth route handler
  contexts/AuthContext.tsx # useAuth() — thin wrapper over next-auth/react
  auth.ts                  # NextAuth config (Google + Credentials, JWT, roles)
  lib/
    db.ts                  # Postgres connection pool
    users.ts               # User/approval queries
    roles.ts               # Role enum, labels, dashboard routes
    dummy-data.ts          # Demo riders, events, sessions (scoring content)
    tests/                 # FEI test configs (movements, collectives, coefficients)
  middleware.ts            # Route protection / redirects (edge-safe)
db/schema.sql              # Database schema (Auth.js tables + roles)
scripts/create-admin.mjs   # Seeds the super admin
```

> **Note on scoring data:** riders, events, and saved scores still come from
> demo data / `localStorage`. Only authentication and roles are backed by the
> database so far.
