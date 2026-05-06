// Circles commands: /join /leave /mycircles /circles /coordinators /charter
// 6 circles after May 2026 consolidation: finance, host, livestream, marketing, music, ops.

import { Context } from 'grammy';
import type { TeamMember } from './auth';
import { db } from './supabase';

const CIRCLE_SLUGS = ['finance', 'host', 'livestream', 'marketing', 'music', 'ops'] as const;
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

// Levenshtein for "did you mean" suggestions
function distance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function suggestSlug(input: string): CircleSlug | null {
  const lower = input.toLowerCase().trim();
  if (!lower) return null;
  // substring match first (e.g. "med" -> "media")
  const sub = CIRCLE_SLUGS.find((s) => s.startsWith(lower) || lower.startsWith(s));
  if (sub) return sub;
  // edit distance <= 2
  let best: { slug: CircleSlug; d: number } | null = null;
  for (const s of CIRCLE_SLUGS) {
    const d = distance(lower, s);
    if (d <= 2 && (!best || d < best.d)) best = { slug: s, d };
  }
  return best?.slug ?? null;
}

async function getCircle(slug: CircleSlug): Promise<Circle | null> {
  const { data, error } = await db()
    .from('circles')
    .select('id, slug, name, coordinator_member_id')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as { id: string; slug: CircleSlug; name: string; coordinator_member_id: string | null };

  const { data: members } = await db()
    .from('circle_members')
    .select('member_id')
    .eq('circle_id', row.id);

  let coordinator_name: string | null = null;
  if (row.coordinator_member_id) {
    const { data: coord } = await db()
      .from('team_members')
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
    .from('circle_members')
    .select('circle_id')
    .eq('member_id', memberId);

  if (!rows || rows.length === 0) return [];
  const circleIds = (rows as Array<{ circle_id: string }>).map((r) => r.circle_id);

  const { data: circles } = await db()
    .from('circles')
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
      .from('circles')
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
        .from('team_members')
        .select('id, name')
        .in('id', coordIds);
      for (const c of (coords as Array<{ id: string; name: string }> | null) ?? []) {
        coordMap.set(c.id, c.name);
      }
    }

    // Batch member counts
    const { data: allMembers } = await db()
      .from('circle_members')
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
  const lower = slug.toLowerCase().trim();
  if (!validateCircleSlug(lower)) {
    const suggest = suggestSlug(lower);
    if (suggest) {
      await ctx.reply(`Unknown circle: ${slug}. Did you mean /${suggest}? Reply /join ${suggest} to confirm.`);
    } else {
      await ctx.reply(`Unknown circle: ${slug}. Valid: ${CIRCLE_SLUGS.join(', ')}.`);
    }
    return;
  }

  try {
    const circle = await getCircle(lower);
    if (!circle) {
      await ctx.reply(`Circle not found: ${lower}.`);
      return;
    }

    // Pre-check (composite PK is (member_id, circle_id), so select an actual column)
    const { data: existing } = await db()
      .from('circle_members')
      .select('member_id')
      .eq('circle_id', circle.id)
      .eq('member_id', member.id)
      .maybeSingle();

    if (existing) {
      await ctx.reply(`You're already in ${circle.name}.`);
      return;
    }

    const { error } = await db()
      .from('circle_members')
      .insert({
        circle_id: circle.id,
        member_id: member.id,
        joined_at: new Date().toISOString(),
      });

    if (error) {
      // Belt-and-suspenders: race or pre-check miss -> friendly message
      if (error.code === '23505' || /duplicate key/i.test(error.message)) {
        await ctx.reply(`You're already in ${circle.name}.`);
        return;
      }
      await ctx.reply(`Could not join: ${error.message}`);
      return;
    }

    await ctx.reply(`Joined ${circle.name} (${lower}).`);
  } catch (err) {
    await ctx.reply(`Error: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

export async function cmdLeave(ctx: Context, member: TeamMember, slug: string): Promise<void> {
  const lower = slug.toLowerCase().trim();
  if (!validateCircleSlug(lower)) {
    const suggest = suggestSlug(lower);
    if (suggest) {
      await ctx.reply(`Unknown circle: ${slug}. Did you mean /leave ${suggest}?`);
    } else {
      await ctx.reply(`Unknown circle: ${slug}. Valid: ${CIRCLE_SLUGS.join(', ')}.`);
    }
    return;
  }

  try {
    const circle = await getCircle(lower);
    if (!circle) {
      await ctx.reply(`Circle not found: ${slug}.`);
      return;
    }

    const { error } = await db()
      .from('circle_members')
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
      .from('circles')
      .select('slug, name, coordinator_member_id')
      .order('slug');

    if (error || !circles) {
      await ctx.reply(`Could not fetch coordinators${error ? `: ${error.message}` : ''}`);
      return;
    }

    type Row = { slug: string; name: string; coordinator_member_id: string | null };
    const rows = (circles as Row[]) ?? [];

    const ids = rows.map((c) => c.coordinator_member_id).filter((v): v is string => Boolean(v));
    const nameById = new Map<string, string>();
    if (ids.length > 0) {
      const { data: members } = await db()
        .from('team_members')
        .select('id, name')
        .in('id', ids);
      for (const m of (members as Array<{ id: string; name: string }> | null) ?? []) {
        nameById.set(m.id, m.name);
      }
    }

    const lines = rows.map((c) => {
      const coord = c.coordinator_member_id ? nameById.get(c.coordinator_member_id) ?? '(unknown)' : '(unassigned)';
      return `• ${c.name} (/${c.slug}): ${coord}`;
    });

    await ctx.reply(['Circle coordinators:', '', ...lines].join('\n'));
  } catch (err) {
    await ctx.reply(`Could not fetch coordinators: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}

// /charter <slug?> - Post the circle's responsibility description into the
// current Telegram topic and pin it. Slug is inferred from the topic name
// (case-insensitive, exact match) when omitted, so `/charter` works in any
// of the 6 circle topics in ZAO Festivals.
export async function cmdCharter(ctx: Context, rawSlug?: string): Promise<void> {
  let slug = (rawSlug ?? '').toLowerCase().trim();

  if (!slug) {
    const reply = ctx.message?.reply_to_message;
    const topicName: string | undefined =
      (reply && 'forum_topic_created' in reply && (reply as { forum_topic_created?: { name?: string } }).forum_topic_created?.name) ||
      undefined;
    if (topicName) slug = topicName.toLowerCase().trim();
  }

  if (!slug) {
    await ctx.reply('Usage: /charter <slug>. In a forum topic, the slug is auto-detected from the topic name.');
    return;
  }

  if (!validateCircleSlug(slug)) {
    const guess = suggestSlug(slug);
    await ctx.reply(
      guess
        ? `Unknown circle: ${slug}. Did you mean /charter ${guess}?`
        : `Unknown circle: ${slug}. Valid: ${CIRCLE_SLUGS.join(', ')}.`,
    );
    return;
  }

  try {
    const { data: row, error } = await db()
      .from('circles')
      .select('name, description')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !row) {
      await ctx.reply(`Could not load circle: ${error?.message ?? 'not found'}`);
      return;
    }

    const r = row as { name: string; description: string | null };
    if (!r.description) {
      await ctx.reply(`${r.name} has no description set in the database yet.`);
      return;
    }

    const text = `**${r.name} circle - what we are responsible for**\n\n${r.description}`;
    const threadId = ctx.message?.message_thread_id;
    const chatId = ctx.chat?.id;
    if (chatId == null) {
      await ctx.reply('Could not resolve chat id.');
      return;
    }

    const sent = await ctx.api.sendMessage(chatId, text, {
      message_thread_id: threadId,
      parse_mode: 'Markdown',
    });

    try {
      await ctx.api.pinChatMessage(chatId, sent.message_id, { disable_notification: true });
      await ctx.reply(`Posted + pinned charter for ${r.name}.`, { reply_parameters: { message_id: sent.message_id } });
    } catch (pinErr) {
      await ctx.reply(
        `Posted charter for ${r.name}, but pin failed (need "Pin Messages" admin perm in this chat): ${
          pinErr instanceof Error ? pinErr.message : 'unknown'
        }`,
        { reply_parameters: { message_id: sent.message_id } },
      );
    }
  } catch (err) {
    await ctx.reply(`Error: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}
