// Circles governance commands: /join /leave /mycircles /circles /coordinators /propose /proposals /object /consent /buddy /respect
// Mirrors spec doc 502: 6 circles, coordinator rotation, 48h consent window, Respect tracking.

import { Context } from 'grammy';
import type { TeamMember } from './auth';
import { db } from './supabase';
import { alertDevops } from './ops';

const CIRCLE_SLUGS = ['music', 'ops', 'partners', 'finance', 'merch', 'marketing', 'media', 'host'] as const;
type CircleSlug = (typeof CIRCLE_SLUGS)[number];

interface Circle {
  id: string;
  slug: CircleSlug;
  name: string;
  member_count: number;
  coordinator_id: string | null;
  coordinator_name: string | null;
}

interface Proposal {
  id: string;
  circle_slug: CircleSlug;
  proposer_name: string;
  title: string;
  body: string;
  status: 'open' | 'passed' | 'blocked' | 'expired';
  created_at: string;
  consent_window_ends_at: string;
  objection_count: number;
}

// ---- Helpers ----

function validateCircleSlug(slug: string): slug is CircleSlug {
  return CIRCLE_SLUGS.includes(slug.toLowerCase() as CircleSlug);
}

async function getCircle(slug: CircleSlug): Promise<Circle | null> {
  const { data, error } = await db()
    .from('stock_circles')
    .select('id, slug, name, coordinator_member_id')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as { id: string; slug: CircleSlug; name: string; coordinator_member_id: string | null };

  const { data: members } = await db()
    .from('stock_circle_members')
    .select('member_id')
    .eq('circle_id', row.id);

  let coordinator_name: string | null = null;
  if (row.coordinator_member_id) {
    const { data: coord } = await db()
      .from('stock_team_members')
      .select('name')
      .eq('id', row.coordinator_member_id)
      .maybeSingle();
    coordinator_name = (coord as { name: string } | null)?.name ?? null;
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    member_count: members?.length ?? 0,
    coordinator_id: row.coordinator_member_id,
    coordinator_name,
  };
}

async function getMemberCircles(memberId: string): Promise<CircleSlug[]> {
  const { data: rows } = await db()
    .from('stock_circle_members')
    .select('circle_id')
    .eq('member_id', memberId);

  if (!rows || rows.length === 0) return [];
  const circleIds = (rows as Array<{ circle_id: string }>).map((r) => r.circle_id);

  const { data: circles } = await db()
    .from('stock_circles')
    .select('slug')
    .in('id', circleIds);

  return ((circles as Array<{ slug: string }> | null) ?? [])
    .map((c) => c.slug.toLowerCase())
    .filter((slug): slug is CircleSlug => CIRCLE_SLUGS.includes(slug as CircleSlug));
}

// ---- Commands ----

