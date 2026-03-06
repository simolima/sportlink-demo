-- ============================================
-- INFO: profile_stats IS A VIEW, NOT A TABLE
-- ============================================

-- Check if it's a view or table
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name = 'profile_stats';

-- If it shows "VIEW", then it's calculated automatically
-- We cannot insert data directly into it

-- Show the view definition
SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name = 'profile_stats';

-- profile_stats is a VIEW that calculates statistics automatically
-- from other tables (follows, posts, etc.)
-- No need to insert/update it manually - it updates itself!

-- Verify it works by checking data
SELECT 
    profile_id, 
    first_name, 
    last_name, 
    followers_count, 
    following_count,
    clubs_count
FROM profile_stats 
WHERE profile_id IS NOT NULL
LIMIT 5;
