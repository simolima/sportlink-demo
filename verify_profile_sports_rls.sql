-- ============================================
-- VERIFY RLS POLICIES ON profile_sports
-- ============================================

-- Check if policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'profile_sports'
ORDER BY policyname;

-- If no policies shown above, run the fix_profile_sports_rls.sql script!

-- Test insert (should succeed if policies are correct)
-- Replace 'YOUR_USER_ID' with your actual user ID from auth
/*
INSERT INTO profile_sports (user_id, sport_id, is_main_sport)
VALUES (
    auth.uid(),  -- Current authenticated user
    (SELECT id FROM lookup_sports WHERE name = 'Calcio' LIMIT 1),
    true
);
*/
