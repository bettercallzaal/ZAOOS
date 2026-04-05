/**
 * Generate an AI summary of a fishbowl transcript.
 * Uses Minimax (primary) or Anthropic (fallback).
 */
export async function generateTranscriptSummary(
  roomTitle: string,
  transcripts: Array<{ speaker_name: string; speaker_role: string; text: string; started_at: string }>
): Promise<string | null> {
  if (transcripts.length === 0) return null;

  const transcriptText = transcripts
    .map((t) => `[${t.speaker_role}] ${t.speaker_name}: ${t.text}`)
    .join('\n');

  const prompt = `Summarize this fishbowl conversation titled "${roomTitle}" in 2-3 concise paragraphs. Focus on key topics discussed, decisions made, and notable quotes. Keep it under 200 words.\n\nTranscript:\n${transcriptText}`;

  // Try Minimax first
  const minimaxKey = process.env.MINIMAX_API_KEY;
  if (minimaxKey) {
    try {
      const endpoint = process.env.MINIMAX_API_URL || 'https://api.minimax.io/v1/chat/completions';
      const model = process.env.MINIMAX_MODEL || 'MiniMax-M2.7';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${minimaxKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
      }
    } catch {
      // Fall through to Anthropic
    }
  }

  // Fallback to Anthropic
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.content?.[0]?.text || null;
      }
    } catch {
      // Silent fail
    }
  }

  return null;
}
