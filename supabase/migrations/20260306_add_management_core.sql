-- =============================================
-- MIGRATION: Add Management Core Tables
-- Date: 2026-03-06
-- Author: Sprinta AI Architecture
-- Description:
--   Implements the foundational SaaS B2B2C layer:
--   1. Multi-role support via profile_roles junction table
--   2. Club team containers (club_teams + team_members)
--   3. Professional studios (professional_studios + studio_clients)
--   4. Athlete medical consent hub (athlete_medical_consents)
--   5. Calendars: team events + studio appointments
--
-- BACKWARD COMPATIBILITY NOTE:
--   profiles.role_id is NOT dropped. It is kept as a
--   legacy/cached "primary role" field. profile_roles is the new
--   source of truth. A future migration can remove profiles.role_id
--   once all application code reads from profile_roles.
-- =============================================

-- =============================================
-- PREREQUISITE: ensure set_updated_at() exists
-- (already created in 20260228_profile_experiences.sql;
--  this CREATE OR REPLACE is idempotent and safe to re-run)
-- =============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================
-- ENUMS  (idempotent DO block)
-- =============================================
DO $$
BEGIN
    -- Consent lifecycle for medical data sharing
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'medical_consent_status_enum') THEN
        CREATE TYPE public.medical_consent_status_enum AS ENUM (
            'pending',
            'approved',
            'revoked'
        );
    END IF;

    -- Team event categories
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_event_type_enum') THEN
        CREATE TYPE public.team_event_type_enum AS ENUM (
            'training',
            'match'
        );
    END IF;

    -- Studio appointment lifecycle
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status_enum') THEN
        CREATE TYPE public.appointment_status_enum AS ENUM (
            'pending',
            'confirmed',
            'cancelled',
            'completed'
        );
    END IF;

    -- Roles a person can hold within a team
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_member_role_enum') THEN
        CREATE TYPE public.team_member_role_enum AS ENUM (
            'player',
            'head_coach',
            'assistant_coach',
            'athletic_trainer',
            'physio',
            'nutritionist',
            'team_manager',
            'goalkeeper_coach'
        );
    END IF;

    -- Studio–client relationship status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'studio_client_status_enum') THEN
        CREATE TYPE public.studio_client_status_enum AS ENUM (
            'pending',
            'active',
            'inactive'
        );
    END IF;
END$$;


-- =============================================
-- 1. MULTI-RUOLO: profile_roles
--    Junction table: a user can hold multiple concurrent roles.
--    Constraint: exactly one active primary role per user enforced
--    via a partial unique index (simpler and safer than EXCLUDE).
-- =============================================
CREATE TABLE IF NOT EXISTS public.profile_roles (
    user_id    uuid NOT NULL REFERENCES public.profiles(id)     ON DELETE CASCADE,
    -- role_id is TEXT because lookup_roles uses a text PK
    role_id    text NOT NULL REFERENCES public.lookup_roles(id) ON DELETE CASCADE,

    is_active  boolean NOT NULL DEFAULT true,
    is_primary boolean NOT NULL DEFAULT false,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (user_id, role_id)
);

-- Enforce: a user can have AT MOST one active primary role
CREATE UNIQUE INDEX IF NOT EXISTS uniq_profile_roles_one_primary
    ON public.profile_roles (user_id)
    WHERE is_primary = true AND is_active = true;

-- Fast lookups for "what roles is this user active in?"
CREATE INDEX IF NOT EXISTS idx_profile_roles_user_active
    ON public.profile_roles (user_id)
    WHERE is_active = true;

-- Fast lookups for "all active users in a given role"
CREATE INDEX IF NOT EXISTS idx_profile_roles_role_active
    ON public.profile_roles (role_id)
    WHERE is_active = true;

DROP TRIGGER IF EXISTS trg_profile_roles_updated_at ON public.profile_roles;
CREATE TRIGGER trg_profile_roles_updated_at
    BEFORE UPDATE ON public.profile_roles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- DATA MIGRATION: seed profile_roles from existing profiles.role_id.
