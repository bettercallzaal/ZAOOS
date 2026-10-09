/**
 * X desk, phase 1 (research doc 2651, merged as ZAOOS #3854).
 *
 * Zaal pastes an x.com / twitter.com post link into the ZOE DM. ZOE reads the
 * post (keyless, FxTwitter), drafts three replies in his voice, and sends one
 * card with Copy buttons. He posts from the X app himself. Nothing here posts.
 *
 * Why not the API: since Feb 2026 X rejects API replies unless the original
 * author summoned the replier (devcommunity topic 257909), so the API could
 * not post most of these replies anyway. Phase 1 needs no X credentials, no
 * spend and no account: only a public read.
 *
 * Learning: "I used 1/2/3" buttons record the draft he actually posted. Those
 * become few-shot examples for the next card, next to his own recent posts
 * when the public timeline feed answers (it rate-limits; measured HTTP 429 on
 * 2026-10-09, so it is best-effort and cached for a day).
 *
 * Gated by ZOE_X_DESK=1 (default OFF).
 *
 * The read side is a port of the app's src/lib/scrape/x-fetch.ts (FxTwitter
 * tier) and x-timeline.ts (syndication embed): the bot is its own package and
 * cannot import the app's @/ modules.
 */
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { VOICE_RULES } from './posts/drafters';

export function xDeskEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_X_DESK === '1';
}

function zoeHome(): string {
  return process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
}
const deskDir = () => join(zoeHome(), 'x-desk');
const usedFile = () => join(zoeHome(), 'x-desk-used.jsonl');
const voiceCacheFile = () => join(zoeHome(), 'x-voice-cache.json');

export const OWN_HANDLE = 'bettercallzaal';
/** X filters posts older than 48 hours out of For You ranking (xai-org/x-algorithm AgeFilter). */
export const RANKING_WINDOW_MS = 48 * 60 * 60 * 1000;
export const X_CHAR_LIMIT = 280;
const FETCH_TIMEOUT_MS = 12_000;

// ---------------------------------------------------------------------------
// The link
// ---------------------------------------------------------------------------

export interface XLink {
  url: string;
  handle: string;
  id: string;
  /** Whatever Zaal typed around the link: his steer for the drafts. */
  note: string;
}

const STATUS_RE =
  /https?:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status(?:es)?\/(\d{1,25})\S*/i;

/**
 * The DM gate in one place, so it is tested without importing index.ts
 * (agent-loops rule 21). The desk claims a DM only when the flag is on, no
 * pending answer is armed (a waiting reflection or approval must win), and no
 * "Add a why" reply is expected; then only if the text carries a post link.
 * With the flag off this returns null for every input, so a pasted link takes
 * the path it took before the desk existed.
 */
export function claimXLink(
  text: string,
  state: { pendingArmed: boolean; whyArmed: boolean },
  env: NodeJS.ProcessEnv = process.env,
): XLink | null {
  if (!xDeskEnabled(env) || state.pendingArmed || state.whyArmed) return null;
  return parseXLink(text);
}

/** The first x.com / twitter.com post link in a message, or null. */
export function parseXLink(text: string): XLink | null {
  const m = STATUS_RE.exec(text);
  if (!m) return null;
  const note = text.replace(m[0], ' ').replace(/\s+/g, ' ').trim();
  return { url: `https://x.com/${m[1]}/status/${m[2]}`, handle: m[1], id: m[2], note };
}

// ---------------------------------------------------------------------------
// Reading the post (FxTwitter, keyless)
// ---------------------------------------------------------------------------

export interface XPost {
  id: string;
  url: string;
  text: string;
  authorHandle: string;
  authorName: string;
  createdMs: number | null;
  replies: number;
  likes: number;
}

const FxSchema = z.object({
  code: z.number(),
  tweet: z
    .object({
      id: z.string(),
      url: z.string(),
      text: z.string(),
      created_timestamp: z.number().optional(),
      replies: z.number().optional(),
      likes: z.number().optional(),
      author: z.object({ screen_name: z.string(), name: z.string().optional() }),
    })
    .optional(),
});

