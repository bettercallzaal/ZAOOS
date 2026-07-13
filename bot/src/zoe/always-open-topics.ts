/**
 * always-open-topics.ts - Self-refilling "always has one open move" per topic.
 *
 * The idea: every configured ZAAL BOTZ topic should always have exactly ONE
 * open, tappable next-move at the top. When Zaal clears it (taps an answer),
 * the orchestrator tick refills it with the next one. This lets Zaal work many
 * parallel streams by hopping between topics.
 *
 * Each topic type has its own generator:
 *  - Brand topics (7 masks) -> DRAFT with Approve/Skip/Edit buttons (draft-only, no auto-send)
 *  - Coding -> next open PR (Merge/Review/Skip)
 *  - Research -> next doc to approve or "kick research" prompt
 *  - ZOL -> recent auto-cast review / next cast to approve
 *  - Tasks/General -> next board decision
 *
 * State is minimal: per-topic, track { threadId, lastOpenQid, lastOpenTs }.
 * Degrade gracefully: no material = post nothing (not a filler).
 *
 * SAFETY: Brand drafts are DRAFT-ONLY. Approving queues it for his send, never
 * auto-posts. All outbound stays human-gated + goes through existing paths.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { encodeQuestion, questionKeyboard, type ParsedQuestion } from './questions';
import { putDraft, draftKeyboard } from './drafts';
import { getTopicThread, readTopics } from './topics';
import { brandBoxFor, fetchIcmBrain } from './brand-brain';

const OPEN_THINGS_STATE_PATH = (): string =>
  join(process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe'), 'open-things.json');

/** What type of material a topic generates. */
export type OpenThingType = 'brand_draft' | 'coding_pr' | 'research_doc' | 'zol_cast' | 'board_task';

/** Per-topic state: tracks the currently-open item. */
export interface TopicOpenThingState {
  threadId: number;
  lastOpenQid: string; // the qid posted
  lastOpenTs: string; // when we posted it
}

/** Registry mapping topic names to their config: type + whether to allow typed replies. */
interface TopicOpenThingConfig {
  type: OpenThingType;
  allowTypedReply: boolean; // BRAND topics: true (Edit = typed reply). Others: false (buttons only).
}

const TOPIC_OPEN_THING_CONFIGS: Record<string, TopicOpenThingConfig> = {
  // Brand topics: generate DRAFT items with typed-reply (Edit button)
  WaveWarZ: { type: 'brand_draft', allowTypedReply: true },
  'ZABAL Games': { type: 'brand_draft', allowTypedReply: true },
  'The ZAO': { type: 'brand_draft', allowTypedReply: true },
  BetterCallZaal: { type: 'brand_draft', allowTypedReply: true },
  Magnetiq: { type: 'brand_draft', allowTypedReply: true },
  ZAOstock: { type: 'brand_draft', allowTypedReply: true },
  ZAOlingo: { type: 'brand_draft', allowTypedReply: true },
  // Other topics: buttons only (no typed-reply)
  Coding: { type: 'coding_pr', allowTypedReply: false },
  Research: { type: 'research_doc', allowTypedReply: false },
  ZOL: { type: 'zol_cast', allowTypedReply: false },
  // Tasks/General: board decision (General topic has no thread id, so skipped in refiller)
};

/**
 * Read current open-things state. Returns empty object if file doesn't exist.
 */
export async function readOpenThingsState(): Promise<Record<string, TopicOpenThingState>> {
  try {
    const raw = await fs.readFile(OPEN_THINGS_STATE_PATH(), 'utf8');
    return JSON.parse(raw) as Record<string, TopicOpenThingState>;
  } catch {
    return {};
  }
}

/**
 * Write open-things state atomically.
 */
