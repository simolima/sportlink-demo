-- Migration: allow any emoji as reaction (remove fixed CHECK constraint)
-- This opens the system to arbitrary emoji via emoji-mart picker

ALTER TABLE public.message_reactions
    DROP CONSTRAINT IF EXISTS message_reactions_reaction_check;

ALTER TABLE public.group_message_reactions
    DROP CONSTRAINT IF EXISTS group_message_reactions_reaction_check;

-- Add a loose length constraint to avoid abuse (max 100 bytes, enough for any emoji)
ALTER TABLE public.message_reactions
    ADD CONSTRAINT message_reactions_reaction_nonempty
    CHECK (reaction <> '' AND length(reaction) <= 100);

ALTER TABLE public.group_message_reactions
    ADD CONSTRAINT group_message_reactions_reaction_nonempty
    CHECK (reaction <> '' AND length(reaction) <= 100);
