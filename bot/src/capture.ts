import { db } from './supabase.ts';
import { logBotActivity } from './activity.ts';
import type { TeamMember } from './auth.ts';

export async function addGemba(member: TeamMember, text: string): Promise<string> {
  if (!text.trim()) return 'Say something after /gemba — what moved or got blocked?';
  const { data, error } = await db()
    .from('stock_activity_log')
    .insert({
      actor_id: member.id,
      entity_type: 'member',
      entity_id: member.id,
      action: 'gemba',
      new_value: JSON.stringify(text.trim()),
    })
    .select('id')
    .single();
  if (error) return `Could not log gemba: ${error.message}`;
  return `Logged. ${member.name}'s gemba note saved (id ${data.id.slice(0, 8)}).`;
}

export async function addIdea(member: TeamMember, text: string): Promise<string> {
  if (!text.trim()) return 'Say something after /idea — what should we try?';
  const { data, error } = await db()
    .from('stock_suggestions')
    .insert({
      name: member.name,
      contact: `tg:${member.id}`,
      suggestion: text.trim(),
    })
    .select('id')
    .single();
  if (error) return `Could not save: ${error.message}`;
  await logBotActivity({
    actorId: member.id,
    entityType: 'member',
    entityId: member.id,
    action: 'suggestion_add',
    newValue: text.trim().slice(0, 200),
  });
  return `Saved your idea (id ${data.id.slice(0, 8)}). Zaal will see it in the suggestion box.`;
}

export async function addNote(member: TeamMember, text: string): Promise<string> {
  if (!text.trim()) return 'Say something after /note — what do you want on the meeting notes?';
  const today = new Date().toISOString().slice(0, 10);
  // Find the most recent upcoming meeting note, else create one for today.
  const { data: recent } = await db()
    .from('stock_meeting_notes')
    .select('id, notes, meeting_date')
    .gte('meeting_date', today)
    .order('meeting_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  let noteId: string;
  const stamp = `[${member.name} via bot ${new Date().toISOString().slice(0, 16).replace('T', ' ')}] ${text.trim()}`;

  if (recent) {
    const newBody = recent.notes ? `${recent.notes}\n\n${stamp}` : stamp;
    const { error } = await db()
      .from('stock_meeting_notes')
      .update({ notes: newBody })
      .eq('id', recent.id);
    if (error) return `Could not append: ${error.message}`;
    noteId = recent.id;
  } else {
    const { data, error } = await db()
      .from('stock_meeting_notes')
      .insert({
        title: 'Async notes (bot-created)',
        meeting_date: today,
        notes: stamp,
        created_by: member.id,
      })
      .select('id')
      .single();
    if (error) return `Could not save: ${error.message}`;
    noteId = data.id;
  }

  await logBotActivity({
    actorId: member.id,
    entityType: 'note',
    entityId: noteId,
    action: 'note_add',
    newValue: text.trim().slice(0, 200),
  });
  return `Note added.`;
}