-- Idempotent: ON CONFLICT DO NOTHING means re-running this migration is safe.
INSERT INTO public.profile_roles (user_id, role_id, is_active, is_primary)
SELECT
    id      AS user_id,
    role_id AS role_id,
    true    AS is_active,
    true    AS is_primary
FROM public.profiles
WHERE role_id IS NOT NULL
  AND deleted_at IS NULL
ON CONFLICT (user_id, role_id) DO NOTHING;


-- =============================================
-- 2a. LIVELLO SQUADRA: club_teams
--     The "intermediate container" between a club and its players.
--     A club can have many teams (es. "Prima Squadra", "Under 19").
-- =============================================
CREATE TABLE IF NOT EXISTS public.club_teams (
    id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id    uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,

    name       text NOT NULL,        -- e.g. "Under 19", "Prima Squadra"
    category   text,                 -- e.g. "Giovanile", "Eccellenza", "Serie C"
    season     text,                 -- e.g. "2025/2026"
    sport_id   bigint REFERENCES public.lookup_sports(id) ON DELETE RESTRICT,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT chk_club_team_name_not_empty CHECK (char_length(name) > 0)
);

CREATE INDEX IF NOT EXISTS idx_club_teams_club_active
    ON public.club_teams (club_id, season)
    WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_club_teams_updated_at ON public.club_teams;
CREATE TRIGGER trg_club_teams_updated_at
    BEFORE UPDATE ON public.club_teams
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================
-- 2b. LIVELLO SQUADRA: team_members
--     Links a profile to a club_team with a specific role.
--     Soft-delete: set deleted_at instead of hard DELETE.
-- =============================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    club_team_id  uuid NOT NULL REFERENCES public.club_teams(id) ON DELETE CASCADE,
    profile_id    uuid NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,

    role          public.team_member_role_enum NOT NULL DEFAULT 'player',
    jersey_number integer,
    status        text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive', 'suspended', 'trial')),
    joined_at     date,
    notes         text,

    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz,

    CONSTRAINT chk_jersey_number_valid
        CHECK (jersey_number IS NULL OR jersey_number BETWEEN 1 AND 99)
);

-- A profile can only appear once per team (re-joining is a new record after soft-delete)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_team_members_active
    ON public.team_members (club_team_id, profile_id)
    WHERE deleted_at IS NULL;

-- Look up all teams a profile belongs to
CREATE INDEX IF NOT EXISTS idx_team_members_profile_active
    ON public.team_members (profile_id)
    WHERE deleted_at IS NULL;

-- Look up all members of a team by role
CREATE INDEX IF NOT EXISTS idx_team_members_team_role_active
    ON public.team_members (club_team_id, role)
    WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_team_members_updated_at ON public.team_members;
