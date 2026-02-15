-- Migration: Add missing fields to affiliations table
-- Date: 2026-02-15
-- Description: Add requested_at, responded_at, affiliated_at, notes, and message columns

ALTER TABLE public.affiliations 
ADD COLUMN IF NOT EXISTS requested_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS responded_at timestamptz,
ADD COLUMN IF NOT EXISTS affiliated_at timestamptz,
ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
ADD COLUMN IF NOT EXISTS message text;

-- Add comment to table
COMMENT ON COLUMN public.affiliations.requested_at IS 'Timestamp when the affiliation request was created';
COMMENT ON COLUMN public.affiliations.responded_at IS 'Timestamp when player responded to the request';
COMMENT ON COLUMN public.affiliations.affiliated_at IS 'Timestamp when the affiliation became active';
COMMENT ON COLUMN public.affiliations.notes IS 'Notes from the agent when requesting affiliation';
COMMENT ON COLUMN public.affiliations.message IS 'Message from player when responding';
