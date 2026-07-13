/**
 * Surface new entries from the ZAOstock cloud research loop's pending-approvals
 * queue into the ZAAL BOTZ General topic. The cloud research loop (a claude.ai
 * routine, not this bot) has no safe way to hold Telegram credentials - it runs
 * in an isolated sandbox and can only commit files. So instead of pushing
 * Telegram messages directly, it APPENDS drafts/decisions it can't act on
 * itself (spending money, contacting a third party, a judgment call) to
 * research/_meta/zaostock-pending-approvals.md in bettercallzaal/ZAOOS. This
 * module is the other half of that bridge: it reads the raw file over HTTPS
 * (public repo, no auth needed), diffs against what's already been surfaced,
 * and posts only the new content as plain text - same "no buttons, lowest
 * blast radius" pattern as posts/README.md v1. Best-effort + de-duped via a
 * last-seen file length, mirroring handoffs-surface.ts's last-seen-timestamp
 * approach for the same class of problem.
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const ZOE_HOME = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
const SEEN_PATH = join(ZOE_HOME, 'zaostock-approvals-seen.json');
const REQUEST_TIMEOUT_MS = 8000;
const RAW_URL =
  'https://raw.githubusercontent.com/bettercallzaal/ZAOOS/main/research/_meta/zaostock-pending-approvals.md';
/** Telegram hard cap is 4096 chars; leave headroom for the chunk-number prefix. */
const MAX_CHUNK_CHARS = 3800;

async function lastSeenLength(): Promise<number> {
  try {
    return (JSON.parse(await fs.readFile(SEEN_PATH, 'utf8')) as { length: number }).length;
  } catch {
    return 0;
  }
}

async function setLastSeenLength(length: number): Promise<void> {
  await fs.mkdir(ZOE_HOME, { recursive: true });
  await fs.writeFile(SEEN_PATH, JSON.stringify({ length }));
}

/** Raw file content, or null if it doesn't exist yet or the fetch failed. */
async function fetchPendingApprovals(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(RAW_URL, { signal: controller.signal, cache: 'no-store' }).finally(() =>
      clearTimeout(timer),
    );
    if (!res.ok) return null; // 404 before the loop's first run is expected, not an error
    return await res.text();
  } catch {
    return null;
  }
}

/** Split new content into Telegram-sized chunks, breaking on blank lines where possible. */
function chunkText(text: string, maxChars: number): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed ? [trimmed] : [];
  const paragraphs = trimmed.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';
  for (const p of paragraphs) {
    const candidate = current ? `${current}\n\n${p}` : p;
    if (candidate.length > maxChars && current) {
      chunks.push(current);
      current = p;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * Post any pending-approvals content added since the last check to the
 * General topic. `postToGeneral` sends one message (no thread id - lands in
 * General same as zao-ask). Returns how many chunks were surfaced. Best-effort:
 * never throws into the scheduler tick.
 */
export async function surfaceZaostockApprovals(
  postToGeneral: (text: string) => Promise<unknown>,
): Promise<number> {
  const content = await fetchPendingApprovals();
  if (content === null) return 0;

  const seenLength = await lastSeenLength();
  if (content.length <= seenLength) return 0; // nothing new (or file shrank - don't re-post)

  const newContent = content.slice(seenLength);
  const chunks = chunkText(newContent, MAX_CHUNK_CHARS);
  if (chunks.length === 0) {
    await setLastSeenLength(content.length);
    return 0;
  }

  for (let i = 0; i < chunks.length; i++) {
    const label = chunks.length > 1 ? `ZAOstock loop [${i + 1}/${chunks.length}]:\n\n` : 'ZAOstock loop - new item(s) need a look:\n\n';
    await postToGeneral(`${label}${chunks[i]}`).catch(() => {});
  }
  await setLastSeenLength(content.length);
  return chunks.length;
}
