-- Migration: aggiunge 'Multi-sport' a lookup_sports
-- Permette ai professionisti (non player/coach) di configurarsi come attivi su più discipline sportive.
-- Non sono presenti posizioni (lookup_positions) per questo sport virtuale: by design.

INSERT INTO public.lookup_sports (name)
VALUES ('Multi-sport')
ON CONFLICT (name) DO NOTHING;
