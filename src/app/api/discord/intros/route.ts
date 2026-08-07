import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logger } from '@/lib/logger';

/** Ceiling on the signed-in bulk read. Not authorization - blast radius. */
const BULK_LIMIT = 500;

const introsQuerySchema = z.object({
  discord_id: z
    .string()
    .regex(/^\d{1,32}$/, 'invalid discord_id')
    .nullish(),
  all: z.string().nullish(),
});

/**
 * GET /api/discord/intros — Fetch Discord intro(s)
 * Query params:
 *   ?discord_id=123456789  — get a specific user's intro
 *   ?all=true              — return all intros
 */
export async function GET(req: NextRequest) {
  const parsed = introsQuerySchema.safeParse({
    discord_id: req.nextUrl.searchParams.get('discord_id'),
    all: req.nextUrl.searchParams.get('all'),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }
  const discordId = parsed.data.discord_id ?? null;
  const all = parsed.data.all === 'true';

  if (!discordId && !all) {
    return NextResponse.json({ error: 'Provide discord_id or all=true' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    if (discordId) {
      const { data, error } = await supabase
        .from('discord_intros')
        .select('discord_id, discord_username, intro_text, posted_at')
        .eq('discord_id', discordId)
        .order('posted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('[Discord intros] Query error:', error);
        return NextResponse.json({ intro: null });
      }

      if (!data) {
        return NextResponse.json({ intro: null });
      }

      return NextResponse.json({
        intro: {
          discordId: data.discord_id,
          discordUsername: data.discord_username,
          introText: data.intro_text,
          postedAt: data.posted_at,
        },
      });
    }

    // all=true — the BULK path. This is a member-directory export: every
    // Discord id, username and intro in one anonymous request, and a Discord id
    // is a stable handle someone can be contacted through. Unpaginated bulk
    // reads of member data behind no session is exactly the anonymous-board
    // leak (#2829), so this branch now requires one. The single-id lookup below
    // stays public: it is targeted, and the caller must already know the id.
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json(
        { error: 'Sign in to list all intros. A single intro is available via ?discord_id=' },
        { status: 401 },
      );
    }

    // Even signed in, cap it. A limit is not authorization - it is the blast
    // radius if a session is ever obtained cheaply.
    const { data, error } = await supabase
      .from('discord_intros')
      .select('discord_id, discord_username, intro_text, posted_at')
      .order('posted_at', { ascending: false })
      .limit(BULK_LIMIT);

    if (error) {
      logger.error('[Discord intros] Query error:', error);
      return NextResponse.json({ intros: [], total: 0 });
    }

    return NextResponse.json({
      intros: (data || []).map((d) => ({
        discordId: d.discord_id,
        discordUsername: d.discord_username,
        introText: d.intro_text,
        postedAt: d.posted_at,
      })),
      total: data?.length || 0,
    });
  } catch (err) {
    logger.error('[Discord intros] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
