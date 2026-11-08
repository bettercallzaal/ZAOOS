/**
 * Read-only GitHub in allowlisted groups (iman-desk #168 item 1; vault
 * decisions 2026-11-08 item 4). In a chat on ZOE_GROUP_GITHUB_CHATS, a member
 * ZOE answers there can ask `/issue <n>` (or `/issue owner/repo <n>`) and
 * `/doc <number>`, so "where is X at" gets answered without Zaal.
 *
 * READ ONLY. Every call is a GET to api.github.com; the token is a scoped
 * read-only one Zaal supplies (secrets skill) as ZOE_GROUP_GITHUB_TOKEN, with
 * no fallback to GH_TOKEN, GITHUB_TOKEN or the gh CLI login. No token, no
 * chats, or the flag unset: the feature is off and registers nothing.
 *
 * Repos are an allowlist with NO default (seat-merge on #4273: the desk repo
 * is private, so a default would put private issue bodies into a group). Issue
 * repos come only from ZOE_GROUP_GITHUB_REPOS and the docs repo only from
 * ZOE_GROUP_GITHUB_DOCS_REPO, both set by Zaal; an empty list makes the command
 * answer "no repos configured". Reading a private repo in a group is his
 * ruling, never a default. Every fetch passes redirect: 'error', so the token
 * never follows a redirect off api.github.com. Responses are
 * Zod-checked (the self-scout.ts pattern) and every reply is capped at
 * REPLY_MAX_CHARS. The group gate is groups.ts shouldRespond.
 */
import type { Bot, Context } from 'grammy';
import { z } from 'zod';
import { type GroupConfig, shouldRespond } from './groups';

export const REPLY_MAX_CHARS = 1500;
export const BODY_MAX_CHARS = 600;
export const COMMENT_MAX_CHARS = 400;
export const NO_ISSUE_REPOS = 'No issue repos are configured for this chat.';
export const NO_DOCS_REPO = 'No docs repo is configured for this chat.';
const REPO_RE = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;

export interface GroupGithubConfig {
  token: string;
  chats: number[];
  repos: string[];
  docsRepo: string | null;
}

