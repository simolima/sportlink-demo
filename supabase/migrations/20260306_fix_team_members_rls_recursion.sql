-- =============================================
-- FIX: Infinite recursion in team_members RLS policy (42P17)
-- Date: 2026-03-06
-- Problem:
--   team_members_select_team policy references team_members itself
--   in an EXISTS subquery, causing PostgreSQL to re-evaluate the
--   SELECT policy on the inner query → infinite recursion.
--   Additionally, team_events_select_team_members references
--   team_members, triggering the same recursion.
-- Fix:
--   1. Create a SECURITY DEFINER helper function that checks
--      team membership without being subject to RLS.
--   2. Drop and recreate the affected policies.
-- =============================================

-- ─── Helper function (SECURITY DEFINER = bypasses RLS) ──────────────────────
CREATE OR REPLACE FUNCTION public.is_team_member(
    _club_team_id uuid,
    _profile_id   uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.team_members
        WHERE club_team_id = _club_team_id
          AND profile_id   = _profile_id
          AND deleted_at   IS NULL
    );
$$;

-- ─── Fix 1: team_members SELECT policy ──────────────────────────────────────
DROP POLICY IF EXISTS "team_members_select_team" ON public.team_members;

CREATE POLICY "team_members_select_team" ON public.team_members
    FOR SELECT USING (
        deleted_at IS NULL AND auth.uid() IS NOT NULL AND (
            -- The row belongs to the authenticated user
            profile_id = auth.uid()
            OR
            -- The authenticated user is also a member of the same team
            -- (uses SECURITY DEFINER function to avoid self-referencing RLS)
            public.is_team_member(club_team_id, auth.uid())
            OR
            -- The authenticated user is the club owner
            EXISTS (
                SELECT 1 FROM public.club_teams ct
                JOIN public.clubs c ON c.id = ct.club_id
                WHERE ct.id         = public.team_members.club_team_id
                  AND c.owner_id    = auth.uid()
                  AND c.deleted_at  IS NULL
                  AND ct.deleted_at IS NULL
            )
        )
    );

-- ─── Fix 2: team_events SELECT policy (also references team_members) ────────
DROP POLICY IF EXISTS "team_events_select_team_members" ON public.team_events;

CREATE POLICY "team_events_select_team_members" ON public.team_events
    FOR SELECT USING (
        deleted_at IS NULL AND (
            -- Authenticated user is a member of this team
            public.is_team_member(team_id, auth.uid())
            OR
            -- Authenticated user is the club owner
            EXISTS (
                SELECT 1 FROM public.club_teams ct
                JOIN public.clubs c ON c.id = ct.club_id
                WHERE ct.id         = public.team_events.team_id
                  AND c.owner_id    = auth.uid()
                  AND c.deleted_at  IS NULL
                  AND ct.deleted_at IS NULL
            )
        )
    );

-- =============================================
-- END OF FIX
-- =============================================
