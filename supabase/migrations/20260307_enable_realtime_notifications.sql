-- Enable Supabase Realtime for the notifications table
-- After running this migration, go to Supabase Dashboard → Database → Replication
-- to confirm the table appears in the realtime publication list.

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
