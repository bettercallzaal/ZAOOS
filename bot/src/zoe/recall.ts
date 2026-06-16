/**
 * Bonfire bridge for ZOE - read (recall) + write (remember).
 *
 * Verified against the live Bonfires API 2026-05-30:
 *   - WRITE  POST /knowledge_graph/episode/create     (works with non-admin key)
 *   - READ   POST /delve  {bonfire_id, query}          (works - returns ranked
 *            episodes with content; this is the SDK's delve path)
 *
 * FIX (2026-05-30): the prior read path used POST /vector_store/search with
 * {bonfire_ref, search_string} and ALWAYS returned count:0. That was NOT an
 * admin-labeling gate - labeling is internal to the Bonfires platform, not a
 * key we flip. It was the WRONG ENDPOINT: /vector_store/search is empty for
 * this bonfire; /delve actually queries the graph. Confirmed live - a
 * "What is ZAO?" delve returned 51 episodes with full content. recall() now
 * uses /delve and only falls back to manual relay on a genuine error/empty.
 *
 * `remember()` works today - ZOE's captures + decisions get mirrored into
 * the bonfire as episodes, so the knowledge graph keeps growing from daily use.
 *
 * Env:
 *   BONFIRE_API_KEY  required for any API path; absent => manual relay only
 *   BONFIRE_ID       the ZABAL bonfire id
 *   BONFIRE_API_URL  default https://tnt-v2.api.bonfires.ai
 */

const API_URL = process.env.BONFIRE_API_URL ?? 'https://tnt-v2.api.bonfires.ai';
const API_KEY = process.env.BONFIRE_API_KEY ?? '';
const BONFIRE_ID = process.env.BONFIRE_ID ?? '';
const READ_TIMEOUT_MS = 10_000;
const WRITE_TIMEOUT_MS = 15_000;

export function bonfireConfigured(): boolean {
  return !!API_KEY && !!BONFIRE_ID;
}

// --- secret guard for writes -------------------------------------------------
// ZOE's captures are facts about Zaal/the team - low risk, but never let an
// API key / private key slip into the knowledge graph. Minimal HIGH-severity
// check mirroring scripts/bonfire-ingest/secret_scan.py.
const SECRET_PATTERNS: RegExp[] = [
  /sk-ant-[A-Za-z0-9_-]{20,}/,
  /sk-(?:proj-|cp-)?[A-Za-z0-9_-]{30,}/,
  /ghp_[A-Za-z0-9]{36}/,
  /github_pat_[A-Za-z0-9_]{60,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED |PGP )?PRIVATE KEY-----/,
  /\b0x[0-9a-fA-F]{64}\b/,
  /\b\d{9,12}:[A-Za-z0-9_-]{30,}\b/, // telegram bot token
  /xox[bpaors]-[A-Za-z0-9-]{10,}/, // slack
  /\bAKIA[0-9A-Z]{16}\b/, // aws
];

export function containsSecret(text: string): boolean {
  return SECRET_PATTERNS.some((re) => re.test(text));
}

// --- types -------------------------------------------------------------------
export interface RecallRequest {
  query: string;
  reason: string; // why ZOE needs the answer
  expected_kind: 'fact' | 'people' | 'event' | 'decision' | 'history' | 'mixed';
}

export interface RecallResult {
  kind: 'sdk_response' | 'manual_relay_needed';
  query: string;
  text?: string; // formatted bonfire reply when sdk_response
  hits?: number;
  relay?: string; // Telegram-ready manual-relay text when manual_relay_needed
}

export interface RememberResult {
  ok: boolean;
  skipped?: 'no-config' | 'secret-detected' | 'empty';
  taskId?: string;
  error?: string;
}

// --- write -------------------------------------------------------------------
/**
 * Mirror a fact / capture / decision into the ZABAL bonfire as an episode.
 * Bonfires' auto-extraction turns the natural-language body into KG nodes.
 * Best-effort: never throws, returns a result the caller can log.
 */