export async function cmdCircles(ctx: Context): Promise<void> {
  try {
    const { data: circles, error } = await db()
      .from('stock_circles')
      .select('id, slug, name, coordinator_member_id')
      .order('slug');

    if (error || !circles) {
      await ctx.reply(`Could not fetch circles${error ? `: ${error.message}` : ''}`);
      return;
    }

    type CircleRow = { id: string; slug: string; name: string; coordinator_member_id: string | null };
    const rows = (circles as CircleRow[]) ?? [];

    // Batch lookup coordinator names
    const coordIds = rows.map((c) => c.coordinator_member_id).filter((v): v is string => Boolean(v));
    const coordMap = new Map<string, string>();
    if (coordIds.length > 0) {
      const { data: coords } = await db()
        .from('stock_team_members')
        .select('id, name')
        .in('id', coordIds);
      for (const c of (coords as Array<{ id: string; name: string }> | null) ?? []) {
        coordMap.set(c.id, c.name);
      }
    }

    // Batch member counts
    const { data: allMembers } = await db()
      .from('stock_circle_members')
      .select('circle_id');
    const counts = new Map<string, number>();
    for (const m of (allMembers as Array<{ circle_id: string }> | null) ?? []) {
      counts.set(m.circle_id, (counts.get(m.circle_id) ?? 0) + 1);
    }

    const lines = rows.map((c) => {
      const coord = c.coordinator_member_id ? coordMap.get(c.coordinator_member_id) ?? '(unknown)' : '(unassigned)';
      const count = counts.get(c.id) ?? 0;
      return `• ${c.name} (/${c.slug}) - ${count} member${count === 1 ? '' : 's'} - coordinator: ${coord}`;
    });

    const out = ['Circles:', '', ...lines, '', 'Join: /join <slug> · Leave: /leave <slug> · Mine: /mycircles'].join('\n');
    await ctx.reply(out);
  } catch (err) {
    await ctx.reply(`Could not fetch circles: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

export async function cmdJoin(ctx: Context, member: TeamMember, slug: string): Promise<void> {
  if (!validateCircleSlug(slug)) {
    await ctx.reply(`Unknown circle: ${slug}. Valid: ${CIRCLE_SLUGS.join(', ')}.`);
    return;
  }

  try {
    const circle = await getCircle(slug);
    if (!circle) {
      await ctx.reply(`Circle not found: ${slug}.`);
      return;
    }

    // Check if already member
    const { data: existing } = await db()
      .from('stock_circle_members')
      .select('id')
      .eq('circle_id', circle.id)
      .eq('member_id', member.id)
      .maybeSingle();

    if (existing) {
      await ctx.reply(`You're already in ${circle.name}.`);
      return;
    }

    const { error } = await db()
      .from('stock_circle_members')
      .insert({
        circle_id: circle.id,
        member_id: member.id,
        joined_at: new Date().toISOString(),
      });

    if (error) {
      await ctx.reply(`Could not join: ${error.message}`);
      return;
    }

    await ctx.reply(`Joined **${circle.name}** (${slug}).`);
  } catch (err) {
    await ctx.reply(`Error: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

export async function cmdLeave(ctx: Context, member: TeamMember, slug: string): Promise<void> {
  if (!validateCircleSlug(slug)) {
    await ctx.reply(`Unknown circle: ${slug}.`);
    return;
  }

  try {
    const circle = await getCircle(slug);
    if (!circle) {
      await ctx.reply(`Circle not found: ${slug}.`);
      return;
    }

    const { error } = await db()
      .from('stock_circle_members')
      .delete()
      .eq('circle_id', circle.id)
      .eq('member_id', member.id);

    if (error) {
      await ctx.reply(`Could not leave: ${error.message}`);
      return;
    }

    await ctx.reply(`Left **${circle.name}**.`);
  } catch (err) {
    await ctx.reply(`Error: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

export async function cmdMyCircles(ctx: Context, member: TeamMember): Promise<void> {
  try {
    const circles = await getMemberCircles(member.id);
    if (circles.length === 0) {
      await ctx.reply('You are not in any circles yet. Use /join <circle> to join.');
      return;
    }

    const lines = [];
    for (const slug of circles) {
      const circle = await getCircle(slug);
      if (circle) {
        lines.push(`• **${circle.name}** - coordinator: ${circle.coordinator_name ?? '(unassigned)'}`);
      }
    }

    await ctx.reply(['**Your circles**', '', ...lines].join('\n'));
  } catch (err) {
    await ctx.reply(`Error: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

export async function cmdCoordinators(ctx: Context): Promise<void> {
  try {
    const { data: circles, error } = await db()
      .from('stock_circles')
      .select(`
        slug,
        name,
        coordinator:stock_team_members(name)
      `)
      .order('slug');

    if (error || !circles) {
      await ctx.reply('Could not fetch coordinators.');
      return;
    }

    const lines = (circles as unknown as Array<{ name: string; coordinator: { name: string } | null }>).map((c) => {
      const coord = c.coordinator?.name ?? '(unassigned)';
      return `• ${c.name}: **${coord}**`;
    });

    await ctx.reply(['**Circle coordinators**', '', ...lines].join('\n'));
  } catch (err) {
    await ctx.reply(`Error: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

export async function cmdPropose(ctx: Context, member: TeamMember, args: string): Promise<void> {
  const m = args.match(/^(\S+)\s+(.+?)\s*\|\s*(.+)$/s);
  if (!m) {
    await ctx.reply('Usage: /propose <circle> <title> | <body>\nExample: /propose music Book 3 outdoor stages | We need to finalize sound setup.');
    return;
  }

  const [, slug, title, body] = m;
  if (!validateCircleSlug(slug)) {
    await ctx.reply(`Unknown circle: ${slug}.`);
    return;
  }

  try {
    const circle = await getCircle(slug);
    if (!circle) {
      await ctx.reply(`Circle not found: ${slug}.`);
      return;
    }

    // Check member is in circle
    const { data: isMember } = await db()
      .from('stock_circle_members')
      .select('id')
      .eq('circle_id', circle.id)
      .eq('member_id', member.id)
      .maybeSingle();

    if (!isMember) {
      await ctx.reply(`You must be in ${circle.name} to propose.`);
      return;
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h from now

    const { data: proposal, error } = await db()
      .from('stock_proposals')
      .insert({
        circle_id: circle.id,
        proposer_member_id: member.id,
        title: title.trim(),
        body: body.trim(),
        status: 'open',
        opened_at: now.toISOString(),
        consent_window_ends_at: endsAt.toISOString(),
      })
      .select('id')
      .single();

    if (error || !proposal) {
      await ctx.reply(`Could not create proposal: ${error?.message ?? 'unknown'}`);
      return;
    }

    await ctx.reply(
      [`Proposal created in **${circle.name}**:`, ``, `**${title.trim()}**`, ``, body.trim().slice(0, 200), ``, `ID: \`${proposal.id}\``, `Consent window: 48h`].join(
        '\n',
      ),
    );

    // TODO: notify circle members
  } catch (err) {
    await ctx.reply(`Error: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

export async function cmdProposals(ctx: Context, member: TeamMember): Promise<void> {
  try {
    const { data: circles } = await db()
      .from('stock_circle_members')
      .select('circle_id')
      .eq('member_id', member.id);

    if (!circles || circles.length === 0) {
      await ctx.reply('You are not in any circles. Use /join <circle> to join first.');
      return;
    }

    const circleIds = circles.map((c: { circle_id: string }) => c.circle_id);

    const { data: proposals } = await db()
      .from('stock_proposals')
      .select(`
        id,
        circle:stock_circles(slug, name),
        proposer:stock_team_members(name),
        title,
        status,
        created_at
      `)
      .in('circle_id', circleIds)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (!proposals || proposals.length === 0) {
      await ctx.reply('No open proposals in your circles.');
      return;
    }

    const lines = proposals.map((p: any) => {
      const circle = p.circle as { slug: CircleSlug; name: string } | null;
      return `• [${circle?.slug}] **${p.title}** by ${p.proposer?.name} - \`${p.id}\``;
    });

    await ctx.reply(
      ['**Open proposals**', '', ...lines.slice(0, 10), lines.length > 10 ? `... and ${lines.length - 10} more.` : ''].filter(Boolean).join('\n'),
    );
  } catch (err) {
    await ctx.reply(`Error: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

export async function cmdObject(ctx: Context, member: TeamMember, args: string): Promise<void> {
  const m = args.match(/^(\S+)\s+(.+)$/s);
  if (!m) {
    await ctx.reply('Usage: /object <proposal-id> <reason>');
    return;
  }

  const [, proposalId, reason] = m;

  try {
    const { data: proposal } = await db()
      .from('stock_proposals')
      .select('id, circle_id, status')
      .eq('id', proposalId.trim())
      .maybeSingle();

    if (!proposal) {
      await ctx.reply('Proposal not found.');
      return;
    }

    if (proposal.status !== 'open') {
      await ctx.reply(`Proposal is ${proposal.status}, cannot object.`);
      return;
    }

    // Verify member is in circle
    const { data: isMember } = await db()
      .from('stock_circle_members')
      .select('id')
      .eq('circle_id', proposal.circle_id)
      .eq('member_id', member.id)
      .maybeSingle();

    if (!isMember) {
      await ctx.reply('You must be in this circle to object.');
      return;
    }

    const { error } = await db()
      .from('stock_proposal_objections')
      .insert({
        proposal_id: proposal.id,
        member_id: member.id,
        reason: reason.trim(),
      });

    if (error) {
      await ctx.reply(`Could not record objection: ${error.message}`);
      return;
    }

    await ctx.reply(`Objection recorded: "${reason.trim().slice(0, 100)}${reason.trim().length > 100 ? '...' : ''}"`);

    // TODO: notify proposer
  } catch (err) {
    await ctx.reply(`Error: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

export async function cmdConsent(ctx: Context, member: TeamMember, proposalId: string): Promise<void> {
  try {
    const { data: proposal } = await db()
      .from('stock_proposals')
      .select('id, circle_id, status')
      .eq('id', proposalId.trim())
      .maybeSingle();

    if (!proposal) {
      await ctx.reply('Proposal not found.');
      return;
    }

    if (proposal.status !== 'open') {
      await ctx.reply(`Proposal is ${proposal.status}, cannot consent.`);
      return;
    }

    // Verify member is in circle
    const { data: isMember } = await db()
      .from('stock_circle_members')
      .select('id')
      .eq('circle_id', proposal.circle_id)
      .eq('member_id', member.id)
      .maybeSingle();

    if (!isMember) {
      await ctx.reply('You must be in this circle to consent.');
      return;
    }

    // Log explicit consent (as answered in qa_log)
    const { error } = await db()
      .from('stock_qa_log')
      .insert({
        circle_id: proposal.circle_id,
        member_id_asked: member.id,
        member_id_answered: member.id,
        question_text: `consent-${proposal.id}`,
        answered_at: new Date().toISOString(),
      });

    if (error) {
      await ctx.reply(`Could not record consent: ${error.message}`);
      return;
    }

    await ctx.reply('Consent recorded.');
  } catch (err) {
    await ctx.reply(`Error: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

export async function cmdBuddy(ctx: Context, member: TeamMember): Promise<void> {
  try {
    const { data: existing } = await db()
      .from('stock_buddy_pairings')
      .select('buddy:stock_team_members(name, telegram_username)')
      .eq('new_member_id', member.id)
      .is('ended_at', null)
      .maybeSingle();

    if (existing) {
      const buddy = existing as unknown as { buddy: { name: string; telegram_username: string | null } | null };
      if (buddy.buddy) {
        const tgHandle = buddy.buddy.telegram_username ? `@${buddy.buddy.telegram_username}` : buddy.buddy.name;
        await ctx.reply(`Your buddy: **${buddy.buddy.name}** (${tgHandle})`);
        return;
      }
    }

    // Get member's circles
    const circles = await getMemberCircles(member.id);
    if (circles.length === 0) {
      await ctx.reply('You must be in at least one circle first. Use /join <circle>.');
      return;
    }

    // Find active members in their circles
    const { data: circleIds } = await db()
      .from('stock_circles')
      .select('id')
      .in('slug', circles);

    if (!circleIds || circleIds.length === 0) {
      await ctx.reply('No active circles found.');
      return;
    }

    const { data: potentialBuddies } = await db()
      .from('stock_circle_members')
      .select('member:stock_team_members(id, name, telegram_username)')
      .in('circle_id', circleIds.map((c: { id: string }) => c.id))
      .neq('member_id', member.id);

    if (!potentialBuddies || potentialBuddies.length === 0) {
      await ctx.reply('No other members in your circles yet.');
      return;
    }

    // Pick random
    const typed = potentialBuddies as unknown as Array<{
      member: { id: string; name: string; telegram_username: string | null } | null;
    }>;
    const buddyData = typed[Math.floor(Math.random() * typed.length)];
    const buddy = buddyData.member;

    if (!buddy) {
      await ctx.reply('Could not find buddy.');
      return;
    }

    const { error } = await db()
      .from('stock_buddy_pairings')
      .insert({
        new_member_id: member.id,
        buddy_member_id: buddy.id,
      });

    if (error) {
      await ctx.reply(`Could not pair buddy: ${error.message}`);
      return;
    }

    const tgHandle = buddy.telegram_username ? `@${buddy.telegram_username}` : buddy.name;
    await ctx.reply(`Buddy paired: **${buddy.name}** (${tgHandle}). Reach out and introduce yourself!`);
  } catch (err) {
    await ctx.reply(`Error: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

export async function cmdRespect(ctx: Context, member: TeamMember): Promise<void> {
  try {
    const { data: events } = await db()
      .from('stock_respect_events')
      .select('amount')
      .eq('awarded_to', member.id);

    const total = events?.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0) ?? 0;

    await ctx.reply(`Your ZAOstock Respect: **${total}** points.`);
  } catch (err) {
    await ctx.reply(`Error: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}