export type FetchImpl = typeof fetch;

/**
 * Read one public post. Returns null when FxTwitter has nothing (deleted,
 * private, or down) rather than throwing, so the caller can tell Zaal plainly.
 * An empty text counts as nothing: a 200 with no content is not a read
 * (liveness-probe-guard.md companion clause).
 */
export async function fetchXPost(id: string, fetchImpl: FetchImpl = fetch): Promise<XPost | null> {
  try {
    const res = await fetchImpl(`https://api.fxtwitter.com/status/${id}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZOE/1.0)' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const parsed = FxSchema.safeParse(await res.json());
    if (!parsed.success || parsed.data.code !== 200 || !parsed.data.tweet) return null;
    const t = parsed.data.tweet;
    if (!t.text.trim()) return null;
    return {
      id: t.id,
      url: t.url,
      text: t.text,
      authorHandle: t.author.screen_name,
      authorName: t.author.name ?? t.author.screen_name,
      createdMs: t.created_timestamp ? t.created_timestamp * 1000 : null,
      replies: t.replies ?? 0,
      likes: t.likes ?? 0,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Voice examples: Zaal's own recent posts (best-effort) + drafts he used
// ---------------------------------------------------------------------------

/** Parse the syndication timeline embed into post texts (port of x-timeline.ts). */
export function parseTimelineTexts(html: string): Array<{ text: string; likes: number }> {
  const m = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/.exec(html);
  if (!m) return [];
  try {
    const data = JSON.parse(m[1]) as {
      props?: { pageProps?: { timeline?: { entries?: Array<{ content?: { tweet?: Record<string, unknown> } }> } } };
    };
    const entries = data.props?.pageProps?.timeline?.entries ?? [];
    const out: Array<{ text: string; likes: number }> = [];
    for (const e of entries) {
      const t = e.content?.tweet;
      if (!t) continue;
      const text = String(t.full_text ?? t.text ?? '').trim();
      // Reposts are someone else's voice.
      if (!text || text.startsWith('RT @')) continue;
      out.push({ text, likes: Number(t.favorite_count ?? 0) });
    }
    return out;
  } catch {
    return [];
  }
}

const VOICE_CACHE_MS = 24 * 60 * 60 * 1000;

/**
 * Up to `n` of Zaal's own recent posts, most-liked first. Cached for a day.
 * The feed rate-limits (HTTP 429 measured 2026-10-09); on any failure the last
 * cache is used, and with no cache the drafts lean on the used examples and
 * the voice rules alone.
 */
export async function ownRecentPosts(
  n = 8,
  fetchImpl: FetchImpl = fetch,
  now: number = Date.now(),
): Promise<string[]> {
  let cached: { at: number; posts: Array<{ text: string; likes: number }> } | null = null;
  try {
    cached = JSON.parse(await fs.readFile(voiceCacheFile(), 'utf8'));
  } catch {
    cached = null;
  }
  const pick = (posts: Array<{ text: string; likes: number }>) =>
    [...posts].sort((a, b) => b.likes - a.likes).slice(0, n).map((p) => p.text);
  if (cached && now - cached.at < VOICE_CACHE_MS) return pick(cached.posts);
  try {
    const res = await fetchImpl(`https://syndication.twitter.com/srv/timeline-profile/screen-name/${OWN_HANDLE}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.ok) {
      const posts = parseTimelineTexts(await res.text());
      if (posts.length > 0) {
        await fs.mkdir(zoeHome(), { recursive: true });
        await fs.writeFile(voiceCacheFile(), JSON.stringify({ at: now, posts }), 'utf8');
        return pick(posts);
      }
    }
  } catch {
    // fall through to the stale cache
  }
  return cached ? pick(cached.posts) : [];
}

export interface UsedDraft {
  at: string;
  postId: string;
  draft: string;
}

