-- Migration: Add Verifications, Favorites, and Social Links tables
-- Description: Aggiunge le tabelle per verifications, favorites e estende la tabella profiles per social links
-- Date: 2026-02-13

-- ============================================================
-- 1. Extend profiles table with social_links JSON column
-- ============================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.social_links IS 'Social media links: instagram, tiktok, youtube, facebook, twitter, linkedin, transfermarkt';

-- ============================================================
-- 2. Extend profiles table with self_evaluation JSON columns
-- ============================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS player_self_evaluation JSONB,
ADD COLUMN IF NOT EXISTS coach_self_evaluation JSONB;

COMMENT ON COLUMN public.profiles.player_self_evaluation IS 'Player self-evaluation data (universal + sport-specific skills)';
COMMENT ON COLUMN public.profiles.coach_self_evaluation IS 'Coach self-evaluation data (universal + sport-specific skills)';

-- ============================================================
-- 3. Create verifications table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verifier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    verified_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_verification UNIQUE (verifier_id, verified_id),
    CONSTRAINT no_self_verification CHECK (verifier_id != verified_id)
);

COMMENT ON TABLE public.verifications IS 'User verifications (endorsements)';
COMMENT ON COLUMN public.verifications.verifier_id IS 'User who gives the verification';
COMMENT ON COLUMN public.verifications.verified_id IS 'User who receives the verification';

-- Indexes for verifications
CREATE INDEX IF NOT EXISTS idx_verifications_verifier ON public.verifications(verifier_id);
CREATE INDEX IF NOT EXISTS idx_verifications_verified ON public.verifications(verified_id);
CREATE INDEX IF NOT EXISTS idx_verifications_created_at ON public.verifications(created_at DESC);

-- ============================================================
-- 4. Create favorites table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    favorite_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_favorite UNIQUE (user_id, favorite_id),
    CONSTRAINT no_self_favorite CHECK (user_id != favorite_id)
);

COMMENT ON TABLE public.favorites IS 'User favorites (bookmarks)';
COMMENT ON COLUMN public.favorites.user_id IS 'User who adds to favorites';
COMMENT ON COLUMN public.favorites.favorite_id IS 'User who is favorited';

-- Indexes for favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_favorite ON public.favorites(favorite_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON public.favorites(created_at DESC);

-- ============================================================
-- 5. RLS Policies for verifications
-- ============================================================
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

-- Allow users to read all verifications
CREATE POLICY "verifications_select_all" ON public.verifications
    FOR SELECT USING (true);

-- Allow users to create verifications for others (not themselves)
CREATE POLICY "verifications_insert_own" ON public.verifications
    FOR INSERT WITH CHECK (
        auth.uid() = verifier_id
        AND verifier_id != verified_id
    );

-- Allow users to delete their own verifications
CREATE POLICY "verifications_delete_own" ON public.verifications
    FOR DELETE USING (auth.uid() = verifier_id);

-- ============================================================
-- 6. RLS Policies for favorites
-- ============================================================
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Allow users to read all favorites
CREATE POLICY "favorites_select_all" ON public.favorites
    FOR SELECT USING (true);

-- Allow users to create their own favorites (not themselves)
CREATE POLICY "favorites_insert_own" ON public.favorites
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND user_id != favorite_id
    );

-- Allow users to delete their own favorites
CREATE POLICY "favorites_delete_own" ON public.favorites
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 7. Update profiles RLS to allow social_links and evaluations
-- ============================================================
-- Users can update their own social_links and self_evaluation fields
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================================
-- 8. Helper functions for counts
-- ============================================================

-- Function to get verification count for a user
CREATE OR REPLACE FUNCTION get_verifications_count(profile_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.verifications
    WHERE verified_id = profile_id;
$$;

-- Function to get favorites count for a user
CREATE OR REPLACE FUNCTION get_favorites_count(profile_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.favorites
    WHERE favorite_id = profile_id;
$$;

COMMENT ON FUNCTION get_verifications_count IS 'Returns the number of verifications a user has received';
COMMENT ON FUNCTION get_favorites_count IS 'Returns the number of times a user has been favorited';
