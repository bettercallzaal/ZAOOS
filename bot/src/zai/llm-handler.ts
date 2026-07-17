/**
 * llm-handler.ts — Answer questions about the live conversation using Claude.
 *
 * Takes the current transcript and a question, calls Claude with context,
 * and returns an answer. Uses environment-configured model (Claude 3.5 Sonnet
 * by default via ANTHROPIC_API_KEY).
 */

import type { TranscriptLine, TranscriptSummary } from './types';

interface LLMResponse {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Ask a question about the conversation transcript.
 * Returns an answer + confidence level.
 */
export async function answerQuestion(question: string, transcript: TranscriptLine[]): Promise<LLMResponse> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured for ZAI Q&A');
  }

  const model = process.env.ZAI_LLM_MODEL || DEFAULT_MODEL;
  const transcriptText = formatTranscriptForContext(transcript);

  const systemPrompt = `You are ZAI, a warm and approachable ZAO community assistant. You help participants understand conversations happening in real-time.

When asked about a live Discord voice conversation, you:
1. Read the live transcript carefully
2. Extract the key information requested
3. Respond in plain, conversational language (not academic or formal)
4. Cite specific speakers when relevant
5. Admit when information isn't in the transcript yet

Keep answers concise (2-4 sentences usually) and friendly.`;

  const userMessage = `Here is the live transcript so far:

${transcriptText}

The user asks: "${question}"

Please answer their question based on what you see in the transcript.`;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Claude API ${response.status}: ${detail.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.[0]?.text || '';

    return {
      answer: text.trim(),
      confidence: transcript.length > 20 ? 'high' : 'medium',
    };
  } catch (err) {
    console.error('LLM query failed:', err);
    throw err;
  }
}

/**
 * Generate a summary + action items from the full transcript.
 * Called by /summary command.
 */
export async function summarizeTranscript(transcript: TranscriptLine[]): Promise<TranscriptSummary> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured for ZAI summaries');
  }

  const model = process.env.ZAI_LLM_MODEL || DEFAULT_MODEL;
  const transcriptText = formatTranscriptForContext(transcript);
  const duration = transcript.length > 0 ? getDurationMinutes(transcript) : 0;

  const systemPrompt = `You are ZAI, a warm community assistant. Create a brief, friendly summary of a Discord conversation.

Return JSON with:
- title: short conversational title (5-8 words)
- overview: 1-2 sentences of what happened
- actionItems: array of specific action items or decisions (if any)
- keyTopics: array of main topics discussed (3-5 topics)

Keep language warm and plain-spoken, not formal. Focus on what matters to the community.`;

  const userMessage = `Summarize this Discord conversation:

${transcriptText}

Return valid JSON.`;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Claude API ${response.status}: ${detail.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.[0]?.text || '{}';

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      title: parsed.title || 'Voice Channel Summary',
      overview: parsed.overview || 'Discussion captured',
      actionItems: parsed.actionItems || [],
      keyTopics: parsed.keyTopics || [],
      duration,
    };
  } catch (err) {
    console.error('Summary generation failed:', err);
    // Return minimal summary on error
    return {
      title: 'Voice Channel Summary',
      overview: 'Transcript captured (summary unavailable)',
      actionItems: [],
      keyTopics: [],
      duration,
    };
  }
}

function formatTranscriptForContext(transcript: TranscriptLine[]): string {
  // Limit to last 50 lines to keep context manageable
  const recent = transcript.slice(-50);
  return recent.map((line) => `[${line.timestamp.toLocaleTimeString()}] ${line.speaker}: ${line.text}`).join('\n');
}

function getDurationMinutes(transcript: TranscriptLine[]): number {
  if (transcript.length < 2) return 0;
  const start = transcript[0].timestamp.getTime();
  const end = transcript[transcript.length - 1].timestamp.getTime();
  return Math.round((end - start) / 60000);
}
