import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VOICE_CHANNELS = [
  { channel_id: 'general-hangout', title: 'General Hangout', description: 'Casual conversation' },
  { channel_id: 'fractal-call', title: 'Fractal Call', description: 'Monday 6pm EST weekly fractal' },
  { channel_id: 'music-lounge', title: 'Music Lounge', description: 'Always-on listening room' },
  { channel_id: 'tech-talk', title: 'Tech Talk', description: 'Technical discussions' },
  { channel_id: 'coworking', title: 'Coworking', description: 'Silent cowork with ambient presence' },
];

async function seed() {
  for (const ch of VOICE_CHANNELS) {
    const { data: existing } = await supabase
      .from('rooms')
      .select('id')
      .eq('channel_id', ch.channel_id)
      .maybeSingle();

    if (existing) {
      console.log(`Channel ${ch.channel_id} already exists, skipping`);
      continue;
    }

    const streamCallId = `voice-${ch.channel_id}-${Date.now()}`;
    const { error } = await supabase.from('rooms').insert({
      title: ch.title,
      description: ch.description,
      host_fid: 19640,
      host_name: 'ZAO OS',
      host_username: 'zaoos',
      host_pfp: null,
      stream_call_id: streamCallId,
      state: 'live',
      room_type: 'voice_channel',
      persistent: true,
      channel_id: ch.channel_id,
      theme: 'default',
      layout_preference: 'speakers-first',
      participant_count: 0,
    });

    if (error) {
      console.error(`Failed to seed ${ch.channel_id}:`, error.message);
    } else {
      console.log(`Seeded ${ch.channel_id}`);
    }
  }
}

seed().then(() => process.exit(0));
