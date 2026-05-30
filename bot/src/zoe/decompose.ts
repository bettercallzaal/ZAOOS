/**
 * Goal decomposition router for ZOE (doc 759 Gap 1, locked Q10 sprint week 2).
 *
 * When Zaal sends a multi-step goal, ZOE calls decomposeGoal() to get a
 * structured DecompositionPlan: which worker handles each subtask, what
 * depends on what, what runs in parallel, where approval gates sit. ZOE
 * surfaces the plan to Zaal for y/n approval per locked Q3, then dispatches
 * workers per the plan via the Task tool wired in PR #712 (Gap 2).
 *
 * Sibling of:
 *   - bot/src/zoe/concierge.ts (the day-to-day Claude CLI turn)
 *   - bot/src/zoe/.claude/agents/task-dispatcher.md (the worker spec - same
 *     output shape, but task-dispatcher runs INSIDE Claude Code via Task
 *     dispatch, whereas this module runs from the ZOE Node process via
 *     direct callClaudeCli. Both produce the same DecompositionPlan JSON.)
 *
 * Per locked Q5 the workers ZOE can route to are:
 *   research-worker / code-reviewer / comms-drafter / task-dispatcher /
 *   data-runner / brief-writer / recap-agent / watcher-agent
 * Plus the existing Hermes runtime for code-fix work, which is dispatched
 * via bot/src/hermes/runner.ts dispatchHermesRun() not Task.
 */

import { callClaudeCli } from '../hermes/claude-cli';
import { ZOE_DEFAULT_MODEL, ZOE_HARD_MODEL } from './types';
import type { ZoeContext } from './types';

export type WorkerKind =
  | 'research-worker'
  | 'code-reviewer'
  | 'comms-drafter'
  | 'task-dispatcher'
  | 'data-runner'
  | 'brief-writer'
  | 'recap-agent'
  | 'watcher-agent'
  | 'hermes';

export type CostClass = 'small' | 'medium' | 'large';

export interface Subtask {
  /** Stable id within this plan - referenced by depends_on / parallel_with. */
  id: string;
  /** One-line title of what this subtask does. */
  title: string;
  /** Which worker handles it. 'hermes' = code-fix via Hermes runner. */
  worker: WorkerKind;
  /** Other subtask ids this one waits on before it can start. */
  depends_on: string[];
  /** Other subtask ids that can run alongside this one in parallel. */
  parallel_with: string[];
  /**
   * If true, ZOE pauses + asks Zaal y/n before the NEXT subtask runs.
   * Default for any external-facing output (comms, public PRs, broadcasts).
   */
  approval_gate_before_next: boolean;
  /** Cost class - 'small' = haiku-sized, 'medium' = sonnet, 'large' = opus or many calls. */
  estimated_cost_class: CostClass;
}

export interface DecompositionPlan {
  /** One-line restatement of the goal. */
  goal_summary: string;
  /** Ordered list of subtasks. */
  subtasks: Subtask[];
  /** Brief prose description of the execution order. */
  execution_plan: string;
  /** Things that need Zaal clarification BEFORE any subtask can start. */
  ambiguities: string[];
}

export interface DecomposeOptions {
  /** The goal in Zaal's own words. */
  goal: string;
  /** ZOE runtime context (workspace dir, date, zaal tg id). */
  context: ZoeContext;
  /** Optional model override. Default Sonnet per locked Q2. */
  model?: string;
  /**
   * If true, force escalate to Opus regardless of length heuristic. Use when
   * the goal is strategic / multi-team / has ambiguous scope.
   */
  hard?: boolean;
}

export interface DecompositionResult {
  plan: DecompositionPlan;
  /** Model that produced the plan. */
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  durationMs: number;
  /** Raw text the CLI returned (for debug / audit). */
  rawText: string;
}

