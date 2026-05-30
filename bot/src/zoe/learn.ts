/**
 * learn.ts — ZOE's improvement-over-time loop (doc 759 Gap 5).
 *
 * Weekly, this clusters the dispatch-loop run telemetry (runs.ts) and proposes
 * concise "learnings" to sharpen each worker. A learning is appended to a
 * runtime file (~/.zao/zoe/learnings/<target>.md) that workers.ts injects into
 * the worker's system prompt — it is NOT an autonomous edit of the git-tracked
 * .claude/agents specs. That keeps Gap 5 inside the same safety envelope as
 * Gap 4: every change to ZOE's behavior is a runtime memory layer applied only
 * after explicit Zaal approval, fully reversible, never a silent repo write.
 *
 * summarizeRuns is pure (testable). runLearnCycle calls the CLI. apply/read
 * touch ~/.zao/zoe/learnings/.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { callClaudeCli } from '../hermes/claude-cli';
import { ZOE_PATHS } from './memory';
import { ZOE_DEFAULT_MODEL } from './types';
import type { ZoeContext } from './types';
import type { RunRecord } from './runs';
import { readRuns } from './runs';

export interface WorkerRunSummary {
  worker: string;
  total: number;
  completed: number;
  failed: number;
  needsRevision: number;
  /** Mean critic score over runs that had one, or null. */
  avgScore: number | null;
  /** Most frequent critic issues, most-common first. */
  topIssues: Array<{ issue: string; count: number }>;
}

export interface LearnProposal {
  /** lp-1, lp-2, ... */
  id: string;
  /** Worker kind ('research-worker') or 'persona' — the learnings file to grow. */
  target: string;
  /** One-line description of the learning. */
  summary: string;
  /** The text appended to the target's prompt. */
  learning: string;
  /** Which run pattern motivated it. */
  rationale: string;
}

export interface LearnResult {
  proposals: LearnProposal[];
  summaries: WorkerRunSummary[];
  runsAnalyzed: number;
  model: string;
  costUsd: number;
  rawText: string;
}

/** Minimum runs before a learning cycle is worth the spend. */
export const MIN_RUNS_FOR_LEARN = 5;

/**
 * Aggregate run records into per-worker summaries. Pure — no IO, no CLI.
 */
export function summarizeRuns(runs: RunRecord[]): WorkerRunSummary[] {
  const byWorker = new Map<string, RunRecord[]>();
  for (const r of runs) {
    byWorker.set(r.worker, [...(byWorker.get(r.worker) ?? []), r]);
  }
  const out: WorkerRunSummary[] = [];
  for (const [worker, group] of byWorker) {
    const scores = group.map((r) => r.score).filter((s): s is number => typeof s === 'number');
    const issueCounts = new Map<string, number>();
    for (const r of group) {
      for (const issue of r.criticIssues) {
        issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1);
      }
    }
    const topIssues = [...issueCounts.entries()]
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    out.push({
      worker,
      total: group.length,
      completed: group.filter((r) => r.status === 'completed').length,
      failed: group.filter((r) => r.status === 'failed').length,
      needsRevision: group.filter((r) => r.status === 'needs-revision').length,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      topIssues,
    });
  }
  return out.sort((a, b) => b.total - a.total);
}

const LEARN_SYSTEM_PROMPT = `You are ZOE's learning loop. You read a weekly summary of how each worker performed (pass/fail counts, average critic score, recurring critic issues) and propose AT MOST 3 concise "learnings" that would reduce the recurring failures.

A learning is one or two sentences appended to a worker's system prompt. It must be:
- Specific and actionable ("Always cite the file path you read before claiming a value" — not "be more careful").
- Derived ONLY from the recurring issues in the data. Never invent a problem the data doesn't show.
- Targeted at the worker whose runs show the pattern (target = the worker name), or 'persona' for a cross-worker behavior.

Per feedback_no_sub_agent_context_fabrication: do not invent specifics. If the data is too thin to justify a learning, return fewer or zero proposals.

OUTPUT FORMAT (exact JSON, no prose, no code fences):

{
  "proposals": [
    {
      "id": "lp-1",
      "target": "research-worker",
      "summary": "<one-line>",
      "learning": "<1-2 sentence directive to append to the worker prompt>",
      "rationale": "<which recurring issue + count motivated this>"
    }
  ]
}

If nothing is worth proposing, return {"proposals": []}. Output ONLY the JSON object as the last thing in your message.`;

