import { ENV } from '@/lib/env';

const LIBRARY_SYSTEM_PROMPT = `You are a research assistant for The ZAO — an artist-first decentralized community focused on bringing profit margins, data ownership, and IP rights back to independent artists. ZAO operates on Farcaster and includes governance, music curation, and cross-platform publishing. Summarize this item and explain how it could be relevant to ZAO's mission.`;

interface MinimaxResult {
  summary: string | null;
  error: string | null;
}

/**
 * Call Minimax API directly to generate a research summary.
 * Returns null summary + error string on failure.
 */
export async function generateResearchSummary(content: string): Promise<MinimaxResult> {
  if (!ENV.MINIMAX_API_KEY) {
    return { summary: null, error: 'Minimax not configured' };
  }

  try {
    const endpoint = ENV.MINIMAX_API_URL || 'https://api.minimaxi.com/v1/text/chatcompletion_v2';
    const model = ENV.MINIMAX_MODEL || 'MiniMax-M2.7';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ENV.MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: LIBRARY_SYSTEM_PROMPT },
          { role: 'user', content },
        ],
        max_tokens: 1000,
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error('[library/minimax] API error:', res.status, text);
      return { summary: null, error: `Minimax API error: ${res.status}` };
    }

    const data = JSON.parse(text);
    const summary =
      data?.choices?.[0]?.message?.content ??
      data?.reply ??
      null;

    if (!summary) {
      return { summary: null, error: 'No summary in Minimax response' };
    }

    return { summary, error: null };
  } catch (err) {
    console.error('[library/minimax] Unexpected error:', err);
    return { summary: null, error: 'Minimax request failed' };
  }
}