CREATE TRIGGER trg_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================
-- 3a. STUDI PROFESSIONALI: professional_studios
--     Specular entity to 'clubs', designed for physios/nutritionists
--     who operate independently or in a practice.
-- =============================================
CREATE TABLE IF NOT EXISTS public.professional_studios (
    id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    name             text NOT NULL,
    city             text,
    address          text,
    phone            text,
    website          text,
    logo_url         text,
    description      text,

    -- Array of service descriptors, e.g. ["Fisioterapia", "Massoterapia"]
    services_offered jsonb NOT NULL DEFAULT '[]'::jsonb,

    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    deleted_at       timestamptz,

    CONSTRAINT chk_studio_name_not_empty CHECK (char_length(name) > 0),
    CONSTRAINT chk_services_offered_is_array
        CHECK (jsonb_typeof(services_offered) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_professional_studios_owner_active
    ON public.professional_studios (owner_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_professional_studios_city_active
    ON public.professional_studios (city)
    WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_professional_studios_updated_at ON public.professional_studios;
CREATE TRIGGER trg_professional_studios_updated_at
    BEFORE UPDATE ON public.professional_studios
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================
-- 3b. STUDI PROFESSIONALI: studio_clients
--     Tracks which athlete-profiles are clients of a given studio.
--     Soft-delete via deleted_at.
-- =============================================
CREATE TABLE IF NOT EXISTS public.studio_clients (
    id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id         uuid NOT NULL REFERENCES public.professional_studios(id) ON DELETE CASCADE,
    client_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    status            public.studio_client_status_enum NOT NULL DEFAULT 'pending',
    notes             text,
    onboarded_at      date,

    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    deleted_at        timestamptz,

    -- A client can only have one active record per studio
    CONSTRAINT uniq_studio_client UNIQUE (studio_id, client_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_studio_clients_studio_active
    ON public.studio_clients (studio_id, status)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_studio_clients_profile_active
    ON public.studio_clients (client_profile_id)
    WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_studio_clients_updated_at ON public.studio_clients;
CREATE TRIGGER trg_studio_clients_updated_at
    BEFORE UPDATE ON public.studio_clients
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================
-- 4. CARTELLA MEDICA CONDIVISA: athlete_medical_consents
--    An athlete explicitly grants (or revokes) a professional's
--    access to their medical data. No hard-deletes; revoke instead.
-- =============================================
CREATE TABLE IF NOT EXISTS public.athlete_medical_consents (
    id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    athlete_id              uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    requested_by_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    status                  public.medical_consent_status_enum NOT NULL DEFAULT 'pending',
    request_message         text,       -- Optional note from the professional
    granted_at              timestamptz,
    revoked_at              timestamptz,
    expires_at              timestamptz, -- Optional: auto-expiry date for the consent

    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),

    -- One consent record per (athlete, professional) pair
    CONSTRAINT uniq_medical_consent UNIQUE (athlete_id, requested_by_profile_id),
    -- An athlete cannot consent to themselves
    CONSTRAINT chk_not_self_consent CHECK (athlete_id != requested_by_profile_id),
    -- granted_at must be populated when status = 'approved'
    CONSTRAINT chk_granted_at_when_approved
        CHECK (status != 'approved' OR granted_at IS NOT NULL),
    -- revoked_at must be populated when status = 'revoked'
    CONSTRAINT chk_revoked_at_when_revoked
        CHECK (status != 'revoked' OR revoked_at IS NOT NULL)
);

-- Athlete sees all consent requests directed to them
CREATE INDEX IF NOT EXISTS idx_medical_consents_athlete_status
    ON public.athlete_medical_consents (athlete_id, status);

-- Professional sees all consents they have requested
CREATE INDEX IF NOT EXISTS idx_medical_consents_requester_status
    ON public.athlete_medical_consents (requested_by_profile_id, status);

DROP TRIGGER IF EXISTS trg_athlete_medical_consents_updated_at ON public.athlete_medical_consents;
CREATE TRIGGER trg_athlete_medical_consents_updated_at
    BEFORE UPDATE ON public.athlete_medical_consents
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================
-- 5a. CALENDARI: team_events
--     Training sessions and matches for a club_team.
-- =============================================
CREATE TABLE IF NOT EXISTS public.team_events (
    id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id          uuid NOT NULL REFERENCES public.club_teams(id) ON DELETE CASCADE,
    created_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

    event_type       public.team_event_type_enum NOT NULL,
    title            text,               -- Optional custom label
    date_time        timestamptz NOT NULL,
    duration_minutes integer,
    location         text,
    description      text,

    -- Match-specific fields (relevant only when event_type = 'match')
    opponent         text,
    is_home          boolean,

    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    deleted_at       timestamptz,

    CONSTRAINT chk_event_duration_valid
        CHECK (duration_minutes IS NULL OR duration_minutes > 0)
);

-- Most common query: upcoming events for a given team
CREATE INDEX IF NOT EXISTS idx_team_events_team_upcoming
    ON public.team_events (team_id, date_time)
    WHERE deleted_at IS NULL;

-- Dashboard: next events across all teams (e.g. home widget)
CREATE INDEX IF NOT EXISTS idx_team_events_date_active
    ON public.team_events (date_time)
    WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_team_events_updated_at ON public.team_events;
CREATE TRIGGER trg_team_events_updated_at
    BEFORE UPDATE ON public.team_events
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================
-- 5b. CALENDARI: studio_appointments
--     Appointments between a professional and a client
--     within a professional_studio.
-- =============================================
CREATE TABLE IF NOT EXISTS public.studio_appointments (
    id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id       uuid NOT NULL REFERENCES public.professional_studios(id) ON DELETE CASCADE,
    client_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    professional_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    start_time      timestamptz NOT NULL,
    end_time        timestamptz NOT NULL,
    status          public.appointment_status_enum NOT NULL DEFAULT 'pending',
    service_type    text,   -- e.g. "Fisioterapia", "Consulenza Nutrizionale"
    notes           text,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,

    CONSTRAINT chk_appointment_end_after_start CHECK (end_time > start_time),
    CONSTRAINT chk_appointment_not_self        CHECK (client_id != professional_id)
);

-- Studio calendar view: all appointments for a studio ordered by time
CREATE INDEX IF NOT EXISTS idx_studio_appointments_studio_time
    ON public.studio_appointments (studio_id, start_time)
    WHERE deleted_at IS NULL;

-- Client personal calendar
CREATE INDEX IF NOT EXISTS idx_studio_appointments_client_upcoming
    ON public.studio_appointments (client_id, start_time)
    WHERE deleted_at IS NULL;

-- Professional personal calendar
CREATE INDEX IF NOT EXISTS idx_studio_appointments_professional_upcoming
    ON public.studio_appointments (professional_id, start_time)
    WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_studio_appointments_updated_at ON public.studio_appointments;
CREATE TRIGGER trg_studio_appointments_updated_at
    BEFORE UPDATE ON public.studio_appointments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.profile_roles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_teams                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_studios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_medical_consents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_appointments       ENABLE ROW LEVEL SECURITY;


-- ── profile_roles ─────────────────────────────────────────────────────────────
-- Anyone authenticated can view active roles of any profile (profiles are public).
-- Only the owner can mutate their own role memberships.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE POLICY "profile_roles_select_own" ON public.profile_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profile_roles_select_others_active" ON public.profile_roles
    FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "profile_roles_insert_self" ON public.profile_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profile_roles_update_self" ON public.profile_roles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "profile_roles_delete_self" ON public.profile_roles
    FOR DELETE USING (auth.uid() = user_id);


-- ── club_teams ────────────────────────────────────────────────────────────────
-- Any authenticated user can read active teams (discovery is public).
-- Only the club owner (clubs.owner_id) can create/update/delete teams.
-- Future: extend to club Admins via club_memberships when needed.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE POLICY "club_teams_select_public" ON public.club_teams
    FOR SELECT USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY "club_teams_insert_club_owner" ON public.club_teams
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.clubs c
            WHERE c.id = club_id
              AND c.owner_id = auth.uid()
              AND c.deleted_at IS NULL
        )
    );

CREATE POLICY "club_teams_update_club_owner" ON public.club_teams
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.clubs c
            WHERE c.id = club_id
              AND c.owner_id = auth.uid()
              AND c.deleted_at IS NULL
        )
    );

