/**
 * workers.ts — the per-worker runner for ZOE's dispatch loop (doc 759 Gap 2).
 *
 * Node-orchestrated model (locked decision 2026-05-29): rather than letting
 * one ZOE concierge turn dispatch subagents opaquely via the Task tool, the
 * ZOE Node process runs each worker itself with callClaudeCli, using the
 * worker's .claude/agents/<name>.md spec as the system prompt. This gives us
 * per-worker cost caps, read-only tool lockdown, critic integration (Gap 3),
 * one revision retry, and a run record for the learning loop (Gap 5).
 *
 * The 'hermes' worker is NOT handled here — it routes to
 * bot/src/hermes/runner.ts dispatchHermesRun() from dispatch.ts, because it
 * needs the triggering chat id + has its own coder/critic loop + PR flow.
 *
 * task-dispatcher is also not a runnable worker here — in a plan it means
 * "ZOE handles inline" (a single-turn answer), so dispatch.ts short-circuits
 * it. See decompose.ts.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { callClaudeCli } from '../hermes/claude-cli';
import { ZOE_DEFAULT_MODEL, ZOE_QUICK_MODEL } from './types';
import type { ZoeContext } from './types';
import type { Subtask, WorkerKind } from './decompose';
import { CRITIQUE_PASS_THRESHOLD, type CritiqueOutput } from './critics/types';
import { runResearchCritic } from './critics/research-critic';
import { runCommsCritic } from './critics/comms-critic';
import { runTaskResultCritic } from './critics/task-result-critic';
import { readLearnings } from './learn';

/** Workers runnable via direct callClaudeCli here (everything except hermes). */
export type ClaudeWorkerKind = Exclude<WorkerKind, 'hermes'>;

type CriticKind = 'research' | 'comms' | 'task-result' | 'none';

interface WorkerConfig {
  /** Filename under .claude/agents/. */
  specFile: string;
  model: string;
  allowedTools: string[];
  disallowedTools: string[];
  /** Which critic scores this worker's output. */
  critic: CriticKind;
  /** Hard per-invocation cost cap (USD). */
  maxBudgetUsd: number;
}

// Read-only lockdown shared by every worker. No worker may push, commit,
// reset, rm, or write files — anything that mutates state stays behind an
// explicit Zaal approval at the ZOE layer, never inside an autonomous worker.
//
// doc 770 H4 (verified 2026-05-31): the lockdown is enforced by running with
// permissionMode: 'default' + this per-worker `allowedTools` whitelist. Under
// 'default', non-allowlisted tools are denied in non-interactive (-p) mode —
// every write path (shell redirection, tee, python, Write/Edit) is blocked,
// while allowlisted reads still run. The previous 'auto' mode AUTO-APPROVED
// everything not explicitly denied, so the allowlist did nothing and a worker
// could `echo > file`. This denylist is now belt-and-suspenders on top of the
// authoritative allowlist.
const READ_ONLY_DISALLOW = [
  // File / notebook mutation tools.
  'Edit',
  'Write',
  'NotebookEdit',
  // git state mutation.
  'Bash(git push*)',
  'Bash(git commit*)',
  'Bash(git reset*)',
  'Bash(git clean*)',
  'Bash(git checkout*)',
  'Bash(git stash*)',
  // Filesystem mutation / move / link.
  'Bash(rm*)',
  'Bash(mv*)',
  'Bash(cp*)',
  'Bash(chmod*)',
  'Bash(chown*)',
  'Bash(ln*)',
  'Bash(mkdir*)',
  'Bash(touch*)',
  'Bash(dd*)',
  'Bash(tee*)',
  // Arbitrary code execution (can write/exfiltrate).
  'Bash(npx*)',
  'Bash(npm*)',
  'Bash(pnpm*)',
  'Bash(yarn*)',
  'Bash(node*)',
  'Bash(python*)',
  'Bash(python3*)',
  'Bash(bash*)',
  'Bash(sh*)',
  'Bash(zsh*)',
  'Bash(eval*)',
];

/** Floor below which a revision pass isn't worth launching (doc 770 MED). */
const MIN_REVISION_BUDGET_USD = 0.05;

