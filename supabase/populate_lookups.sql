-- =============================================
-- POPULATE LOOKUP TABLES
-- =============================================
-- Esegui questo script per popolare le tabelle di lookup
-- necessarie per il funzionamento dell'app
-- =============================================

-- OPZIONALE: Pulisci e resetta sequence (solo per database vuoto!)
-- ATTENZIONE: Questo elimina TUTTI i dati esistenti!
-- Decommenta solo se vuoi ripartire da zero
/*
TRUNCATE TABLE lookup_levels CASCADE;
TRUNCATE TABLE lookup_sports CASCADE;
TRUNCATE TABLE lookup_roles CASCADE;

ALTER SEQUENCE lookup_sports_id_seq RESTART WITH 1;
ALTER SEQUENCE lookup_levels_id_seq RESTART WITH 1;
*/

-- Reset lookup_positions per far ripartire gli ID da 1
TRUNCATE TABLE lookup_positions CASCADE;
ALTER SEQUENCE lookup_positions_id_seq RESTART WITH 1;

/*

-- 1. LOOKUP_ROLES (7 ruoli professionali)
INSERT INTO public.lookup_roles (id, name, description) VALUES
('player', 'Player', 'Atleta professionista o dilettante'),
('coach', 'Coach', 'Allenatore o tecnico sportivo'),
('agent', 'Agent', 'Procuratore sportivo'),
('sporting_director', 'Sporting Director', 'Direttore sportivo'),
('athletic_trainer', 'Athletic Trainer', 'Preparatore atletico'),
('nutritionist', 'Nutritionist', 'Nutrizionista sportivo'),
('physio', 'Physio/Masseur', 'Fisioterapista o massaggiatore'),
('talent_scout', 'Talent Scout', 'Osservatore e scopritore di talenti')
ON CONFLICT (id) DO NOTHING;

-- 2. LOOKUP_SPORTS (3 sport iniziali)
INSERT INTO public.lookup_sports (name, description) VALUES
('Calcio', 'Football/Soccer'),
('Basket', 'Basketball'),
('Pallavolo', 'Volleyball')
ON CONFLICT (name) DO NOTHING;

*/

-- 3. LOOKUP_LEVELS (Livelli competitivi per Player/Coach)
-- Questi livelli servono per filtrare atleti/allenatori per esperienza
-- NON si applicano ad Agent, Sporting Director, Nutritionist, Physio, ecc.
INSERT INTO public.lookup_levels (name, rank_order) VALUES
('Professionista', 1),         -- Serie A, NBA, Champions League
('Semi-Professionista', 2),   -- Serie C, Minor League
('Dilettante', 3),            -- Campionati regionali
('Amatoriale', 4);            -- Tornei locali/amatoriali

-- 4. LOOKUP_POSITIONS (Ruoli sportivi)
-- NOTA: Queste posizioni si applicano SOLO a Player e Coach
-- Altri ruoli (Agent, Nutritionist, ecc.) NON hanno posizioni
-- Calcio
INSERT INTO public.lookup_positions (name, sport_id, role_id, category) VALUES
-- Portieri
('Portiere', (SELECT id FROM lookup_sports WHERE name = 'Calcio'), 'player', 'Portiere'),

-- Difensori
('Terzino Destro', (SELECT id FROM lookup_sports WHERE name = 'Calcio'), 'player', 'Difensore'),
('Terzino Sinistro', (SELECT id FROM lookup_sports WHERE name = 'Calcio'), 'player', 'Difensore'),
('Centrale', (SELECT id FROM lookup_sports WHERE name = 'Calcio'), 'player', 'Difensore'),
('Difensore', (SELECT id FROM lookup_sports WHERE name = 'Calcio'), 'player', 'Difensore'),

-- Centrocampisti
('Mediano', (SELECT id FROM lookup_sports WHERE name = 'Calcio'), 'player', 'Centrocampista'),
('Mezzala', (SELECT id FROM lookup_sports WHERE name = 'Calcio'), 'player', 'Centrocampista'),
('Trequartista', (SELECT id FROM lookup_sports WHERE name = 'Calcio'), 'player', 'Centrocampista'),
('Centrocampista', (SELECT id FROM lookup_sports WHERE name = 'Calcio'), 'player', 'Centrocampista'),

-- Attaccanti
('Ala Destra', (SELECT id FROM lookup_sports WHERE name = 'Calcio'), 'player', 'Attaccante'),
('Ala Sinistra', (SELECT id FROM lookup_sports WHERE name = 'Calcio'), 'player', 'Attaccante'),
('Prima Punta', (SELECT id FROM lookup_sports WHERE name = 'Calcio'), 'player', 'Attaccante'),
('Seconda Punta', (SELECT id FROM lookup_sports WHERE name = 'Calcio'), 'player', 'Attaccante'),
('Attaccante', (SELECT id FROM lookup_sports WHERE name = 'Calcio'), 'player', 'Attaccante');

-- Basket
INSERT INTO public.lookup_positions (name, sport_id, role_id, category) VALUES
('Playmaker', (SELECT id FROM lookup_sports WHERE name = 'Basket'), 'player', 'Guardia'),
('Guardia', (SELECT id FROM lookup_sports WHERE name = 'Basket'), 'player', 'Guardia'),
('Ala Piccola', (SELECT id FROM lookup_sports WHERE name = 'Basket'), 'player', 'Ala'),
('Ala Grande', (SELECT id FROM lookup_sports WHERE name = 'Basket'), 'player', 'Ala'),
('Centro', (SELECT id FROM lookup_sports WHERE name = 'Basket'), 'player', 'Centro');

-- Pallavolo (cambiato in 'Volley' per matchare lo schema)
INSERT INTO public.lookup_positions (name, sport_id, role_id, category) VALUES
('Palleggiatore', (SELECT id FROM lookup_sports WHERE name = 'Volley'), 'player', 'Regista'),
('Opposto', (SELECT id FROM lookup_sports WHERE name = 'Volley'), 'player', 'Attaccante'),
('Schiacciatore', (SELECT id FROM lookup_sports WHERE name = 'Volley'), 'player', 'Attaccante'),
('Centrale', (SELECT id FROM lookup_sports WHERE name = 'Volley'), 'player', 'Centrale'),
('Libero', (SELECT id FROM lookup_sports WHERE name = 'Volley'), 'player', 'Difensore');

-- Verifica inserimenti
SELECT 'lookup_roles' as table_name, count(*) as total FROM lookup_roles
UNION ALL
SELECT 'lookup_sports', count(*) FROM lookup_sports
UNION ALL
SELECT 'lookup_levels', count(*) FROM lookup_levels
UNION ALL
SELECT 'lookup_positions', count(*) FROM lookup_positions;
