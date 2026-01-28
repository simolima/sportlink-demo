-- Migration: Add RLS policy for profiles UPDATE
-- Date: 2026-01-28
-- Purpose: Allow users to update their own profile

-- Drop existing update policy if any
drop policy if exists "Users can update their own profile" on public.profiles;

-- Create update policy
create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);
