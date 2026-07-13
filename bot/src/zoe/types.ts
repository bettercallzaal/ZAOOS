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
  current_date: string;
}

export interface BotRelayOp {
  op: "relay_to_bot";
  /** Group chat title (resolved against groups.json) OR explicit chat_id. */
  to_group?: string;
  to_chat_id?: number;
  /** Bot username to tag, e.g. "@zabal_bonfire_bot". The runtime prepends this to message. */
  tag_bot: string;
  /** The question/message body (without the tag). */
  message: string;
  /** v1: fire-and-forget. v2 will support await_reply_seconds for ZOE to capture + summarize. */
  await_reply_seconds?: number;
}

export interface CrmOp {
  op: "log_crm";
  /** Person record. Upserted by a deterministic slug (handle/name). */
  contact: {
    name: string;
    farcaster_handle?: string;
    x_handle?: string;
    github_handle?: string;
    telegram_handle?: string;
    role?: string;
    org?: string;
    how_we_met?: string;
    /** Public-safe one-liner shown on /network. */
    public_summary?: string;
    email?: string;
    location?: string;
    /** Default false. Only true if Zaal OK'd showing this contact publicly. */
    is_public?: boolean;
  };
  /** The interaction to log against the contact. */
  interaction: {
    type?: "meeting" | "call" | "email" | "message" | "gcal" | "github" | "note";
    title?: string;
    /** Shown on /network only if visibility=public. */
    public_summary?: string;
    private_notes?: string;
    /** Default private. */
    visibility?: "public" | "private";
    occurred_at?: string;
  };
}

/** Deeper memory: decision records that ZOE logs + recalls */
export interface DecisionRecord {
  id: string;
  decision: string; // Zaal's decision (his words)
  rationale: string; // Why (reasoning)
  context?: string; // Optional context (who, what triggered it)
  created_at: string;
}

export type DecisionOp = {
  op: "log_decision";
  decision: string;
  rationale: string;
  context?: string;
};

/** Deeper memory: build-state records tracking features/PRs across sessions */
export interface BuildStateRecord {
  id: string;
  feature: string; // Feature name (e.g. "WaveWarZ-v2")
  status: "open" | "in-review" | "blocked" | "shipped" | "paused" | "planning";
  pr?: string; // PR number/URL
  branch?: string; // Git branch name
  reason?: string; // Why this status (e.g. "waiting for review")
  created_at: string;
}

export type BuildStateOp = {
  op: "log_build_state";
  feature: string;
  status: "open" | "in-review" | "blocked" | "shipped" | "paused" | "planning";
  pr?: string;
  branch?: string;
  reason?: string;
};

export interface ConciergeOptions {
  /** User message text */
  message: string;
  /** Memory blocks (persona/human/working/tasks) loaded for this turn */
  blocks: import('./memory').MemoryBlocks;
  /** Loaded ZOE runtime context (date, workspace, zaal id) */
  context: ZoeContext;
  /** Label for who's speaking — 'Zaal' for DMs, first-name or username for group members */
  senderLabel?: string;
  /** Override model: 'sonnet' | 'opus' | 'haiku'. Default: sonnet (cheap), escalate to opus on hard reasoning */
  model?: string;
  /** Prior context retrieved from the Bonfire graph (via recall/delve), injected as a <bonfire_recall> block. */
  recallContext?: string;
  /** Brand context (ICM box text) for brand-masked responses, injected as a <brand_context> block. */
  brandContext?: string;
  /** True if the message contains a URL + research intent keywords. Routes toward research-worker dispatch. */
  linkResearchIntent?: boolean;
}

export interface ConciergeResult {
  /** Text to reply to user in Telegram */
  reply: string;
  /** Tasks the assistant wants to add or update */
  task_ops: TaskOp[];
  /** Side-quest ops the assistant wants to apply (SIDEQUESTZ) */
  quest_ops: QuestOp[];
  /** Captures to log */
  captures: ZoeCaptureNote[];
  /** Cross-bot relay ops (e.g. ZOE asks @zabal_bonfire_bot in ZAO Civilization). */
  bot_relay_ops: BotRelayOp[];
  /** CRM ops - upsert a contact + log an interaction via the app API (doc 772). */
  crm_ops: CrmOp[];
  /** Open-thread ops - track/advance commitments Zaal makes (doc 796 Move 2). */
  thread_ops: ThreadOp[];
  /** Decision ops - log Zaal's decisions + rationale for recall (deeper memory increment 1). */
  decision_ops: DecisionOp[];
  /** Build-state ops - track feature/PR status across sessions (deeper memory increment 1). */
  build_state_ops: BuildStateOp[];
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

/**
 * Open-thread ops (doc 796 Move 2). ZOE opens a thread when Zaal commits to
 * something ("I'll ship X today"), and resolves/snoozes/drops it as the loop
 * closes. `open` is the only op the concierge emits proactively; resolve/snooze/
 * drop usually come from Zaal's reply to a nudge (handled in index.ts), but the
 * concierge may also emit them when Zaal says "done with X" mid-conversation.
 * `dueAt` is an ISO timestamp or a natural phrase the runtime resolves.
 */
export type ThreadOp =
  | { op: 'open'; summary: string; dueAt?: string | null }
  | { op: 'resolve'; id: string }
  | { op: 'snooze'; id: string; untilHours?: number }
  | { op: 'drop'; id: string };

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

// --- SIDEQUESTZ (doc 648 / spec 2026-05-14) -----------------------------------

export interface SideQuest {
  id: string;                  // sq-<timestamp>-<rand>
  title: string;
  description: string;
  alignment: number | null;    // 0-10, null = not yet scored
  alignment_reason: string;    // ZOE's one-line "why this score" ('' if unscored)
  status: 'active' | 'parked' | 'done' | 'dropped';
  pinned: boolean;             // true = forced active regardless of score
  created_at: string;          // ISO 8601
  updated_at: string;
  scored_at: string | null;
}

export type QuestOp =
  | { op: 'set_main'; text: string }
  | { op: 'add'; quest: { title: string; description: string; alignment?: number; alignment_reason?: string } }
  | { op: 'score'; id: string; alignment: number; reason: string }
  | { op: 'complete'; id: string }
  | { op: 'drop'; id: string }
  | { op: 'pin'; id: string };

export interface QuestOpResult {
  main_quest_set: boolean;
  added: SideQuest[];
  scored: string[];
  completed: string[];
  dropped: string[];
  pinned: string[];
  active: SideQuest[];   // the resulting active set after recompute
}
