-- Migration: Add missing fields to career_experiences table
-- Date: 2026-02-21
-- Purpose: Add category_tier and summary columns missing from career_experiences

-- ============================================================
-- 1. Macro-categoria (category_tier)
-- ============================================================
-- Rappresenta il livello della categoria (es: "Professionisti", "Dilettanti", "Giovanili")
-- mentre 'category' contiene il dettaglio (es: "Serie A", "Eccellenza", "Primavera 1")

ALTER TABLE public.career_experiences
ADD COLUMN IF NOT EXISTS category_tier TEXT;

COMMENT ON COLUMN public.career_experiences.category_tier IS 'Macro-categoria/livello: Professionisti, Semi-Professionisti, Dilettanti, Giovanili';

-- ============================================================
-- Index per ricerca per macro-categoria
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_career_experiences_category_tier
ON public.career_experiences(category_tier)
WHERE deleted_at IS NULL AND category_tier IS NOT NULL;