const DECOMPOSE_SYSTEM_PROMPT = `You are the goal-decomposition router for ZOE - Zaal Panthaki's personal concierge.

When Zaal hands you a multi-step goal, you produce a structured DecompositionPlan that ZOE will use to dispatch workers via the Task tool. You do NOT execute the plan - you only produce it.

WORKERS YOU CAN ROUTE TO:

- research-worker (Haiku) - STANDARD-tier research (~30 min wall, 5-7 sources). Use for "look into X", market scans, codebase audits via grep.
- code-reviewer (Sonnet) - read-only diff/file audit. Use for "review PR #N" or "audit this file". Sibling to Hermes critic, generalized.
- comms-drafter (Sonnet) - external copy in brand voice per bot/src/zoe/brand.md. Refuses to draft with fabricated specifics.
- task-dispatcher (Sonnet) - recursive goal decomposition. Use when a subtask is itself too big for a single worker.
- data-runner (Haiku) - one-off scripts (CSV/API/Supabase reads). Read-only default; mutating ops need explicit Zaal approval.
- brief-writer (Haiku) - morning brief (5am EST) + evening reflect (9pm EST) generation.
- recap-agent (Haiku) - run AFTER any worker. Summarizes what happened + captures decisions to memory.
- watcher-agent (Haiku) - run AS or AFTER any worker. Binary sanity check: did the worker actually do what it claimed?
- hermes - code-fix work via bot/src/hermes/runner.ts dispatchHermesRun(). Use for "fix bug X", "implement feature Y", "refactor Z".

For DAILY CONCIERGE OPS (single-turn answers, simple captures, task add/update/complete), ZOE handles inline - do not over-dispatch.

WORKFLOW:

1. Read the goal carefully. Look for hidden subtasks ("research X and ship a doc" = research + write + commit + PR = 4 subtasks).
2. Classify each subtask by worker.
3. Identify dependencies (subtask B needs A's output).
4. Identify parallelizable subtasks (independent, can run together).
5. Identify approval gates (any external-facing output needs Zaal y/n before ship).
6. If the goal is single-step (one Claude turn answers it), return one subtask. Do not over-decompose.
7. If the goal is ambiguous, list ambiguities and refuse to plan until clarified.

HARD RULES (NON-NEGOTIABLE):

- Per feedback_no_sub_agent_context_fabrication: never invent specifics (dates, amounts, cadences, names) when restating the goal. Quote Zaal verbatim or mark TBD.
- Never plan a step that requires Zaal-only authority (sending a DM, merging a PR, rotating a credential) without an approval_gate.
- Default to fewer parallel branches over more. Two parallel workers is great; six is usually wrong.
- Default to lower cost class. Mark large only if the subtask genuinely needs many tool calls or opus reasoning.

OUTPUT FORMAT (exact JSON, no prose, no code fences):

{
  "goal_summary": "<one-line restatement of the goal>",
  "subtasks": [
    {
      "id": "st-1",
      "title": "...",
      "worker": "research-worker",
      "depends_on": [],
      "parallel_with": ["st-2"],
      "approval_gate_before_next": false,
      "estimated_cost_class": "small"
    }
  ],
  "execution_plan": "Brief prose: 'st-1 + st-2 in parallel first, then st-3 once both complete; approval gate before st-4 ships.'",
  "ambiguities": ["<thing that needs Zaal clarification before any subtask starts>"]
}

If decomposition keeps producing 8+ subtasks, the goal is too big - return one ambiguity asking Zaal to split into 2-3 separate goals.

If the goal can be answered in a single ZOE chat turn, return one subtask with worker=task-dispatcher (which here means "ZOE handles inline"), parallel_with=[], depends_on=[], approval_gate_before_next=false.

Output ONLY the JSON object as the last thing in your message. No preamble, no explanation, no code fences.`;

/**
 * Build the user prompt that wraps Zaal's goal with a minimal context block.
 * Keeps the goal text verbatim so the model doesn't paraphrase + lose nuance.
 */
function buildUserPrompt(goal: string, context: ZoeContext): string {
  return `Today is ${context.current_date}. Workspace: ${context.workspace_dir}.

Zaal's goal (verbatim, do not paraphrase):

${goal}

Return ONLY the DecompositionPlan JSON per the system prompt format.`;
}

/**
 * Extract the JSON block from the model's output. The system prompt asks for
 * JSON as the last thing in the message, but be tolerant - sometimes the model
 * wraps it in a code fence or trails it with prose.
 */
