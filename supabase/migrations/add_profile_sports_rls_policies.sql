-- =============================================
-- ADD RLS POLICIES FOR profile_sports & profile_secondary_positions
-- =============================================
-- CONTEXT: Questo script aggiunge le policy RLS mancanti per le tabelle
--          profile_sports e profile_secondary_positions.
--
-- PROBLEMA: Nel file schema_definitivo.sql è presente:
--           `alter table public.profile_sports enable row level security;`
--           ma NON sono definite le policy → RLS blocca tutte le operazioni DML
--           degli utenti (INSERT/UPDATE/DELETE) con errore 42501.
--
-- SOLUZIONE: Questo script crea le policy permissive per consentire agli utenti
--            autenticati di gestire i propri sport e posizioni secondarie.
--
-- QUANDO USARE: 
--   - Se il database è già stato creato con schema_definitivo.sql (ambiente attuale)
--   - Esegui questo script nel Supabase SQL Editor per sbloccare le operazioni
--
-- NOTA: Le policy sono già state aggiunte a schema_definitivo.sql (dopo questa fix)
--       quindi NON serve eseguire questo script in nuovi environment creati da zero.
--
-- Data: 27 gennaio 2026
-- =============================================

-- Drop existing policies if any (idempotent)
drop policy if exists "Profile sports viewable by everyone" on public.profile_sports;
drop policy if exists "Users can insert own profile sports" on public.profile_sports;
drop policy if exists "Users can update own profile sports" on public.profile_sports;
drop policy if exists "Users can delete own profile sports" on public.profile_sports;
drop policy if exists "Profile secondary positions viewable by everyone" on public.profile_secondary_positions;
drop policy if exists "Users can manage own profile secondary positions" on public.profile_secondary_positions;

-- =============================================
-- PROFILE_SPORTS POLICIES
-- =============================================

-- 1. SELECT: Tutti possono vedere gli sport dei profili (pubblici)
create policy "Profile sports viewable by everyone"
  on public.profile_sports for select
  using (deleted_at is null);

-- 2. INSERT: Gli utenti possono aggiungere sport al proprio profilo
create policy "Users can insert own profile sports"
  on public.profile_sports for insert
  with check (auth.uid() = user_id);

-- 3. UPDATE: Gli utenti possono aggiornare i propri sport (es: cambiare is_main_sport)
create policy "Users can update own profile sports"
  on public.profile_sports for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. DELETE: Gli utenti possono rimuovere sport dal proprio profilo
create policy "Users can delete own profile sports"
  on public.profile_sports for delete
  using (auth.uid() = user_id);

-- =============================================
-- PROFILE_SECONDARY_POSITIONS POLICIES
-- =============================================

-- 1. SELECT: Tutti possono vedere le posizioni secondarie (pubbliche)
create policy "Profile secondary positions viewable by everyone"
  on public.profile_secondary_positions for select
  using (deleted_at is null);

-- 2. INSERT/UPDATE/DELETE: Gli utenti possono gestire le posizioni secondarie dei propri sport
-- Verifica che il profile_sport_id appartenga all'utente autenticato
create policy "Users can manage own profile secondary positions"
  on public.profile_secondary_positions for all
  using (
    exists (
      select 1 from public.profile_sports
      where profile_sports.id = profile_secondary_positions.profile_sport_id
      and profile_sports.user_id = auth.uid()
    )
  );

-- =============================================
-- VERIFICA RISULTATO
-- =============================================
-- Per verificare che le policy siano state create correttamente:
--
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('profile_sports', 'profile_secondary_positions')
-- ORDER BY tablename, policyname;
--
-- Dovresti vedere:
-- - 4 policy per profile_sports (select, insert, update, delete)
-- - 2 policy per profile_secondary_positions (select, all)
-- =============================================

-- Test insert (opzionale - decommentare per testare):
-- Sostituisci <your-user-id> con il tuo UUID reale
--
-- INSERT INTO public.profile_sports (user_id, sport_id, is_main_sport)
-- VALUES ('<your-user-id>', 1, true);
--
-- Se funziona → policy OK ✅
-- Se fallisce con 42501 → verifica che auth.uid() ritorni il tuo ID
-- =============================================
