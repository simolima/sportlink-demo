-- Migration: Add professional_role_id to club_memberships
-- Date: 2026-03-07
-- Goal:
--   Persist the professional profile context (player/coach/...) for each membership,
--   so club memberships are isolated per active professional role.

ALTER TABLE public.club_memberships
    ADD COLUMN IF NOT EXISTS professional_role_id text REFERENCES public.lookup_roles(id);

COMMENT ON COLUMN public.club_memberships.professional_role_id IS
    'Professional role context used when the membership is created (FK -> lookup_roles.id).';

-- Backfill existing rows with a deterministic strategy:
-- 1) Player memberships => player
-- 2) Staff/Admin memberships => user primary profile role if it is a club-admin role
-- 3) Fallback for remaining Staff/Admin => coach
UPDATE public.club_memberships cm
SET professional_role_id = CASE
    WHEN cm.club_role = 'Player' THEN 'player'
    WHEN lower(coalesce(p.role_id, '')) IN (
        'coach',
        'sporting_director',
        'athletic_trainer',
        'nutritionist',
        'physio',
        'talent_scout'
    ) THEN lower(p.role_id)
    ELSE 'coach'
END
FROM public.profiles p
WHERE cm.user_id = p.id
  AND cm.professional_role_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_club_memberships_user_prof_role_active
    ON public.club_memberships (user_id, professional_role_id, status)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_club_memberships_club_prof_role_active
    ON public.club_memberships (club_id, professional_role_id, status)
    WHERE deleted_at IS NULL;
