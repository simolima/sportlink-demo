-- =============================================
-- MIGRATION: Studio public content tables
-- Date: 2026-03-07
-- Purpose:
--   Add normalized tables to replace mock content in public studio pages:
--   1) studio_reviews
--   2) studio_specializations
--   3) studio_faqs
-- =============================================

-- =============================================
-- 1. studio_reviews
-- =============================================
CREATE TABLE IF NOT EXISTS public.studio_reviews (
    id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id           uuid NOT NULL REFERENCES public.professional_studios(id) ON DELETE CASCADE,
    reviewer_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    rating              smallint NOT NULL,
    title               text,
    comment             text NOT NULL,
    is_verified         boolean NOT NULL DEFAULT false,
    is_published        boolean NOT NULL DEFAULT true,

    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz,

    CONSTRAINT chk_studio_reviews_rating_range CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT chk_studio_reviews_comment_not_empty CHECK (char_length(trim(comment)) > 0),
    CONSTRAINT chk_studio_reviews_title_not_empty CHECK (title IS NULL OR char_length(trim(title)) > 0)
);

-- One active review per user per studio
CREATE UNIQUE INDEX IF NOT EXISTS idx_studio_reviews_unique_active_reviewer
    ON public.studio_reviews (studio_id, reviewer_profile_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_studio_reviews_studio_active
    ON public.studio_reviews (studio_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_studio_reviews_published
    ON public.studio_reviews (studio_id, is_published)
    WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_studio_reviews_updated_at ON public.studio_reviews;
CREATE TRIGGER trg_studio_reviews_updated_at
    BEFORE UPDATE ON public.studio_reviews
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================
-- 2. studio_specializations
-- =============================================
CREATE TABLE IF NOT EXISTS public.studio_specializations (
    id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id      uuid NOT NULL REFERENCES public.professional_studios(id) ON DELETE CASCADE,

    name           text NOT NULL,
    description    text,
    icon           text,
    display_order  integer NOT NULL DEFAULT 0,

    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    deleted_at     timestamptz,

    CONSTRAINT chk_studio_specializations_name_not_empty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT chk_studio_specializations_display_order_non_negative CHECK (display_order >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_studio_specializations_unique_name_active
    ON public.studio_specializations (studio_id, lower(name))
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_studio_specializations_studio_order_active
    ON public.studio_specializations (studio_id, display_order, created_at)
    WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_studio_specializations_updated_at ON public.studio_specializations;
CREATE TRIGGER trg_studio_specializations_updated_at
    BEFORE UPDATE ON public.studio_specializations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================
-- 3. studio_faqs
-- =============================================
CREATE TABLE IF NOT EXISTS public.studio_faqs (
    id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    studio_id      uuid NOT NULL REFERENCES public.professional_studios(id) ON DELETE CASCADE,

    question       text NOT NULL,
    answer         text NOT NULL,
    display_order  integer NOT NULL DEFAULT 0,

    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    deleted_at     timestamptz,

    CONSTRAINT chk_studio_faqs_question_not_empty CHECK (char_length(trim(question)) > 0),
    CONSTRAINT chk_studio_faqs_answer_not_empty CHECK (char_length(trim(answer)) > 0),
    CONSTRAINT chk_studio_faqs_display_order_non_negative CHECK (display_order >= 0)
);

CREATE INDEX IF NOT EXISTS idx_studio_faqs_studio_order_active
    ON public.studio_faqs (studio_id, display_order, created_at)
    WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_studio_faqs_updated_at ON public.studio_faqs;
CREATE TRIGGER trg_studio_faqs_updated_at
    BEFORE UPDATE ON public.studio_faqs
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================
-- 4. RLS ENABLE
-- =============================================
ALTER TABLE public.studio_reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_faqs            ENABLE ROW LEVEL SECURITY;


-- =============================================
-- 5. RLS POLICIES: studio_reviews
-- =============================================
-- READ: authenticated users can read active published reviews of active studios.
CREATE POLICY "studio_reviews_select_public" ON public.studio_reviews
    FOR SELECT USING (
        deleted_at IS NULL
        AND is_published = true
        AND auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.professional_studios ps
            WHERE ps.id = studio_id
              AND ps.deleted_at IS NULL
        )
    );

-- INSERT: only authenticated user writes own review, only if active client for that studio.
CREATE POLICY "studio_reviews_insert_client" ON public.studio_reviews
    FOR INSERT WITH CHECK (
        auth.uid() = reviewer_profile_id
        AND EXISTS (
            SELECT 1
            FROM public.studio_clients sc
            WHERE sc.studio_id = studio_id
              AND sc.client_profile_id = auth.uid()
              AND sc.deleted_at IS NULL
              AND sc.status = 'active'
        )
    );

-- UPDATE: reviewer can edit own review; studio owner can moderate publication.
CREATE POLICY "studio_reviews_update_reviewer_or_owner" ON public.studio_reviews
    FOR UPDATE USING (
        reviewer_profile_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.professional_studios ps
            WHERE ps.id = studio_id
              AND ps.owner_id = auth.uid()
              AND ps.deleted_at IS NULL
        )
    );

-- DELETE: reviewer soft-deletes own review, or owner moderates/removes.
CREATE POLICY "studio_reviews_delete_reviewer_or_owner" ON public.studio_reviews
    FOR DELETE USING (
        reviewer_profile_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.professional_studios ps
            WHERE ps.id = studio_id
              AND ps.owner_id = auth.uid()
              AND ps.deleted_at IS NULL
        )
    );


-- =============================================
-- 6. RLS POLICIES: studio_specializations
-- =============================================
-- READ: authenticated users can read active specializations for active studios.
CREATE POLICY "studio_specializations_select_public" ON public.studio_specializations
    FOR SELECT USING (
        deleted_at IS NULL
        AND auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.professional_studios ps
            WHERE ps.id = studio_id
              AND ps.deleted_at IS NULL
        )
    );

