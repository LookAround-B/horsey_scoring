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

## Logging in

The app uses a built-in demo auth layer — **no backend or environment variables
are required to run it.** On the login page, click any **demo account** card to
pre-fill its email, then sign in.

- **Password for every demo account:** `Horsey@2025`

Each account lands on its role-specific dashboard (Super Admin, Dressage Judge,
Examiner, Rider, Show Secretary, etc.).

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
  contexts/AuthContext.tsx # Demo auth (localStorage-backed)
  lib/
    dummy-data.ts          # Demo users, riders, events, sessions
    tests/                 # FEI test configs (movements, collectives, coefficients)
  middleware.ts            # Route protection / redirects
```

## Optional: Supabase

A Supabase browser-client helper exists at `src/lib/supabase.ts` but is **not
wired into the app** — the demo runs entirely on local data. If you later
connect Supabase, add a `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
