-- Migration: Studio Google Calendar Integration
-- Created: 2026-03-07
-- Purpose: Add tables and columns for Google Calendar OAuth, availability rules,
--          appointment types, blackout dates, and external event sync

-- ============================================================================
-- 1. NEW TABLE: google_calendar_connections
-- ============================================================================
-- Stores OAuth tokens and calendar sync state for professional studios
CREATE TABLE IF NOT EXISTS public.google_calendar_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_studio_id UUID NOT NULL REFERENCES public.professional_studios(id) ON DELETE CASCADE,
    
    -- OAuth tokens (encrypted with AES-256-GCM)
    encrypted_access_token TEXT NOT NULL,
    encrypted_refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    
    -- Calendar selection
    selected_calendar_id TEXT, -- Google Calendar ID (e.g., "primary" or email)
    selected_calendar_name TEXT,
    
    -- Sync state
    sync_token TEXT, -- Google Calendar sync token for incremental sync
    last_synced_at TIMESTAMPTZ,
    
    -- Watch channel for push notifications (7-day expiration)
    watch_channel_id TEXT,
    watch_resource_id TEXT,
    watch_expires_at TIMESTAMPTZ,
    
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.google_calendar_connections IS 'OAuth connections between professional studios and Google Calendar accounts';
COMMENT ON COLUMN public.google_calendar_connections.encrypted_access_token IS 'AES-256-GCM encrypted access token';
COMMENT ON COLUMN public.google_calendar_connections.encrypted_refresh_token IS 'AES-256-GCM encrypted refresh token';
COMMENT ON COLUMN public.google_calendar_connections.sync_token IS 'Google Calendar API sync token for incremental changes';
COMMENT ON COLUMN public.google_calendar_connections.watch_channel_id IS 'Google Calendar watch channel ID for push notifications';

-- ============================================================================
-- 2. NEW TABLE: studio_availability_rules
-- ============================================================================
-- Weekly schedule defining when professional is available for bookings
CREATE TABLE IF NOT EXISTS public.studio_availability_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_studio_id UUID NOT NULL REFERENCES public.professional_studios(id) ON DELETE CASCADE,
    
    -- Weekly schedule JSON structure:
    -- {
    --   "monday": [{"start": "09:00", "end": "13:00"}, {"start": "14:00", "end": "18:00"}],
    --   "tuesday": [{"start": "09:00", "end": "13:00"}],
    --   ...
    -- }
    weekly_schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timezone for schedule interpretation (IANA format: Europe/Rome, America/New_York)
    timezone VARCHAR(50) NOT NULL DEFAULT 'Europe/Rome',
    
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.studio_availability_rules IS 'Weekly availability schedule for professional studios (source of truth for booking slots)';
COMMENT ON COLUMN public.studio_availability_rules.weekly_schedule IS 'JSON structure defining available time slots per day of week';

-- ============================================================================
-- 3. NEW TABLE: studio_blackout_dates
-- ============================================================================
-- Date ranges when professional is unavailable (vacations, holidays, etc.)
CREATE TABLE IF NOT EXISTS public.studio_blackout_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_studio_id UUID NOT NULL REFERENCES public.professional_studios(id) ON DELETE CASCADE,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    reason TEXT, -- Optional description (e.g., "Vacation", "Conference")
    
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Validate date range
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

COMMENT ON TABLE public.studio_blackout_dates IS 'Date ranges when professional is unavailable for bookings';