export async function recordUsed(postId: string, draft: string, now: Date = new Date()): Promise<void> {
  await fs.mkdir(zoeHome(), { recursive: true });
  const row: UsedDraft = { at: now.toISOString(), postId, draft };
  await fs.appendFile(usedFile(), `${JSON.stringify(row)}\n`, 'utf8');
}

/** The most recent drafts Zaal said he used, newest first. */
export async function recentUsed(n = 6): Promise<string[]> {
  try {
    const rows = (await fs.readFile(usedFile(), 'utf8'))
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => {
        try {
          return JSON.parse(l) as UsedDraft;
        } catch {
          return null;
        }
      })
      .filter((r): r is UsedDraft => r !== null);
    return rows.slice(-n).reverse().map((r) => r.draft);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Drafting
// ---------------------------------------------------------------------------

export const REPLY_SYSTEM = `You draft REPLIES on X for Zaal (@${OWN_HANDLE}), founder of The ZAO, in his own voice.

${VOICE_RULES}

REPLY RULES:
- Each reply stands alone and is at most ${X_CHAR_LIMIT} characters.
- Add something the post does not already say: a specific fact, a number, a project, a question that invites a real answer. Replies and quotes are what X's ranking rewards most; a reply nobody can answer is wasted.
- Do not start with "ZM." (that greeting is for his own posts, not replies).
- No links unless the steer asks for one.
- Never pretend to have done something he has not; never invent numbers or names.
- Three replies, three different angles (for example: add a fact, ask a question, connect it to a ZAO project).

OUTPUT: JSON only, exactly {"replies": ["...", "...", "..."]}. No markdown, no commentary.`;

export function buildReplyPrompt(post: XPost, note: string, ownPosts: string[], used: string[]): string {
  const parts = [
    `POST by @${post.authorHandle} (${post.authorName}):`,
    post.text,
  ];
  if (note) parts.push('', `ZAAL'S STEER: ${note}`);
  if (used.length) parts.push('', 'REPLIES ZAAL ACTUALLY POSTED BEFORE (match this voice):', ...used.map((u) => `- ${u}`));
  if (ownPosts.length) parts.push('', 'ZAAL\'S OWN RECENT POSTS (voice reference, do not copy):', ...ownPosts.map((p) => `- ${p.replace(/\s+/g, ' ')}`));
  parts.push('', 'Write the three replies now.');
  return parts.join('\n');
}

const RepliesSchema = z.object({ replies: z.array(z.string()).min(1) });

/**
 * Pull up to three usable replies out of the model's answer. Tolerates a
 * fenced or prefixed JSON object; drops empty, over-limit and duplicate lines,
 * and strips em dashes (a hard voice rule) rather than failing the card.
 */
export function parseReplies(raw: string): string[] {
  const m = /\{[\s\S]*\}/.exec(raw);
  if (!m) return [];
  let data: unknown;
  try {
    data = JSON.parse(m[0]);
  } catch {
    return [];
  }
  const parsed = RepliesSchema.safeParse(data);
  if (!parsed.success) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of parsed.data.replies) {
    const t = r.replace(/\u2014/g, '-').replace(/^["']|["']$/g, '').trim();
    if (!t || t.length > X_CHAR_LIMIT || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length === 3) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// The card
// ---------------------------------------------------------------------------

export interface DeskCard {
  postId: string;
  url: string;
  author: string;
  postText: string;
  note: string;
  drafts: string[];
  createdMs: number | null;
  at: string;
}

type Button =
  | { text: string; callback_data: string }
  | { text: string; url: string }
  | { text: string; copy_text: { text: string } };

export function ageWarning(createdMs: number | null, now: number = Date.now()): string {
  if (createdMs === null || now - createdMs <= RANKING_WINDOW_MS) return '';
  const days = Math.floor((now - createdMs) / (24 * 60 * 60 * 1000));
  return `Heads up: this post is ${days} day${days === 1 ? '' : 's'} old. X stops ranking posts after 48 hours, so a reply here mostly reaches the author.`;
}

export function renderCard(card: DeskCard, now: number = Date.now()): { text: string; keyboard: Button[][] } {
  const quoted = card.postText.length > 400 ? `${card.postText.slice(0, 397)}...` : card.postText;
  const lines = [`@${card.author}: ${quoted}`];
  const warn = ageWarning(card.createdMs, now);
  if (warn) lines.push('', warn);
  lines.push('', 'Reply drafts:');
  card.drafts.forEach((d, i) => lines.push('', `${i + 1}. ${d}`, `(${d.length}/${X_CHAR_LIMIT})`));
  lines.push('', 'Copy one, post it from X, then tap "I used" so I learn your voice.');
  const copyRow: Button[] = card.drafts.map((d, i) => ({ text: `Copy ${i + 1}`, copy_text: { text: d } }));
  const usedRow: Button[] = card.drafts.map((_, i) => ({ text: `I used ${i + 1}`, callback_data: `xd:used:${i + 1}:${card.postId}` }));
  const actionRow: Button[] = [
    { text: 'Open post', url: card.url },
    { text: 'Redo', callback_data: `xd:redo:${card.postId}` },
    { text: 'Skip', callback_data: `xd:skip:${card.postId}` },
  ];
  return { text: lines.join('\n'), keyboard: [copyRow, usedRow, actionRow] };
}

export const XD_CALLBACK = /^xd:(used|redo|skip):(?:([1-3]):)?(\d{1,25})$/;

export async function saveCard(card: DeskCard): Promise<void> {
  await fs.mkdir(deskDir(), { recursive: true });
  await fs.writeFile(join(deskDir(), `${card.postId}.json`), JSON.stringify(card, null, 2), 'utf8');
}

export async function loadCard(postId: string): Promise<DeskCard | null> {
  if (!/^\d{1,25}$/.test(postId)) return null;
  try {
    return JSON.parse(await fs.readFile(join(deskDir(), `${postId}.json`), 'utf8')) as DeskCard;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// The flow, with its side effects injected so it is testable
// ---------------------------------------------------------------------------

export interface DeskDeps {
  fetchImpl?: FetchImpl;
  /** Calls the model with (systemPrompt, userPrompt) and returns its text. */
  draft: (system: string, prompt: string) => Promise<string>;
  now?: () => number;
}

export type DeskResult =
  | { ok: true; card: DeskCard }
  | { ok: false; reason: 'unreadable' | 'no-drafts'; message: string };

/** Read the post, draft three replies, save the card. Never throws. */
export async function runDesk(link: XLink, deps: DeskDeps): Promise<DeskResult> {
  const now = deps.now ?? Date.now;
  const post = await fetchXPost(link.id, deps.fetchImpl);
  if (!post) {
    return {
      ok: false,
      reason: 'unreadable',
      message: `I could not read that post (deleted, private, or the reader is down). Link: ${link.url}`,
    };
  }
  const [ownPosts, used] = await Promise.all([ownRecentPosts(8, deps.fetchImpl, now()), recentUsed(6)]);
  let drafts: string[] = [];
  try {
    drafts = parseReplies(await deps.draft(REPLY_SYSTEM, buildReplyPrompt(post, link.note, ownPosts, used)));
  } catch (err) {
    console.warn('[zoe/x-desk] draft call failed:', (err as Error).message);
  }
  if (drafts.length === 0) {
    return { ok: false, reason: 'no-drafts', message: `I read the post but the drafts came back empty. Tap Redo or send the link again. ${link.url}` };
  }
  const card: DeskCard = {
    postId: post.id,
    url: post.url,
    author: post.authorHandle,
    postText: post.text,
    note: link.note,
    drafts,
    createdMs: post.createdMs,
    at: new Date(now()).toISOString(),
  };
  try {
    await saveCard(card);
  } catch (err) {
    // The card still goes out; only Redo and "I used" lose their context.
    console.warn('[zoe/x-desk] could not save the card:', (err as Error).message);
  }
  return { ok: true, card };
}