const WORKER_CONFIG: Record<ClaudeWorkerKind, WorkerConfig> = {
  'research-worker': {
    specFile: 'research-worker.md',
    model: ZOE_DEFAULT_MODEL,
    allowedTools: ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'Bash(git log*)'],
    disallowedTools: READ_ONLY_DISALLOW,
    critic: 'research',
    maxBudgetUsd: 1.0,
  },
  'code-reviewer': {
    specFile: 'code-reviewer.md',
    model: ZOE_DEFAULT_MODEL,
    allowedTools: ['Read', 'Glob', 'Grep', 'Bash(git diff*)', 'Bash(git log*)', 'Bash(git status)'],
    disallowedTools: READ_ONLY_DISALLOW,
    critic: 'task-result',
    maxBudgetUsd: 0.75,
  },
  'comms-drafter': {
    specFile: 'comms-drafter.md',
    model: ZOE_DEFAULT_MODEL,
    allowedTools: ['Read', 'Glob', 'Grep'],
    disallowedTools: READ_ONLY_DISALLOW,
    critic: 'comms',
    maxBudgetUsd: 0.5,
  },
  'data-runner': {
    specFile: 'data-runner.md',
    model: ZOE_QUICK_MODEL,
    allowedTools: ['Read', 'Glob', 'Grep', 'Bash(cat*)', 'Bash(ls*)', 'Bash(curl -s*)'],
    disallowedTools: READ_ONLY_DISALLOW,
    critic: 'task-result',
    maxBudgetUsd: 0.5,
  },
  'brief-writer': {
    specFile: 'brief-writer.md',
    model: ZOE_QUICK_MODEL,
    allowedTools: ['Read', 'Glob', 'Grep'],
    disallowedTools: READ_ONLY_DISALLOW,
    critic: 'none',
    maxBudgetUsd: 0.4,
  },
  'recap-agent': {
    specFile: 'recap-agent.md',
    model: ZOE_QUICK_MODEL,
    allowedTools: ['Read'],
    disallowedTools: READ_ONLY_DISALLOW,
    critic: 'none',
    maxBudgetUsd: 0.3,
  },
  'watcher-agent': {
    specFile: 'watcher-agent.md',
    model: ZOE_QUICK_MODEL,
    allowedTools: ['Read', 'Glob', 'Grep'],
    disallowedTools: READ_ONLY_DISALLOW,
    critic: 'none',
    maxBudgetUsd: 0.3,
  },
  'task-dispatcher': {
    // Only reached if dispatch.ts doesn't short-circuit it; treat as a plain
    // reasoning turn with no tools.
    specFile: 'task-dispatcher.md',
    model: ZOE_DEFAULT_MODEL,
    allowedTools: [],
    disallowedTools: READ_ONLY_DISALLOW,
    critic: 'none',
    maxBudgetUsd: 0.3,
  },
};

export interface WorkerResult {
  subtaskId: string;
  worker: WorkerKind;
  status: 'completed' | 'failed' | 'needs-revision';
  /** The worker's final text output. */
  output: string;
  /** Critic score, if a critic ran for this worker. */
  critique: CritiqueOutput | null;
  /** True if a revision pass was run after a failing critique. */
  revised: boolean;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  durationMs: number;
  error?: string;
}

export interface RunWorkerArgs {
  subtask: Subtask;
  context: ZoeContext;
  /** ZOE's higher-level goal, for worker context + critic parentGoal. */
  goal: string;
  /** Outputs of completed depends_on subtasks, fed as upstream context. */
  priorOutputs: Array<{ id: string; title: string; output: string }>;
}

/** Strip YAML frontmatter from a .claude/agents spec, leaving the body. */
function stripFrontmatter(md: string): string {
  const m = md.match(/^---\n[\s\S]*?\n---\n?/);
  return (m ? md.slice(m[0].length) : md).trim();
}

function agentsDir(context: ZoeContext): string {
  return (
    process.env.ZOE_AGENTS_DIR ??
    join(context.workspace_dir, 'bot', 'src', 'zoe', '.claude', 'agents')
  );
}

async function loadSpec(worker: ClaudeWorkerKind, context: ZoeContext): Promise<string> {
  const path = join(agentsDir(context), WORKER_CONFIG[worker].specFile);
  const raw = await fs.readFile(path, 'utf8');
  const spec = stripFrontmatter(raw);
  // Gap 5: fold in any Zaal-approved learnings accrued for this worker.
  const learnings = await readLearnings(worker);
  return learnings.trim()
    ? `${spec}\n\n# Learnings (apply these — accrued from past runs)\n\n${learnings.trim()}`
    : spec;
}

function buildWorkerPrompt(args: RunWorkerArgs, criticFeedback?: string): string {
  const { subtask, goal, priorOutputs } = args;
  const lines: string[] = [];
  lines.push(`ZOE's overall goal: ${goal}`);
  lines.push('');
  lines.push(`Your subtask (${subtask.id}): ${subtask.title}`);
  if (priorOutputs.length > 0) {
    lines.push('');
    lines.push('Upstream subtask outputs you can build on:');
    for (const p of priorOutputs) {
      lines.push(`--- ${p.id} (${p.title}) ---`);
      lines.push(p.output.slice(0, 4000));
    }
  }
  if (criticFeedback) {
    lines.push('');
    lines.push('A reviewer flagged your previous attempt. Address this and redo:');
    lines.push(criticFeedback);
  }
  return lines.join('\n');
}

