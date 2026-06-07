/**
 * cowork.ts — ZAOOS bot client for the cowork-zaodevz REST API (/api/v1/*).
 *
 * Contract source of truth: cowork-zaodevz `docs/BOT-API.md` (PR #63).
 * ZAOOS-side mirror + per-bot scope table: `bot/COWORK_API.md`.
 *
 * DORMANT BY DEFAULT: if COWORK_API_URL or COWORK_BOT_TOKEN is unset, every call
 * is a silent no-op (returns { ok: false, skipped: true }) so the live VPS fleet
 * runs unchanged until the endpoints + per-bot tokens are configured. All calls
 * are fault-tolerant — network/HTTP/timeout errors are caught and returned, never
 * thrown into a bot loop.
 *
 * Env:
 *   COWORK_API_URL    base URL of the cowork app (e.g. https://cowork.example.com)
 *   COWORK_BOT_TOKEN  this bot's per-bot token; identifies the bot server-side
 */

const API_URL = (process.env.COWORK_API_URL ?? '').replace(/\/$/, '');
const BOT_TOKEN = process.env.COWORK_BOT_TOKEN ?? '';
const REQUEST_TIMEOUT_MS = 8_000;

/** Canonical task statuses the API accepts (server also tolerates lowercase/in_progress). */
export type TaskStatus = 'TODO' | 'WIP' | 'BLOCKED' | 'DONE' | 'TRIAGE';
export type BotHealthStatus = 'up' | 'degraded' | 'down';

export interface CoworkResult<T> {
  ok: boolean;
  /** true when the client is dormant (COWORK_API_URL / COWORK_BOT_TOKEN unset). */
  skipped?: boolean;
  /** HTTP status when a request was actually made. */
  status?: number;
  data?: T;
  error?: string;
}

export interface CreateItemInput {
  title: string;
  /** Owner name; server resolves to a team UUID (unknown -> "Open"). */
  assignee?: string;
  /** YYYY-MM-DD. */
  due_date?: string;
  notes?: string;
  /** Must be in cowork TASK_SOURCES; defaults to "human-bot" server-side. */
  source?: string;
}

export interface UpdateItemInput {
  status?: TaskStatus;
  assignee?: string;
  due_date?: string;
  notes?: string;
}

export interface BotHealth {
  bot: string;
  status: BotHealthStatus;
  ts: number;
  meta?: Record<string, unknown>;
  online: boolean;
  ageSeconds: number;
}

/** True when the client is configured (both URL and token present). */
export function coworkEnabled(): boolean {
  return Boolean(API_URL && BOT_TOKEN);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unexpected error';
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: unknown,
): Promise<CoworkResult<T>> {
  if (!coworkEnabled()) return { ok: false, skipped: true };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${BOT_TOKEN}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    let data: T | undefined;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        // non-JSON body; leave data undefined
      }
    }

    if (!res.ok) {
      return { ok: false, status: res.status, data, error: `HTTP ${res.status}` };
    }
    return { ok: true, status: res.status, data };
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  } finally {
    clearTimeout(timer);
  }
}

/** Create a cowork task. Returns the legacy id (#N) on success. */
export function pushItem(input: CreateItemInput): Promise<CoworkResult<{ id: string }>> {
  return request<{ id: string }>('POST', '/api/v1/items', input);
}

/**
 * Update a cowork task by legacy id (pass "12" or "#12").
 *
 * NOTE for Hermes: this is only needed to close a task WITHOUT a merge.
 * Merge-driven closes are already handled by cowork's GitHub webhook +
 * /api/v1/auto-close (linked via `cowork#<id>` in the PR), so no client call is
 * needed on a normal merge.
 */
