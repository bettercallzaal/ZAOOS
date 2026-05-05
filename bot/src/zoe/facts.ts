/**
 * Facts memory layer - persistent things Zaal told ZOE to remember.
 *
 * Distinct from `note:` (which goes to claude-code-notes.md for next session).
 * Facts are READ ON EVERY ZOE CALL: concierge, newsletter, brief, reflect.
 * They get appended to the system prompt so all agents share them.
 *
 * File: ~/.zao/zoe/facts.md
 *
 * Format: append-only markdown list. One fact per entry, ISO timestamp.
 *
 *     ## 2026-05-05T19:13:42.000Z
 *     Fractals are Mondays. Weekly recurring slot.
 *
 * Triggers (any of these prefixes in a DM):
 *   remember: <fact>
 *   fact: <fact>
 *   fyi: <fact>
 *   actually <fact>     (no colon, common typo path)
 *   always <fact>       (declarative correction)
 *   never <fact>
 *   btw: <fact>
 *   note that <fact>
 *
 * Reply: "Got it. <count> facts on file. Future replies and drafts will know."
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';

export const FACTS_FILE = join(ZOE_PATHS.home, 'facts.md');

export const FACTS_PREFIX = /^(remember|fact|fyi|actually|always|never|btw|note that)[\s:]+(.+)/is;

export async function appendFact(body: string): Promise<number> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error('empty fact');
  await fs.mkdir(ZOE_PATHS.home, { recursive: true });
  const ts = new Date().toISOString();
  const block = `\n## ${ts}\n\n${trimmed}\n`;
  await fs.appendFile(FACTS_FILE, block, 'utf8');
  let count = 0;
  try {
    const raw = await fs.readFile(FACTS_FILE, 'utf8');
    count = (raw.match(/^## /gm) ?? []).length;
  } catch {
    count = 1;
  }
  return count;
}

/**
 * Returns the current facts file content as a single string for inclusion in
 * agent context. Empty string if no facts yet.
 *
 * Cap at 8000 chars (roughly 2k tokens) to bound the system prompt budget.
 * If facts file grows past that, oldest entries get truncated from the front.
 */
export async function readFacts(): Promise<string> {
  try {
    const raw = await fs.readFile(FACTS_FILE, 'utf8');
    if (raw.length <= 8000) return raw.trim();
    return raw.slice(raw.length - 8000).trim();
  } catch {
    return '';
  }
}

/**
 * Build a context block ready to inject into a system prompt. Returns empty
 * string if no facts. Caller decides whether to include it.
 */
export async function buildFactsBlock(): Promise<string> {
  const facts = await readFacts();
  if (!facts) return '';
  return `\n\n## Persistent facts Zaal has told you to remember (always honor these)\n\n${facts}\n`;
}

export async function listFactsCount(): Promise<number> {
  try {
    const raw = await fs.readFile(FACTS_FILE, 'utf8');
    return (raw.match(/^## /gm) ?? []).length;
  } catch {
    return 0;
  }
}
