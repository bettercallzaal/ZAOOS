import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSignedConversationUrl } from '@/lib/agents/voice/elevenlabs';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

/**
 * Mint a short-lived signed ElevenLabs ConvAI URL for a space voice agent.
 *
 * Session-gated and agent-allowlisted: a caller can only start a session for a
 * known agent slug, and only the server ever sees the ElevenLabs API key.
 */

const BodySchema = z.object({
  agent: z.enum(['zoe']).default('zoe'),
});

// Allowlist of agent slugs -> env-configured agent IDs. Resolved per-request so
// the route returns 503 (not a load-time throw) when an agent is unconfigured,
// and stays trivially testable. Prevents callers requesting arbitrary agents.
function resolveAgentId(agent: 'zoe'): string | undefined {
  const agents: Record<'zoe', string | undefined> = {
    zoe: process.env.ELEVENLABS_SPACE_AGENT_ID,
  };
  return agents[agent];
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid && !session?.walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const agentId = resolveAgentId(parsed.data.agent);
    if (!agentId) {
      return NextResponse.json({ error: 'Voice agent not configured' }, { status: 503 });
    }

    const { signedUrl } = await getSignedConversationUrl(agentId);
    return NextResponse.json({ success: true, signedUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[voice-agent/token] failed:', message);
    return NextResponse.json({ error: 'Failed to start voice session' }, { status: 500 });
  }
}