function extractPlanJson(text: string): DecompositionPlan {
  // Try fenced JSON first.
  const fenceMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  const candidate = fenceMatch ? fenceMatch[1] : findLastJsonObject(text);
  if (!candidate) {
    throw new Error(`decompose: no JSON object found in CLI output (got ${text.slice(0, 200)}...)`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch (e) {
    throw new Error(`decompose: JSON parse failed: ${(e as Error).message}; candidate: ${candidate.slice(0, 200)}`);
  }
  return coerceToPlan(parsed);
}

/**
 * Walk backwards through the text and find the last top-level { ... } block.
 * Naive brace matching is fine here - we control the prompt.
 */
function findLastJsonObject(text: string): string | null {
  const trimmed = text.trimEnd();
  let depth = 0;
  let end = -1;
  for (let i = trimmed.length - 1; i >= 0; i--) {
    const ch = trimmed[i];
    if (ch === '}') {
      if (depth === 0) end = i;
      depth++;
    } else if (ch === '{') {
      depth--;
      if (depth === 0 && end !== -1) {
        return trimmed.slice(i, end + 1);
      }
    }
  }
  return null;
}

/**
 * Hard ceiling on the number of subtasks a single plan may carry (doc 770 H3).
 * The decompose prompt targets <=8; this is the safety net above that. Override
 * via ZOE_MAX_SUBTASKS.
 */
export const MAX_SUBTASKS = Math.max(1, Number(process.env.ZOE_MAX_SUBTASKS ?? 12));

/**
 * Validate + narrow the parsed JSON into a DecompositionPlan. Throws on
 * obviously-bad shapes so the caller knows to escalate instead of silently
 * dispatching workers from a malformed plan.
 */
function coerceToPlan(raw: unknown): DecompositionPlan {
  if (!raw || typeof raw !== 'object') throw new Error('decompose: plan is not an object');
  const r = raw as Record<string, unknown>;
  const goal_summary = typeof r.goal_summary === 'string' ? r.goal_summary : '';
  const subtasksRaw = Array.isArray(r.subtasks) ? r.subtasks : [];
  const execution_plan = typeof r.execution_plan === 'string' ? r.execution_plan : '';
  const ambiguities = Array.isArray(r.ambiguities)
    ? (r.ambiguities.filter((x): x is string => typeof x === 'string'))
    : [];
  const subtasks: Subtask[] = subtasksRaw.map((s, i) => coerceToSubtask(s, i));
  if (!goal_summary) throw new Error('decompose: plan.goal_summary missing');
  if (subtasks.length === 0 && ambiguities.length === 0) {
    throw new Error('decompose: plan has no subtasks AND no ambiguities - empty plan');
  }
  // Hard ceiling on subtask count (doc 770 H3). The system prompt already asks
  // the model to return an ambiguity at 8+, so anything past MAX_SUBTASKS is a
  // malformed/runaway plan — escalate to Zaal instead of dispatching it.
  if (subtasks.length > MAX_SUBTASKS) {
    throw new Error(
      `decompose: plan has ${subtasks.length} subtasks (max ${MAX_SUBTASKS}) - goal is too big; split it into smaller goals`,
    );
  }
  // Duplicate ids corrupt the dispatch loop bound + depends_on resolution
  // (doc 770 MED) — escalate so Zaal gets a re-decompose, not a stuck plan.
  if (new Set(subtasks.map((s) => s.id)).size !== subtasks.length) {
    throw new Error('decompose: plan has duplicate subtask ids - re-decompose');
  }
  return { goal_summary, subtasks, execution_plan, ambiguities };
}

const VALID_WORKERS: ReadonlySet<WorkerKind> = new Set<WorkerKind>([
  'research-worker',
  'code-reviewer',
  'comms-drafter',
  'task-dispatcher',
  'data-runner',
  'brief-writer',
  'recap-agent',
  'watcher-agent',
  'hermes',
]);

const VALID_COST: ReadonlySet<CostClass> = new Set<CostClass>(['small', 'medium', 'large']);

function coerceToSubtask(raw: unknown, idx: number): Subtask {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`decompose: subtask[${idx}] is not an object`);
  }
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === 'string' && r.id ? r.id : `st-${idx + 1}`;
  const title = typeof r.title === 'string' ? r.title : '';
  const workerRaw = typeof r.worker === 'string' ? r.worker : '';
  const worker: WorkerKind = VALID_WORKERS.has(workerRaw as WorkerKind)
    ? (workerRaw as WorkerKind)
    : 'task-dispatcher';
  const depends_on = Array.isArray(r.depends_on)
    ? r.depends_on.filter((x): x is string => typeof x === 'string')
    : [];
  const parallel_with = Array.isArray(r.parallel_with)
    ? r.parallel_with.filter((x): x is string => typeof x === 'string')
    : [];
  const approval_gate_before_next = r.approval_gate_before_next === true;
  const costRaw = typeof r.estimated_cost_class === 'string' ? r.estimated_cost_class : '';
  const estimated_cost_class: CostClass = VALID_COST.has(costRaw as CostClass)
    ? (costRaw as CostClass)
    : 'small';
  if (!title) throw new Error(`decompose: subtask[${idx}].title missing`);
  return {
    id,
    title,
    worker,
    depends_on,
    parallel_with,
    approval_gate_before_next,
    estimated_cost_class,
  };
}

