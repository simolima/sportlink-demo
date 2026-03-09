-- Migration: add is_forwarded boolean flag to messages and group_messages
-- Needed for cross-type forwards (1:1 → group and vice versa) where
-- forwarded_from_id cannot be set (FK points to a different table).

ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS is_forwarded BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.group_messages
    ADD COLUMN IF NOT EXISTS is_forwarded BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: mark as forwarded any message that already has a forwarded_from_id
UPDATE public.messages
    SET is_forwarded = TRUE
    WHERE forwarded_from_id IS NOT NULL AND is_forwarded = FALSE;

UPDATE public.group_messages
    SET is_forwarded = TRUE
    WHERE forwarded_from_id IS NOT NULL AND is_forwarded = FALSE;
