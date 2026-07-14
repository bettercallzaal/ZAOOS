/**
 * curator.ts - Clean-curator Telegram topic posting for ZAO group forums.
 *
 * NOT a spam feed - clean, well-explained, curated posts routed to the right
 * topic. Zaal's hard rule: low-frequency, prose, explained. Posts are batched
 * and deduplicated (e.g., daily github digest, not one-per-commit).
 *
 * HOW TO CAPTURE THREAD IDs (for Zaal):
 * =======================================
 * The curator needs to know which Telegram message_thread_id corresponds to each
 * topic. ZOE logs these automatically when you send a message in each topic.
 *
 * 1. In the ZAO group, visit the Newsletter topic and send any message.
 *    ZOE logs: "[zoe/curator] logged topic 'newsletter' -> thread_id 123"
 *
 * 2. Repeat for Github, Artizen, Recommendations, General topics.
 *    After all 5 are logged, the curator auto-activates.
 *
 * 3. Alternatively, set env vars TG_TOPIC_NEWSLETTER, TG_TOPIC_GITHUB, etc.
 *    (curator prioritizes env vars over logged mappings).
 *
 * Logging location: ~/.zao/zoe/topic_thread_map.json (persists across restarts).
 *
 * The system has three parts:
 *
 * 1. THREAD ID LOGGER: when a message arrives in a ZAO group forum topic,
 *    log the topic name + message_thread_id so Zaal can capture the 5 IDs
 *    by sending a message in each topic (or we read from env vars).
 *
 * 2. TOPIC ROUTING CONFIG: a map { newsletter, github, artizen, recommendations,
 *    general } -> thread_id from env vars (TG_TOPIC_*) or logged JSON.
 *    postToTopic(topicKey, text) helper sends with the right thread_id.
 *    No-ops safely (logs a warning) if that topic's id is unset.
 *
 * 3. CLEAN-CURATOR POSTING: sources are wired here (newsletter -> issue link,
 *    github -> daily digest, etc). All curated/batched, prose, explained.
 *    Disabled by default (no-op-until-set guard) so merging does not spam.
 *
 * Daily schedule: runs at 08:00 UTC (one hour before morning brief, so brief
 * can reference any curator output). Posts are one-per-day per topic (or fewer).
 * Github: daily "today's ships" digest (batched, prose, not one-per-event).
 * Newsletter: posted when issue publishes (one-liner + link).
 * Others: hooks provided; wire sources as they become available.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const ZOE_HOME = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
const TOPIC_THREAD_MAP_PATH = join(ZOE_HOME, 'topic_thread_map.json');

export type TopicKey = 'newsletter' | 'github' | 'artizen' | 'recommendations' | 'general';

export interface TopicThreadMap {
  [key: string]: number;
}

/**
 * Read the persisted topic -> thread_id map from disk.
 * Returns {} if the file doesn't exist (OK - we're still discovering topics).
 */
export async function readTopicThreadMap(): Promise<TopicThreadMap> {
  try {
    const raw = await fs.readFile(TOPIC_THREAD_MAP_PATH, 'utf8');
    return JSON.parse(raw) as TopicThreadMap;
  } catch {
    return {};
  }
}

/**
 * Write the topic -> thread_id map to disk atomically.
 */
export async function writeTopicThreadMap(map: TopicThreadMap): Promise<void> {
  await fs.mkdir(ZOE_HOME, { recursive: true });
  await fs.writeFile(TOPIC_THREAD_MAP_PATH, JSON.stringify(map, null, 2), 'utf8');
}

/**
 * Log a topic name + thread_id when a message arrives in a ZAO group forum topic.
 * Call from the message handler when message.is_forum_topic_message is true.
 * This lets Zaal capture the 5 IDs by sending a message in each topic.
 *
 * Logs clearly so Zaal sees which topic was discovered.
 * Best-effort: never throws.
 */
export async function logTopicThreadId(topicName: string, threadId: number): Promise<void> {
  try {
    const map = await readTopicThreadMap();
    if (map[topicName] === threadId) {
      // Already logged
      return;
    }
    map[topicName] = threadId;
    await writeTopicThreadMap(map);
    console.log(`[zoe/curator] logged topic '${topicName}' -> thread_id ${threadId}`);
  } catch (err) {
    console.warn(`[zoe/curator] failed to log topic thread id:`, (err as Error).message);
  }
}

/**
 * Resolve the topic thread ID from env vars or the logged JSON.
 * Priority: env var (TG_TOPIC_<KEY>) > logged map > undefined (not set).
 */
export async function resolveTopicThreadId(topicKey: TopicKey): Promise<number | undefined> {
  // Check env var first
  const envKey = `TG_TOPIC_${topicKey.toUpperCase()}`;
  const envId = process.env[envKey];
  if (envId) {
    const parsed = Number(envId);
    if (!Number.isNaN(parsed)) return parsed;
  }
  // Fall back to logged map
  const map = await readTopicThreadMap();
  return map[topicKey];
}

/**
 * Helper: send a message to a topic with safety checks.
 * Returns true if sent, false if the topic thread_id is unset (safe no-op).
 *
 * @param send - injected Telegram sender: (chatId, text, opts) => Promise<void>
 * @param chatId - the ZAO group chat id
 * @param topicKey - which topic to post to (e.g., 'newsletter', 'github')
 * @param text - the message text (plain string, no markdown for now)
 */
