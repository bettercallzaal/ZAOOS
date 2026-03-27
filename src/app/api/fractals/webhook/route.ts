// src/app/api/fractals/webhook/route.ts
//
// Receives real-time webhook events from the ZAO Fractal Discord bot.
// Events: fractal_started, vote_cast, round_complete, fractal_complete,
//         fractal_paused, fractal_resumed.
//
// Auth: Bearer token in the Authorization header, validated against
// FRACTAL_BOT_WEBHOOK_SECRET env var. The bot sends via WebIntegration
// class with fire-and-forget semantics (10s timeout).
//
// Storage: writes to fractal_sessions + fractal_scores (same tables used
// by /api/fractals/sessions and /api/fractals/analytics), plus a
// fractal_events audit log table.

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/db/supabase';

// ---------------------------------------------------------------------------
// Zod schemas — one per event type, matching bot's WebIntegration payloads
// (see fractalbotmarch2026/utils/web_integration.py)
// ---------------------------------------------------------------------------

const fractalStartedDataSchema = z.object({
  threadId: z.string(),
  name: z.string(),
  guildId: z.string(),
  facilitatorDiscordId: z.string(),
  participantDiscordIds: z.array(z.string()),
  currentLevel: z.number().int(),
});

const voteCastDataSchema = z.object({
  voterId: z.string(),
  candidateId: z.string(),
  level: z.number().int(),
  totalVotes: z.number().int(),
});

const roundCompleteDataSchema = z.object({
  level: z.number().int(),
  winnerId: z.string(),
  totalVotes: z.number().int(),
  voteDistribution: z.record(z.string(), z.number()),
});

const fractalCompleteResultSchema = z.object({
  discordId: z.string(),
  rank: z.number().int(),
  level: z.number().int(),
});

const fractalCompleteDataSchema = z.object({
  results: z.array(fractalCompleteResultSchema),
  totalRounds: z.number().int(),
});

const fractalPausedDataSchema = z.object({
  currentLevel: z.number().int(),
  pausedAt: z.string().optional(),
});

const fractalResumedDataSchema = z.object({
  currentLevel: z.number().int(),
  resumedAt: z.string().optional(),
});

// Allowed event types
const EVENT_TYPES = [
  'fractal_started',
  'vote_cast',
  'round_complete',
  'fractal_complete',
  'fractal_paused',
  'fractal_resumed',
] as const;

type EventType = (typeof EVENT_TYPES)[number];

// Top-level envelope schema (data is validated per-event below)
const webhookEnvelopeSchema = z.object({
  fractalId: z.string().min(1).max(200),
  event: z.enum(EVENT_TYPES),
  data: z.record(z.string(), z.unknown()),
});

// Map event type to its data schema
const dataSchemas: Record<EventType, z.ZodType> = {
  fractal_started: fractalStartedDataSchema,
  vote_cast: voteCastDataSchema,
  round_complete: roundCompleteDataSchema,
  fractal_complete: fractalCompleteDataSchema,
  fractal_paused: fractalPausedDataSchema,
  fractal_resumed: fractalResumedDataSchema,
};

// Respect points per rank position (matches bot config: config/config.py)
const RESPECT_POINTS = [110, 68, 42, 26, 16, 10];

// ---------------------------------------------------------------------------
// Auth helper — timing-safe comparison to prevent timing attacks
// ---------------------------------------------------------------------------

function timingSafeCompare(a: string, b: string): boolean {
  // HMAC both inputs so digests are always the same length,
  // preventing length-leak via the early-return timing side-channel.
  const key = 'fractal-webhook-compare';
  const aMac = crypto.createHmac('sha256', key).update(a).digest();
  const bMac = crypto.createHmac('sha256', key).update(b).digest();
  return crypto.timingSafeEqual(aMac, bMac);
}

