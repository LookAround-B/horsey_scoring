-- ============================================================================
-- Horsey · Auth.js (NextAuth) schema for self-hosted PostgreSQL
-- Run once against your database:
--   psql "postgresql://appuser:****@HOST:5433/horsey_scoring" -f db/schema.sql
-- ============================================================================

-- gen_random_uuid()
create extension if not exists pgcrypto;

-- 1. Role + approval enums ----------------------------------------------------
do $$ begin
  create type user_role as enum (
    'super_admin','dressage_judge','showjumping_judge','dressage_writer',
    'showjumping_writer','examiner','rider','show_secretary'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type approval_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

-- 2. Auth.js core tables (PostgreSQL adapter schema) --------------------------
create table if not exists users (
  id            uuid not null default gen_random_uuid(),
  name          text,
  email         text,
  "emailVerified" timestamptz,
  image         text,
  -- Horsey additions:
  role          user_role,                       -- null until super admin assigns it
  status        approval_status not null default 'pending',
  password_hash text,                            -- only set for credential (super admin) logins
  created_at    timestamptz not null default now(),
  approved_at   timestamptz,
  approved_by   uuid,
  primary key (id)
);
create unique index if not exists users_email_key on users (email);

create table if not exists accounts (
  id                  uuid not null default gen_random_uuid(),
  "userId"            uuid not null references users(id) on delete cascade,
  type                text not null,
  provider            text not null,
  "providerAccountId" text not null,
  refresh_token       text,
  access_token        text,
  expires_at          bigint,
  id_token            text,
  scope               text,
  session_state       text,
  token_type          text,
  primary key (id)
);

create table if not exists sessions (
  id             uuid not null default gen_random_uuid(),
  "userId"       uuid not null references users(id) on delete cascade,
  expires        timestamptz not null,
  "sessionToken" text not null,
  primary key (id)
);

create table if not exists verification_token (
  identifier text not null,
  expires    timestamptz not null,
  token      text not null,
  primary key (identifier, token)
);

-- Which discipline each scoring sheet belongs to (admin-controlled, shared).
create table if not exists sheet_placements (
  test_slug  text primary key,
  discipline text not null check (discipline in ('dressage','showjumping')),
  updated_at timestamptz not null default now(),
  updated_by uuid references users(id) on delete set null
);

-- Admin-managed event groups (KSEC, KPL, …) shown as tabs.
create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- A scoring sheet can belong to many events (many-to-many).
create table if not exists sheet_events (
  test_slug text not null,
  event_id  uuid not null references events(id) on delete cascade,
  primary key (test_slug, event_id)
);

-- Scoring sheets created by admins in the UI (config = TestConfig-shaped JSON).
create table if not exists custom_sheets (
  slug       text primary key,
  label      text not null,
  appendix   text,
  subtitle   text,
  abbr       text,
  discipline text not null default 'dressage' check (discipline in ('dressage','showjumping')),
  config     jsonb not null,
  max_score  int not null default 0,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 3. SEED THE SUPER ADMIN
--    Easiest: run  `node scripts/create-admin.mjs`  (hashes the password for you).
--    Or manually, after inserting a row, set:
--      update users set role='super_admin', status='approved', approved_at=now()
--        where email = 'admin@your-domain.com';
-- ============================================================================
