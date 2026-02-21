-- Migration: Add contract status fields to profiles
-- Date: 2026-02-21
-- Purpose: Restore contract_status and contract_end_date fields lost during Supabase migration

-- ============================================================
-- Add contract fields to profiles table
-- ============================================================

-- Add contract_status column (svincolato or sotto contratto)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS contract_status TEXT 
CHECK (contract_status IN ('svincolato', 'sotto contratto'));

-- Add contract_end_date column (when the contract expires)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS contract_end_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.contract_status IS 'Contract status: svincolato (free agent) or sotto contratto (under contract)';
COMMENT ON COLUMN public.profiles.contract_end_date IS 'Date when the current contract expires (only meaningful if contract_status = ''sotto contratto'')';

-- Create index for quick filtering by contract status
CREATE INDEX IF NOT EXISTS idx_profiles_contract_status 
ON public.profiles(contract_status) 
WHERE deleted_at IS NULL AND contract_status IS NOT NULL;

-- Create index for contracts expiring soon (useful for queries)
CREATE INDEX IF NOT EXISTS idx_profiles_contract_end_date 
ON public.profiles(contract_end_date) 
WHERE deleted_at IS NULL AND contract_status = 'sotto contratto' AND contract_end_date IS NOT NULL;

-- ============================================================
-- Notes:
-- ============================================================
-- - These fields are primarily used for Player, Coach, and Sporting Director profiles
-- - Frontend display logic in components/profile-sidebar.tsx shows:
--   * Green badge: "Svincolato" (free agent)
--   * Orange badge: "Sotto contratto" with expiry < 6 months
--   * Red badge: "Sotto contratto" with expiry > 6 months
-- - Fields are optional (NULL allowed) since not all profiles need contract info
