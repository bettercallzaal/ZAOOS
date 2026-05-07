import { db } from './supabase';
import type { TeamMember } from './auth';

function daysSince(iso: string | null): number {
  if (!iso) return Infinity;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export async function buildStatus(): Promise<string> {
  const s = db();
  const [sponsorsR, artistsR, volunteersR, todosR, milestonesR] = await Promise.all([
    s.from('sponsors').select('status, amount_committed, last_contacted_at, name'),
    s.from('artists').select('status, name'),
    s.from('volunteers').select('confirmed, role, shift'),
    s.from('todos').select('status'),
    s.from('timeline').select('status, title, due_date'),
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
    .from('todos')
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

export async function buildAllOpenTodos(): Promise<string> {
  const { data } = await db()
    .from('todos')
    .select('title, status, owner_id, created_at')
    .neq('status', 'done')
    .order('created_at', { ascending: false })
    .limit(40);

  const todos = (data ?? []) as Array<{ title: string; status: string; owner_id: string | null; created_at: string }>;
  if (todos.length === 0) return 'No open todos. Nice.';

  const ownerIds = Array.from(new Set(todos.map((t) => t.owner_id).filter((v): v is string => Boolean(v))));
  const nameById = new Map<string, string>();
  if (ownerIds.length > 0) {
    const { data: owners } = await db()
      .from('team_members')
      .select('id, name')
      .in('id', ownerIds);
    for (const o of (owners as Array<{ id: string; name: string }> | null) ?? []) {
      nameById.set(o.id, o.name);
    }
  }

  const unclaimed = todos.filter((t) => !t.owner_id);
  const claimed = todos.filter((t) => t.owner_id);

  const lines: string[] = [`${todos.length} open todo${todos.length === 1 ? '' : 's'}:`];
  if (unclaimed.length > 0) {
    lines.push('', `Unclaimed (${unclaimed.length}) - grab via /do "I am taking <title>":`);
    for (const t of unclaimed.slice(0, 15)) {
      const mark = t.status === 'in_progress' ? '▶' : '·';
      lines.push(`${mark} ${t.title}`);
    }
    if (unclaimed.length > 15) lines.push(`  ... and ${unclaimed.length - 15} more.`);
  }
  if (claimed.length > 0) {
    lines.push('', `Claimed (${claimed.length}):`);
    for (const t of claimed.slice(0, 15)) {
      const mark = t.status === 'in_progress' ? '▶' : '·';
      const owner = t.owner_id ? nameById.get(t.owner_id) ?? '?' : '?';
      lines.push(`${mark} ${t.title} - ${owner}`);
    }
    if (claimed.length > 15) lines.push(`  ... and ${claimed.length - 15} more.`);
  }
  return lines.join('\n');
}

export async function buildTeamRoster(): Promise<string> {
  const { data, error } = await db()
    .from('team_members')
    .select('name, scope, role, telegram_id, telegram_username, active')
    .neq('active', false)
    .order('name');

  if (error) return `Could not fetch team: ${error.message}`;

  type Row = { name: string; scope: string | null; role: string | null; telegram_id: number | null; telegram_username: string | null };
  const rows = (data as Row[]) ?? [];
  if (rows.length === 0) return 'No active team members.';

  const byScope = new Map<string, Row[]>();
  for (const r of rows) {
    const k = r.scope ?? 'unscoped';
    if (!byScope.has(k)) byScope.set(k, []);
    byScope.get(k)!.push(r);
  }

  let linked = 0;
  let unlinked = 0;
  for (const r of rows) {
    if (r.telegram_id) linked++;
    else unlinked++;
  }

  const lines: string[] = [`ZAOstock team (${rows.length} active - ${linked} linked, ${unlinked} not yet)`, ''];
  const scopes = Array.from(byScope.keys()).sort();
  for (const scope of scopes) {
    lines.push(`[${scope}]`);
    for (const r of byScope.get(scope)!) {
      const tag = r.telegram_id ? (r.telegram_username ? `@${r.telegram_username}` : 'linked') : 'NOT LINKED';
      const role = r.role && r.role !== 'member' ? ` (${r.role})` : '';
      lines.push(`  - ${r.name}${role} - ${tag}`);
    }
    lines.push('');
  }
  lines.push('Link someone: /link @handle <name>');
  return lines.join('\n').trim();
}

export async function buildMyContributions(member: TeamMember): Promise<string> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await db()
    .from('activity_log')
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

// /timeline-done <id_prefix_or_title_substring>
// Marks a timeline entry done. Accepts:
//  - 8-char UUID prefix (matches first segment)
//  - Substring of the title (case-insensitive, only if it matches exactly one entry)
export async function markTimelineDone(query: string, member: TeamMember): Promise<string> {
  const q = query.trim();
  if (!q) return 'Usage: /timeline-done <id-prefix or unique title fragment>';

  const s = db();
  // Try UUID prefix first (8 chars common, but accept anything 4+)
  const isUuidLike = /^[0-9a-f]{4,}/i.test(q.replace(/-/g, ''));

  let target: { id: string; title: string; status: string } | null = null;

  if (isUuidLike && q.length >= 4) {
    const { data } = await s
      .from('timeline')
      .select('id, title, status')
      .ilike('id', `${q}%`)
      .limit(2);
    if (data && data.length === 1) target = data[0] as { id: string; title: string; status: string };
    if (data && data.length > 1) {
      return `Multiple timeline entries match "${q}". Try a longer prefix.`;
    }
  }

  if (!target) {
    const { data } = await s
      .from('timeline')
      .select('id, title, status')
      .ilike('title', `%${q}%`)
      .limit(3);
    if (!data || data.length === 0) {
      return `No timeline entry matches "${q}".`;
    }
    if (data.length > 1) {
      return `Multiple timeline entries match "${q}":\n${data.map((d) => `  - ${d.title}`).join('\n')}\nUse a more specific fragment or pass an id prefix.`;
    }
    target = data[0] as { id: string; title: string; status: string };
  }

  if (target!.status === 'done') {
    return `"${target!.title}" is already marked done.`;
  }

  const { error } = await s
    .from('timeline')
    .update({
      status: 'done',
      notes: `[done by ${member.name} via /timeline-done ${new Date().toISOString().slice(0, 10)}]`,
    })
    .eq('id', target!.id);

  if (error) return `Could not update: ${error.message}`;

  return `Marked "${target!.title}" done.`;
}
