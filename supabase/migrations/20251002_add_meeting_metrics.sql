-- Add visitor and weekly activity metrics to meetings table
-- Safe for repeated runs using IF NOT EXISTS
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS visits_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visitors_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS converts_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS followups_count integer NOT NULL DEFAULT 0;

-- Backfill existing rows to default 0 (redundant due to DEFAULT but explicit)
UPDATE public.meetings
SET visits_count = COALESCE(visits_count, 0),
    visitors_count = COALESCE(visitors_count, 0),
    converts_count = COALESCE(converts_count, 0),
    followups_count = COALESCE(followups_count, 0)
WHERE true;