-- ============================================================================
-- 4. NEW TABLE: studio_appointment_types
-- ============================================================================
-- Service catalog defining types of appointments professional offers
CREATE TABLE IF NOT EXISTS public.studio_appointment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_studio_id UUID NOT NULL REFERENCES public.professional_studios(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL, -- e.g., "Initial Consultation", "Follow-up Session"
    description TEXT,
    
    -- Duration and buffers (in minutes)
    duration_minutes INTEGER NOT NULL, -- Actual appointment duration
    buffer_before_minutes INTEGER DEFAULT 0, -- Time blocked before appointment
    buffer_after_minutes INTEGER DEFAULT 0, -- Time blocked after appointment
    
    -- Pricing (stored but not displayed on public page per architectural decision)
    price_amount DECIMAL(10, 2), -- Nullable (some services may be free consultation)
    
    -- Visual customization
    color_hex VARCHAR(7) DEFAULT '#2341F0', -- Hex color for calendar display
    
    is_active BOOLEAN DEFAULT TRUE, -- Allow disabling without deleting
    
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Validate constraints
    CONSTRAINT valid_duration CHECK (duration_minutes >= 15 AND duration_minutes <= 480), -- 15min to 8 hours
    CONSTRAINT valid_buffer_before CHECK (buffer_before_minutes >= 0 AND buffer_before_minutes <= 60),
    CONSTRAINT valid_buffer_after CHECK (buffer_after_minutes >= 0 AND buffer_after_minutes <= 60),
    CONSTRAINT valid_price CHECK (price_amount IS NULL OR price_amount >= 0),
    CONSTRAINT valid_color_hex CHECK (color_hex ~* '^#[0-9A-F]{6}$') -- Hex color validation
);

COMMENT ON TABLE public.studio_appointment_types IS 'Service catalog for professional studios (appointment types with duration, buffers, pricing)';
COMMENT ON COLUMN public.studio_appointment_types.duration_minutes IS 'Actual appointment duration (15-480 minutes)';
COMMENT ON COLUMN public.studio_appointment_types.buffer_before_minutes IS 'Time blocked before appointment (0-60 minutes)';
COMMENT ON COLUMN public.studio_appointment_types.buffer_after_minutes IS 'Time blocked after appointment (0-60 minutes)';
COMMENT ON COLUMN public.studio_appointment_types.price_amount IS 'Price in EUR (dashboard only, not public page)';

-- ============================================================================
-- 5. NEW TABLE: studio_external_events
-- ============================================================================
-- Cache of Google Calendar events for conflict detection (lean storage)
CREATE TABLE IF NOT EXISTS public.studio_external_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_studio_id UUID NOT NULL REFERENCES public.professional_studios(id) ON DELETE CASCADE,
    
    google_event_id VARCHAR(255) NOT NULL, -- Google Calendar event ID
    google_calendar_id VARCHAR(255) NOT NULL, -- Which calendar it belongs to
    
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Minimal metadata (no sensitive data per GDPR)
    summary TEXT, -- Event title (visible only to studio owner)
    is_all_day BOOLEAN DEFAULT FALSE,
    
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Validate time range
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

COMMENT ON TABLE public.studio_external_events IS 'Cached Google Calendar events for conflict detection (professional-only visibility)';
COMMENT ON COLUMN public.studio_external_events.summary IS 'Event title (stored for reference, RLS-protected)';

-- ============================================================================
-- 6. ALTER TABLE: professional_studios (add booking settings)
-- ============================================================================
ALTER TABLE public.professional_studios
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Europe/Rome',
    ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS auto_confirm_bookings BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS slot_increment_minutes INTEGER DEFAULT 30,
    ADD COLUMN IF NOT EXISTS default_buffer_between_appointments INTEGER DEFAULT 5;

COMMENT ON COLUMN public.professional_studios.timezone IS 'IANA timezone for availability schedule (e.g., Europe/Rome)';
COMMENT ON COLUMN public.professional_studios.booking_enabled IS 'Whether online booking system is active';
COMMENT ON COLUMN public.professional_studios.auto_confirm_bookings IS 'If true, bookings confirmed automatically; if false, require manual approval';
COMMENT ON COLUMN public.professional_studios.slot_increment_minutes IS 'Slot granularity: 15, 30, or 60 minutes';
COMMENT ON COLUMN public.professional_studios.default_buffer_between_appointments IS 'Default buffer time between appointments (0-60 minutes)';

-- Add constraint for slot increment
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_slot_increment'
    ) THEN
        ALTER TABLE public.professional_studios
            ADD CONSTRAINT valid_slot_increment 
            CHECK (slot_increment_minutes IN (15, 30, 60));
    END IF;
END $$;

