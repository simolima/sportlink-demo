-- =============================================
-- CLEANUP & FIX RLS POLICIES FOR profile_sports
-- =============================================
-- PROBLEMA: Ci sono policy duplicate su profile_sports (13 invece di 4)
--           che potrebbero causare conflitti o comportamenti inaspettati.
--
-- SOLUZIONE: Rimuove TUTTE le policy esistenti e le ricrea in modo pulito.
--
-- Data: 27 gennaio 2026
-- =============================================

-- =============================================
-- STEP 1: RIMUOVI TUTTE LE POLICY ESISTENTI
-- =============================================

-- Profile Sports - Rimuovi tutte le policy
drop policy if exists "Profile sports viewable by everyone" on public.profile_sports;
drop policy if exists "Users can insert own profile sports" on public.profile_sports;
drop policy if exists "Users can update own profile sports" on public.profile_sports;
drop policy if exists "Users can delete own profile sports" on public.profile_sports;
drop policy if exists "Authenticated users can delete own profile_sports" on public.profile_sports;
drop policy if exists "Authenticated users can insert profile_sports" on public.profile_sports;
drop policy if exists "Authenticated users can update own profile_sports" on public.profile_sports;
drop policy if exists "Users can delete their own sports" on public.profile_sports;
drop policy if exists "Users can insert their own sports" on public.profile_sports;
drop policy if exists "Users can update their own sports" on public.profile_sports;
drop policy if exists "Users can view their own sports" on public.profile_sports;

-- Profile Secondary Positions - Rimuovi tutte le policy
drop policy if exists "Profile secondary positions viewable by everyone" on public.profile_secondary_positions;
drop policy if exists "Users can manage own profile secondary positions" on public.profile_secondary_positions;

-- =============================================
-- STEP 2: CREA LE POLICY CORRETTE (SOLO 4 PER profile_sports)
-- =============================================

-- 1. SELECT: Tutti possono vedere gli sport (pubblici)
create policy "Everyone can view profile sports"
  on public.profile_sports for select
  using (deleted_at is null);

-- 2. INSERT: Solo utenti autenticati possono aggiungere i propri sport
create policy "Authenticated users can insert own sports"
  on public.profile_sports for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 3. UPDATE: Solo utenti autenticati possono aggiornare i propri sport
create policy "Authenticated users can update own sports"
  on public.profile_sports for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. DELETE: Solo utenti autenticati possono rimuovere i propri sport
create policy "Authenticated users can delete own sports"
  on public.profile_sports for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================
-- STEP 3: CREA LE POLICY PER profile_secondary_positions
-- =============================================

-- 1. SELECT: Tutti possono vedere le posizioni secondarie
create policy "Everyone can view secondary positions"
  on public.profile_secondary_positions for select
  using (deleted_at is null);

-- 2. ALL: Solo utenti autenticati possono gestire le proprie posizioni secondarie
create policy "Authenticated users can manage own secondary positions"
  on public.profile_secondary_positions for all
  to authenticated
  using (
    exists (
      select 1 from public.profile_sports
      where profile_sports.id = profile_secondary_positions.profile_sport_id
      and profile_sports.user_id = auth.uid()
    )
  );

-- =============================================
-- STEP 4: VERIFICA RISULTATO
-- =============================================
-- Esegui questa query per verificare:
--
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('profile_sports', 'profile_secondary_positions')
-- ORDER BY tablename, policyname;
--
-- Dovresti vedere:
-- - 4 policy per profile_sports (1 SELECT + 1 INSERT + 1 UPDATE + 1 DELETE)
-- - 2 policy per profile_secondary_positions (1 SELECT + 1 ALL)
-- - Tutte con role {authenticated} tranne le SELECT che sono {public}
-- =============================================
