/**
 * Generate an AI summary of a fishbowl transcript using Claude API.
 */
export async function generateTranscriptSummary(
  roomTitle: string,
  transcripts: Array<{ speaker_name: string; speaker_role: string; text: string; started_at: string }>
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || transcripts.length === 0) return null;

  const transcriptText = transcripts
    .map((t) => `[${t.speaker_role}] ${t.speaker_name}: ${t.text}`)
    .join('\n');

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Summarize this fishbowl conversation titled "${roomTitle}" in 2-3 concise paragraphs. Focus on key topics discussed, decisions made, and notable quotes. Keep it under 200 words.\n\nTranscript:\n${transcriptText}`,
          },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch {
    return null;
  }
}
