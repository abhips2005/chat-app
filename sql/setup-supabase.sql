-- Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create room_members tableAnd the index. Aditya. Index. Hey. Hey, Cortana. Marathi Lingala. Bollywood. None. Local. Cortana. To do list. Hello. P. Hey, Cortana. Hello. Hey, Cortana. Now. India. Noses pyro directory. CD2. Random either a folder folder. Hey, Cortana. Hey, Cortana. SRC. Ilaya Control Shift 10. AAP, Trinity. Project. I have done devices. In PM started. Create a React app with. To use this application you need to create a new React app. Replace the default files in the ones provided above. Template. Hello I didn't only went to. No such. I. Nabi Nayar. Hey, Cortana Reddy. Storage. Ennore Karma Reddy. E Level 3. Completing level three. Hey, Cortana. Reacting on April inbuilt learn. Hey, Cortana. Nice. Nice. Ohh happened. Heterog.
CREATE TABLE IF NOT EXISTS public.room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (room_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for rooms table
CREATE POLICY "Anyone can view rooms"
    ON public.rooms FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create rooms"
    ON public.rooms FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Room creator can update rooms"
    ON public.rooms FOR UPDATE
    USING (created_by = current_user);

CREATE POLICY "Room creator can delete rooms"
    ON public.rooms FOR DELETE
    USING (created_by = current_user);

-- Create policies for room_members table
CREATE POLICY "Anyone can view room members"
    ON public.room_members FOR SELECT
    USING (true);

CREATE POLICY "Users can join rooms"
    ON public.room_members FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can leave rooms"
    ON public.room_members FOR DELETE
    USING (user_id = current_user);

-- Create policies for messages table
CREATE POLICY "Anyone can view messages"
    ON public.messages FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Message creators can update their messages"
    ON public.messages FOR UPDATE
    USING (user_id = current_user);

CREATE POLICY "Message creators can delete their messages"
    ON public.messages FOR DELETE
    USING (user_id = current_user);

-- Create utility function to get all rooms a user is a member of
CREATE OR REPLACE FUNCTION public.get_user_rooms(user_id TEXT)
RETURNS SETOF public.rooms
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT r.* FROM public.rooms r
    JOIN public.room_members rm ON r.id = rm.room_id
    WHERE rm.user_id = get_user_rooms.user_id;
$$;

-- Create utility function to check if a user is a member of a room
CREATE OR REPLACE FUNCTION public.is_room_member(room_id UUID, user_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.room_members
        WHERE room_id = is_room_member.room_id AND user_id = is_room_member.user_id
    );
$$;

-- Configure realtime publications for all tables
BEGIN;
  -- Drop existing publications (if any)
  DROP PUBLICATION IF EXISTS supabase_realtime;

  -- Create a new publication for all changes
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.rooms, 
    public.room_members, 
    public.messages;
COMMIT;

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT, INSERT ON public.rooms TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.room_members TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