export async function postToTopic(
  send: (chatId: number, text: string, opts?: { message_thread_id?: number }) => Promise<void>,
  chatId: number,
  topicKey: TopicKey,
  text: string,
): Promise<boolean> {
  const threadId = await resolveTopicThreadId(topicKey);
  if (!threadId) {
    console.warn(`[zoe/curator] no thread_id for topic '${topicKey}', skipping post (safe no-op)`);
    return false;
  }

  try {
    await send(chatId, text, { message_thread_id: threadId });
    return true;
  } catch (err) {
    console.error(`[zoe/curator] failed to post to topic '${topicKey}':`, (err as Error).message);
    return false;
  }
}

/**
 * DAILY CURATED GITHUB DIGEST: runs once per day, batches the day's
 * merged PRs + ships into one clean prose post (not one-per-event).
 *
 * Example output:
 *   Today's ships (Jul 14):
 *
 *   PRs merged:
 *   #1344: docs: research doc 1078 - individual operating system
 *   #1343: fix: insurance vendors sourcing
 *   #1342: fix: sound-system backup vendors
 *
 *   Commits landed:
 *   57f28c4 - docs: farcaster research doc
 *   8b3e1ad - docs: doc 1063 question 3
 *
 * Stub implementation for MVP. Future: fetch from GitHub API + Bonfire recall.
 */
export async function generateGithubDigest(): Promise<{ text: string; timestamp: string } | null> {
  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Stub: for MVP, return placeholder. Real impl would:
    // - fetch recent merged PRs from GitHub API
    // - fetch recent commits from git log
    // - batch into prose narrative
    // Disabled by default (curator OFF) so this won't fire until enabled.

    const digestText = `Today's ships (${dateStr}):

PRs merged:
(fetching from GitHub API - not yet wired)

Commits landed:
(fetching from git log - not yet wired)

If this appears, curator is enabled. Wire the GitHub API fetcher in curator.ts.`;

    return {
      text: digestText,
      timestamp: now.toISOString(),
    };
  } catch (err) {
    console.error('[zoe/curator] failed to generate github digest:', (err as Error).message);
    return null;
  }
}

/**
 * NEWSLETTER TOPIC: post the daily issue link + one-line framing when it publishes.
 * Reuses the newsletter flow if it exists (stub for MVP).
 *
 * Example output:
 *   Daily newsletter published: zabalnewsletterbuilder.vercel.app
 *   Today's issue: ZAO ecosystem + ZABAL Games updates
 */
export function generateNewsletterPost(issueUrl: string, frameText: string): { text: string } {
  return {
    text: `Daily newsletter published: ${issueUrl}\n${frameText}`,
  };
}

/**
 * ARTIZEN / RECOMMENDATIONS / GENERAL: provide postToTopic helpers + wire obvious
 * sources (Artizen = milestone digests, Recommendations = curated, General = brief).
 * All curated/batched, low-frequency, prose, explained.
 *
 * Stub stubs for MVP - these are hooks for future sources.
 */
export function generateArtizenPost(): { text: string } | null {
  // Stub: would fetch milestone events from Artizen API
  return {
    text: '[Artizen milestone digest - not yet wired]',
  };
}

export function generateRecommendationsPost(): { text: string } | null {
  // Stub: would fetch curated recommendations from a source
  return {
    text: '[Recommendations digest - not yet wired]',
  };
}

/**
 * Guard: curator is disabled by default until the 5 topic thread IDs are set.
 * Check this before any curator post. Returns true iff curator should be active.
 *
 * Curator activates when ALL of { newsletter, github, artizen, recommendations, general }
 * have thread_ids (either from env or logged). Individual topics can post even if
 * their thread_id is unset (safe no-op), but we don't spam without explicit config.
 */
export async function curatorEnabled(): Promise<boolean> {
  const requiredTopics: TopicKey[] = ['newsletter', 'github', 'artizen', 'recommendations', 'general'];
  for (const topicKey of requiredTopics) {
    const threadId = await resolveTopicThreadId(topicKey);
    if (!threadId) {
      return false;
    }
  }
  return true;
}

/**
 * One curator tick: run daily github digest, check for new newsletter issue, etc.
 * Each source is independent and safe-no-ops if its topic thread_id is unset.
 * Never throws; returns a summary of what was posted.
 *
 * Called from scheduler or manually. Disabled by default (curatorEnabled guard).
 */
export interface CuratorTickResult {
  enabled: boolean;
  posted: number;
  skipped: number;
  errors: string[];
}

export async function runCuratorTick(
  send: (chatId: number, text: string, opts?: { message_thread_id?: number }) => Promise<void>,
  chatId: number,
): Promise<CuratorTickResult> {
  const result: CuratorTickResult = {
    enabled: false,
    posted: 0,
    skipped: 0,
    errors: [],
  };

  // SAFETY: disabled by default
  if (!(await curatorEnabled())) {
    result.enabled = false;
    console.log('[zoe/curator] curator is disabled (thread_ids not set)');
    return result;
  }

  result.enabled = true;

  // Github digest (daily, batched)
  try {
    const digest = await generateGithubDigest();
    if (digest) {
      const sent = await postToTopic(send, chatId, 'github', digest.text);
      if (sent) result.posted++;
      else result.skipped++;
    } else {
      result.skipped++;
    }
  } catch (err) {
    result.errors.push(`github: ${(err as Error).message}`);
  }

  // Newsletter (when published)
  // Stub: would check if a new issue was published today
  // if (newIssuePublished) {
  //   const post = generateNewsletterPost(issueUrl, frameText);
  //   const sent = await postToTopic(send, chatId, 'newsletter', post.text);
  //   if (sent) result.posted++;
  //   else result.skipped++;
  // }

  console.log(
    `[zoe/curator] tick: ${result.posted} posted, ${result.skipped} skipped, ${result.errors.length} errors`,
  );
  return result;
}
