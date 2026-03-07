-- =============================================
-- MIGRATION: Add Google Calendar sync fields
-- Date: 2026-03-06
-- Description:
--   Prepares the schema for future OAuth2 GCal integration.
--
--   professional_studios:
--     + google_calendar_id  — target calendar to sync events to
--     + sync_gcal           — opt-in flag controlled by studio owner
--
--   studio_appointments:
--     + google_event_id     — GCal event ID after a successful push/pull
--     + is_external_blocker — true when the slot comes from the user's
--                             personal Google Calendar (show as "Non disponibile"
--                             instead of exposing patient details)
--
-- NOTE: OAuth refresh tokens will live in a dedicated, secure table
--       (e.g. `gcal_tokens`) to be added when the OAuth flow is built.
--       Never store refresh tokens in professional_studios.
-- =============================================

-- ── professional_studios ─────────────────────────────────────────────────────
ALTER TABLE public.professional_studios
    ADD COLUMN IF NOT EXISTS google_calendar_id text               NULL,
    ADD COLUMN IF NOT EXISTS sync_gcal          boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.professional_studios.google_calendar_id IS
    'Google Calendar ID (e.g. "primary" or a specific calendar ID) used for GCal sync.';
COMMENT ON COLUMN public.professional_studios.sync_gcal IS
    'Opt-in flag: when true the studio owner has enabled Google Calendar synchronisation.';

-- ── studio_appointments ───────────────────────────────────────────────────────
ALTER TABLE public.studio_appointments
    ADD COLUMN IF NOT EXISTS google_event_id      text    NULL,
    ADD COLUMN IF NOT EXISTS is_external_blocker  boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.studio_appointments.google_event_id IS
    'Google Calendar event ID assigned after a successful GCal push or pull. NULL means not yet synced.';
COMMENT ON COLUMN public.studio_appointments.is_external_blocker IS
    'When true this slot was imported from the professional''s personal Google Calendar.
     It represents a personal commitment and MUST NOT expose patient/client details in any UI.
     Display it as "Non disponibile" to athletes and other clients.';

-- Index: find un-synced appointments quickly when running the sync job
CREATE INDEX IF NOT EXISTS idx_studio_appointments_unsynced
    ON public.studio_appointments (studio_id, start_time)
    WHERE google_event_id IS NULL
      AND deleted_at IS NULL
      AND is_external_blocker = false;
