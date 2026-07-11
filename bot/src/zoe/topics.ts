/**
 * Forum-topic registry for the ZAAL BOTZ ops group. ZOE (a group admin with
 * can_manage_topics) creates the standard topics itself and stores each
 * name -> message_thread_id here, so the code never needs a hand-copied id.
 * Persisted to ~/.zao/zoe/topics.json (private-instance config, doc 1025).
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const ZOE_HOME = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
const TOPICS_PATH = join(ZOE_HOME, 'topics.json');

/** The standard ZAAL BOTZ topics ZOE manages. Order is the create order.
 * Each has a behavior in topic-router.ts (topic = intent). */
export const STANDARD_TOPICS = [
  'Research',
  'ZOL',
  'Handoffs',
  'Claude Code',
  'Farcaster',
  'Coding',
  'Ideas',
  'Newsletter',
  'WaveWarZ',
  'ZABAL Games',
] as const;

/** name -> message_thread_id */
export type TopicMap = Record<string, number>;

export async function readTopics(): Promise<TopicMap> {
  try {
    return JSON.parse(await fs.readFile(TOPICS_PATH, 'utf8')) as TopicMap;
  } catch {
    return {};
  }
}

export async function writeTopics(map: TopicMap): Promise<void> {
  await fs.mkdir(ZOE_HOME, { recursive: true });
  await fs.writeFile(TOPICS_PATH, JSON.stringify(map, null, 2));
}

/** Thread id for a named topic, or undefined if not created yet. */
export async function getTopicThread(name: string): Promise<number | undefined> {
  return (await readTopics())[name];
}
