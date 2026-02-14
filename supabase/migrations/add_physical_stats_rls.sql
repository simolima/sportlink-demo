-- Migration: Add RLS policies for physical_stats table
-- Date: 2026-01-28
-- Purpose: Allow users to read and update their own physical stats

-- Drop existing policies if any
drop policy if exists "Users can view their own physical stats" on public.physical_stats;
drop policy if exists "Users can insert their own physical stats" on public.physical_stats;
drop policy if exists "Users can update their own physical stats" on public.physical_stats;
drop policy if exists "Users can delete their own physical stats" on public.physical_stats;

-- Create new policies
create policy "Users can view their own physical stats"
on public.physical_stats for select
using (auth.uid() = user_id);

create policy "Users can insert their own physical stats"
on public.physical_stats for insert
with check (auth.uid() = user_id);

create policy "Users can update their own physical stats"
on public.physical_stats for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own physical stats"
on public.physical_stats for delete
using (auth.uid() = user_id);
