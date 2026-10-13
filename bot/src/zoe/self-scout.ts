/**
 * self-scout.ts - once a week ZOE picks ONE outside open-source repo herself
 * and queues the fit check she already runs on links Zaal sends her
 * (research doc agents/2662-zoe-self-scout; it extends self-upgrade.ts,
 * research doc agents/2652-self-upgrade-shared-resources-ingest).
 *
 * NOT APPROVED TO RUN. Doc 2662 asks Zaal a yes-or-no and this file was
 * written before the answer. It does nothing unless BOTH ZOE_SELF_UPGRADE=1
 * and ZOE_SELF_SCOUT=1 are set, and setting the second one is his.
 *
 * WHAT IT DOES
 * One GitHub repository search (public, no token, no model call), a plain
 * filter, then the first repo that is neither queued nor already named in the
 * research library goes into the work queue as a `resource` item - the same
 * item the DM intake creates. The work loop does the rest: fit check, research
 * doc, PR. One item per fire, one fire per week.
 *
 * WHAT IT NEVER DOES
 * Write code, merge, post, spend, add a dependency, or pass a candidate's own
 * text anywhere. Only `owner/name`, re-validated by parseResourceLink, leaves
 * this file; a description is read for the list filter and then dropped, so a
 * README or description cannot steer the worker through the queue.
 *
 * WHICH WAY IT FAILS
 * The DM intake fails open (an unreadable queue or library still queues what
 * Zaal sent). This fails CLOSED where it can: nobody asked for this week's
 * pick, so if the search or the research library cannot be read, nothing is
 * queued. The work queue is the exception: work-loop.ts readQueue returns an
 * empty list on any read error and cannot report one, so a damaged queue file
 * reads as "nothing queued" here as it does everywhere else.
 *
 * Everything but searchRepos is pure; runSelfScout takes its I/O as arguments.
 */
import { z } from 'zod';
import {
  parseResourceLink,
  type ResourceLink,
  resourceDecision,
  resourceInput,
  selfUpgradeEnabled,
} from './self-upgrade';

/** Needs the self-upgrade flag too: the scout only feeds that queue. */
export function selfScoutEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return selfUpgradeEnabled(env) && env.ZOE_SELF_SCOUT === '1';
}

/**
 * Topic pairs, rotated one per week. Pairs, not single topics: measured
 * 2026-10-11, `topic:agent-memory` alone returned 100 repos led by a database
 * and a book, while the two-topic queries returned 9 and 12 (doc 2662).
 * Changing this list is a PR.
 */
export const SCOUT_QUERIES: readonly string[] = [
  'topic:telegram-bot topic:ai-agent',
  'topic:personal-assistant topic:llm',
  'topic:agent-memory topic:llm',
  'topic:claude-code topic:agent',
  'topic:ai-agent topic:self-improving',
  'topic:telegram-bot topic:llm',
];

export const MIN_STARS = 200;
export const FRESH_DAYS = 30;
export const SEARCH_PAGE = 20;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

/** Owners that are us. Our own repos are the inward scout's job (repo-improver.ts). */
const OUR_OWNERS: ReadonlySet<string> = new Set(['bettercallzaal', 'zaodevz', 'zao-devz']);

/** A list, a course or a book is not something to take code from. */
const LIST_RE = /\b(awesome|tutorials?|courses?|books?|roadmap|interview|cheat-?sheet|curated)\b/i;

/** This week's query: the list rotated by whole weeks since the epoch. */
export function queryForWeek(now: Date, queries: readonly string[] = SCOUT_QUERIES): string {
  return queries[Math.floor(now.getTime() / WEEK_MS) % queries.length];
}

/** The search URL. Every part of it comes from this file and the clock. */
export function buildSearchUrl(topicQuery: string, now: Date): string {
  const since = new Date(now.getTime() - FRESH_DAYS * DAY_MS).toISOString().slice(0, 10);
  const q = `${topicQuery} pushed:>${since} stars:>=${MIN_STARS} archived:false fork:false`;
  const params = new URLSearchParams({ q, sort: 'stars', order: 'desc', per_page: String(SEARCH_PAGE) });
  return `https://api.github.com/search/repositories?${params.toString()}`;
}

const ItemSchema = z.object({
  full_name: z.string().min(3).max(200),
  stargazers_count: z.number(),
  archived: z.boolean(),
  fork: z.boolean(),
  pushed_at: z.string(),
  description: z.string().nullable().optional(),
  license: z.object({ spdx_id: z.string().nullable().optional() }).nullable().optional(),
});
const SearchSchema = z.object({ items: z.array(z.unknown()) });

export interface RepoItem {
  fullName: string;
  stars: number;
  archived: boolean;
  fork: boolean;
  pushedAt: string;
  description: string;
  /** GitHub's licence FIELD, a pre-filter only. The fit check reads the LICENSE file. */
  licenceField: string;
}

/**
 * The rows of a search response. Null when the body is not a search response
 * at all; a row that does not parse is left out and counted in `malformed`.
 */
export function parseSearch(body: unknown): { items: RepoItem[]; malformed: number } | null {
  const top = SearchSchema.safeParse(body);
  if (!top.success) return null;
  const items: RepoItem[] = [];
  let malformed = 0;
  for (const raw of top.data.items) {
    const r = ItemSchema.safeParse(raw);
    if (!r.success) {
      malformed++;
      continue;
    }
    items.push({
      fullName: r.data.full_name,
      stars: r.data.stargazers_count,
      archived: r.data.archived,
      fork: r.data.fork,
      pushedAt: r.data.pushed_at,
      description: r.data.description ?? '',
      licenceField: r.data.license?.spdx_id ?? '',
    });
  }
  return { items, malformed };
}

