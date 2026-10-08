import { timingSafeEqual } from 'node:crypto';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';
import { autoCastToZao } from '@/lib/publish/auto-cast';
import { publishToBluesky } from '@/lib/publish/bluesky';
import { broadcastToChannels } from '@/lib/publish/broadcast';
import { normalizeForBluesky, normalizeForX } from '@/lib/publish/normalize';
import { publishToX } from '@/lib/publish/x';

/**
 * POST /api/publish/compose - compose once, publish to several platforms.
 *
 * The missing orchestrator. ZAO already had every publisher (auto-cast, x,
 * bluesky, broadcast) but nothing that took ONE piece of text and fanned it out:
 * the existing routes mirror an EXISTING Farcaster cast (they require a castHash),
 * and /api/publish/farcaster only publishes governance proposals. So ZOE's POST
 * button had nothing to call and fell back to "approved - paste it".
 *
 * The chain this runs:
 *   1. Farcaster FIRST (autoCastToZao) - it produces the castHash the mirrors need
 *   2. X + Bluesky mirror that cast (they take {castHash, text})
 *   3. Telegram + Discord via broadcastToChannels
 *
 * dryRun (DEFAULT TRUE) validates + reports what WOULD happen and publishes
 * nothing - so the dashboard can be tested safely before anything goes public.
 * Publishing is irreversible, so the safe mode is the default and the caller must
 * explicitly opt out.
 */
const PLATFORMS = ['farcaster', 'x', 'bluesky', 'telegram', 'discord'] as const;
type Platform = (typeof PLATFORMS)[number];

const composeSchema = z.object({
  text: z.string().min(1).max(4096),
  platforms: z.array(z.enum(PLATFORMS)).min(1),
  /** Publish for real. Omitted/false = dry run (nothing leaves the building). */
  dryRun: z.boolean().default(true),
  embedUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
});

/**
 * Bot bearer for ZOE's POST button (doc 2239 section 5, fix 1).
 *
 * ZOE runs on the VPS with no iron-session, so the only way its POST button can
 * reach this route is a shared secret. PUBLISH_BOT_TOKEN, when set and at least
 * 32 characters, is accepted as admin-equivalent on THIS route only. Unset or
 * short means the header is ignored and the session path decides, which is the
 * exact behaviour before this change. The compare is constant-time so a wrong
 * token cannot be guessed byte by byte, and nothing about the token is logged.
 */
const MIN_BOT_TOKEN_LENGTH = 32;

function bearerMatchesBotToken(req: NextRequest): boolean {
  // Trimmed on BOTH sides: a token pasted into an env UI with a trailing
  // newline would otherwise never match and the feature would fail closed
  // without saying why (security review finding 1, 2026-10-07).
  const expected = (process.env.PUBLISH_BOT_TOKEN ?? '').trim();
  if (expected.length < MIN_BOT_TOKEN_LENGTH) return false;
  const header = req.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  const given = Buffer.from(match[1].trim(), 'utf8');
  const want = Buffer.from(expected, 'utf8');
  if (given.length !== want.length) return false;
  return timingSafeEqual(given, want);
}

/** Per-platform hard limits, checked before anything is sent. */
const LIMITS: Record<Platform, number> = {
  farcaster: 320,
  x: 280,
  bluesky: 300,
  telegram: 4096,
  discord: 2000,
};

export interface PlatformOutcome {
  platform: Platform;
  ok: boolean;
  detail: string;
  /** true when this was a dry run (nothing published). */
  simulated: boolean;
}