CREATE POLICY "club_teams_delete_club_owner" ON public.club_teams
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.clubs c
            WHERE c.id = club_id
              AND c.owner_id = auth.uid()
              AND c.deleted_at IS NULL
        )
    );


-- ── team_members ──────────────────────────────────────────────────────────────
-- READ:  a member can see all other members of the same team; club owner sees everyone.
-- WRITE: club owner manages the roster; a member can remove themselves (self-exit).
-- ──────────────────────────────────────────────────────────────────────────────
CREATE POLICY "team_members_select_team" ON public.team_members
    FOR SELECT USING (
        deleted_at IS NULL AND auth.uid() IS NOT NULL AND (
            -- The row is about the authenticated user themselves
            profile_id = auth.uid()
            OR
            -- The authenticated user is also an active member of the same team
            EXISTS (
                SELECT 1 FROM public.team_members tm2
                WHERE tm2.club_team_id = public.team_members.club_team_id
                  AND tm2.profile_id   = auth.uid()
                  AND tm2.deleted_at   IS NULL
            )
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

CREATE POLICY "team_members_insert_club_owner" ON public.team_members
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.club_teams ct
            JOIN public.clubs c ON c.id = ct.club_id
            WHERE ct.id        = club_team_id
              AND c.owner_id   = auth.uid()
              AND c.deleted_at IS NULL
        )
    );

