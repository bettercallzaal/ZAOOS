import { getHindsightClient } from './hindsight';

// ============================================================================
// Types
// ============================================================================

export interface RecallResult {
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Recall - Retrieve Relevant Memories
// ============================================================================

/**
 * Get up to N most relevant memories for a user bank.
 */
export async function recallMemories(
  userFid: string,
  query: string,
  limit = 10
): Promise<RecallResult[]> {
  try {
    const hindsight = await getHindsightClient();
    if (!hindsight) return [];

    const results = await hindsight.recall(userFid, query, { limit });
    return results;
  } catch (error) {
    console.error(`Failed to recall memories for user ${userFid}:`, error);
    return [];
  }
}

/**
 * Build a prompt with memory context injected for AI context.
 * Used at the start of every agent prompt.
 */
export async function buildPromptWithMemory(
  userFid: string,
  currentMessage: string,
  systemPrompt: string,
  limit = 10
): Promise<string> {
  const memories = await recallMemories(
    userFid,
    currentMessage,
    limit
  );

  if (memories.length === 0) {
    return `${systemPrompt}\n\n${currentMessage}`;
  }

  const reminiscence = [
    `SYSTEM_REMINISCENCE (last updated: ${new Date().toISOString()}, ${memories.length} memories recalled)`,
    '---',
    ...memories.map(m => m.content),
    '---',
    'END_REMINISCENCE',
    '',
    systemPrompt,
    '',
    currentMessage,
  ].join('\n');

  return reminiscence;
}

/**
 * Get relevant memories for a user to inject into AI context.
 * Convenience wrapper for simple use cases.
 */
export async function getUserMemoryContext(
  userFid: string,
  query?: string,
  limit = 10
): Promise<string> {
  const searchQuery = query || 'recent activity preferences interactions';
  const memories = await recallMemories(userFid, searchQuery, limit);

  if (memories.length === 0) {
    return '';
  }

  return [
    `SYSTEM_REMINISCENCE (${memories.length} memories)`,
    '---',
    ...memories.map(m => m.content),
    '---',
    'END_REMINISCENCE',
  ].join('\n');
}

// ============================================================================
// Reflect - Synthesize Taste Profile
// ============================================================================

export const TASTE_REFLECT_PROMPT = `
You are analyzing the recent activity of a ZAO OS community member.
Based on their recent memories (casts, track shares, room participation, Respect transactions),
synthesize a taste profile with the following structure:

1. **Music Preferences** — Genres, artists, vibes they gravitate toward
2. **Community Behavior** — How they engage (supportive, collaborative, competitive, etc.)
3. **Tone & Voice** — How they communicate (formal, casual, hype, introspective, etc.)
4. **Notable Patterns** — Recurring interests or behaviors
5. **Recommended Actions** — How the agent can best support them

Keep it concise: 3–5 sentences per section.
`.trim();

/**
 * Run a reflection query to synthesize insights from memories.
 * Used weekly to update the user's taste profile.
 */
export async function reflectOnMemories(
  userFid: string,
  prompt: string
): Promise<string> {
  try {
    const hindsight = await getHindsightClient();
    if (!hindsight) return '';

    const result = await hindsight.reflect(userFid, prompt);
    return result;
  } catch (error) {
    console.error(`Failed to reflect on memories for user ${userFid}:`, error);
    throw error;
  }
}

/**
 * Run weekly reflection for a user to synthesize their taste profile.
 */
export async function runWeeklyReflection(userFid: string): Promise<string> {
  return reflectOnMemories(userFid, TASTE_REFLECT_PROMPT);
}

/**
 * Filter memories by event type (if Hindsight supports metadata filtering).
 * Note: Depends on Hindsight version - may need adjustment.
 */
export async function recallMemoriesByType(
  userFid: string,
  eventType: string,
  query: string,
  limit = 5
): Promise<RecallResult[]> {
  try {
    const hindsight = await getHindsightClient();
    if (!hindsight) return [];

    // Note: metadataFilter depends on Hindsight version support
    const results = await hindsight.recall(userFid, query, {
      limit,
      metadataFilter: { eventType },
    });
    return results;
  } catch (error) {
    // Fallback to regular recall if metadataFilter not supported
    console.warn(`Metadata filter not supported, falling back to regular recall:`, error);
    return recallMemories(userFid, `${eventType} ${query}`, limit);
  }
}