export type DropReason = 'bad-name' | 'ours' | 'archived' | 'fork' | 'stale' | 'stars' | 'licence' | 'list' | 'denied';

/** Extra owners or `owner/name` pairs to refuse, lowercased, from ZOE_SELF_SCOUT_DENY (comma separated). */
export function denyList(env: NodeJS.ProcessEnv = process.env): ReadonlySet<string> {
  return new Set(
    (env.ZOE_SELF_SCOUT_DENY ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** The repo as a link the intake already knows how to validate, or null. */
export function toLink(item: RepoItem): ResourceLink | null {
  if (!/^[^/\s]+\/[^/\s]+$/.test(item.fullName)) return null;
  const link = parseResourceLink(`https://github.com/${item.fullName}`);
  // parseResourceLink canonicalises; a name it changed is a name not to trust.
  return link && `${link.owner}/${link.repo}` === item.fullName ? link : null;
}

/** Why a repo is not a candidate, or null when it is one. */
export function dropReason(item: RepoItem, now: Date, deny: ReadonlySet<string> = new Set()): DropReason | null {
  const link = toLink(item);
  if (!link) return 'bad-name';
  const owner = link.owner.toLowerCase();
  if (OUR_OWNERS.has(owner)) return 'ours';
  if (deny.has(owner) || deny.has(item.fullName.toLowerCase())) return 'denied';
  if (item.archived) return 'archived';
  if (item.fork) return 'fork';
  const pushed = Date.parse(item.pushedAt);
  if (!Number.isFinite(pushed) || now.getTime() - pushed > FRESH_DAYS * DAY_MS) return 'stale';
  if (!(item.stars >= MIN_STARS)) return 'stars';
  if (!item.licenceField || item.licenceField === 'NOASSERTION') return 'licence';
  if (LIST_RE.test(link.repo.replace(/[-_.]/g, ' ')) || LIST_RE.test(item.description)) return 'list';
  return null;
}

export interface Ranked {
  kept: ResourceLink[];
  dropped: Partial<Record<DropReason, number>>;
}

/** Candidates in star order, with a count of what each rule removed. */
export function rankCandidates(items: RepoItem[], now: Date, deny: ReadonlySet<string> = new Set()): Ranked {
  const dropped: Partial<Record<DropReason, number>> = {};
  const kept: Array<{ link: ResourceLink; stars: number }> = [];
  for (const item of items) {
    const why = dropReason(item, now, deny);
    if (why) {
      dropped[why] = (dropped[why] ?? 0) + 1;
      continue;
    }
    // dropReason returned null, so toLink is non-null here.
    kept.push({ link: toLink(item) as ResourceLink, stars: item.stars });
  }
  kept.sort((a, b) => b.stars - a.stars);
  return { kept: kept.map((k) => k.link), dropped };
}

/** One GET to the public search API. Throws on anything but a parsed 200. */
export async function searchRepos(
  url: string,
  fetchFn: typeof fetch = fetch,
): Promise<{ items: RepoItem[]; malformed: number }> {
  const res = await fetchFn(url, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'zoe-self-scout' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`GitHub search answered ${res.status}`);
  const parsed = parseSearch(await res.json());
  if (!parsed) throw new Error('GitHub search answered something that is not a search result');
  return parsed;
}

export interface ScoutDeps {
  now: Date;
  search: (url: string) => Promise<{ items: RepoItem[]; malformed: number }>;
  /** Inputs already waiting in the work queue (cannot report a failed read; see the header). */
  queuedInputs: () => Promise<string[]>;
  /** Research docs that already name this repo. Must THROW when the library cannot be read. */
  findDocs: (link: ResourceLink) => Promise<string[]>;
  enqueue: (input: string) => Promise<unknown>;
  deny?: ReadonlySet<string>;
}

export type ScoutOutcome =
  | { kind: 'queued'; link: ResourceLink; query: string; seen: number; dropped: Ranked['dropped']; covered: number }
  | { kind: 'none'; query: string; seen: number; dropped: Ranked['dropped']; covered: number; malformed: number };

/**
 * One scout pass: search, filter, queue at most ONE repo. Any failed read
 * throws before `enqueue` is reached, so a pass that could not look queues
 * nothing.
 */
export async function runSelfScout(deps: ScoutDeps): Promise<ScoutOutcome> {
  const query = queryForWeek(deps.now);
  const { items, malformed } = await deps.search(buildSearchUrl(query, deps.now));
  const { kept, dropped } = rankCandidates(items, deps.now, deps.deny);
  const queued = await deps.queuedInputs();
  let covered = 0;
  for (const link of kept) {
    const decision = resourceDecision(link, { queuedInputs: queued, docs: await deps.findDocs(link), recheck: false });
    if (decision.kind !== 'queue') {
      covered++;
      continue;
    }
    await deps.enqueue(resourceInput(link));
    return { kind: 'queued', link, query, seen: items.length, dropped, covered };
  }
  return { kind: 'none', query, seen: items.length, dropped, covered, malformed };
}

/** The one line Zaal gets when something was queued. It asks nothing. */
export function scoutStatusLine(link: ResourceLink): string {
  return `Scouting ${link.owner}/${link.repo} this week: I queued a fit check against our code. It lands as a research doc and writes no code.`;
}

/** The journal line for a pass, whatever it did. */
export function scoutLogLine(out: ScoutOutcome): string {
  const drops = Object.entries(out.dropped)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
  const head = out.kind === 'queued' ? `queued ${out.link.owner}/${out.link.repo}` : 'queued nothing';
  return `${head}; query "${out.query}"; seen ${out.seen}; dropped ${drops || 'none'}; already covered ${out.covered}`;
}