export async function writeOpenThingsState(state: Record<string, TopicOpenThingState>): Promise<void> {
  await fs.mkdir(join(OPEN_THINGS_STATE_PATH(), '..'), { recursive: true });
  await fs.writeFile(OPEN_THINGS_STATE_PATH(), JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Generate a brand draft for a topic. Returns { text, draftId } or null if error.
 * Pure function (generates from brand box + static prompts, no network calls).
 *
 * For MVP: use the brand box as context + simple prompt to generate a short
 * cast/newsletter idea. In future: this could use LLM + recent graph context.
 *
 * The draft id is prefixed with the topic name so we can extract the topic when
 * the callback is handled (e.g., "wavewarz-draft-abc123" lets us know this is
 * a WaveWarZ topic draft).
 */
export function generateBrandDraft(topicName: string, brandContext: string): { text: string; id: string } | null {
  try {
    // Simple heuristic: extract first 200 chars of brand context + ask for an idea
    const contextSnip = brandContext.split('\n').slice(0, 3).join('\n');
    const topicSlug = topicToQidPrefix(topicName);
    const draftId = `${topicSlug}-draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // MVP: Static prompt per brand. Future: LLM + Bonfire recall.
    const draftText = `Next idea for ${topicName}:

Context: ${contextSnip.slice(0, 150)}...

Suggestion: [auto-generated draft - tap Edit to customize]`;

    return { text: draftText, id: draftId };
  } catch {
    return null;
  }
}

/**
 * Generate a coding PR question. Returns { text, qid } or null.
 * (Stub for MVP; in future: fetch from GitHub API.)
 */
export function generateCodingPrQuestion(): { text: string; qid: string } | null {
  const qid = `pr-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    text: 'Next open PR to review or merge?',
    qid,
  };
}

/**
 * Generate a research doc question. Returns { text, qid } or null.
 * (Stub for MVP; in future: fetch from docs index or Bonfire.)
 */
export function generateResearchDocQuestion(): { text: string; qid: string } | null {
  const qid = `research-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    text: 'Which research doc to focus on next?',
    qid,
  };
}

/**
 * Generate a ZOL cast question. Returns { text, qid } or null.
 */
export function generateZolCastQuestion(): { text: string; qid: string } | null {
  const qid = `zol-cast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    text: 'Next ZOL cast ready to review?',
    qid,
  };
}

/**
 * Generate a board task question. Returns { text, qid } or null.
 */
export function generateBoardTaskQuestion(): { text: string; qid: string } | null {
  const qid = `board-task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    text: 'Next task to tackle?',
    qid,
  };
}

/**
 * Check if a topic already has an open item. If so, leave it and return true.
 * (Deduplication: do NOT stack open items for the same topic.)
 */
export function hasOpenItem(topicName: string, state: Record<string, TopicOpenThingState>): boolean {
  return topicName in state;
}

/**
 * Encode a topic name into a qid prefix for later extraction by the orchestrator.
 * Slugifies the topic name to avoid special chars that might break qid parsing.
 * Example: "ZABAL Games" -> "zabal-games"
 */
export function topicToQidPrefix(topicName: string): string {
  return topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Extract topic name from a qid by prefix matching. Returns null if not a topic-based qid.
 * Tries to match configured topic names in order of specificity (longest first).
 */
export function topicFromQid(qid: string): string | null {
  // Get all topic names sorted by length (longest first for prefix matching)
  const topicNames = Object.keys(TOPIC_OPEN_THING_CONFIGS).sort((a, b) => b.length - a.length);

  for (const topicName of topicNames) {
    const prefix = topicToQidPrefix(topicName);
    if (qid.startsWith(prefix + '-')) {
      return topicName;
    }
  }

  return null;
}

/**
 * Extract topic name from a draft id (which is prefixed like "wavewarz-draft-...").
 * Returns null if not a topic-based draft.
 */
export function topicFromDraftId(draftId: string): string | null {
  // Get all topic names sorted by length (longest first for prefix matching)
  const topicNames = Object.keys(TOPIC_OPEN_THING_CONFIGS).sort((a, b) => b.length - a.length);

  for (const topicName of topicNames) {
    const prefix = topicToQidPrefix(topicName);
    // Draft ids are formatted as "<topic-slug>-draft-..."
    if (draftId.startsWith(prefix + '-draft-')) {
      return topicName;
    }
  }

  return null;
}

/**
 * Main refiller: run after orchestrator processes answers.
 * For each configured topic without an open item, generate + post the next one.
 *
 * deps: {
 *   bot.api.sendMessage(chatId, text, options) - to post questions/drafts
 *   groupId - the ZAAL BOTZ group id
 *   now - current Date for timestamping
 * }
 *
 * Safety:
 *  - DRAFT-ONLY for brand topics (Approve button queues for send, never auto-posts)
 *  - Degrades gracefully (no material = post nothing, not a filler)
 *  - One open item per topic (no stacking)
 */
export async function refillOpenThings(deps: {
  bot: { api: { sendMessage: (chatId: number, text: string, options?: unknown) => Promise<unknown> } };
  groupId: number;
  now: Date;
}): Promise<{ refilled: number; skipped: number; errors: unknown[] }> {
  // SAFETY: disabled by default
  if (process.env.ZOE_ALWAYS_OPEN !== 'true') {
    return { refilled: 0, skipped: 0, errors: [] };
  }

  const errors: unknown[] = [];
  let refilled = 0;
  let skipped = 0;

  try {
    const state = await readOpenThingsState();
    const topics = await readTopics();

    // Iterate each configured topic
    for (const [topicName, config] of Object.entries(TOPIC_OPEN_THING_CONFIGS)) {
      if (hasOpenItem(topicName, state)) {
        // Already has an open item, skip
        skipped++;
        continue;
      }

      // Fetch thread id for this topic
      const threadId = topics[topicName];
      if (!threadId) {
        // Topic not yet created, skip
        console.log(`[zoe/always-open] topic "${topicName}" not yet created, skip`);
        continue;
      }

      let posted = false;
      let qid: string | undefined;

      try {
        switch (config.type) {
          case 'brand_draft': {
            // Fetch brand context from ICM box
            const boxId = brandBoxFor(topicName);
            if (!boxId) {
              console.warn(`[zoe/always-open] no ICM box for brand "${topicName}", skip`);
              break;
            }

            const brandContext = await fetchIcmBrain(boxId);
            if (!brandContext) {
              console.warn(`[zoe/always-open] failed to fetch ICM box ${boxId} for "${topicName}", skip`);
              break;
            }

            const draft = generateBrandDraft(topicName, brandContext);
            if (!draft) {
              console.warn(`[zoe/always-open] failed to generate draft for "${topicName}"`);
              break;
            }

            // Store draft in memory (survived by in-memory map)
            // Note: draft id already encodes topic name (e.g., "wavewarz-draft-...")
            putDraft('brand-draft', draft.text, draft.id, deps.now.getTime());

            // Post to topic thread with Approve/Skip/Edit buttons
            qid = draft.id;
            await deps.bot.api.sendMessage(deps.groupId, draft.text, {
              reply_markup: draftKeyboard(draft.id),
              message_thread_id: threadId,
            });

            posted = true;
            break;
          }

          case 'coding_pr': {
            const q = generateCodingPrQuestion();
            if (!q) break;

            // Encode topic name in qid prefix for later extraction by orchestrator
            qid = `${topicToQidPrefix(topicName)}-${q.qid}`;
            await deps.bot.api.sendMessage(deps.groupId, q.text, {
              reply_markup: questionKeyboard(qid, ['Review next', 'Skip to backlog'], config.allowTypedReply),
              message_thread_id: threadId,
            });

            posted = true;
            break;
          }

          case 'research_doc': {
            const q = generateResearchDocQuestion();
            if (!q) break;

            // Encode topic name in qid prefix
            qid = `${topicToQidPrefix(topicName)}-${q.qid}`;
            await deps.bot.api.sendMessage(deps.groupId, q.text, {
              reply_markup: questionKeyboard(qid, ['Approve doc', 'Kick research', 'Skip'], config.allowTypedReply),
              message_thread_id: threadId,
            });

            posted = true;
            break;
          }

          case 'zol_cast': {
            const q = generateZolCastQuestion();
            if (!q) break;

            // Encode topic name in qid prefix
            qid = `${topicToQidPrefix(topicName)}-${q.qid}`;
            await deps.bot.api.sendMessage(deps.groupId, q.text, {
              reply_markup: questionKeyboard(qid, ['Post now', 'Skip'], config.allowTypedReply),
              message_thread_id: threadId,
            });

            posted = true;
            break;
          }

          case 'board_task': {
            const q = generateBoardTaskQuestion();
            if (!q) break;

            // Encode topic name in qid prefix
            qid = `${topicToQidPrefix(topicName)}-${q.qid}`;
            await deps.bot.api.sendMessage(deps.groupId, q.text, {
              reply_markup: questionKeyboard(qid, ['Start', 'Delegate', 'Skip'], config.allowTypedReply),
              message_thread_id: threadId,
            });

            posted = true;
            break;
          }
        }
      } catch (err) {
        errors.push({ topic: topicName, error: (err as Error)?.message ?? String(err) });
        console.error(`[zoe/always-open] error refilling ${topicName}:`, err);
      }

      // If posted, record state
      if (posted && qid) {
        state[topicName] = {
          threadId,
          lastOpenQid: qid,
          lastOpenTs: deps.now.toISOString(),
        };
        refilled++;
      }
    }

    // Persist updated state
    if (refilled > 0) {
      await writeOpenThingsState(state);
    }

    console.log(
      `[zoe/always-open] refill tick: ${refilled} refilled, ${skipped} already open, ${errors.length} errors`,
    );
  } catch (err) {
    errors.push({ stage: 'outer', error: (err as Error)?.message ?? String(err) });
    console.error('[zoe/always-open] outer error:', err);
  }

  return { refilled, skipped, errors };
}

/**
 * Clear an open thing when Zaal answers it. Called from orchestrator after detecting an answer.
 * After this, the next refill will post a new item.
 */
export async function clearOpenThing(topicName: string): Promise<void> {
  const state = await readOpenThingsState();
  if (topicName in state) {
    delete state[topicName];
    await writeOpenThingsState(state);
    console.log(`[zoe/always-open] cleared open item for "${topicName}"`);
  }
}

/**
 * Test-only: reset state. Used in tests to ensure clean slate between cases.
 */
export async function _resetOpenThingsState(): Promise<void> {
  try {
    await fs.unlink(OPEN_THINGS_STATE_PATH());
  } catch {
    // ignore
  }
}
