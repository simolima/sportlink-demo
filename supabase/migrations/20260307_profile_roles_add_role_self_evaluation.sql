-- =============================================
-- MIGRATION: Add role-scoped self evaluation to profile_roles
-- Date: 2026-03-07
-- Description:
--   Stores self-evaluation per (user_id, role_id) to support multi-role
--   profiles with different evaluations by active role.
--   Keeps backward compatibility by backfilling from profiles columns.
-- =============================================

ALTER TABLE public.profile_roles
    ADD COLUMN IF NOT EXISTS role_self_evaluation jsonb;

COMMENT ON COLUMN public.profile_roles.role_self_evaluation IS
'Role-scoped self evaluation JSON for (user_id, role_id). Backfilled from profiles.player_self_evaluation and profiles.coach_self_evaluation.';

-- Backfill existing data from legacy columns in profiles
UPDATE public.profile_roles pr
SET role_self_evaluation = p.player_self_evaluation
FROM public.profiles p
WHERE pr.user_id = p.id
  AND pr.role_id = 'player'
  AND p.player_self_evaluation IS NOT NULL
  AND pr.role_self_evaluation IS NULL;

UPDATE public.profile_roles pr
SET role_self_evaluation = p.coach_self_evaluation
FROM public.profiles p
WHERE pr.user_id = p.id
  AND pr.role_id = 'coach'
  AND p.coach_self_evaluation IS NOT NULL
  AND pr.role_self_evaluation IS NULL;
