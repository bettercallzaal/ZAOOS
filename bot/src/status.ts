import { db } from './supabase.ts';
import type { TeamMember } from './auth.ts';

function daysSince(iso: string | null): number {
  if (!iso) return Infinity;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export async function buildStatus(): Promise<string> {
  const s = db();
  const [sponsorsR, artistsR, volunteersR, todosR, milestonesR] = await Promise.all([
    s.from('stock_sponsors').select('status, amount_committed, last_contacted_at, name'),
    s.from('stock_artists').select('status, name'),
    s.from('stock_volunteers').select('confirmed, role, shift'),
    s.from('stock_todos').select('status'),
    s.from('stock_timeline').select('status, title, due_date'),
  ]);

  const sponsors = sponsorsR.data || [];
  const artists = artistsR.data || [];
  const volunteers = volunteersR.data || [];
  const todos = todosR.data || [];
  const milestones = milestonesR.data || [];

  const committedTotal = sponsors
    .filter((x) => x.status === 'committed' || x.status === 'paid')
    .reduce((sum, x) => sum + Number(x.amount_committed || 0), 0);
  const paidTotal = sponsors
    .filter((x) => x.status === 'paid')
    .reduce((sum, x) => sum + Number(x.amount_committed || 0), 0);
  const sponsorsPipeline = sponsors.filter(
    (x) => x.status === 'contacted' || x.status === 'in_talks',
  ).length;
  const overdueSponsors = sponsors.filter(
    (x) => (x.status === 'contacted' || x.status === 'in_talks') && daysSince(x.last_contacted_at) > 21,
  );

  const artistsConfirmed = artists.filter(
    (x) => x.status === 'confirmed' || x.status === 'travel_booked',
  ).length;
  const artistsInTalks = artists.filter(
    (x) => x.status === 'contacted' || x.status === 'interested',
  ).length;

  const volunteersConfirmed = volunteers.filter((v) => v.confirmed).length;

  const todosOpen = todos.filter((t) => t.status !== 'done').length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueMilestones = milestones.filter((m) => {
    if (m.status === 'done') return false;
    return new Date(m.due_date + 'T00:00:00').getTime() < today.getTime();
  });

  const festival = new Date('2026-10-03T12:00:00-04:00');
  const daysToFest = Math.ceil((festival.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const lines: string[] = [];
  lines.push(`ZAOstock status · ${daysToFest} days to Oct 3`);
  lines.push('');
  lines.push('Sponsors');
  lines.push(`  $${committedTotal.toLocaleString()} committed · $${paidTotal.toLocaleString()} paid`);
  lines.push(`  ${sponsorsPipeline} in pipeline`);
  if (overdueSponsors.length > 0) {
    lines.push(`  ⚠ ${overdueSponsors.length} stalled (no contact 21+ days):`);
    for (const s of overdueSponsors.slice(0, 3)) {
      lines.push(`    · ${s.name} — ${daysSince(s.last_contacted_at)}d`);
    }
  }
  lines.push('');
  lines.push('Artists');
  lines.push(`  ${artistsConfirmed} confirmed · ${artistsInTalks} in talks`);
  lines.push('');
  lines.push('Volunteers');
  lines.push(`  ${volunteersConfirmed} confirmed`);
  lines.push('');
  lines.push('Todos');
  lines.push(`  ${todosOpen} open`);
  if (overdueMilestones.length > 0) {
    lines.push('');
    lines.push(`⚠ Overdue milestones (${overdueMilestones.length}):`);
    for (const m of overdueMilestones.slice(0, 3)) {
      lines.push(`  · ${m.title} (${m.due_date})`);
    }
  }
  return lines.join('\n');
}

export async function buildMyTodos(member: TeamMember): Promise<string> {
  const { data } = await db()
    .from('stock_todos')
    .select('title, status, created_at')
    .eq('owner_id', member.id)
    .neq('status', 'done')
    .order('created_at', { ascending: false })
    .limit(15);

  const todos = data || [];
  if (todos.length === 0) return `${member.name}, no open todos assigned to you.`;

  const lines: string[] = [`${member.name} — ${todos.length} open todo${todos.length === 1 ? '' : 's'}:`];
  for (const t of todos) {
    const mark = t.status === 'in_progress' ? '▶' : '·';
    lines.push(`${mark} ${t.title}`);
  }
  return lines.join('\n');
}

export async function buildMyContributions(member: TeamMember): Promise<string> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await db()
    .from('stock_activity_log')
    .select('action, entity_type, new_value, created_at')
    .eq('actor_id', member.id)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20);

  const entries = data || [];
  if (entries.length === 0) return `${member.name}, no activity logged in the last 7 days.`;

  const lines: string[] = [`${member.name} — last 7 days (${entries.length} entries):`];
  for (const e of entries) {
    const when = new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const value = e.new_value ? ` — ${e.new_value.slice(1, 60).replace(/"/g, '')}${e.new_value.length > 60 ? '...' : ''}` : '';
    lines.push(`${when} · ${e.entity_type} ${e.action}${value}`);
  }
  return lines.join('\n');
}
