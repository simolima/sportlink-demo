-- =============================================
-- MIGRATION: Add Injury Tracker (Functional, GDPR-safe)
-- Date: 2026-03-06
-- Description:
--   Light "Functional Tracker" for athlete availability.
--   NO clinical data, NO medical reports, NO documents.
--   Purpose: communicate recovery timelines to clubs and athletes.
--
-- Schema: athlete_injuries
--   Stores injury events with severity and expected return date.
--   Soft-delete only: set deleted_at instead of hard DELETE.
-- =============================================

-- =============================================
-- ENUMS
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'injury_severity_enum') THEN
        CREATE TYPE public.injury_severity_enum AS ENUM (
            'Lieve',
            'Moderato',
            'Grave'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'injury_status_enum') THEN
        CREATE TYPE public.injury_status_enum AS ENUM (
            'Active',
            'Recovering',
            'Resolved'
        );
    END IF;
END$$;


-- =============================================
-- TABLE: athlete_injuries
-- =============================================
CREATE TABLE IF NOT EXISTS public.athlete_injuries (
    id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Chi ha subito l'infortunio
    athlete_profile_id      uuid NOT NULL
        REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Chi ha inserito il record (atleta stesso, physio, DS, admin club)
    reported_by_profile_id  uuid NOT NULL
        REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Classificazione funzionale (nessun dato clinico sensibile)
    injury_type             text NOT NULL
        CHECK (injury_type IN ('Muscolare', 'Articolare', 'Trauma', 'Malattia', 'Altro')),

    body_part               text,               -- es. "Ginocchio destro", opzionale

    severity                public.injury_severity_enum NOT NULL,

    -- Timeline
    start_date              date NOT NULL,
    expected_return_date    date,               -- stima rientro, opzionale

    -- Stato recupero
    status                  public.injury_status_enum NOT NULL DEFAULT 'Active',

    -- Note libere (non cliniche, solo logistiche)
    notes                   text,

    -- Audit
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    deleted_at              timestamptz,

    CONSTRAINT chk_injury_return_after_start
        CHECK (expected_return_date IS NULL OR expected_return_date >= start_date)
);

-- ── Indici ──────────────────────────────────────────────────────────────────

-- Lookup primario: cronologia degli infortuni di un atleta
CREATE INDEX IF NOT EXISTS idx_athlete_injuries_athlete_active
    ON public.athlete_injuries (athlete_profile_id, start_date DESC)
    WHERE deleted_at IS NULL;

-- Lookup per chi ha inserito (audit trail leggero)
CREATE INDEX IF NOT EXISTS idx_athlete_injuries_reporter
    ON public.athlete_injuries (reported_by_profile_id)
    WHERE deleted_at IS NULL;

-- Lookup per trovare atleti con infortuni attivi (es. per il club)
CREATE INDEX IF NOT EXISTS idx_athlete_injuries_status_active
    ON public.athlete_injuries (status, athlete_profile_id)
    WHERE deleted_at IS NULL;

-- ── Trigger updated_at ───────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_athlete_injuries_updated_at ON public.athlete_injuries;
CREATE TRIGGER trg_athlete_injuries_updated_at
    BEFORE UPDATE ON public.athlete_injuries
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================
-- RLS — Row Level Security
-- =============================================
ALTER TABLE public.athlete_injuries ENABLE ROW LEVEL SECURITY;

-- Atleta: può leggere i propri infortuni
CREATE POLICY "athlete_injuries_self_read"
    ON public.athlete_injuries
    FOR SELECT
    USING (
        auth.uid() = athlete_profile_id
        AND deleted_at IS NULL
    );

-- Atleta: può inserire i propri infortuni
CREATE POLICY "athlete_injuries_self_insert"
    ON public.athlete_injuries
    FOR INSERT
    WITH CHECK (auth.uid() = athlete_profile_id);

-- Chi ha inserito: può aggiornare (es. segnare Resolved)
-- Nota: la service role bypassa RLS → le Server Actions usano supabaseServer
CREATE POLICY "athlete_injuries_reporter_update"
    ON public.athlete_injuries
    FOR UPDATE
    USING (
        auth.uid() = reported_by_profile_id
        OR auth.uid() = athlete_profile_id
    );

-- Soft delete: solo il reporter o l'atleta stesso
CREATE POLICY "athlete_injuries_soft_delete"
    ON public.athlete_injuries
    FOR UPDATE
    USING (
        auth.uid() = reported_by_profile_id
        OR auth.uid() = athlete_profile_id
    );

-- Commento per documentazione DB
COMMENT ON TABLE public.athlete_injuries IS
    'Functional injury tracker. GDPR-safe: no clinical data, medical reports or documents. '
    'Purpose: communicate availability and recovery timeline to clubs and athletes.';