export function updateItem(
  id: string | number,
  input: UpdateItemInput,
): Promise<CoworkResult<unknown>> {
  const legacyId = String(id).replace(/^#/, '');
  return request<unknown>('PATCH', `/api/v1/items/${legacyId}`, input);
}

/** Convenience: mark a task DONE (non-merge close). */
export function markDone(id: string | number, notes?: string): Promise<CoworkResult<unknown>> {
  return updateItem(id, notes === undefined ? { status: 'DONE' } : { status: 'DONE', notes });
}

/** Post this bot's heartbeat. The bot identity is the token, not the body. */
export function heartbeat(
  status: BotHealthStatus = 'up',
  meta?: Record<string, unknown>,
): Promise<CoworkResult<unknown>> {
  return request<unknown>('POST', '/api/v1/bots/heartbeat', meta === undefined ? { status } : { status, meta });
}

/**
 * Report an activity event to the coworking board (Phase 1 Observe).
 * Dormant-safe + fault-tolerant like heartbeat: a no-op while dormant, and
 * network/HTTP errors are caught and returned, never thrown into a bot loop.
 * The bot identity is the token, not the body.
 */
export function reportEvent(
  kind: string,
  message?: string,
  meta?: Record<string, unknown>,
): Promise<CoworkResult<unknown>> {
  const body: Record<string, unknown> = { kind };
  if (message !== undefined) body.message = message;
  if (meta !== undefined) body.meta = meta;
  return request<unknown>('POST', '/api/v1/bots/events', body);
}

/** Read the fleet status board. */
export function getBots(): Promise<CoworkResult<{ bots: BotHealth[] }>> {
  return request<{ bots: BotHealth[] }>('GET', '/api/v1/bots');
}

/**
 * Start a periodic heartbeat. Returns a stop() function.
 * No-op (returns a noop stop) when the client is dormant, so it is safe to call
 * unconditionally from any bot's startup.
 *
 * `meta` is static per-process metadata (e.g. { unit }). `metaFn`, when given,
 * is evaluated each tick and merged over `meta`, so a bot can report live detail
 * (current_task, last_error, uptime) to the board's per-bot panel. Backwards-
 * compatible: existing 3-arg callers are unaffected (metaFn stays undefined).
 */
export function startHeartbeat(
  intervalMs = 60_000,
  statusFn: () => BotHealthStatus = () => 'up',
  meta?: Record<string, unknown>,
  metaFn?: () => Record<string, unknown>,
): () => void {
  if (!coworkEnabled()) return () => {};
  const tick = (): void => {
    const dynamic = metaFn ? metaFn() : undefined;
    const merged =
      meta === undefined && dynamic === undefined ? undefined : { ...(meta ?? {}), ...(dynamic ?? {}) };
    void heartbeat(statusFn(), merged);
  };
  tick();
  const handle = setInterval(tick, intervalMs);
  // Don't keep the event loop alive solely for heartbeats.
  (handle as { unref?: () => void }).unref?.();
  return () => clearInterval(handle);
}

// ===========================================================================
// Control plane (doc 800 Phases 2-4) — pull-based command queue.
// A bot polls its own pending commands, executes, and posts results back.
// All dormant-safe + fault-tolerant like the rest of this client.
// ===========================================================================

export interface BotCommand {
  id: number;
  bot: string;
  command: string;
  args: Record<string, unknown> | null;
  status: string;
  created_at: string;
}

/** Pull + atomically claim this bot's pending commands (its own queue). */
export function getCommands(): Promise<CoworkResult<{ commands: BotCommand[] }>> {
  return request<{ commands: BotCommand[] }>('GET', '/api/v1/bots/commands');
}

/** Pull + claim pending host commands (start|stop). Fleet-agent ("fleet" token) only. */
export function getHostCommands(): Promise<CoworkResult<{ commands: BotCommand[] }>> {
  return request<{ commands: BotCommand[] }>('GET', '/api/v1/bots/commands?scope=host');
}

/** Report the outcome of a claimed command. */
export function postCommandResult(
  id: number,
  status: 'done' | 'error',
  result?: Record<string, unknown>,
): Promise<CoworkResult<unknown>> {
  return request<unknown>(
    'POST',
    `/api/v1/bots/commands/${id}/result`,
    result === undefined ? { status } : { status, result },
  );
}

/**
 * Handlers a bot supplies to startCommandPoller. All optional: a bot that omits
 * onRunTask/onAsk reports those commands as unsupported (error result), so the
 * board shows a clear outcome rather than silently dropping them. Lifecycle
 * (pause/resume/restart) is handled generically below.
 */
export interface CommandHandlers {
  onPause?: () => void;
  onResume?: () => void;
  onRunTask?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  onAsk?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

async function executeCommand(cmd: BotCommand, h: CommandHandlers): Promise<void> {
  try {
    switch (cmd.command) {
      case 'pause':
        h.onPause?.();
        await postCommandResult(cmd.id, 'done', { message: 'paused' });
        return;
      case 'resume':
        h.onResume?.();
        await postCommandResult(cmd.id, 'done', { message: 'resumed' });
        return;
      case 'restart':
        // Report first, then exit non-zero so systemd restarts the unit
        // (zoe-bot Restart=on-failure, zaostock-bot Restart=always).
        await postCommandResult(cmd.id, 'done', { message: 'restarting' });
        setTimeout(() => process.exit(1), 500);
        return;
      case 'run_task': {
        if (!h.onRunTask) {
          await postCommandResult(cmd.id, 'error', { error: 'run_task not supported by this bot' });
          return;
        }
        const result = await h.onRunTask(cmd.args ?? {});
        await postCommandResult(cmd.id, 'done', result);
        return;
      }
      case 'ask': {
        if (!h.onAsk) {
          await postCommandResult(cmd.id, 'error', { error: 'ask not supported by this bot' });
          return;
        }
        const result = await h.onAsk(cmd.args ?? {});
        await postCommandResult(cmd.id, 'done', result);
        return;
      }
      default:
        await postCommandResult(cmd.id, 'error', { error: `unknown command: ${cmd.command}` });
    }
  } catch (err) {
    await postCommandResult(cmd.id, 'error', {
      error: err instanceof Error ? err.message : 'execution failed',
    });
  }
}

/**
 * Poll this bot's command queue on a timer and execute claimed commands.
 * No-op while dormant. Returns a stop() function. Commands run sequentially
 * per tick so a long run_task/ask doesn't overlap the next poll's work.
 */
export function startCommandPoller(handlers: CommandHandlers, intervalMs = 20_000): () => void {
  if (!coworkEnabled()) return () => {};
  let running = false;
  const tick = async (): Promise<void> => {
    if (running) return;
    running = true;
    try {
      const res = await getCommands();
      if (res.ok && res.data?.commands?.length) {
        for (const cmd of res.data.commands) {
          await executeCommand(cmd, handlers);
        }
      }
    } finally {
      running = false;
    }
  };
  void tick();
  const handle = setInterval(() => void tick(), intervalMs);
  (handle as { unref?: () => void }).unref?.();
  return () => clearInterval(handle);
}