function buildLearnPrompt(summaries: WorkerRunSummary[], runsAnalyzed: number): string {
  const lines: string[] = [];
  lines.push(`Weekly worker telemetry — ${runsAnalyzed} runs analyzed.`);
  lines.push('');
  for (const s of summaries) {
    lines.push(
      `${s.worker}: ${s.total} runs (${s.completed} ok, ${s.needsRevision} needed-revision, ${s.failed} failed)` +
        (s.avgScore !== null ? `, avg critic ${s.avgScore}/100` : ''),
    );
    for (const i of s.topIssues) {
      lines.push(`  - x${i.count}: ${i.issue}`);
    }
  }
  lines.push('');
  lines.push('Propose AT MOST 3 learnings per the system prompt format. Return ONLY the JSON.');
  return lines.join('\n');
}

function coerceProposals(text: string): LearnProposal[] {
  const fence = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  let candidate: string | null = fence ? fence[1] : null;
  if (!candidate) {
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
          candidate = trimmed.slice(i, end + 1);
          break;
        }
      }
    }
  }
  if (!candidate) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return [];
  }
  const raw = (parsed as Record<string, unknown>)?.proposals;
  if (!Array.isArray(raw)) return [];
  const out: LearnProposal[] = [];
  raw.forEach((p, i) => {
    if (!p || typeof p !== 'object') return;
    const r = p as Record<string, unknown>;
    const target = typeof r.target === 'string' ? r.target : '';
    const learning = typeof r.learning === 'string' ? r.learning : '';
    const summary = typeof r.summary === 'string' ? r.summary : '';
    if (!target || !learning || !summary) return;
    out.push({
      id: typeof r.id === 'string' && r.id ? r.id : `lp-${i + 1}`,
      target,
      summary,
      learning,
      rationale: typeof r.rationale === 'string' ? r.rationale : '',
    });
  });
  return out;
}

/**
 * Run a learning cycle over the last `sinceDays` of run telemetry. Returns
 * proposals (possibly empty) for Zaal to approve. Never throws.
 */
export async function runLearnCycle(opts: {
  context: ZoeContext;
  sinceDays?: number;
}): Promise<LearnResult> {
  const runs = await readRuns(opts.sinceDays ?? 7);
  const summaries = summarizeRuns(runs);
  const empty: LearnResult = {
    proposals: [],
    summaries,
    runsAnalyzed: runs.length,
    model: ZOE_DEFAULT_MODEL,
    costUsd: 0,
    rawText: '',
  };
  if (runs.length < MIN_RUNS_FOR_LEARN) return empty;

  try {
    const result = await callClaudeCli({
      model: ZOE_DEFAULT_MODEL,
      prompt: buildLearnPrompt(summaries, runs.length),
      cwd: opts.context.workspace_dir,
      appendSystemPrompt: LEARN_SYSTEM_PROMPT,
      allowedTools: [],
      disallowedTools: ['Bash', 'Read', 'Edit', 'Write', 'Grep', 'Glob', 'WebFetch', 'Task'],
      permissionMode: 'auto',
      outputFormat: 'json',
      maxBudgetUsd: 0.5,
      bare: false,
    });
    return {
      proposals: coerceProposals(result.text),
      summaries,
      runsAnalyzed: runs.length,
      model: result.model,
      costUsd: result.totalCostUsd,
      rawText: result.text,
    };
  } catch (err) {
    console.error('[zoe/learn] cycle failed:', (err as Error).message);
    return empty;
  }
}

