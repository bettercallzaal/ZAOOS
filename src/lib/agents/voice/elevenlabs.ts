import { logger } from '@/lib/logger';

/**
 * ElevenLabs Conversational-AI (ConvAI) server helper.
 *
 * Mints a short-lived signed WebRTC/WebSocket URL for a ConvAI agent. The API
 * key is read server-side only and is NEVER exposed to the browser.
 *
 * This deliberately fixes the pattern in Songjam's `agent-conversation.tsx`,
 * which shipped the agent id to the client via `NEXT_PUBLIC_ADAM_AGENT` and
 * started the session client-side with no auth. See
 * `research/dev-workflows/815-songjam-site-fork-audit/`.
 */

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

export interface SignedConversationUrl {
  signedUrl: string;
  agentId: string;
}

interface SignedUrlResponse {
  signed_url?: string;
}

/**
 * Request a signed ConvAI conversation URL for the given agent.
 *
 * @throws if `ELEVENLABS_API_KEY` is unset or the upstream request fails.
 */
export async function getSignedConversationUrl(
  agentId: string,
): Promise<SignedConversationUrl> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not configured');

  const res = await fetch(
    `${ELEVENLABS_API_BASE}/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(agentId)}`,
    {
      method: 'GET',
      headers: { 'xi-api-key': apiKey },
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    logger.error('[voice-agent] signed-url request failed', res.status, detail);
    throw new Error(`ElevenLabs signed-url request failed: ${res.status}`);
  }

  const data = (await res.json()) as SignedUrlResponse;
  if (!data.signed_url) {
    throw new Error('ElevenLabs response missing signed_url');
  }

  return { signedUrl: data.signed_url, agentId };
}