CREATE POLICY "team_members_update_club_owner" ON public.team_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.club_teams ct
            JOIN public.clubs c ON c.id = ct.club_id
            WHERE ct.id        = public.team_members.club_team_id
              AND c.owner_id   = auth.uid()
              AND c.deleted_at IS NULL
        )
    );

CREATE POLICY "team_members_delete_club_owner_or_self" ON public.team_members
    FOR DELETE USING (
        -- Club owner removes anyone
        EXISTS (
            SELECT 1 FROM public.club_teams ct
            JOIN public.clubs c ON c.id = ct.club_id
            WHERE ct.id        = public.team_members.club_team_id
              AND c.owner_id   = auth.uid()
              AND c.deleted_at IS NULL
        )
        OR
        -- Member removes themselves
        profile_id = auth.uid()
    );


-- ── professional_studios ──────────────────────────────────────────────────────
-- READ:  all authenticated users can discover active studios.
-- WRITE: only the studio owner.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE POLICY "professional_studios_select_public" ON public.professional_studios
    FOR SELECT USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY "professional_studios_insert_owner" ON public.professional_studios
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "professional_studios_update_owner" ON public.professional_studios
    FOR UPDATE USING (auth.uid() = owner_id AND deleted_at IS NULL);

CREATE POLICY "professional_studios_delete_owner" ON public.professional_studios
    FOR DELETE USING (auth.uid() = owner_id);


-- ── studio_clients ────────────────────────────────────────────────────────────
-- READ:  the client themselves, or the studio owner.
-- WRITE: studio owner creates/updates/hard-removes client records.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE POLICY "studio_clients_select_parties" ON public.studio_clients
    FOR SELECT USING (
        deleted_at IS NULL AND (
            client_profile_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.professional_studios ps
                WHERE ps.id          = studio_id
                  AND ps.owner_id    = auth.uid()
                  AND ps.deleted_at  IS NULL
            )
        )
    );

CREATE POLICY "studio_clients_insert_studio_owner" ON public.studio_clients
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.professional_studios ps
            WHERE ps.id         = studio_id
              AND ps.owner_id   = auth.uid()
              AND ps.deleted_at IS NULL
        )
    );

CREATE POLICY "studio_clients_update_studio_owner" ON public.studio_clients
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.professional_studios ps
            WHERE ps.id         = studio_id
              AND ps.owner_id   = auth.uid()
              AND ps.deleted_at IS NULL
        )
    );

CREATE POLICY "studio_clients_delete_studio_owner" ON public.studio_clients
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.professional_studios ps
            WHERE ps.id         = studio_id
              AND ps.owner_id   = auth.uid()
              AND ps.deleted_at IS NULL
        )
    );


-- ── athlete_medical_consents ──────────────────────────────────────────────────
-- READ:  only the athlete (athlete_id) and the requesting professional.
-- INSERT: only the professional makes the request (they are requested_by_profile_id).
-- UPDATE: only the athlete can approve or revoke.
-- DELETE: intentionally blocked — set status = 'revoked' instead (audit trail).
-- ──────────────────────────────────────────────────────────────────────────────
CREATE POLICY "medical_consents_select_parties" ON public.athlete_medical_consents
    FOR SELECT USING (
        athlete_id = auth.uid() OR requested_by_profile_id = auth.uid()
    );

