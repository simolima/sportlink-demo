-- Add owner response fields to studio reviews
ALTER TABLE public.studio_reviews
    ADD COLUMN IF NOT EXISTS owner_response text,
    ADD COLUMN IF NOT EXISTS owner_responded_at timestamptz;