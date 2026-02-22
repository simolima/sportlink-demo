-- Migration: sostituisce la colonna `sport text` con `sport_id bigint` FK → lookup_sports
-- in public.sports_organizations

-- 1. Aggiungi la nuova colonna (nullable per ora, la popoliamo prima di mettere NOT NULL)
ALTER TABLE public.sports_organizations
  ADD COLUMN IF NOT EXISTS sport_id bigint REFERENCES public.lookup_sports(id) ON DELETE RESTRICT;

-- 2. Popola sport_id dai valori esistenti nella colonna sport (case-insensitive match)
UPDATE public.sports_organizations so
SET sport_id = ls.id
FROM public.lookup_sports ls
WHERE lower(ls.name) = lower(so.sport);

-- 3. Se ci sono righe con sport non mappabile, le mettiamo a NULL
--    (puoi decidere se eliminarle o tenerle)
-- SELECT id, name, sport FROM public.sports_organizations WHERE sport_id IS NULL;

-- 4. Rendi sport_id NOT NULL
ALTER TABLE public.sports_organizations
  ALTER COLUMN sport_id SET NOT NULL;

-- 5. Rimuovi la vecchia colonna sport
ALTER TABLE public.sports_organizations
  DROP COLUMN sport;

-- 6. Ricrea il constraint unique senza sport, con sport_id
ALTER TABLE public.sports_organizations
  DROP CONSTRAINT IF EXISTS unique_org;

ALTER TABLE public.sports_organizations
  ADD CONSTRAINT unique_org UNIQUE (name, country, city, sport_id);

-- 7. Aggiorna indice country+sport
DROP INDEX IF EXISTS idx_sports_orgs_country_sport;
CREATE INDEX idx_sports_orgs_country_sport
  ON public.sports_organizations (country, sport_id)
  WHERE deleted_at IS NULL;
