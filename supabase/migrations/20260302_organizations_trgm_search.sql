-- Migration: ricerca fuzzy su sports_organizations tramite pg_trgm
-- Evita duplicati e migliora la qualità del matching nel banner di creazione club

-- 1. Abilita l'estensione (già disponibile su Supabase, idempotente)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Indice GIN per ricerche veloci per similarità
CREATE INDEX IF NOT EXISTS idx_sports_orgs_name_trgm
    ON public.sports_organizations
    USING GIN (name gin_trgm_ops);

-- 3. Funzione RPC: cerca organizzazioni simili per nome
--    Restituisce le righe con similarity > threshold, ordinate per punteggio
--    threshold default 0.25 (25% di trigrammi in comune) — abbastanza permissivo
--    per mostrare suggerimenti, ma filtra i casi chiaramente diversi
CREATE OR REPLACE FUNCTION public.search_organizations_similar(
    search_name  text,
    threshold    float8 DEFAULT 0.25,
    max_results  int    DEFAULT 10
)
RETURNS TABLE (
    id         uuid,
    name       text,
    country    text,
    city       text,
    sport_id   bigint,
    similarity float4
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT
        so.id,
        so.name,
        so.country,
        so.city,
        so.sport_id,
        similarity(so.name, search_name) AS similarity
    FROM public.sports_organizations so
    WHERE
        so.deleted_at IS NULL
        AND similarity(so.name, search_name) >= threshold
    ORDER BY similarity DESC
    LIMIT max_results;
$$;

-- Permette la chiamata anche agli utenti anonimi (solo lettura)
GRANT EXECUTE ON FUNCTION public.search_organizations_similar TO anon, authenticated;
