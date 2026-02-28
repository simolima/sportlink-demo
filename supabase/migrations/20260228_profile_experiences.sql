-- 1. DROP LEGACY TABLE
DROP TABLE IF EXISTS public.career_experiences CASCADE;

-- 2. CREATE ENUMS (Idempotent approach using DO block)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_type_enum') THEN
        CREATE TYPE public.profile_type_enum AS ENUM ('player', 'coach', 'agent', 'sporting_director', 'athletic_trainer', 'nutritionist', 'physio');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experience_kind_enum') THEN
        CREATE TYPE public.experience_kind_enum AS ENUM ('club', 'national_team', 'academy', 'federation', 'private_practice', 'other');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'competition_type_enum') THEN
        CREATE TYPE public.competition_type_enum AS ENUM ('male', 'female', 'open', 'mixed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employment_type_enum') THEN
        CREATE TYPE public.employment_type_enum AS ENUM ('owned', 'loan', 'free_agent', 'tryout', 'other');
    END IF;
END$$;

-- 3. CREATE BASE EXPERIENCE TABLE
CREATE TABLE IF NOT EXISTS public.profile_experiences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id uuid NULL REFERENCES public.sports_organizations(id) ON DELETE SET NULL,
    profile_type public.profile_type_enum NOT NULL,
    experience_kind public.experience_kind_enum NOT NULL DEFAULT 'club',
    title text NOT NULL,
    role_detail text NULL,
    season text NULL,
    category text NULL,
    category_tier text NULL,
    competition_type public.competition_type_enum NULL,
    start_date date NOT NULL,
    end_date date NULL,
    is_current boolean NOT NULL DEFAULT false,
    employment_type public.employment_type_enum NULL,
    loan_from_organization_id uuid NULL REFERENCES public.sports_organizations(id) ON DELETE SET NULL,
    description text NULL,
    is_public boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL,

    -- Constraints
    CONSTRAINT chk_end_date_logic CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_is_current_logic CHECK (NOT is_current OR end_date IS NULL),
    CONSTRAINT chk_loan_logic CHECK (employment_type != 'loan' OR loan_from_organization_id IS NOT NULL),
    CONSTRAINT chk_loan_inverse CHECK (loan_from_organization_id IS NULL OR employment_type = 'loan'),
    CONSTRAINT chk_employment_player_only CHECK (employment_type IS NULL OR profile_type = 'player')
);

-- Indices for base table
CREATE INDEX IF NOT EXISTS idx_profile_exp_user_active 
    ON public.profile_experiences(user_id, start_date DESC) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profile_exp_org_active 
    ON public.profile_experiences(organization_id) 
    WHERE deleted_at IS NULL AND organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profile_exp_public 
    ON public.profile_experiences(is_public) 
    WHERE deleted_at IS NULL;

-- Make sure updated_at trigger function exists
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for base table
DROP TRIGGER IF EXISTS trg_profile_experiences_updated_at ON public.profile_experiences;
CREATE TRIGGER trg_profile_experiences_updated_at
    BEFORE UPDATE ON public.profile_experiences
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- 4. CREATE STATS TABLES

-- 4.1 Football Player Stats
CREATE TABLE IF NOT EXISTS public.experience_stats_football_player (
    experience_id uuid PRIMARY KEY REFERENCES public.profile_experiences(id) ON DELETE CASCADE,
    position_id bigint NULL REFERENCES public.lookup_positions(id),
    appearances int NULL CHECK (appearances >= 0 OR appearances IS NULL),
    minutes_played int NULL CHECK (minutes_played >= 0 OR minutes_played IS NULL),
    goals int NULL CHECK (goals >= 0 OR goals IS NULL),
    assists int NULL CHECK (assists >= 0 OR assists IS NULL),
    clean_sheets int NULL CHECK (clean_sheets >= 0 OR clean_sheets IS NULL),
    penalties_scored int NULL CHECK (penalties_scored >= 0 OR penalties_scored IS NULL),
    yellow_cards int NULL CHECK (yellow_cards >= 0 OR yellow_cards IS NULL),
    red_cards int NULL CHECK (red_cards >= 0 OR red_cards IS NULL),
    substitutions_in int NULL CHECK (substitutions_in >= 0 OR substitutions_in IS NULL),
    substitutions_out int NULL CHECK (substitutions_out >= 0 OR substitutions_out IS NULL)
);

