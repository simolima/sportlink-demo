-- =============================================
-- MIGRATION: Add professional profile fields to professional_studios
-- Date: 2026-03-08
-- Purpose: Replace mock data with real DB fields for public studio pages
-- =============================================

ALTER TABLE public.professional_studios
    ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
    ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS work_modes JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS methodology TEXT;

-- Constraints
ALTER TABLE public.professional_studios
    ADD CONSTRAINT chk_years_experience_positive 
        CHECK (years_of_experience IS NULL OR years_of_experience >= 0),
    ADD CONSTRAINT chk_languages_is_array 
        CHECK (languages IS NULL OR jsonb_typeof(languages) = 'array'),
    ADD CONSTRAINT chk_work_modes_is_array 
        CHECK (work_modes IS NULL OR jsonb_typeof(work_modes) = 'array'),
    ADD CONSTRAINT chk_certifications_is_array 
        CHECK (certifications IS NULL OR jsonb_typeof(certifications) = 'array');

-- Comments
COMMENT ON COLUMN public.professional_studios.years_of_experience IS 'Years of professional experience';
COMMENT ON COLUMN public.professional_studios.languages IS 'Languages spoken: ["Italiano", "Inglese", ...]';
COMMENT ON COLUMN public.professional_studios.work_modes IS 'Work modes: ["in-person", "remote", "hybrid"]';
COMMENT ON COLUMN public.professional_studios.certifications IS 'Array of certification/education strings';
COMMENT ON COLUMN public.professional_studios.methodology IS 'Long-form "How I work" methodology text';
