-- Migration: add covering index for club_memberships.professional_role_id FK
-- Date: 2026-03-07

CREATE INDEX IF NOT EXISTS idx_club_memberships_professional_role_id
    ON public.club_memberships (professional_role_id);
