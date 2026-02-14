-- =============================================
-- POPOLAMENTO INIZIALE sports_organizations
-- =============================================
-- Eseguire questo script manualmente da Supabase SQL Editor
-- Solo per amministratori

-- =============================================
-- CALCIO - SERIE A (Italia)
-- =============================================
INSERT INTO public.sports_organizations (name, country, city, sport) VALUES
('AC Milan', 'Italia', 'Milano', 'Calcio'),
('Inter', 'Italia', 'Milano', 'Calcio'),
('Juventus', 'Italia', 'Torino', 'Calcio'),
('AS Roma', 'Italia', 'Roma', 'Calcio'),
('Lazio', 'Italia', 'Roma', 'Calcio'),
('Napoli', 'Italia', 'Napoli', 'Calcio'),
('Atalanta', 'Italia', 'Bergamo', 'Calcio'),
('Fiorentina', 'Italia', 'Firenze', 'Calcio'),
('Bologna', 'Italia', 'Bologna', 'Calcio'),
('Torino', 'Italia', 'Torino', 'Calcio'),
('Udinese', 'Italia', 'Udine', 'Calcio'),
('Genoa', 'Italia', 'Genova', 'Calcio'),
('Sampdoria', 'Italia', 'Genova', 'Calcio'),
('Hellas Verona', 'Italia', 'Verona', 'Calcio'),
('Sassuolo', 'Italia', 'Sassuolo', 'Calcio'),
('Empoli', 'Italia', 'Empoli', 'Calcio'),
('Cagliari', 'Italia', 'Cagliari', 'Calcio'),
('Lecce', 'Italia', 'Lecce', 'Calcio'),
('Monza', 'Italia', 'Monza', 'Calcio'),
('Frosinone', 'Italia', 'Frosinone', 'Calcio')
ON CONFLICT (name, country, city, sport) DO NOTHING;

-- =============================================
-- CALCIO - SERIE B (Italia) - Esempi
-- =============================================
INSERT INTO public.sports_organizations (name, country, city, sport) VALUES
('Parma', 'Italia', 'Parma', 'Calcio'),
('Como', 'Italia', 'Como', 'Calcio'),
('Venezia', 'Italia', 'Venezia', 'Calcio'),
('Brescia', 'Italia', 'Brescia', 'Calcio'),
('Palermo', 'Italia', 'Palermo', 'Calcio'),
('Cremonese', 'Italia', 'Cremona', 'Calcio'),
('Bari', 'Italia', 'Bari', 'Calcio'),
('Ternana', 'Italia', 'Terni', 'Calcio'),
('Modena', 'Italia', 'Modena', 'Calcio'),
('Reggina', 'Italia', 'Reggio Calabria', 'Calcio')
ON CONFLICT (name, country, city, sport) DO NOTHING;

-- =============================================
-- BASKET - SERIE A (Italia)
-- =============================================
INSERT INTO public.sports_organizations (name, country, city, sport) VALUES
('Olimpia Milano', 'Italia', 'Milano', 'Basket'),
('Virtus Bologna', 'Italia', 'Bologna', 'Basket'),
('Umana Reyer Venezia', 'Italia', 'Venezia', 'Basket'),
('Germani Brescia', 'Italia', 'Brescia', 'Basket'),
('Pallacanestro Varese', 'Italia', 'Varese', 'Basket'),
('Fortitudo Bologna', 'Italia', 'Bologna', 'Basket'),
('Pallacanestro Reggiana', 'Italia', 'Reggio Emilia', 'Basket'),
('Dinamo Sassari', 'Italia', 'Sassari', 'Basket'),
('Derthona Basket', 'Italia', 'Tortona', 'Basket'),
('Openjobmetis Varese', 'Italia', 'Varese', 'Basket')
ON CONFLICT (name, country, city, sport) DO NOTHING;

