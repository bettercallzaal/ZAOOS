/**
 * Shared types for bot/src/zoe — ZOE concierge brain.
 *
 * Mirrors bot/src/hermes/types.ts shape but scoped to concierge concerns
 * (tasks, captures, daily nudges) rather than code-fix work.
 */

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'deferred';

export interface ZoeTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'high' | 'med' | 'low';
  source: string;             // e.g. 'doc-601' | 'ad-hoc' | 'bonfire-recall'
  blocked_by?: string[];      // task ids
  notes: string[];            // running history
  created_at: string;         // ISO 8601
  updated_at: string;
}

export interface ZoeCaptureNote {
  id: string;
  text: string;
  topic: string;              // free-form: 'idea', 'fact', 'decision', 'reflection'
  source: 'dm' | 'cron' | 'bridge';
  created_at: string;
}

export interface ZoeContext {
  zaal_tg_id: number;
  workspace_dir: string;
  pending_tasks: ZoeTask[];
  recent_captures: ZoeCaptureNote[];
  current_date: string;
}

export interface ConciergeOptions {
  /** User message text */
  message: string;
  /** Loaded ZOE context for system prompt */
  context: ZoeContext;
  /** Override model: 'sonnet' | 'opus' | 'haiku'. Default: sonnet (cheap), escalate to opus on hard reasoning */
  model?: string;
}

export interface ConciergeResult {
  /** Text to reply to user in Telegram */
  reply: string;
  /** Tasks the assistant wants to add or update */
  task_ops: TaskOp[];
  /** Captures to log */
  captures: ZoeCaptureNote[];
  /** Cost stats from Claude CLI call */
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  model: string;
  durationMs: number;
}

export type TaskOp =
  | { op: 'add'; task: Omit<ZoeTask, 'id' | 'created_at' | 'updated_at'> }
  | { op: 'update'; id: string; patch: Partial<Pick<ZoeTask, 'status' | 'description' | 'priority' | 'notes'>> }
  | { op: 'complete'; id: string; outcome?: string }
  | { op: 'defer'; id: string; reason?: string };

/** Cost-routing helper — match bot/src/hermes/claude-cli.ts ZOE-side defaults. */
export const ZOE_DEFAULT_MODEL = process.env.ZOE_DEFAULT_MODEL ?? 'sonnet';
export const ZOE_HARD_MODEL = process.env.ZOE_HARD_MODEL ?? 'opus';
export const ZOE_QUICK_MODEL = process.env.ZOE_QUICK_MODEL ?? 'haiku';

/**
 * Decide which model to use for a concierge request.
 * Heuristic: short factual questions = quick. Default = default. Strategic / multi-step = hard.
 */
export function selectModel(message: string): string {
  const len = message.length;
  const lower = message.toLowerCase();
  const strategicKeywords = ['plan', 'strategy', 'should i', 'tradeoff', 'vs', 'decide', 'compare', 'whitepaper', 'architecture'];
  const quickKeywords = ['what is', 'when', 'where', 'who', 'time', 'date'];

  if (strategicKeywords.some((kw) => lower.includes(kw)) || len > 280) {
    return ZOE_HARD_MODEL;
  }
  if (quickKeywords.some((kw) => lower.includes(kw)) && len < 80) {
    return ZOE_QUICK_MODEL;
  }
  return ZOE_DEFAULT_MODEL;
}