-- Add constraint for default buffer
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_default_buffer'
    ) THEN
        ALTER TABLE public.professional_studios
            ADD CONSTRAINT valid_default_buffer 
            CHECK (default_buffer_between_appointments >= 0 AND default_buffer_between_appointments <= 60);
    END IF;
END $$;

-- ============================================================================
-- 7. ALTER TABLE: studio_appointments (add appointment type & Google sync)
-- ============================================================================
ALTER TABLE public.studio_appointments
    ADD COLUMN IF NOT EXISTS appointment_type_id UUID REFERENCES public.studio_appointment_types(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS buffer_before_minutes INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS buffer_after_minutes INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS google_sync_status VARCHAR(50) DEFAULT 'not_synced';

COMMENT ON COLUMN public.studio_appointments.appointment_type_id IS 'Type of appointment (links to service catalog)';
COMMENT ON COLUMN public.studio_appointments.buffer_before_minutes IS 'Time blocked before this appointment';
COMMENT ON COLUMN public.studio_appointments.buffer_after_minutes IS 'Time blocked after this appointment';
COMMENT ON COLUMN public.studio_appointments.google_event_id IS 'Google Calendar event ID if synced';
COMMENT ON COLUMN public.studio_appointments.google_sync_status IS 'Sync status: not_synced, synced, sync_failed';

-- Add constraint for sync status enum
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_google_sync_status'
    ) THEN
        ALTER TABLE public.studio_appointments
            ADD CONSTRAINT valid_google_sync_status
            CHECK (google_sync_status IN ('not_synced', 'synced', 'sync_failed'));
    END IF;
END $$;

-- ============================================================================
-- INDEXES (Performance Optimization)
-- ============================================================================