-- =============================================
-- VOLLEY - SERIE A1 MASCHILE (Italia)
-- =============================================
INSERT INTO public.sports_organizations (name, country, city, sport) VALUES
('Itas Trentino', 'Italia', 'Trento', 'Volley'),
('Sir Safety Perugia', 'Italia', 'Perugia', 'Volley'),
('Cucine Lube Civitanova', 'Italia', 'Civitanova Marche', 'Volley'),
('Allianz Milano', 'Italia', 'Milano', 'Volley'),
('Gas Sales Bluenergy Piacenza', 'Italia', 'Piacenza', 'Volley'),
('Vero Volley Monza', 'Italia', 'Monza', 'Volley'),
('Top Volley Cisterna', 'Italia', 'Cisterna di Latina', 'Volley'),
('Modena Volley', 'Italia', 'Modena', 'Volley'),
('Pallavolo Padova', 'Italia', 'Padova', 'Volley')
ON CONFLICT (name, country, city, sport) DO NOTHING;

-- =============================================
-- VOLLEY - SERIE A1 FEMMINILE (Italia)
-- =============================================
INSERT INTO public.sports_organizations (name, country, city, sport) VALUES
('Imoco Volley Conegliano', 'Italia', 'Conegliano', 'Volley'),
('Vero Volley Milano', 'Italia', 'Milano', 'Volley'),
('Savino Del Bene Scandicci', 'Italia', 'Scandicci', 'Volley'),
('Prosecco DOC Imoco Conegliano', 'Italia', 'Conegliano', 'Volley'),
('Igor Gorgonzola Novara', 'Italia', 'Novara', 'Volley'),
('Reale Mutua Fenera Chieri', 'Italia', 'Chieri', 'Volley'),
('Megabox Ondulati del Savio Vallefoglia', 'Italia', 'Vallefoglia', 'Volley')
ON CONFLICT (name, country, city, sport) DO NOTHING;

-- =============================================
-- CLUB INTERNAZIONALI - TOP CALCIO
-- =============================================
INSERT INTO public.sports_organizations (name, country, city, sport) VALUES
-- Premier League
('Manchester City', 'Inghilterra', 'Manchester', 'Calcio'),
('Liverpool', 'Inghilterra', 'Liverpool', 'Calcio'),
('Arsenal', 'Inghilterra', 'Londra', 'Calcio'),
('Chelsea', 'Inghilterra', 'Londra', 'Calcio'),
('Manchester United', 'Inghilterra', 'Manchester', 'Calcio'),
('Tottenham', 'Inghilterra', 'Londra', 'Calcio'),

-- La Liga
('Real Madrid', 'Spagna', 'Madrid', 'Calcio'),
('FC Barcelona', 'Spagna', 'Barcellona', 'Calcio'),
('Atletico Madrid', 'Spagna', 'Madrid', 'Calcio'),
('Sevilla', 'Spagna', 'Siviglia', 'Calcio'),
('Valencia', 'Spagna', 'Valencia', 'Calcio'),

-- Bundesliga
('Bayern Monaco', 'Germania', 'Monaco', 'Calcio'),
('Borussia Dortmund', 'Germania', 'Dortmund', 'Calcio'),
('RB Leipzig', 'Germania', 'Lipsia', 'Calcio'),
('Bayer Leverkusen', 'Germania', 'Leverkusen', 'Calcio'),

-- Ligue 1
('Paris Saint-Germain', 'Francia', 'Parigi', 'Calcio'),
('Olympique Marseille', 'Francia', 'Marsiglia', 'Calcio'),
('Olympique Lione', 'Francia', 'Lione', 'Calcio'),
('Monaco', 'Francia', 'Monaco', 'Calcio')
ON CONFLICT (name, country, city, sport) DO NOTHING;

-- =============================================
-- VERIFICA INSERIMENTI
-- =============================================
SELECT 
    sport,
    country,
    COUNT(*) as total_organizations
FROM public.sports_organizations
WHERE deleted_at IS NULL
GROUP BY sport, country
ORDER BY sport, country;

-- Query per contare il totale
SELECT COUNT(*) as total_organizations 
FROM public.sports_organizations 
WHERE deleted_at IS NULL;