/** The config, or null when off. Fails closed: no flag, no token or no valid chat means off. */
export function readGroupGithubConfig(env: NodeJS.ProcessEnv = process.env): GroupGithubConfig | null {
  if (env.ZOE_GROUP_GITHUB !== '1') return null;
  const token = (env.ZOE_GROUP_GITHUB_TOKEN ?? '').trim();
  if (!token) return null;
  const chats = (env.ZOE_GROUP_GITHUB_CHATS ?? '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n !== 0);
  if (chats.length === 0) return null;
  const listed = (env.ZOE_GROUP_GITHUB_REPOS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => REPO_RE.test(s));
  const docsRaw = (env.ZOE_GROUP_GITHUB_DOCS_REPO ?? '').trim();
  if (docsRaw && !REPO_RE.test(docsRaw)) return null;
  return { token, chats, repos: listed, docsRepo: docsRaw || null };
}

export type GithubAsk = { kind: 'issue'; repo: string; number: number } | { kind: 'doc'; number: number } | { kind: 'usage'; text: string };

/** Parse the argument of /issue or /doc. A repo off the allowlist is a usage reply, not a read. */
export function parseAsk(command: 'issue' | 'doc', arg: string, cfg: GroupGithubConfig): GithubAsk {
  const parts = arg.trim().split(/\s+/).filter(Boolean);
  if (command === 'doc') {
    if (!cfg.docsRepo) return { kind: 'usage', text: NO_DOCS_REPO };
    const n = Number((parts[0] ?? '').replace(/^#/, ''));
    return parts.length === 1 && Number.isInteger(n) && n > 0 ? { kind: 'doc', number: n } : { kind: 'usage', text: 'Use: /doc 2732' };
  }
  if (cfg.repos.length === 0) return { kind: 'usage', text: NO_ISSUE_REPOS };
  const usage = `Use: /issue 175, or /issue owner/repo 175 for one of: ${cfg.repos.join(', ')}`;
  const [a, b] = parts;
  const repo = parts.length === 2 ? a : cfg.repos[0];
  const n = Number((parts.length === 2 ? b : a ?? '').replace(/^#/, ''));
  if (!(parts.length === 1 || parts.length === 2) || !Number.isInteger(n) || n <= 0) return { kind: 'usage', text: usage };
  if (!cfg.repos.some((r) => r.toLowerCase() === repo.toLowerCase())) return { kind: 'usage', text: usage };
  return { kind: 'issue', repo, number: n };
}

const IssueSchema = z.object({
  number: z.number(),
  title: z.string(),
  state: z.string(),
  html_url: z.string().url(),
  body: z.string().nullable().optional(),
  comments: z.number(),
  updated_at: z.string(),
  labels: z.array(z.object({ name: z.string() }).passthrough()).default([]),
});
const CommentSchema = z.array(z.object({ body: z.string().nullable().optional(), created_at: z.string() }).passthrough());
const TreeSchema = z.object({ tree: z.array(z.object({ path: z.string(), type: z.string() }).passthrough()), truncated: z.boolean().optional() });

export type FetchFn = (
  url: string,
  init: { headers: Record<string, string>; signal?: AbortSignal; redirect: 'error' },
) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;

function headers(token: string, raw = false): Record<string, string> {
  return {
    Accept: raw ? 'application/vnd.github.raw' : 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'zoe-group-github',
  };
}

async function getText(fetchFn: FetchFn, url: string, token: string, raw = false): Promise<string | null> {
  if (!url.startsWith('https://api.github.com/')) return null;
  const res = await fetchFn(url, { headers: headers(token, raw), signal: AbortSignal.timeout(15_000), redirect: 'error' });
  if (!res.ok) return null;
  return res.text();
}

async function getJson<T>(fetchFn: FetchFn, url: string, token: string, schema: z.ZodType<T>): Promise<T | null> {
  const text = await getText(fetchFn, url, token);
  if (text === null) return null;
  try {
    const r = schema.safeParse(JSON.parse(text));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

function clip(s: string, max: number): string {
  const t = s.replace(/\r/g, '').trim();
  return t.length > max ? `${t.slice(0, max - 3).trimEnd()}...` : t;
}

/** An issue and its newest comment as one short plain-text reply, or null when it could not be read. */
export async function readIssue(cfg: GroupGithubConfig, repo: string, n: number, fetchFn: FetchFn): Promise<string | null> {
  const base = `https://api.github.com/repos/${repo}/issues/${n}`;
  const issue = await getJson(fetchFn, base, cfg.token, IssueSchema);
  if (!issue) return null;
  const labels = (issue.labels ?? []).map((l) => l.name).join(', ');
  const lines = [
    `${repo} #${issue.number}: ${issue.title} (${issue.state}${labels ? `; ${labels}` : ''}; updated ${issue.updated_at.slice(0, 10)})`,
  ];
  if (issue.body?.trim()) lines.push('', clip(issue.body, BODY_MAX_CHARS));
  if (issue.comments > 0) {
    const last = await getJson(fetchFn, `${base}/comments?per_page=1&page=${issue.comments}`, cfg.token, CommentSchema);
    const c = last?.[0];
    if (c?.body?.trim()) lines.push('', `Newest comment (${c.created_at.slice(0, 10)}): ${clip(c.body, COMMENT_MAX_CHARS)}`);
  }
  lines.push('', issue.html_url);
  return clip(lines.join('\n'), REPLY_MAX_CHARS);
}

/** The README path of doc N in a research tree: research/<topic>/NNNN-slug/README.md. */
export function docPath(paths: readonly string[], n: number): string | null {
  const re = new RegExp(`^research/(?:[^/]+/)*0*${n}-[^/]+/README\\.md$`);
  return paths.find((p) => re.test(p) && !p.includes('/_archive/')) ?? paths.find((p) => re.test(p)) ?? null;
}

/** A research doc's title and opening, or null when it could not be found or read. */
export async function readDoc(cfg: GroupGithubConfig, n: number, fetchFn: FetchFn): Promise<string | null> {
  if (!cfg.docsRepo) return NO_DOCS_REPO;
  const tree = await getJson(fetchFn, `https://api.github.com/repos/${cfg.docsRepo}/git/trees/HEAD?recursive=1`, cfg.token, TreeSchema);
  if (!tree) return null;
  const path = docPath(
    tree.tree.filter((t) => t.type === 'blob').map((t) => t.path),
    n,
  );
  if (!path) return `No doc ${n} in ${cfg.docsRepo}.`;
  const raw = await getText(fetchFn, `https://api.github.com/repos/${cfg.docsRepo}/contents/${path}`, cfg.token, true);
  if (raw === null) return null;
  const text = raw.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
  const title = /^#\s+(.+)$/m.exec(text)?.[1]?.trim() ?? path;
  const opening = text.replace(/^#\s+.+$/m, '').trim();
  return clip([`Doc ${n}: ${title}`, '', clip(opening, BODY_MAX_CHARS), '', `${cfg.docsRepo}: ${path}`].join('\n'), REPLY_MAX_CHARS);
}

export interface GroupGithubDeps {
  getGroupConfig: (chatId: number) => Promise<GroupConfig | null>;
  fetch: FetchFn;
  featureRan: (name: string, detail?: string) => void;
  botUsername: () => string | null;
  botId: () => number | null;
}

/** Handle one /issue or /doc. Silent outside the allowlisted chats and for anyone the group gate refuses. */
export async function handleGithubAsk(
  ctx: Context,
  command: 'issue' | 'doc',
  arg: string,
  cfg: GroupGithubConfig,
  deps: GroupGithubDeps,
): Promise<void> {
  const chatId = ctx.chat?.id;
  const fromId = ctx.from?.id;
  if (chatId === undefined || !fromId || !cfg.chats.includes(chatId)) return;
  const gate = shouldRespond(
    await deps.getGroupConfig(chatId),
    { fromId, botUsername: deps.botUsername(), botId: deps.botId(), messageText: arg, entities: [], isCommand: true },
    false,
  );
  if (!gate.allow) return;
  const ask = parseAsk(command, arg, cfg);
  if (ask.kind === 'usage') {
    await ctx.reply(ask.text);
    return;
  }
  let out: string | null = null;
  try {
    out = ask.kind === 'issue' ? await readIssue(cfg, ask.repo, ask.number, deps.fetch) : await readDoc(cfg, ask.number, deps.fetch);
  } catch (e) {
    console.error('[zoe/group-github] read failed:', (e as Error)?.message);
  }
  if (out === null) {
    await ctx.reply(`I could not read that from GitHub just now.`);
    return;
  }
  await ctx.reply(out, { link_preview_options: { is_disabled: true } });
  deps.featureRan('group-github', ask.kind);
}

/** Register /issue and /doc. Call once at boot, only when readGroupGithubConfig() is not null. */
export function registerGroupGithubCommands(bot: Bot, cfg: GroupGithubConfig, deps: GroupGithubDeps): void {
  for (const command of ['issue', 'doc'] as const) {
    bot.command(command, async (ctx) => {
      const arg = (ctx.message?.text ?? '').replace(new RegExp(`^/${command}(@\\w+)?\\s*`), '');
      await handleGithubAsk(ctx, command, arg, cfg, deps);
    });
  }
}
