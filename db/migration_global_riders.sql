-- ============================================================================
-- Migration: Global Riders Pool (Path B)
-- Converts event_riders from storing rider data inline to a join table
-- ============================================================================
-- This migration:
-- 1. Creates a global 'riders' table
-- 2. Extracts unique riders from event_riders into the new table
-- 3. Converts event_riders to a join table
-- 4. Updates FKs in sheet_riders and scores to reference riders.id
-- ============================================================================

BEGIN;

-- 1. Create global riders table
CREATE TABLE IF NOT EXISTS riders (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  nf            text,
  competitor_no text,
  horse         text,
  horse_no      text,
  image_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. Migrate existing event_riders data to riders table
-- For each unique rider (by name/horse combo within event), create a rider
-- Store mapping of old event_riders.id → new riders.id in a temp table
CREATE TEMP TABLE rider_mapping AS
SELECT
  er.id as old_id,
  r.id as new_id
FROM event_riders er
LEFT JOIN riders r ON
  r.name = er.name AND
  r.nf IS NOT DISTINCT FROM er.nf AND
  r.competitor_no IS NOT DISTINCT FROM er.competitor_no AND
  r.horse IS NOT DISTINCT FROM er.horse AND
  r.horse_no IS NOT DISTINCT FROM er.horse_no;

-- Insert new riders for existing event_riders that don't have a match
INSERT INTO riders (name, nf, competitor_no, horse, horse_no, image_url, created_at, updated_at)
SELECT DISTINCT er.name, er.nf, er.competitor_no, er.horse, er.horse_no, er.image_url, er.created_at, er.updated_at
FROM event_riders er
WHERE NOT EXISTS (
  SELECT 1 FROM riders r
  WHERE r.name = er.name AND
        r.nf IS NOT DISTINCT FROM er.nf AND
        r.competitor_no IS NOT DISTINCT FROM er.competitor_no AND
        r.horse IS NOT DISTINCT FROM er.horse AND
        r.horse_no IS NOT DISTINCT FROM er.horse_no
);

-- Recreate mapping with new riders
DROP TABLE rider_mapping;
CREATE TEMP TABLE rider_mapping AS
SELECT
  er.id as old_id,
  r.id as new_id,
  er.event_id
FROM event_riders er
JOIN riders r ON
  r.name = er.name AND
  r.nf IS NOT DISTINCT FROM er.nf AND
  r.competitor_no IS NOT DISTINCT FROM er.competitor_no AND
  r.horse IS NOT DISTINCT FROM er.horse AND
  r.horse_no IS NOT DISTINCT FROM er.horse_no;

-- 3. Update sheet_riders to reference riders.id instead of event_riders.id
ALTER TABLE sheet_riders
  DROP CONSTRAINT sheet_riders_rider_id_fkey,
  ADD CONSTRAINT sheet_riders_rider_id_fkey FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE CASCADE;

-- Migrate sheet_riders data
UPDATE sheet_riders sr
SET rider_id = rm.new_id
FROM rider_mapping rm
WHERE sr.rider_id = rm.old_id AND sr.event_id = rm.event_id;

-- 4. Update scores to reference riders.id instead of event_riders.id
ALTER TABLE scores
  DROP CONSTRAINT scores_rider_id_fkey,
  ADD CONSTRAINT scores_rider_id_fkey FOREIGN KEY (rider_id) REFERENCES riders(id) ON DELETE CASCADE;

-- Migrate scores data
UPDATE scores s
SET rider_id = rm.new_id
FROM rider_mapping rm
WHERE s.rider_id = rm.old_id AND s.event_id = rm.event_id;

-- 5. Rebuild event_riders as a join table
-- Store old data to recreate relationships
CREATE TEMP TABLE event_rider_relationships AS
SELECT rm.event_id, rm.new_id as rider_id
FROM rider_mapping rm;

-- Drop and recreate event_riders table
DROP TABLE event_riders;

CREATE TABLE event_riders (
  event_id  uuid not null references events(id) on delete cascade,
  rider_id  uuid not null references riders(id) on delete cascade,
  primary key (event_id, rider_id)
);

-- Restore relationships
INSERT INTO event_riders (event_id, rider_id)
SELECT event_id, rider_id FROM event_rider_relationships
ON CONFLICT DO NOTHING;

COMMIT;
