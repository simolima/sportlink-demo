-- Migration: notification_preferences table
-- Date: 2026-03-08
-- Stores per-user notification preference toggles, keyed by category.
-- Replaces the in-memory DEFAULT_PREFERENCES MVP approach.

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id     UUID        PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferences JSONB       NOT NULL DEFAULT '{
        "follower":     true,
        "messages":     true,
        "applications": true,
        "affiliations": true,
        "club":         true,
        "opportunities":true,
        "permissions":  true,
        "profile":      true
    }',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast JSONB lookups (optional, the table PK is already a point lookup)
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id
    ON public.notification_preferences (user_id);

-- RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notification preferences"
    ON public.notification_preferences
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notification preferences"
    ON public.notification_preferences
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notification preferences"
    ON public.notification_preferences
    FOR UPDATE
    USING (user_id = auth.uid());

-- Allow service role full access (used by server-side preference checks)
CREATE POLICY "Service role can read all notification preferences"
    ON public.notification_preferences
    FOR SELECT
    USING (auth.role() = 'service_role');