-- 4.2 Basketball Player Stats
CREATE TABLE IF NOT EXISTS public.experience_stats_basketball_player (
    experience_id uuid PRIMARY KEY REFERENCES public.profile_experiences(id) ON DELETE CASCADE,
    games_played int NULL CHECK (games_played >= 0 OR games_played IS NULL),
    minutes_played int NULL CHECK (minutes_played >= 0 OR minutes_played IS NULL),
    points_per_game numeric(5,2) NULL CHECK (points_per_game >= 0 OR points_per_game IS NULL),
    rebounds int NULL CHECK (rebounds >= 0 OR rebounds IS NULL)
);

-- 4.3 Volleyball Player Stats
CREATE TABLE IF NOT EXISTS public.experience_stats_volleyball_player (
    experience_id uuid PRIMARY KEY REFERENCES public.profile_experiences(id) ON DELETE CASCADE,
    matches_played int NULL CHECK (matches_played >= 0 OR matches_played IS NULL),
    aces int NULL CHECK (aces >= 0 OR aces IS NULL),
    blocks int NULL CHECK (blocks >= 0 OR blocks IS NULL),
    digs int NULL CHECK (digs >= 0 OR digs IS NULL)
);

-- 4.4 Coach Stats
CREATE TABLE IF NOT EXISTS public.experience_stats_coach (
    experience_id uuid PRIMARY KEY REFERENCES public.profile_experiences(id) ON DELETE CASCADE,
    matches_coached int NULL CHECK (matches_coached >= 0 OR matches_coached IS NULL),
    wins int NULL CHECK (wins >= 0 OR wins IS NULL),
    draws int NULL CHECK (draws >= 0 OR draws IS NULL),
    losses int NULL CHECK (losses >= 0 OR losses IS NULL),
    trophies int NULL CHECK (trophies >= 0 OR trophies IS NULL),
    
    CONSTRAINT chk_coach_stats_consistency CHECK (
        matches_coached IS NULL OR 
        matches_coached = (COALESCE(wins, 0) + COALESCE(draws, 0) + COALESCE(losses, 0))
    )
);


-- 5. ROW LEVEL SECURITY (RLS)

-- Enable RLS on all tables
ALTER TABLE public.profile_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_stats_football_player ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_stats_basketball_player ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_stats_volleyball_player ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_stats_coach ENABLE ROW LEVEL SECURITY;

-- 5.1 Policies for profile_experiences

-- READ: Public can read if is_public=true and not soft-deleted
DROP POLICY IF EXISTS "Public can view public active experiences" ON public.profile_experiences;
CREATE POLICY "Public can view public active experiences" 
    ON public.profile_experiences FOR SELECT 
    TO public
    USING (is_public = true AND deleted_at IS NULL);

-- READ: Owner can read all their own experiences (even private or soft-deleted ones)
DROP POLICY IF EXISTS "Owner can view own experiences" ON public.profile_experiences;
CREATE POLICY "Owner can view own experiences" 
    ON public.profile_experiences FOR SELECT 
    TO authenticated 
    USING (user_id = auth.uid() AND deleted_at IS NULL);

-- INSERT: Only owner can insert their own experiences
DROP POLICY IF EXISTS "Owner can insert own experiences" ON public.profile_experiences;
CREATE POLICY "Owner can insert own experiences" 
    ON public.profile_experiences FOR INSERT 
    TO authenticated 
    WITH CHECK (user_id = auth.uid());

-- UPDATE: Only owner can update their own experiences
DROP POLICY IF EXISTS "Owner can update own experiences" ON public.profile_experiences;
CREATE POLICY "Owner can update own experiences" 
    ON public.profile_experiences FOR UPDATE 
    TO authenticated 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETE: Only owner can delete their own experiences