export async function remember(opts: {
  body: string;
  name: string; // stable-ish episode name, e.g. "zoe-capture:<id>"
  sourceTag: string; // source_description, e.g. "zoe:capture"
}): Promise<RememberResult> {
  if (!bonfireConfigured()) return { ok: false, skipped: 'no-config' };
  const body = opts.body.trim();
  if (!body) return { ok: false, skipped: 'empty' };
  if (containsSecret(body)) {
    console.warn('[zoe/recall] remember() blocked - body contains a secret-shaped string');
    return { ok: false, skipped: 'secret-detected' };
  }

  try {
    const res = await fetch(`${API_URL}/knowledge_graph/episode/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bonfire_id: BONFIRE_ID,
        name: opts.name,
        episode_body: body,
        source: 'text',
        source_description: opts.sourceTag,
        reference_time: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 200);
      return { ok: false, error: `HTTP ${res.status} ${detail}` };
    }
    const json = (await res.json().catch(() => ({}))) as { task_id?: string; success?: boolean };
    return { ok: json.success !== false, taskId: json.task_id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// --- read --------------------------------------------------------------------
interface DelveEpisode {
  uuid?: string;
  name?: string;
  source_description?: string;
  summary?: string | null;
  content?: string;
  created_at?: string;
  valid_at?: string;
}
interface DelveResponse {
  success?: boolean;
  query?: string;
  num_results?: number;
  episodes?: DelveEpisode[];
}

/**
 * Query the bonfire via /delve (the SDK's graph-query path). Returns ranked
 * episodes (possibly empty). Never throws. `limit` is applied client-side
 * since /delve returns the full ranked set.
 */
async function delveBonfire(
  query: string,
  limit = 5,
): Promise<{ ok: boolean; results: DelveEpisode[]; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/delve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bonfire_id: BONFIRE_ID, query }),
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
    });
    if (!res.ok) {
      return { ok: false, results: [], error: `HTTP ${res.status}` };
    }
    const json = (await res.json()) as DelveResponse;
    return { ok: true, results: (json.episodes ?? []).slice(0, limit) };
  } catch (err) {
    return { ok: false, results: [], error: err instanceof Error ? err.message : String(err) };
  }
}

function formatHit(hit: DelveEpisode): string {
  const body = hit.summary || hit.content || hit.name || JSON.stringify(hit);
  const src = hit.source_description ? ` [src: ${hit.source_description}]` : '';
  return `- ${String(body).slice(0, 500)}${src}`;
}

/**
 * Telegram-ready manual-relay text - fallback used only when /delve errors or
 * returns nothing, or the bonfire isn't configured.
 */
export function formatManualRelay(req: RecallRequest): string {
  return [
    `_Bonfire delve returned nothing for this query. Manual relay for: ${req.reason}_`,
    '',
    'Paste into @zabal_bonfire DM:',
    '```',
    `RECALL: ${req.query}`,
    '```',
    '',
    'Then paste the reply back here and I will continue.',
  ].join('\n');
}

/**
 * Single entry point ZOE's concierge calls. Tries vector search; on empty
 * result or failure, returns a manual-relay payload. Never throws.
 */
export async function recall(req: RecallRequest): Promise<RecallResult> {
  if (!bonfireConfigured()) {
    return { kind: 'manual_relay_needed', query: req.query, relay: formatManualRelay(req) };
  }
  const search = await delveBonfire(req.query, 12);
  if (search.ok && search.results.length > 0) {
    console.log(`[zoe/recall] delve: ${search.results.length} hit(s) for "${req.query.slice(0, 60)}"`);
    return {
      kind: 'sdk_response',
      query: req.query,
      hits: search.results.length,
      text: search.results.map(formatHit).join('\n'),
    };
  }
  console.log(`[zoe/recall] delve: 0 hits${search.error ? ` (error: ${search.error})` : ''} for "${req.query.slice(0, 60)}" - manual-relay fallback`);
  // delve ok-but-empty (or errored) => graceful manual-relay fallback.
  return {
    kind: 'manual_relay_needed',
    query: req.query,
    hits: 0,
    relay: formatManualRelay(req),
  };
}

/**
 * Days since the NEWEST graph episode for a topic (via /delve created_at).
 * Used by proactive graph-staleness nudges - if nothing new on a watched
 * front in N days, it has gone cold. Returns null if unconfigured / no hits.
 */
export async function graphTopicAgeDays(topic: string, now: number = Date.now()): Promise<number | null> {
  if (!bonfireConfigured()) return null;
  const search = await delveBonfire(topic, 25);
  if (!search.ok || search.results.length === 0) return null;
  let newest = 0;
  for (const ep of search.results) {
    const raw = ep.created_at ?? ep.valid_at;
    const t = raw ? Date.parse(raw) : Number.NaN;
    if (Number.isFinite(t) && t > newest) newest = t;
  }
  if (!newest) return null;
  return Math.floor((now - newest) / 86_400_000);
}

// --- turn mirroring ----------------------------------------------------------
/**
 * Mirror the meaningful output of a concierge turn into the bonfire as
 * episodes - captures, new tasks, completed tasks, side-quest changes.
 * The knowledge graph grows from ZOE's daily use. Best-effort, fire-and-forget.
 *
 * Loosely typed on purpose (captures/task_ops/quest_ops) so this stays
 * decoupled from concierge.ts's exact types - the caller passes the result's
 * arrays straight through.
 */
export async function mirrorTurn(turn: {
  captures?: Array<{ text: string; topic: string }>;
  task_ops?: Array<Record<string, unknown>>;
  quest_ops?: Array<Record<string, unknown>>;
}): Promise<{ mirrored: number; skipped: number }> {
  if (!bonfireConfigured()) return { mirrored: 0, skipped: 0 };

  const episodes: Array<{ body: string; name: string; sourceTag: string }> = [];
  const stamp = Date.now();

  for (const c of turn.captures ?? []) {
    if (!c.text?.trim()) continue;
    episodes.push({
      body: `ZOE captured a ${c.topic || 'note'} from a conversation with the ZAO team: ${c.text}`,
      name: `zoe-capture:${stamp}:${episodes.length}`,
      sourceTag: 'zoe:capture',
    });
  }

  for (const op of turn.task_ops ?? []) {
    const kind = String(op.op ?? '');
    if (kind === 'add') {
      const task = (op.task ?? {}) as Record<string, unknown>;
      const desc = String(task.description ?? task.title ?? '').trim();
      if (desc) {
        episodes.push({
          body: `ZOE added a task for the ZAO team: ${desc}.`,
          name: `zoe-task-add:${stamp}:${episodes.length}`,
          sourceTag: 'zoe:task-add',
        });
      }
    } else if (kind === 'complete') {
      const outcome = String(op.outcome ?? '').trim();
      episodes.push({
        body: `ZOE marked a ZAO team task complete (id ${op.id})${outcome ? `: ${outcome}` : '.'}`,
        name: `zoe-task-done:${stamp}:${episodes.length}`,
        sourceTag: 'zoe:task-done',
      });
    }
  }

  for (const op of turn.quest_ops ?? []) {
    const kind = String(op.op ?? '');
    if (kind === 'add') {
      const quest = (op.quest ?? {}) as Record<string, unknown>;
      const title = String(quest.title ?? '').trim();
      const description = String(quest.description ?? '').trim();
      if (title) {
        episodes.push({
          body: `ZOE added a side quest for the ZAO team: ${title}. ${description}`,
          name: `zoe-quest-add:${stamp}:${episodes.length}`,
          sourceTag: 'zoe:quest-add',
        });
      }
    } else if (kind === 'set_main') {
      const text = String(op.text ?? '').trim();
      if (text) {
        episodes.push({
          body: `ZOE set the ZAO team's main quest: ${text}`,
          name: `zoe-quest-main:${stamp}:${episodes.length}`,
          sourceTag: 'zoe:quest-main',
        });
      }
    }
  }

  let mirrored = 0;
  let skipped = 0;
  for (const ep of episodes) {
    const r = await remember(ep);
    if (r.ok) mirrored += 1;
    else skipped += 1;
  }
  return { mirrored, skipped };
}
