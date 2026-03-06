-- ============================================================================
-- Migration: Add role_id to profile_sports
-- ============================================================================
-- PURPOSE: Enable per-role sport associations.
--   Currently profile_sports links user ↔ sport globally.
--   With this migration, a user can have different sports per role:
--     e.g. user is "player" in Calcio AND "coach" in Basket.
--
-- CHANGES:
--   1. Add nullable role_id column (FK → lookup_roles)
--   2. Backfill existing rows from profiles.role_id
--   3. Replace UNIQUE(user_id, sport_id) with UNIQUE(user_id, sport_id, role_id)
--   4. Add index for efficient per-role lookups
-- ============================================================================

-- 1. Add column (nullable for backward compatibility)
ALTER TABLE public.profile_sports
    ADD COLUMN IF NOT EXISTS role_id text REFERENCES public.lookup_roles(id);

-- 2. Backfill: set role_id from the user's primary role in profiles
UPDATE public.profile_sports ps
SET role_id = p.role_id
FROM public.profiles p
WHERE ps.user_id = p.id
  AND ps.role_id IS NULL
  AND p.role_id IS NOT NULL;

-- 3. Replace unique constraint: (user_id, sport_id) → (user_id, sport_id, role_id)
--    This allows the same user+sport combo for different roles.
--    Drop the old constraint first — it may be named differently depending on how it was created.
DO $$
BEGIN
    -- Try dropping by typical constraint names
    ALTER TABLE public.profile_sports DROP CONSTRAINT IF EXISTS profile_sports_user_id_sport_id_key;
    ALTER TABLE public.profile_sports DROP CONSTRAINT IF EXISTS profile_sports_user_id_sport_id_unique;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if not found
    NULL;
END$$;

-- Also drop any unnamed unique index on (user_id, sport_id)
DROP INDEX IF EXISTS profile_sports_user_id_sport_id_key;
DROP INDEX IF EXISTS profile_sports_user_id_sport_id_unique;

-- Create new unique index that includes role_id
-- COALESCE handles NULLs for legacy rows
CREATE UNIQUE INDEX IF NOT EXISTS uniq_profile_sports_user_sport_role
    ON public.profile_sports (user_id, sport_id, COALESCE(role_id, ''));

-- 4. Index for efficient per-user-per-role lookups
CREATE INDEX IF NOT EXISTS idx_profile_sports_user_role
    ON public.profile_sports (user_id, role_id)
    WHERE deleted_at IS NULL;

-- 5. Comment for documentation
COMMENT ON COLUMN public.profile_sports.role_id IS
    'Professional role this sport association belongs to. NULL for legacy rows.';
