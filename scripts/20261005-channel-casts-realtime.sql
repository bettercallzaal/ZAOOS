-- Enable Supabase Realtime for channel_casts
-- Allows clients to receive live chat updates via websocket without polling /api/chat/messages

-- 1. Ensure RLS allows read access to channel casts for anon and authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'channel_casts' AND policyname = 'Allow public read of channel_casts'
  ) THEN
    CREATE POLICY "Allow public read of channel_casts"
      ON public.channel_casts
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- 2. Add channel_casts table to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'channel_casts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_casts;
  END IF;
END $$;

-- 3. Add agent_events table to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'agent_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_events;
  END IF;
END $$;