export async function POST(req: NextRequest) {
  try {
    // Admin only - this publishes to ZAO's official accounts. ZOE's POST button
    // passes with the bot bearer instead of a session (see bearerMatchesBotToken).
    const viaBot = bearerMatchesBotToken(req);
    if (viaBot) {
      // Audit marker: a publish with no session is the bot, never an admin.
      logger.info('publish/compose: authenticated via PUBLISH_BOT_TOKEN bearer (ZOE)');
    } else {
      const session = await getSessionData();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!session.isAdmin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    const parsed = composeSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { text, platforms, dryRun, embedUrl, imageUrl } = parsed.data;

    // Length check FIRST - report every over-limit platform at once rather than
    // failing halfway through a fan-out.
    const tooLong = platforms.filter((p) => text.length > LIMITS[p]);
    if (tooLong.length > 0) {
      return NextResponse.json(
        {
          error: 'Text too long for selected platforms',
          details: tooLong.map((p) => `${p}: ${text.length}/${LIMITS[p]}`),
        },
        { status: 400 },
      );
    }

    const results: PlatformOutcome[] = [];
    let castHash: string | null = null;

    // 1. Farcaster first - the mirrors need its hash.
    if (platforms.includes('farcaster')) {
      if (dryRun) {
        results.push({
          platform: 'farcaster',
          ok: true,
          detail: 'would cast to /zao',
          simulated: true,
        });
      } else {
        castHash = await autoCastToZao(text, embedUrl);
        results.push({
          platform: 'farcaster',
          ok: Boolean(castHash),
          detail: castHash ? `cast ${castHash}` : 'failed (signer/API key missing or Neynar error)',
          simulated: false,
        });
      }
    }

    // 2. Mirrors - X and Bluesky take the cast hash. Without a real cast (dry run,
    // or Farcaster not selected/failed) we use a placeholder marker so the mirror
    // still validates but never claims a link it does not have.
    const mirrorHash = castHash ?? 'compose-no-cast';

    if (platforms.includes('x')) {
      if (dryRun) {
        results.push({ platform: 'x', ok: true, detail: 'would post to X', simulated: true });
      } else {
        // publishToX takes NormalizedContent and THROWS on failure - catch so one
        // platform's outage never aborts the rest of the fan-out.
        try {
          const r = await publishToX(
            normalizeForX({
              text,
              castHash: mirrorHash,
              embedUrls: embedUrl ? [embedUrl] : undefined,
              imageUrls: imageUrl ? [imageUrl] : undefined,
            }),
          );
          results.push({ platform: 'x', ok: true, detail: r.tweetUrl, simulated: false });
        } catch (e: unknown) {
          results.push({
            platform: 'x',
            ok: false,
            detail: e instanceof Error ? e.message : 'failed',
            simulated: false,
          });
        }
      }
    }

    if (platforms.includes('bluesky')) {
      if (dryRun) {
        results.push({
          platform: 'bluesky',
          ok: true,
          detail: 'would post to Bluesky',
          simulated: true,
        });
      } else {
        try {
          const r = await publishToBluesky(
            normalizeForBluesky({
              text,
              castHash: mirrorHash,
              embedUrls: embedUrl ? [embedUrl] : undefined,
              imageUrls: imageUrl ? [imageUrl] : undefined,
            }),
          );
          results.push({ platform: 'bluesky', ok: true, detail: r.postUrl, simulated: false });
        } catch (e: unknown) {
          results.push({
            platform: 'bluesky',
            ok: false,
            detail: e instanceof Error ? e.message : 'failed',
            simulated: false,
          });
        }
      }
    }

    // 3. Telegram + Discord in one call.
    const wantsBroadcast = platforms.includes('telegram') || platforms.includes('discord');
    if (wantsBroadcast) {
      if (dryRun) {
        for (const p of ['telegram', 'discord'] as const) {
          if (platforms.includes(p)) {
            results.push({
              platform: p,
              ok: true,
              detail: `would broadcast to ${p}`,
              simulated: true,
            });
          }
        }
      } else {
        // Pass the selection through. broadcastToChannels defaults to BOTH
        // channels, so calling it because EITHER was ticked used to publish to
        // both - an irreversible send to a public channel the admin did not
        // select, and one this response never reported.
        const b = await broadcastToChannels({
          text,
          imageUrl,
          castHash: castHash ?? undefined,
          channels: {
            telegram: platforms.includes('telegram'),
            discord: platforms.includes('discord'),
          },
        });
        if (platforms.includes('telegram')) {
          results.push({
            platform: 'telegram',
            ok: b.telegram.success,
            detail: b.telegram.error ?? 'sent',
            simulated: false,
          });
        }
        if (platforms.includes('discord')) {
          results.push({
            platform: 'discord',
            ok: b.discord.success,
            detail: b.discord.error ?? 'sent',
            simulated: false,
          });
        }
      }
    }

    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0 && !dryRun) {
      logger.error('[publish/compose] some platforms failed', { failed });
    }

    return NextResponse.json({
      success: failed.length === 0,
      data: { dryRun, castHash, results, chars: text.length },
    });
  } catch (error: unknown) {
    logger.error('[publish/compose] unhandled error', error);
    return NextResponse.json({ error: 'Publish failed' }, { status: 500 });
  }
}
