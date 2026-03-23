/**
 * AI Content Moderation via Google Perspective API
 *
 * Perspective API is optional — if PERSPECTIVE_API_KEY is not set,
 * all content passes through unmoderated (allow-by-default).
 *
 * Rate limit: 1 QPS on free tier.
 */

export interface ModerationResult {
  flagged: boolean;
  categories: string[];
  scores: Record<string, number>;
  action: 'allow' | 'flag' | 'hide';
}

const PERSPECTIVE_URL =
  'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

const ATTRIBUTES = [
  'TOXICITY',
  'SEVERE_TOXICITY',
  'IDENTITY_ATTACK',
  'INSULT',
  'THREAT',
] as const;

/** Threshold above which a category is considered flagged */
const FLAG_THRESHOLD = 0.8;
/** Threshold for SEVERE_TOXICITY that triggers auto-hide */
const HIDE_THRESHOLD = 0.9;

/**
 * Analyse text with Perspective API.
 * Returns a passthrough result when the API key is missing or text is empty.
 */
export async function moderateContent(
  text: string,
): Promise<ModerationResult> {
  const apiKey = process.env.PERSPECTIVE_API_KEY;

  // Graceful passthrough when disabled
  if (!apiKey || !text.trim()) {
    return { flagged: false, categories: [], scores: {}, action: 'allow' };
  }

  try {
    const requestedAttributes: Record<string, object> = {};
    for (const attr of ATTRIBUTES) {
      requestedAttributes[attr] = {};
    }

    const res = await fetch(`${PERSPECTIVE_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: { text: text.slice(0, 3000) }, // API limit ~3k chars
        languages: ['en'],
        requestedAttributes,
      }),
    });

    if (!res.ok) {
      console.error(
        `[moderation] Perspective API error ${res.status}:`,
        await res.text().catch(() => ''),
      );
      // Fail-open: if the API errors, allow the content
      return { flagged: false, categories: [], scores: {}, action: 'allow' };
    }

    const data = (await res.json()) as {
      attributeScores: Record<
        string,
        { summaryScore: { value: number } }
      >;
    };

    const scores: Record<string, number> = {};
    const flaggedCategories: string[] = [];

    for (const attr of ATTRIBUTES) {
      const score =
        data.attributeScores?.[attr]?.summaryScore?.value ?? 0;
      scores[attr] = Math.round(score * 1000) / 1000; // 3 decimal places
      if (score > FLAG_THRESHOLD) {
        flaggedCategories.push(attr);
      }
    }

    // Determine action
    let action: ModerationResult['action'] = 'allow';
    if (
      scores.SEVERE_TOXICITY !== undefined &&
      scores.SEVERE_TOXICITY > HIDE_THRESHOLD
    ) {
      action = 'hide';
    } else if (flaggedCategories.length > 0) {
      action = 'flag';
    }

    return {
      flagged: flaggedCategories.length > 0,
      categories: flaggedCategories,
      scores,
      action,
    };
  } catch (err) {
    console.error('[moderation] Perspective API request failed:', err);
    // Fail-open
    return { flagged: false, categories: [], scores: {}, action: 'allow' };
  }
}
