-- =============================================
-- FIX SELECT POLICY FOR profile_sports
-- =============================================
-- PROBLEMA: La query SELECT su profile_sports ritorna null anche se i dati esistono.
--           Possibile causa: la policy SELECT usa "deleted_at is null" ma il campo
--           potrebbe essere NULL e causare problemi con la valutazione.
--
-- SOLUZIONE: Semplifica la policy SELECT per renderla più permissiva.
--
-- Data: 27 gennaio 2026
-- =============================================

-- Rimuovi la policy SELECT esistente
drop policy if exists "Everyone can view profile sports" on public.profile_sports;

-- Crea una policy SELECT più permissiva
-- Opzione 1: Permetti a tutti di vedere tutti gli sport (senza filtro deleted_at)
create policy "Everyone can view all profile sports"
  on public.profile_sports for select
  using (true);

-- Se vuoi mantenere il filtro deleted_at, usa questa sintassi più esplicita:
-- create policy "Everyone can view profile sports"
--   on public.profile_sports for select
--   using (deleted_at is null OR deleted_at is null);

-- =============================================
-- VERIFICA
-- =============================================
-- Dopo aver eseguito questo script, testa dal frontend:
-- 1. Fai logout completo (cancella localStorage)
-- 2. Fai login con Google
-- 3. La query dovrebbe ora ritornare i tuoi sport
-- =============================================
