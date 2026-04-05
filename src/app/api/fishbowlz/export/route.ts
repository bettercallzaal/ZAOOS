import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
  }

  // Fetch room details
  const { data: room } = await supabaseAdmin
    .from('fishbowl_rooms')
    .select('title, host_username, created_at, ended_at, hot_seat_count, ai_summary')
    .eq('id', roomId)
    .single();

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  // Fetch transcripts
  const { data: transcripts } = await supabaseAdmin
    .from('fishbowl_transcripts')
    .select('speaker_name, speaker_role, text, started_at')
    .eq('room_id', roomId)
    .order('started_at', { ascending: true });

  // Build Markdown
  const lines: string[] = [];
  lines.push(`# ${room.title}`);
  lines.push('');
  lines.push(`**Host:** @${room.host_username}`);
  lines.push(`**Created:** ${new Date(room.created_at).toLocaleString()}`);
  if (room.ended_at) lines.push(`**Ended:** ${new Date(room.ended_at).toLocaleString()}`);
  lines.push(`**Hot seats:** ${room.hot_seat_count}`);
  lines.push('');

  if (room.ai_summary) {
    lines.push('## AI Summary');
    lines.push('');
    lines.push(room.ai_summary);
    lines.push('');
  }

  lines.push('## Transcript');
  lines.push('');

  if (transcripts && transcripts.length > 0) {
    for (const t of transcripts) {
      const time = new Date(t.started_at).toLocaleTimeString();
      lines.push(`**${t.speaker_name}** [${t.speaker_role}] — ${time}`);
      lines.push(`> ${t.text}`);
      lines.push('');
    }
  } else {
    lines.push('*No transcript recorded.*');
  }

  lines.push('---');
  lines.push(`*Exported from FISHBOWLZ on ${new Date().toLocaleString()}*`);

  const markdown = lines.join('\n');
  const filename = `fishbowlz-${room.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;

  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
