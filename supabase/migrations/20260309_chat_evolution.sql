-- =============================================================================
-- Migration: 20260309_chat_evolution.sql
-- Chat Evolution: group chats, edit/delete, reply, forward, reactions, read receipts
-- =============================================================================

-- -------------------------------------------------------------------------
-- 1. Extend existing `messages` table (1:1 chats)
-- -------------------------------------------------------------------------
ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS forwarded_from_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_deleted_for_all BOOLEAN DEFAULT FALSE NOT NULL;

-- -------------------------------------------------------------------------
-- 2. "Delete for me" on 1:1 messages
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_hidden_for (
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, message_id)
);

-- -------------------------------------------------------------------------
-- 3. Reactions on 1:1 messages
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction   TEXT NOT NULL CHECK (reaction IN ('like','love','fire','trophy','zap','star')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (message_id, user_id, reaction)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);

-- -------------------------------------------------------------------------
-- 4. Group conversations
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_conversations (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    avatar_url  TEXT,
    created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    deleted_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_conversations_created_by ON public.group_conversations(created_by);

-- -------------------------------------------------------------------------
-- 5. Group members
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_members (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id   UUID NOT NULL REFERENCES public.group_conversations(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    added_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    joined_at  TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_unique_active
    ON public.group_members(group_id, user_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user  ON public.group_members(user_id);

-- -------------------------------------------------------------------------
-- 6. Group messages
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_messages (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id            UUID NOT NULL REFERENCES public.group_conversations(id) ON DELETE CASCADE,
    sender_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content             TEXT NOT NULL CHECK (char_length(content) > 0),
    reply_to_id         UUID REFERENCES public.group_messages(id) ON DELETE SET NULL,
    forwarded_from_id   UUID REFERENCES public.group_messages(id) ON DELETE SET NULL,
    edited_at           TIMESTAMPTZ,
    is_deleted_for_all  BOOLEAN DEFAULT FALSE NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_group_messages_group_created ON public.group_messages(group_id, created_at);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender        ON public.group_messages(sender_id);

-- -------------------------------------------------------------------------
-- 7. "Delete for me" on group messages
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_message_hidden_for (
    user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    group_message_id UUID NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
    created_at       TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, group_message_id)
);

-- -------------------------------------------------------------------------
-- 8. Group message read receipts
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_message_reads (
    group_message_id UUID NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
    user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at          TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (group_message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_message_reads_msg  ON public.group_message_reads(group_message_id);
CREATE INDEX IF NOT EXISTS idx_group_message_reads_user ON public.group_message_reads(user_id);

-- -------------------------------------------------------------------------
-- 9. Reactions on group messages
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_message_reactions (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_message_id UUID NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
    user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction         TEXT NOT NULL CHECK (reaction IN ('like','love','fire','trophy','zap','star')),
    created_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE (group_message_id, user_id, reaction)
);

CREATE INDEX IF NOT EXISTS idx_group_message_reactions_msg ON public.group_message_reactions(group_message_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- -------- message_hidden_for --------
ALTER TABLE public.message_hidden_for ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own hidden messages" ON public.message_hidden_for
    FOR ALL USING (auth.uid() = user_id);

-- -------- message_reactions --------
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reaction participants can read" ON public.message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.messages m
            WHERE m.id = message_id
              AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
              AND m.deleted_at IS NULL
        )
    );

CREATE POLICY "Users add own reactions" ON public.message_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove own reactions" ON public.message_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- -------- group_conversations --------
ALTER TABLE public.group_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read group" ON public.group_conversations
    FOR SELECT USING (
        deleted_at IS NULL AND EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = id
              AND gm.user_id = auth.uid()
              AND gm.deleted_at IS NULL
        )
    );

CREATE POLICY "Authenticated users can create groups" ON public.group_conversations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update group" ON public.group_conversations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = id
              AND gm.user_id = auth.uid()
              AND gm.role = 'admin'
              AND gm.deleted_at IS NULL
        )
    );

-- -------- group_members --------
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read group members" ON public.group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm2
            WHERE gm2.group_id = group_id
              AND gm2.user_id = auth.uid()
              AND gm2.deleted_at IS NULL
        )
    );

CREATE POLICY "Admins can insert members" ON public.group_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_id
              AND gm.user_id = auth.uid()
              AND gm.role = 'admin'
              AND gm.deleted_at IS NULL
        )
        OR auth.uid() = added_by  -- creator inserting initial members
    );

CREATE POLICY "Admins can update member roles" ON public.group_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_id
              AND gm.user_id = auth.uid()
              AND gm.role = 'admin'
              AND gm.deleted_at IS NULL
        )
    );

CREATE POLICY "Admins or self can remove members" ON public.group_members
    FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_id
              AND gm.user_id = auth.uid()
              AND gm.role = 'admin'
              AND gm.deleted_at IS NULL
        )
    );

-- -------- group_messages --------
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read group messages" ON public.group_messages
    FOR SELECT USING (
        deleted_at IS NULL AND EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_id
              AND gm.user_id = auth.uid()
              AND gm.deleted_at IS NULL
        )
    );

CREATE POLICY "Active members can send messages" ON public.group_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_id
              AND gm.user_id = auth.uid()
              AND gm.deleted_at IS NULL
        )
    );

CREATE POLICY "Sender can update own messages" ON public.group_messages
    FOR UPDATE USING (auth.uid() = sender_id AND deleted_at IS NULL);

-- -------- group_message_hidden_for --------
ALTER TABLE public.group_message_hidden_for ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own hidden group messages" ON public.group_message_hidden_for
    FOR ALL USING (auth.uid() = user_id);

-- -------- group_message_reads --------
ALTER TABLE public.group_message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read receipts" ON public.group_message_reads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_messages gm
            JOIN public.group_members gmb ON gmb.group_id = gm.group_id
            WHERE gm.id = group_message_id
              AND gmb.user_id = auth.uid()
              AND gmb.deleted_at IS NULL
        )
    );

CREATE POLICY "Users insert own reads" ON public.group_message_reads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own reads" ON public.group_message_reads
    FOR UPDATE USING (auth.uid() = user_id);

-- -------- group_message_reactions --------
ALTER TABLE public.group_message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read group reactions" ON public.group_message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_messages gm
            JOIN public.group_members gm2 ON gm2.group_id = gm.group_id
            WHERE gm.id = group_message_id
              AND gm2.user_id = auth.uid()
              AND gm2.deleted_at IS NULL
        )
    );

CREATE POLICY "Active members add reactions" ON public.group_message_reactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND EXISTS (
            SELECT 1 FROM public.group_messages gm
            JOIN public.group_members gmb ON gmb.group_id = gm.group_id
            WHERE gm.id = group_message_id
              AND gmb.user_id = auth.uid()
              AND gmb.deleted_at IS NULL
        )
    );

CREATE POLICY "Users remove own group reactions" ON public.group_message_reactions
    FOR DELETE USING (auth.uid() = user_id);