CREATE POLICY "medical_consents_insert_professional" ON public.athlete_medical_consents
    FOR INSERT WITH CHECK (
        auth.uid() = requested_by_profile_id
        -- Role enforcement (physio/nutritionist) is handled at the API layer
        -- to allow flexibility and avoid tight coupling to lookup_roles values.
    );

CREATE POLICY "medical_consents_update_athlete_only" ON public.athlete_medical_consents
    FOR UPDATE USING (
        -- Only the athlete can grant or revoke their own consent.
        auth.uid() = athlete_id
    );

-- No DELETE policy: revocation is a status change, not a hard delete.


-- ── team_events ───────────────────────────────────────────────────────────────
-- READ:  team members (via team_members) or club owner see events.
-- WRITE: club owner (or event creator who is club owner) manages events.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE POLICY "team_events_select_team_members" ON public.team_events
    FOR SELECT USING (
        deleted_at IS NULL AND (
            -- Authenticated user is a member of this team
            EXISTS (
                SELECT 1 FROM public.team_members tm
                WHERE tm.club_team_id = public.team_events.team_id
                  AND tm.profile_id   = auth.uid()
                  AND tm.deleted_at   IS NULL
            )
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

CREATE POLICY "team_events_insert_club_owner" ON public.team_events
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM public.club_teams ct
            JOIN public.clubs c ON c.id = ct.club_id
            WHERE ct.id        = team_id
              AND c.owner_id   = auth.uid()
              AND c.deleted_at IS NULL
        )
    );

CREATE POLICY "team_events_update_club_owner" ON public.team_events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.club_teams ct
            JOIN public.clubs c ON c.id = ct.club_id
            WHERE ct.id        = public.team_events.team_id
              AND c.owner_id   = auth.uid()
              AND c.deleted_at IS NULL
        )
    );

CREATE POLICY "team_events_delete_club_owner" ON public.team_events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.club_teams ct
            JOIN public.clubs c ON c.id = ct.club_id
            WHERE ct.id        = public.team_events.team_id
              AND c.owner_id   = auth.uid()
              AND c.deleted_at IS NULL
        )
    );


-- ── studio_appointments ───────────────────────────────────────────────────────
-- READ:  client, professional, or studio owner.
-- INSERT: professional or studio owner creates the appointment.
-- UPDATE: any of the three parties can update (e.g. cancel, confirm).
-- DELETE: studio owner only (soft-delete preferred via status = 'cancelled').
-- ──────────────────────────────────────────────────────────────────────────────
CREATE POLICY "studio_appointments_select_parties" ON public.studio_appointments
    FOR SELECT USING (
        deleted_at IS NULL AND (
            client_id       = auth.uid()
            OR professional_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.professional_studios ps
                WHERE ps.id         = studio_id
                  AND ps.owner_id   = auth.uid()
                  AND ps.deleted_at IS NULL
            )
        )
    );

CREATE POLICY "studio_appointments_insert_professional_or_owner" ON public.studio_appointments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            professional_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.professional_studios ps
                WHERE ps.id         = studio_id
                  AND ps.owner_id   = auth.uid()
                  AND ps.deleted_at IS NULL
            )
        )
    );

CREATE POLICY "studio_appointments_update_parties" ON public.studio_appointments
    FOR UPDATE USING (
        client_id       = auth.uid()
        OR professional_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.professional_studios ps
            WHERE ps.id         = studio_id
              AND ps.owner_id   = auth.uid()
              AND ps.deleted_at IS NULL
        )
    );

CREATE POLICY "studio_appointments_delete_studio_owner" ON public.studio_appointments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.professional_studios ps
            WHERE ps.id         = studio_id
              AND ps.owner_id   = auth.uid()
              AND ps.deleted_at IS NULL
        )
    );


-- =============================================
-- END OF MIGRATION
-- =============================================
