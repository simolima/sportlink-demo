-- =============================================
-- FIX: Ensure profile_roles is always in sync with profiles.role_id
-- Date: 2026-03-06
-- Problem:
--   profile_roles was created and seeded from existing profiles,
--   but new profiles created after the migration are missing.
-- Fix:
--   1. A trigger on profiles that auto-syncs profile_roles
--      on INSERT or UPDATE of role_id.
--   2. Backfill any profiles currently missing from profile_roles.
-- =============================================

-- ─── 1. Trigger function: sync profiles.role_id → profile_roles ─────────────
CREATE OR REPLACE FUNCTION public.sync_profile_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.role_id IS NOT NULL THEN
        INSERT INTO public.profile_roles (user_id, role_id, is_active, is_primary)
        VALUES (NEW.id, NEW.role_id, true, true)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_roles ON public.profiles;
CREATE TRIGGER trg_sync_profile_roles
    AFTER INSERT OR UPDATE OF role_id ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profile_roles();

-- ─── 2. Backfill: insert missing profiles into profile_roles ────────────────
INSERT INTO public.profile_roles (user_id, role_id, is_active, is_primary)
SELECT p.id, p.role_id, true, true
FROM public.profiles p
WHERE p.deleted_at IS NULL
  AND p.role_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM public.profile_roles pr
      WHERE pr.user_id = p.id AND pr.role_id = p.role_id
  )
ON CONFLICT (user_id, role_id) DO NOTHING;

-- =============================================
-- END OF FIX
-- =============================================