async function runCriticFor(
  kind: CriticKind,
  args: RunWorkerArgs,
  output: string,
): Promise<CritiqueOutput | null> {
  const cwd = args.context.workspace_dir;
  switch (kind) {
    case 'research':
      return runResearchCritic({ doc: output, cwd });
    case 'comms':
      return runCommsCritic({ draft: output, cwd });
    case 'task-result':
      return runTaskResultCritic({
        originalTask: args.subtask.title,
        claimedOutcome: 'See worker output.',
        workerOutput: output,
        workerType: args.subtask.worker,
        parentGoal: args.goal,
        cwd,
      });
    case 'none':
      return null;
  }
}

/**
 * Run a single claude-CLI worker (not hermes): load its spec, call the CLI
 * with read-only tools + a cost cap, then run its critic. If the critic
 * fails (score < 70), run exactly one revision pass with the critic's
 * feedback. Never throws — failures resolve to a status='failed' result so
 * the dispatch loop can continue and report.
 */
export async function runClaudeWorker(args: RunWorkerArgs): Promise<WorkerResult> {
  const worker = args.subtask.worker as ClaudeWorkerKind;
  const cfg = WORKER_CONFIG[worker];
  const base: Omit<WorkerResult, 'status' | 'output' | 'critique' | 'revised'> = {
    subtaskId: args.subtask.id,
    worker,
    model: cfg.model,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    durationMs: 0,
  };

  let spec: string;
  try {
    spec = await loadSpec(worker, args.context);
  } catch (err) {
    return {
      ...base,
      status: 'failed',
      output: '',
      critique: null,
      revised: false,
      error: `spec load failed for ${worker}: ${(err as Error).message}`,
    };
  }

  const call = async (criticFeedback?: string, budgetUsd: number = cfg.maxBudgetUsd) =>
    callClaudeCli({
      model: cfg.model,
      prompt: buildWorkerPrompt(args, criticFeedback),
      cwd: args.context.workspace_dir,
      appendSystemPrompt: spec,
      allowedTools: cfg.allowedTools,
      disallowedTools: cfg.disallowedTools,
      permissionMode: 'default',
      outputFormat: 'json',
      maxBudgetUsd: budgetUsd,
      bare: false,
    });

  try {
    const first = await call();
    let output = first.text;
    let inTok = first.inputTokens;
    let outTok = first.outputTokens;
    let cost = first.totalCostUsd;
    let dur = first.durationMs;

    let critique = await runCriticFor(cfg.critic, args, output);
    let revised = false;

    if (critique && critique.score < CRITIQUE_PASS_THRESHOLD) {
      // One revision pass with the critic's feedback — but only within the
      // REMAINING per-worker budget (doc 770 MED). Previously the revision got
      // a fresh full cap, so a failing critique silently doubled the ceiling to
      // ~2×maxBudget. Now total worker spend stays under cfg.maxBudgetUsd.
      const remaining = revisionBudget(cfg.maxBudgetUsd, cost);
      if (remaining >= MIN_REVISION_BUDGET_USD) {
        revised = true;
        const feedback = [
          `Score ${critique.score}/100: ${critique.summary}`,
          ...critique.issues.map((i) => `- [${i.severity}] ${i.location ?? ''} ${i.issue}`),
        ].join('\n');
        const second = await call(feedback, remaining);
        output = second.text;
        inTok += second.inputTokens;
        outTok += second.outputTokens;
        cost += second.totalCostUsd;
        dur += second.durationMs;
        critique = await runCriticFor(cfg.critic, args, output);
      }
    }

    // Fold critic cost into the worker total.
    if (critique) cost += critique.costUsd;

    const passed = !critique || critique.score >= CRITIQUE_PASS_THRESHOLD;
    return {
      ...base,
      status: passed ? 'completed' : 'needs-revision',
      output,
      critique,
      revised,
      inputTokens: inTok,
      outputTokens: outTok,
      costUsd: cost,
      durationMs: dur,
    };
  } catch (err) {
    return {
      ...base,
      status: 'failed',
      output: '',
      critique: null,
      revised: false,
      error: (err as Error).message,
    };
  }
}

/** Expose the config for tests / introspection (e.g. dispatch budget sums). */
export function workerMaxBudget(worker: ClaudeWorkerKind): number {
  return WORKER_CONFIG[worker].maxBudgetUsd;
}

/** Budget for the single revision pass: whatever's left under the cap (doc 770 MED). */
export function revisionBudget(cap: number, spentSoFar: number): number {
  return Math.max(0, cap - spentSoFar);
}