-- WRITE: only studio owner manages specializations.
CREATE POLICY "studio_specializations_insert_owner" ON public.studio_specializations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.professional_studios ps
            WHERE ps.id = studio_id
              AND ps.owner_id = auth.uid()
              AND ps.deleted_at IS NULL
        )
    );

CREATE POLICY "studio_specializations_update_owner" ON public.studio_specializations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.professional_studios ps
            WHERE ps.id = studio_id
              AND ps.owner_id = auth.uid()
              AND ps.deleted_at IS NULL
        )
    );

CREATE POLICY "studio_specializations_delete_owner" ON public.studio_specializations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.professional_studios ps
            WHERE ps.id = studio_id
              AND ps.owner_id = auth.uid()
              AND ps.deleted_at IS NULL
        )
    );


-- =============================================
-- 7. RLS POLICIES: studio_faqs
-- =============================================
-- READ: authenticated users can read active FAQs for active studios.
CREATE POLICY "studio_faqs_select_public" ON public.studio_faqs
    FOR SELECT USING (
        deleted_at IS NULL
        AND auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.professional_studios ps
            WHERE ps.id = studio_id
              AND ps.deleted_at IS NULL
        )
    );

-- WRITE: only studio owner manages FAQ.
CREATE POLICY "studio_faqs_insert_owner" ON public.studio_faqs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.professional_studios ps
            WHERE ps.id = studio_id
              AND ps.owner_id = auth.uid()
              AND ps.deleted_at IS NULL
        )
    );

CREATE POLICY "studio_faqs_update_owner" ON public.studio_faqs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.professional_studios ps
            WHERE ps.id = studio_id
              AND ps.owner_id = auth.uid()
              AND ps.deleted_at IS NULL
        )
    );

CREATE POLICY "studio_faqs_delete_owner" ON public.studio_faqs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.professional_studios ps
            WHERE ps.id = studio_id
              AND ps.owner_id = auth.uid()
              AND ps.deleted_at IS NULL
        )
    );

-- =============================================
-- END OF MIGRATION
-- =============================================