function validateWebhookAuth(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.FRACTAL_BOT_WEBHOOK_SECRET;
  if (!secret) return false;

  // Primary: Bearer token in Authorization header (bot's default method)
  const authHeader = req.headers.get('authorization') ?? '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '');
  if (bearerToken && timingSafeCompare(bearerToken, secret)) {
    return true;
  }

  // Fallback: HMAC signature in x-webhook-signature header
  const hmacHeader = req.headers.get('x-webhook-signature');
  if (hmacHeader) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return timingSafeCompare(hmacHeader, expected);
  }

  // Fallback: plain secret in x-webhook-secret header
  const headerSecret = req.headers.get('x-webhook-secret');
  if (headerSecret && timingSafeCompare(headerSecret, secret)) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    // 1. Fail closed if webhook secret is not configured
    if (!process.env.FRACTAL_BOT_WEBHOOK_SECRET) {
      console.error('[fractal-webhook] FRACTAL_BOT_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    }

    // 2. Read raw body (needed for both HMAC verification and JSON parsing)
    const rawBody = await req.text();

    // 3. Authenticate
    if (!validateWebhookAuth(req, rawBody)) {
      console.warn('[fractal-webhook] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 4. Parse JSON
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // 5. Validate envelope
    const envelopeParsed = webhookEnvelopeSchema.safeParse(body);
    if (!envelopeParsed.success) {
      console.warn('[fractal-webhook] Invalid envelope:', envelopeParsed.error.flatten());
      return NextResponse.json(
        { error: 'Invalid payload', details: envelopeParsed.error.flatten() },
        { status: 400 },
      );
    }

    const { fractalId, event, data } = envelopeParsed.data;

    // 6. Validate event-specific data with its Zod schema
    const dataSchema = dataSchemas[event];
    const dataParsed = dataSchema.safeParse(data);
    if (!dataParsed.success) {
      console.warn(`[fractal-webhook] Invalid ${event} data:`, dataParsed.error.flatten());
      return NextResponse.json(
        { error: `Invalid data for ${event}`, details: dataParsed.error.flatten() },
        { status: 400 },
      );
    }

    const validatedData = dataParsed.data;
    console.log(`[fractal-webhook] ${event} for fractal ${fractalId}`);

    // 7. Process event — update main tables + log to audit table
    const [eventResult] = await Promise.allSettled([
      processEvent(event, fractalId, validatedData),
      logEvent(fractalId, event, validatedData),
    ]);

    // If the main processing failed, return 500 (audit log failure is non-fatal)
    if (eventResult.status === 'rejected') {
      console.error(`[fractal-webhook] ${event} processing failed:`, eventResult.reason);
      return NextResponse.json({ error: 'Failed to process event' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, event });
  } catch (err) {
    console.error('[fractal-webhook] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Event dispatcher
// ---------------------------------------------------------------------------

async function processEvent(event: EventType, fractalId: string, data: unknown) {
  switch (event) {
    case 'fractal_started':
      return handleFractalStarted(fractalId, data as z.infer<typeof fractalStartedDataSchema>);
    case 'vote_cast':
      return handleVoteCast(fractalId, data as z.infer<typeof voteCastDataSchema>);
    case 'round_complete':
      return handleRoundComplete(fractalId, data as z.infer<typeof roundCompleteDataSchema>);
    case 'fractal_complete':
      return handleFractalComplete(fractalId, data as z.infer<typeof fractalCompleteDataSchema>);
    case 'fractal_paused':
      return handleFractalPaused(fractalId);
    case 'fractal_resumed':
      return handleFractalResumed(fractalId);
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

/**
 * fractal_started — insert a new live session into fractal_sessions.
 * Uses discord_thread_id as the natural key for upsert so reconnects
 * do not create duplicate rows.
 */
async function handleFractalStarted(
  fractalId: string,
  data: z.infer<typeof fractalStartedDataSchema>,
) {
  const { error } = await supabaseAdmin
    .from('fractal_sessions')
    .upsert(
      {
        discord_thread_id: fractalId,
        name: data.name,
        session_date: new Date().toISOString().split('T')[0],
        host_name: data.facilitatorDiscordId,
        participant_count: data.participantDiscordIds.length,
        scoring_era: 'ORDAO',
        status: 'active',
        notes: JSON.stringify({
          guildId: data.guildId,
          participantDiscordIds: data.participantDiscordIds,
          currentLevel: data.currentLevel,
          source: 'webhook',
        }),
      },
      { onConflict: 'discord_thread_id', ignoreDuplicates: false },
    );

  if (error) {
    console.error('[fractal-webhook] fractal_started upsert error:', error);
    throw error;
  }
}

/**
 * vote_cast — update the session's live state with latest vote info.
 * Individual votes are captured in the audit log (logEvent) for the
 * real-time feed; the session row just tracks current level + vote count.
 */
async function handleVoteCast(
  fractalId: string,
  data: z.infer<typeof voteCastDataSchema>,
) {
  const { error } = await supabaseAdmin
    .from('fractal_sessions')
    .update({
      notes: JSON.stringify({
        lastVote: {
          voterId: data.voterId,
          candidateId: data.candidateId,
          level: data.level,
          totalVotes: data.totalVotes,
        },
        source: 'webhook',
      }),
    })
    .eq('discord_thread_id', fractalId);

  if (error) {
    console.error('[fractal-webhook] vote_cast update error:', error);
    // Non-fatal: vote is already recorded in the audit log
  }
}

/**
 * round_complete — record the round winner. Updates the session notes
 * with the latest round result for the live indicator.
 */
async function handleRoundComplete(
  fractalId: string,
  data: z.infer<typeof roundCompleteDataSchema>,
) {
  const { error } = await supabaseAdmin
    .from('fractal_sessions')
    .update({
      notes: JSON.stringify({
        lastRound: {
          level: data.level,
          winnerId: data.winnerId,
          voteDistribution: data.voteDistribution,
        },
        source: 'webhook',
      }),
    })
    .eq('discord_thread_id', fractalId);

  if (error) {
    console.error('[fractal-webhook] round_complete update error:', error);
  }
}

/**
 * fractal_complete — mark the session as completed and insert final
 * scores into fractal_scores (the same table queried by
 * /api/fractals/sessions and /api/fractals/analytics).
 */
async function handleFractalComplete(
  fractalId: string,
  data: z.infer<typeof fractalCompleteDataSchema>,
) {
  // 1. Find the session row and mark it completed
  const { data: session, error: findError } = await supabaseAdmin
    .from('fractal_sessions')
    .update({
      status: 'completed',
      notes: JSON.stringify({
        totalRounds: data.totalRounds,
        results: data.results,
        source: 'webhook',
        completedAt: new Date().toISOString(),
      }),
    })
    .eq('discord_thread_id', fractalId)
    .select('id')
    .single();

  if (findError) {
    console.error('[fractal-webhook] fractal_complete session update error:', findError);
    throw findError;
  }

  if (!session?.id) {
    console.error('[fractal-webhook] fractal_complete: no session found for', fractalId);
    return;
  }

  // 2. Insert final scores — same schema as the existing fractal_scores table
  //    used by the sessions and analytics routes.
  const scoreRows = data.results.map((result) => ({
    session_id: session.id,
    member_name: result.discordId,
    rank: result.rank,
    score: RESPECT_POINTS[result.rank - 1] ?? 0,
    // wallet_address will be null — can be resolved later via Discord ID lookup
  }));

  const { error: scoresError } = await supabaseAdmin
    .from('fractal_scores')
    .insert(scoreRows);

  if (scoresError) {
    console.error('[fractal-webhook] fractal_complete scores insert error:', scoresError);
    // Do not throw — the session was already marked complete
  }
}

/**
 * fractal_paused — mark the session as paused.
 */
async function handleFractalPaused(fractalId: string) {
  const { error } = await supabaseAdmin
    .from('fractal_sessions')
    .update({ status: 'paused' })
    .eq('discord_thread_id', fractalId);

  if (error) {
    console.error('[fractal-webhook] fractal_paused update error:', error);
  }
}

/**
 * fractal_resumed — mark the session as active again.
 */
async function handleFractalResumed(fractalId: string) {
  const { error } = await supabaseAdmin
    .from('fractal_sessions')
    .update({ status: 'active' })
    .eq('discord_thread_id', fractalId);

  if (error) {
    console.error('[fractal-webhook] fractal_resumed update error:', error);
  }
}

// ---------------------------------------------------------------------------
// Audit log — fire-and-forget insert into fractal_events table
// ---------------------------------------------------------------------------

async function logEvent(fractalId: string, eventType: string, payload: unknown) {
  const { error } = await supabaseAdmin.from('fractal_events').insert({
    fractal_id: fractalId,
    event_type: eventType,
    payload,
    created_at: new Date().toISOString(),
  });

  if (error) {
    // fractal_events table may not exist yet — log but do not throw.
    // The main event processing should still succeed even if audit logging fails.
    console.error(`[fractal-webhook] Failed to log ${eventType} event:`, error);
  }
}