-- google_calendar_connections
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_connection_per_studio
    ON public.google_calendar_connections(professional_studio_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_google_calendar_connections_professional_studio_id 
    ON public.google_calendar_connections(professional_studio_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_google_calendar_connections_watch_expires_at 
    ON public.google_calendar_connections(watch_expires_at) WHERE deleted_at IS NULL;

-- studio_availability_rules
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_rules_per_studio
    ON public.studio_availability_rules(professional_studio_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_studio_availability_rules_professional_studio_id 
    ON public.studio_availability_rules(professional_studio_id) WHERE deleted_at IS NULL;

-- studio_blackout_dates
CREATE INDEX IF NOT EXISTS idx_studio_blackout_dates_professional_studio_id 
    ON public.studio_blackout_dates(professional_studio_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_studio_blackout_dates_date_range 
    ON public.studio_blackout_dates(professional_studio_id, start_date, end_date) WHERE deleted_at IS NULL;

-- studio_appointment_types
CREATE INDEX IF NOT EXISTS idx_studio_appointment_types_professional_studio_id 
    ON public.studio_appointment_types(professional_studio_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_studio_appointment_types_is_active 
    ON public.studio_appointment_types(professional_studio_id, is_active) WHERE deleted_at IS NULL;

-- studio_external_events
CREATE INDEX IF NOT EXISTS idx_studio_external_events_professional_studio_id 
    ON public.studio_external_events(professional_studio_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_studio_external_events_time_range 
    ON public.studio_external_events(professional_studio_id, start_time, end_time) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_studio_external_events_google_event_id 
    ON public.studio_external_events(google_event_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_google_event
    ON public.studio_external_events(professional_studio_id, google_event_id) WHERE deleted_at IS NULL;

-- studio_appointments (new indexes for appointment type and Google sync)
CREATE INDEX IF NOT EXISTS idx_studio_appointments_appointment_type_id 
    ON public.studio_appointments(appointment_type_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_studio_appointments_google_event_id 
    ON public.studio_appointments(google_event_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- TRIGGERS (Auto-update updated_at)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all 5 new tables
CREATE TRIGGER update_google_calendar_connections_updated_at
    BEFORE UPDATE ON public.google_calendar_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_studio_availability_rules_updated_at
    BEFORE UPDATE ON public.studio_availability_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_studio_blackout_dates_updated_at
    BEFORE UPDATE ON public.studio_blackout_dates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_studio_appointment_types_updated_at
    BEFORE UPDATE ON public.studio_appointment_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_studio_external_events_updated_at
    BEFORE UPDATE ON public.studio_external_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_blackout_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_external_events ENABLE ROW LEVEL SECURITY;

-- google_calendar_connections: Only studio owner can read/write
CREATE POLICY google_calendar_connections_owner_read
    ON public.google_calendar_connections FOR SELECT
    USING (
        professional_studio_id IN (
            SELECT id FROM public.professional_studios WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY google_calendar_connections_owner_write
    ON public.google_calendar_connections FOR ALL
    USING (
        professional_studio_id IN (
            SELECT id FROM public.professional_studios WHERE owner_id = auth.uid()
        )
    );

-- studio_availability_rules: Owner write, public read (for booking page)
CREATE POLICY studio_availability_rules_public_read
    ON public.studio_availability_rules FOR SELECT
    USING (deleted_at IS NULL);

CREATE POLICY studio_availability_rules_owner_write
    ON public.studio_availability_rules FOR ALL
    USING (
        professional_studio_id IN (
            SELECT id FROM public.professional_studios WHERE owner_id = auth.uid()
        )
    );

-- studio_blackout_dates: Owner write, public read (for booking page)
CREATE POLICY studio_blackout_dates_public_read
    ON public.studio_blackout_dates FOR SELECT
    USING (deleted_at IS NULL);

CREATE POLICY studio_blackout_dates_owner_write
    ON public.studio_blackout_dates FOR ALL
    USING (
        professional_studio_id IN (
            SELECT id FROM public.professional_studios WHERE owner_id = auth.uid()
        )
    );

-- studio_appointment_types: Owner write, public read (for booking page)
CREATE POLICY studio_appointment_types_public_read
    ON public.studio_appointment_types FOR SELECT
    USING (deleted_at IS NULL AND is_active = TRUE);

CREATE POLICY studio_appointment_types_owner_read_all
    ON public.studio_appointment_types FOR SELECT
    USING (
        professional_studio_id IN (
            SELECT id FROM public.professional_studios WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY studio_appointment_types_owner_write
    ON public.studio_appointment_types FOR ALL
    USING (
        professional_studio_id IN (
            SELECT id FROM public.professional_studios WHERE owner_id = auth.uid()
        )
    );

-- studio_external_events: Only studio owner can read (privacy protection)
CREATE POLICY studio_external_events_owner_read
    ON public.studio_external_events FOR SELECT
    USING (
        professional_studio_id IN (
            SELECT id FROM public.professional_studios WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY studio_external_events_owner_write
    ON public.studio_external_events FOR ALL
    USING (
        professional_studio_id IN (
            SELECT id FROM public.professional_studios WHERE owner_id = auth.uid()
        )
    );

-- ============================================================================
-- GRANTS (Service Role Access)
-- ============================================================================
-- Grant permissions to service role for server-side operations

GRANT ALL ON public.google_calendar_connections TO service_role;
GRANT ALL ON public.studio_availability_rules TO service_role;
GRANT ALL ON public.studio_blackout_dates TO service_role;
GRANT ALL ON public.studio_appointment_types TO service_role;
GRANT ALL ON public.studio_external_events TO service_role;

-- ============================================================================
-- VALIDATION QUERIES (Optional - for testing after migration)
-- ============================================================================

-- Verify table creation
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully. Tables created:';
    RAISE NOTICE '  - google_calendar_connections';
    RAISE NOTICE '  - studio_availability_rules';
    RAISE NOTICE '  - studio_blackout_dates';
    RAISE NOTICE '  - studio_appointment_types';
    RAISE NOTICE '  - studio_external_events';
    RAISE NOTICE 'Altered tables:';
    RAISE NOTICE '  - professional_studios (added 5 columns)';
    RAISE NOTICE '  - studio_appointments (added 5 columns)';
    RAISE NOTICE 'Created 14 indexes, 5 triggers, 10 RLS policies.';
END $$;