function learningsDir(): string {
  return join(ZOE_PATHS.home, 'learnings');
}

function learningsPath(target: string): string {
  // Sanitize target to a safe filename.
  const safe = target.replace(/[^a-z0-9_-]/gi, '_');
  return join(learningsDir(), `${safe}.md`);
}

/**
 * Cap (doc 770 MED): worker learnings are spliced verbatim into every worker
 * system prompt. Left unbounded they silently inflate input-token cost on every
 * run. Defaults: keep the most recent 30 bullets, dedupe identical text, cap at
 * ~4000 chars. Override via ZOE_MAX_LEARNING_LINES / ZOE_MAX_LEARNING_CHARS.
 */
export const MAX_LEARNING_LINES = Math.max(1, Number(process.env.ZOE_MAX_LEARNING_LINES ?? 30));
export const MAX_LEARNING_CHARS = Math.max(200, Number(process.env.ZOE_MAX_LEARNING_CHARS ?? 4000));

/** Pure cap+dedupe of a learnings file body. Keeps header lines + recent bullets. */
export function capLearnings(
  raw: string,
  maxLines: number = MAX_LEARNING_LINES,
  maxChars: number = MAX_LEARNING_CHARS,
): string {
  if (!raw.trim()) return '';
  const header: string[] = [];
  const bullets: string[] = [];
  for (const line of raw.split('\n')) {
    if (line.trimStart().startsWith('- ')) bullets.push(line);
    else if (bullets.length === 0) header.push(line); // header precedes the bullets
  }
  // Dedupe by the learning text (strip the leading "- (YYYY-MM-DD) " prefix).
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const b of bullets) {
    const key = b.replace(/^\s*-\s*(\(\d{4}-\d{2}-\d{2}\))?\s*/, '').trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      deduped.push(b);
    }
  }
  const kept = deduped.slice(-maxLines); // bullets are appended chronologically → keep the tail
  let out = [...header, ...kept].join('\n').trim();
  if (out.length > maxChars) {
    out = out.slice(out.length - maxChars);
    const nl = out.indexOf('\n');
    if (nl >= 0) out = out.slice(nl + 1); // drop a partial leading line
  }
  return out;
}

/** Read the accrued learnings for a worker/persona, capped + deduped, or '' if none. */
export async function readLearnings(target: string): Promise<string> {
  try {
    return capLearnings(await fs.readFile(learningsPath(target), 'utf8'));
  } catch {
    return '';
  }
}

/** Append an approved learning to its target file. Returns the line written. */
export async function applyLearnProposal(p: LearnProposal): Promise<string> {
  await fs.mkdir(learningsDir(), { recursive: true });
  const line = `- (${new Date().toISOString().slice(0, 10)}) ${p.learning}`;
  const path = learningsPath(p.target);
  let existing = '';
  try {
    existing = await fs.readFile(path, 'utf8');
  } catch {
    existing = `# Learnings for ${p.target}\n\nAppended by ZOE's Gap 5 learning loop after Zaal approval.\n`;
  }
  await fs.writeFile(path, `${existing.trimEnd()}\n${line}\n`, 'utf8');
  return line;
}

/** Render proposals as a Telegram approval message. */
export function renderLearnProposals(proposals: LearnProposal[]): string {
  if (proposals.length === 0) return 'No worker learnings to propose this week.';
  const lines: string[] = [];
  lines.push(`${proposals.length} worker learning${proposals.length === 1 ? '' : 's'} from this week's runs:`);
  lines.push('');
  for (const p of proposals) {
    lines.push(`${p.id} (${p.target}): ${p.summary}`);
    lines.push(`  - learning: ${p.learning}`);
    lines.push(`  - why: ${p.rationale}`);
    lines.push('');
  }
  lines.push('Reply "y all" to apply all, "y lp-1 lp-2" for a subset, or "n" to skip.');
  return lines.join('\n');
}
