// Scheduled digests. No LLM — DB queries rendered as text templates.

import { db } from './supabase';

function daysSince(iso: string | null): number {
  if (!iso) return Infinity;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntil(iso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(iso + 'T00:00:00');
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function festivalDaysOut(): number {
  const festival = new Date('2026-10-03T12:00:00-04:00');
  return Math.ceil((festival.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export async function morningDigest(): Promise<string> {
  const s = db();
  const today = new Date().toISOString().slice(0, 10);
  const [todosR, timelineR, sponsorsR] = await Promise.all([
    s.from('todos').select('title, status, owner:team_members!owner_id(name)').neq('status', 'done').limit(50),
    s.from('timeline').select('title, due_date, status').neq('status', 'done').order('due_date').limit(20),
    s.from('sponsors').select('name, status, last_contacted_at').in('status', ['contacted', 'in_talks']),
  ]);

  const todos = todosR.data ?? [];
  const milestones = timelineR.data ?? [];
  const sponsors = sponsorsR.data ?? [];

  const inProgress = todos.filter((t) => t.status === 'in_progress');
  const overdueMilestones = milestones.filter((m) => daysUntil(m.due_date) < 0);
  const dueSoon = milestones.filter((m) => {
    const d = daysUntil(m.due_date);
    return d >= 0 && d <= 7;
  });
  const stalledSponsors = sponsors.filter((x) => daysSince(x.last_contacted_at) > 21);

  const lines: string[] = [];
  lines.push(`Morning · ${today} · ${festivalDaysOut()} days to Oct 3`);
  lines.push('');
  if (inProgress.length > 0) {
    lines.push(`In progress (${inProgress.length})`);
    for (const t of inProgress.slice(0, 5)) {
      // @ts-expect-error supabase inferred
      const owner = t.owner?.name ?? '?';
      lines.push(`  · ${t.title} - ${owner}`);
    }
    lines.push('');
  }
  if (overdueMilestones.length > 0) {
    lines.push(`Overdue milestones (${overdueMilestones.length})`);
    for (const m of overdueMilestones.slice(0, 3)) {
      lines.push(`  · ${m.title} (was due ${m.due_date})`);
    }
    lines.push('');
  }
  if (dueSoon.length > 0) {
    lines.push(`Due this week (${dueSoon.length})`);
    for (const m of dueSoon.slice(0, 5)) {
      lines.push(`  · ${m.title} (${m.due_date}, ${daysUntil(m.due_date)}d)`);
    }
    lines.push('');
  }
  if (stalledSponsors.length > 0) {
    lines.push(`Sponsor follow-ups needed (${stalledSponsors.length} stalled 21+ days)`);
    for (const sp of stalledSponsors.slice(0, 3)) {
      lines.push(`  · ${sp.name} (${daysSince(sp.last_contacted_at)}d)`);
    }
    lines.push('');
  }
  if (lines.length <= 2) lines.push('All clear. Quiet board. Find one thing to move.');
  lines.push('---');
  lines.push('Ask me: "/do add todo X" or "/ask <question>" · /help for more');
  return lines.join('\n');
}

export async function eveningRecap(): Promise<string> {
  const s = db();
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const [activityR, todosClosedR] = await Promise.all([
    s
      .from('activity_log')
      .select('action, entity_type, actor:team_members!actor_id(name)')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(100),
    s.from('todos').select('title, updated_at, owner:team_members!owner_id(name)').eq('status', 'done').gte('updated_at', since).limit(20),
  ]);

  const activity = activityR.data ?? [];
  const closed = todosClosedR.data ?? [];

  const byActor: Record<string, number> = {};
  for (const a of activity) {
    // @ts-expect-error supabase inferred
    const name: string = a.actor?.name ?? 'Unknown';
    byActor[name] = (byActor[name] ?? 0) + 1;
  }
  const actors = Object.entries(byActor)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const lines: string[] = [];
  lines.push(`Evening recap · ${new Date().toISOString().slice(0, 10)} · ${festivalDaysOut()} days to Oct 3`);
  lines.push('');
  lines.push(`Moves today (${activity.length} activity entries)`);
  if (actors.length > 0) {
    for (const [name, count] of actors) lines.push(`  · ${name}: ${count}`);
  } else {
    lines.push('  (no activity logged)');
  }
  lines.push('');
  if (closed.length > 0) {
    lines.push(`Todos closed (${closed.length})`);
    for (const t of closed.slice(0, 5)) {
      // @ts-expect-error supabase inferred
      const owner = t.owner?.name ?? '?';
      lines.push(`  · ${t.title} - ${owner}`);
    }
    lines.push('');
  }
  lines.push('Good night. Morning brief drops at 6am EST.');
  return lines.join('\n');
}

export async function weekAheadDigest(): Promise<string> {
  const s = db();
  const today = new Date();
  const weekOut = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [timelineR, sponsorsR, artistsR] = await Promise.all([
    s
      .from('timeline')
      .select('title, due_date, status, category, owner:team_members!owner_id(name)')
      .neq('status', 'done')
      .lte('due_date', weekOut)
      .order('due_date')
      .limit(30),
    s.from('sponsors').select('status, amount_committed'),
    s.from('artists').select('status'),
  ]);

  const milestones = timelineR.data ?? [];
  const sponsors = sponsorsR.data ?? [];
  const artists = artistsR.data ?? [];

  const committed = sponsors.filter((x) => x.status === 'committed' || x.status === 'paid').reduce((sum, x) => sum + Number(x.amount_committed || 0), 0);
  const paid = sponsors.filter((x) => x.status === 'paid').reduce((sum, x) => sum + Number(x.amount_committed || 0), 0);
  const pipeline = sponsors.filter((x) => x.status === 'contacted' || x.status === 'in_talks').length;
  const artistsConfirmed = artists.filter((x) => x.status === 'confirmed' || x.status === 'travel_booked').length;

  const lines: string[] = [];
  lines.push(`Week ahead · ${festivalDaysOut()} days to Oct 3`);
  lines.push('');
  lines.push(`Money: $${committed.toLocaleString()} committed · $${paid.toLocaleString()} paid · ${pipeline} in pipeline`);
  lines.push(`Artists: ${artistsConfirmed} confirmed / 10 target`);
  lines.push('');
  if (milestones.length > 0) {
    lines.push(`Upcoming this week (${milestones.length})`);
    for (const m of milestones.slice(0, 10)) {
      const d = daysUntil(m.due_date);
      const label = d < 0 ? `OVERDUE ${-d}d` : `${d}d`;
      // @ts-expect-error supabase inferred
      const owner = m.owner?.name ? ` · ${m.owner.name}` : '';
      lines.push(`  · [${m.category}] ${m.title} (${m.due_date}, ${label})${owner}`);
    }
  } else {
    lines.push('No milestones due this week.');
  }
  return lines.join('\n');
}

export async function fridayRetro(): Promise<string> {
  const s = db();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [actR, commitR] = await Promise.all([
    s.from('activity_log').select('action, actor:team_members!actor_id(name)').gte('created_at', since).limit(500),
    s.from('sponsors').select('status, amount_committed').in('status', ['committed', 'paid']),
  ]);
  const act = actR.data ?? [];
  const commits = commitR.data ?? [];
  const committedTotal = commits.reduce((sum, x) => sum + Number(x.amount_committed || 0), 0);

  const byActor: Record<string, number> = {};
  for (const a of act) {
    // @ts-expect-error supabase inferred
    const name: string = a.actor?.name ?? 'Unknown';
    byActor[name] = (byActor[name] ?? 0) + 1;
  }
  const top = Object.entries(byActor)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const lines: string[] = [];
  lines.push(`Friday retro · week ending ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');
  lines.push(`${act.length} activity entries this week`);
  lines.push(`Total committed $ to date: $${committedTotal.toLocaleString()}`);
  lines.push('');
  if (top.length > 0) {
    lines.push(`Top contributors this week`);
    for (const [name, count] of top) lines.push(`  · ${name}: ${count}`);
  }
  lines.push('');
  lines.push('Reply with what worked + one thing to try next week.');
  return lines.join('\n');
}
