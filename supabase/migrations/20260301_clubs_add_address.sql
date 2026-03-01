-- Add missing columns to clubs table that are used by the API

ALTER TABLE public.clubs
    ADD COLUMN IF NOT EXISTS address text,
    ADD COLUMN IF NOT EXISTS address_lat double precision,
    ADD COLUMN IF NOT EXISTS address_lng double precision,
    ADD COLUMN IF NOT EXISTS followers_count integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS members_count integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- organization_id diventa opzionale su clubs:
-- il collegamento a sports_organizations è suggerito all'utente ma non obbligatorio.
ALTER TABLE public.clubs
    ALTER COLUMN organization_id DROP NOT NULL;

-- sport_id diventa opzionale su sports_organizations:
-- supporta le polisportive (sport principale non obbligatorio,
-- gli sport effettivi sono gestiti in club_sports).
ALTER TABLE public.sports_organizations
    ALTER COLUMN sport_id DROP NOT NULL;
