-- ============================================
-- FIX RLS POLICIES FOR profile_sports TABLE
-- ============================================
-- This script fixes the RLS policies to allow authenticated users
-- to insert their own sports during onboarding

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own sports" ON profile_sports;
DROP POLICY IF EXISTS "Users can insert their own sports" ON profile_sports;
DROP POLICY IF EXISTS "Users can update their own sports" ON profile_sports;
DROP POLICY IF EXISTS "Users can delete their own sports" ON profile_sports;

-- Enable RLS on profile_sports (if not already enabled)
ALTER TABLE profile_sports ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own sports
CREATE POLICY "Users can view their own sports"
ON profile_sports
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own sports
CREATE POLICY "Users can insert their own sports"
ON profile_sports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own sports
CREATE POLICY "Users can update their own sports"
ON profile_sports
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own sports
CREATE POLICY "Users can delete their own sports"
ON profile_sports
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profile_sports'
ORDER BY policyname;
