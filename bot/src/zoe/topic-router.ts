/**
 * topic-router.ts - map a ZAAL BOTZ forum topic to a behavior.
 *
 * "Topic = intent" (Zaal's call 2026-07-11): when Zaal drops a plain message
 * into a topic, ZOE auto-acts per that topic instead of just chatting. Internal
 * actions (research, capture, draft) happen immediately; anything OUTBOUND
 * (posting a cast, publishing) is drafted with an Approve button and never fires
 * without his tap - the standing money/public/irreversible gate.
 *
 * This module is a PURE classifier (name -> action) plus a thread-id -> name
 * lookup off topics.json, so index.ts owns all the bot/api side-effects and the
 * routing table stays unit-testable.
 */
import { readTopics } from './topics';

/** What ZOE does with a plain message dropped into a topic. */
export type TopicAction =
  | { kind: 'research' }
  /** Run the coder+critic auto-PR pipeline; report the PR link in the topic. */
  | { kind: 'coding' }
  /** File a tagged capture on the cowork board under `project`. */
  | { kind: 'capture'; project: string }
  /** Draft the topic-appropriate thing + Approve button. `draftKind` selects the
   *  Post-side routing; `alsoCapture` (if set) also files a tagged note. */
  | { kind: 'draft'; draftKind: string; label: string; alsoCapture?: string }
  /** No special behavior - normal ZOE conversation (Handoffs, Claude Code, etc). */
  | { kind: 'chat' };

/**
 * The routing table. Topic names match the ones ZOE created via createForumTopic
 * (stored in topics.json). Unknown / passive topics fall through to chat.
 */
export function routeTopic(topicName: string | undefined): TopicAction {
  switch (topicName) {
    case 'Research':
      return { kind: 'research' };
    case 'Coding':
      return { kind: 'coding' };
    case 'Ideas':
      return { kind: 'capture', project: 'ideas' };
    case 'Newsletter':
      return { kind: 'draft', draftKind: 'newsletter', label: 'Newsletter draft' };
    case 'Farcaster':
      return { kind: 'draft', draftKind: 'farcaster-cast', label: 'Farcaster draft' };
    case 'ZOL':
      return { kind: 'draft', draftKind: 'zol-cast', label: 'ZOL draft' };
    case 'WaveWarZ':
      return {
        kind: 'draft',
        draftKind: 'wavewarz-cast',
        label: 'WaveWarZ draft',
        alsoCapture: 'wavewarz',
      };
    case 'ZABAL Games':
      return {
        kind: 'draft',
        draftKind: 'zabal-cast',
        label: 'ZABAL Games draft',
        alsoCapture: 'zabal-games',
      };
    default:
      // Handoffs + Claude Code are passive (auto-surface only); anything unknown
      // is just a chat room.
      return { kind: 'chat' };
  }
}

/**
 * Resolve a forum thread id to its topic name via topics.json. Falls back to the
 * Research env thread so the Research topic still routes even if topics.json is
 * missing it. Returns undefined for the group's General thread (no id) or an
 * unmapped topic.
 */
export async function topicNameForThread(
  threadId: number | undefined,
): Promise<string | undefined> {
  if (!threadId) return undefined;
  const researchThread = Number(process.env.ZAAL_BOTZ_RESEARCH_THREAD ?? 0);
  if (researchThread && threadId === researchThread) return 'Research';
  const topics = await readTopics().catch(() => ({}) as Record<string, number>);
  for (const [name, id] of Object.entries(topics)) {
    if (id === threadId) return name;
  }
  return undefined;
}