/**
 * Heuristic: should ZOE bother decomposing this goal at all? Short
 * conversational messages, factual questions, and simple captures should
 * stay inline in concierge.ts and NOT trigger decomposition.
 *
 * Returns true if the goal LOOKS multi-step. False positives are cheap
 * (we just run decompose and get 1 subtask back); false negatives mean
 * ZOE under-decomposes which is worse, so lean toward true.
 */
export function shouldDecompose(goal: string): boolean {
  const text = goal.trim();
  if (text.length < 30) return false;
  const lower = text.toLowerCase();
  // Single-question signals - stay inline.
  if (/^(what|when|where|who|how much|what time|is it|are we)\b/.test(lower)) return false;
  if (/^(yes|no|y|n)\b/.test(lower)) return false;
  // Multi-step signals - decompose.
  const multiStepMarkers = [
    ' and then ',
    ' then ',
    ' after that',
    ' next ',
    ' also ',
    ' plus ',
    ', and ',
    ' followed by ',
    ' before ',
    ' once ',
    ' build ',
    ' ship ',
    ' research ',
    ' decompose ',
    ' decide ',
  ];
  return multiStepMarkers.some((m) => lower.includes(m));
}

/**
 * Pick the model. Default Sonnet per locked Q2 (Sonnet for ZOE core).
 * Escalate to Opus for genuinely strategic goals or when caller passes hard=true.
 */
function pickModel(goal: string, opts: DecomposeOptions): string {
  if (opts.model) return opts.model;
  if (opts.hard) return ZOE_HARD_MODEL;
  // Long + strategic-keyword goals escalate.
  const lower = goal.toLowerCase();
  const strategicMarkers = [
    'architecture',
    'strategy',
    'roadmap',
    'whitepaper',
    'brand',
    'launch',
    'governance',
    'tokenomics',
  ];
  if (goal.length > 400 || strategicMarkers.some((m) => lower.includes(m))) {
    return ZOE_HARD_MODEL;
  }
  return ZOE_DEFAULT_MODEL;
}

/**
 * Decompose a Zaal goal into a routed subtask plan.
 *
 * Pattern is the same as concierge.runConciergeTurn but with a different
 * system prompt + JSON-coerced return. Reuses the Hermes claude-cli wrapper
 * so cost accounting + Max-plan auth stays consistent across ZOE invocations.
 */
export async function decomposeGoal(opts: DecomposeOptions): Promise<DecompositionResult> {
  const model = pickModel(opts.goal, opts);
  const userPrompt = buildUserPrompt(opts.goal, opts.context);

  const result = await callClaudeCli({
    model,
    prompt: userPrompt,
    cwd: opts.context.workspace_dir,
    appendSystemPrompt: DECOMPOSE_SYSTEM_PROMPT,
    // Decompose is pure reasoning - no tools. Lock it down so the model
    // can't get distracted by Read/Grep mid-decomposition.
    allowedTools: [],
    disallowedTools: ['Bash', 'Read', 'Edit', 'Write', 'Grep', 'Glob', 'WebFetch', 'Task'],
    permissionMode: 'auto',
    outputFormat: 'json',
    // bare:false on purpose - matches concierge.ts (Max plan OAuth flow).
    bare: false,
  });

  const plan = extractPlanJson(result.text);

  return {
    plan,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    costUsd: result.totalCostUsd,
    durationMs: result.durationMs,
    rawText: result.text,
  };
}

/**
 * Render a DecompositionPlan as a human-readable Telegram message for the
 * y/n approval gate per locked Q3. Keep it tight - mobile screens.
 */
export function renderPlanForApproval(plan: DecompositionPlan): string {
  const lines: string[] = [];
  lines.push(`Plan: ${plan.goal_summary}`);
  lines.push('');
  if (plan.ambiguities.length > 0) {
    lines.push('Need clarification first:');
    for (const a of plan.ambiguities) lines.push(`  - ${a}`);
    lines.push('');
    lines.push('Resolve these and I\'ll re-decompose. No subtasks dispatch yet.');
    return lines.join('\n');
  }
  lines.push(`Steps (${plan.subtasks.length}):`);
  for (const st of plan.subtasks) {
    const dep = st.depends_on.length > 0 ? ` (after ${st.depends_on.join(', ')})` : '';
    const par = st.parallel_with.length > 0 ? ` (parallel with ${st.parallel_with.join(', ')})` : '';
    const gate = st.approval_gate_before_next ? ' [gate]' : '';
    lines.push(`  ${st.id}. ${st.title} -> ${st.worker}${dep}${par}${gate}`);
  }
  lines.push('');
  lines.push(plan.execution_plan);
  lines.push('');
  lines.push('Reply y to dispatch, n to cancel, or quote a step id to revise.');
  return lines.join('\n');
}