DROP POLICY IF EXISTS "Owner can delete own experiences" ON public.profile_experiences;
CREATE POLICY "Owner can delete own experiences" 
    ON public.profile_experiences FOR DELETE 
    TO authenticated 
    USING (user_id = auth.uid());


-- 5.2 RLS Helper for Stats tables (Template)
-- We use a single pattern for all stats tables

-- football_player stats policies
DROP POLICY IF EXISTS "Public can view stats for public experiences" ON public.experience_stats_football_player;
CREATE POLICY "Public can view stats for public experiences" 
    ON public.experience_stats_football_player FOR SELECT 
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.profile_experiences e 
            WHERE e.id = experience_id 
            AND e.is_public = true 
            AND e.deleted_at IS NULL
        ) 
        OR 
        EXISTS (
            SELECT 1 FROM public.profile_experiences e 
            WHERE e.id = experience_id 
            AND e.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Owner can insert stats" ON public.experience_stats_football_player;
CREATE POLICY "Owner can insert stats" 
    ON public.experience_stats_football_player FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Owner can update stats" ON public.experience_stats_football_player;
CREATE POLICY "Owner can update stats" 
    ON public.experience_stats_football_player FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Owner can delete stats" ON public.experience_stats_football_player;
CREATE POLICY "Owner can delete stats" 
    ON public.experience_stats_football_player FOR DELETE 
    TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid())
    );

-- basketball_player stats policies
DROP POLICY IF EXISTS "Public can view stats for public experiences" ON public.experience_stats_basketball_player;
CREATE POLICY "Public can view stats for public experiences" 
    ON public.experience_stats_basketball_player FOR SELECT 
    TO public
    USING (
        EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.is_public = true AND e.deleted_at IS NULL) 
        OR EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Owner can insert stats" ON public.experience_stats_basketball_player;
CREATE POLICY "Owner can insert stats" ON public.experience_stats_basketball_player FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid()));

DROP POLICY IF EXISTS "Owner can update stats" ON public.experience_stats_basketball_player;
CREATE POLICY "Owner can update stats" ON public.experience_stats_basketball_player FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid()));

DROP POLICY IF EXISTS "Owner can delete stats" ON public.experience_stats_basketball_player;
CREATE POLICY "Owner can delete stats" ON public.experience_stats_basketball_player FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid()));

-- volleyball_player stats policies
DROP POLICY IF EXISTS "Public can view stats for public experiences" ON public.experience_stats_volleyball_player;
CREATE POLICY "Public can view stats for public experiences" 
    ON public.experience_stats_volleyball_player FOR SELECT 
    TO public
    USING (
        EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.is_public = true AND e.deleted_at IS NULL) 
        OR EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Owner can insert stats" ON public.experience_stats_volleyball_player;
CREATE POLICY "Owner can insert stats" ON public.experience_stats_volleyball_player FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid()));

DROP POLICY IF EXISTS "Owner can update stats" ON public.experience_stats_volleyball_player;
CREATE POLICY "Owner can update stats" ON public.experience_stats_volleyball_player FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid()));

DROP POLICY IF EXISTS "Owner can delete stats" ON public.experience_stats_volleyball_player;
CREATE POLICY "Owner can delete stats" ON public.experience_stats_volleyball_player FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid()));

-- coach stats policies
DROP POLICY IF EXISTS "Public can view stats for public experiences" ON public.experience_stats_coach;
CREATE POLICY "Public can view stats for public experiences" 
    ON public.experience_stats_coach FOR SELECT 
    TO public
    USING (
        EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.is_public = true AND e.deleted_at IS NULL) 
        OR EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Owner can insert stats" ON public.experience_stats_coach;
CREATE POLICY "Owner can insert stats" ON public.experience_stats_coach FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid()));

DROP POLICY IF EXISTS "Owner can update stats" ON public.experience_stats_coach;
CREATE POLICY "Owner can update stats" ON public.experience_stats_coach FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid()));

DROP POLICY IF EXISTS "Owner can delete stats" ON public.experience_stats_coach;
CREATE POLICY "Owner can delete stats" ON public.experience_stats_coach FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profile_experiences e WHERE e.id = experience_id AND e.user_id = auth.uid()));