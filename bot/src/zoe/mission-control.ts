/**
 * mission-control.ts - render + emit layer for the TG pinned mission-control.
 *
 * Doc 2226 (task #73): a live pinned Telegram message where Zaal READS everything
 * the swarm is doing and steers it. This module is the PURE layer: parse the
 * step-journal, render the pinned text, and let bot loops emit steps. It makes NO
 * Telegram calls - the actual pin/edit call site is a later, reviewed insertion
 * (same pattern as the guardrail 1-liner in #2932).
 *
 * The substrate is the step-journal (scripts/agents/step-journal.py, #2911):
 * JSONL of {id, ts, topic, actor, severity 0-10, text, parent, kind}. The spec's
 * four features map directly: topic-threaded (group by topic), priority (>=7 on
 * top), mutable channels (mute topics at render), reply-to-step (kind=correction
 * rows linked by parent - rendered inline under their target).
 */
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** One step-journal row (mirrors step-journal.py's append() shape exactly). */
export interface JournalStep {
  id: string;
  ts: string;
  topic: string;
  actor: string;
  severity: number;
  text: string;
  parent: string | null;
  kind: string; // 'step' | 'correction'
}

export const DEFAULT_JOURNAL_PATH = join(homedir(), '.zao', 'step-journal', 'journal.jsonl');

/** Telegram hard limit is 4096; leave headroom so the header/footer never overflow. */
const RENDER_BUDGET = 3900;

/** Parse the step-journal JSONL. Corrupt lines are skipped, never a crash. */
export async function readStepJournal(path: string = DEFAULT_JOURNAL_PATH): Promise<JournalStep[]> {
  let raw: string;
  try {
    raw = await fs.readFile(path, 'utf8');
  } catch {
    return []; // no journal yet = empty feed, not an error
  }
  const steps: JournalStep[] = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as Partial<JournalStep>;
      if (typeof row.id === 'string' && typeof row.topic === 'string' && typeof row.text === 'string') {
        steps.push({
          id: row.id,
          ts: typeof row.ts === 'string' ? row.ts : '',
          topic: row.topic,
          actor: typeof row.actor === 'string' ? row.actor : 'unknown',
          severity: typeof row.severity === 'number' ? row.severity : 0,
          text: row.text,
          parent: typeof row.parent === 'string' ? row.parent : null,
          kind: typeof row.kind === 'string' ? row.kind : 'step',
        });
      }
    } catch {
      // corrupt line - skip (mirrors step-journal.py's tolerant reader)
    }
  }
  return steps;
}

/**
 * Append a step from bot code so ZOE's loops write the same journal the python
 * primitive reads. Same id scheme (s1, s2...) and shape as step-journal.py.
 */
export async function emitStep(
  topic: string,
  actor: string,
  severity: number,
  text: string,
  opts: { parent?: string | null; kind?: string; path?: string } = {},
): Promise<JournalStep> {
  const path = opts.path ?? DEFAULT_JOURNAL_PATH;
  const existing = await readStepJournal(path);
  const step: JournalStep = {
    id: `s${existing.length + 1}`,
    ts: new Date().toISOString(),
    topic,
    actor,
    severity: Math.max(0, Math.min(10, Math.round(severity))),
    text,
    parent: opts.parent ?? null,
    kind: opts.kind ?? 'step',
  };
  await fs.mkdir(join(path, '..'), { recursive: true });
  await fs.appendFile(path, `${JSON.stringify(step)}\n`, 'utf8');
  return step;
}

export interface RenderOptions {
  /** Topics muted at render time (the spec's mutable channels). */
  mutedTopics?: string[];
  /** Steps with severity >= this render in the NEEDS-YOU block (spec: 7). */
  priorityThreshold?: number;
  /** Most recent N steps per topic thread (keep the pin phone-readable). */
  perTopic?: number;
}

function shortTime(ts: string): string {
  // "2026-08-07T05:31:00.000Z" -> "05:31"
  const m = ts.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : '';
}

function stepLine(s: JournalStep): string {
  const mark = s.kind === 'correction' ? 'FIX ' : '';
  return `- [${s.severity}] ${shortTime(s.ts)} ${s.actor}: ${mark}${s.text}`;
}

/**
 * Render the pinned mission-control text (doc 2226): NEEDS-YOU (severity >=
 * threshold) on top, then topic threads newest-activity-first, corrections inline
 * under their thread. Phone-readable (brand.md: short lines, blank line between
 * blocks), and always within the Telegram budget - oldest threads drop first.
 */
export function renderPinnedText(steps: JournalStep[], opts: RenderOptions = {}): string {
  const muted = new Set(opts.mutedTopics ?? []);
  const threshold = opts.priorityThreshold ?? 7;
  const perTopic = opts.perTopic ?? 3;

  const visible = steps.filter((s) => !muted.has(s.topic));
  if (visible.length === 0) return 'MISSION CONTROL\n\nquiet - no steps yet';

  const lines: string[] = ['MISSION CONTROL'];

  // NEEDS-YOU: priority steps, newest first (the notify->=7 rule)
  const hot = visible.filter((s) => s.severity >= threshold).slice(-5).reverse();
  if (hot.length > 0) {
    lines.push('', `NEEDS YOU (sev >= ${threshold})`);
    for (const s of hot) lines.push(`${stepLine(s)} [${s.topic}]`);
  }

  // topic threads, most-recent-activity first
  const byTopic = new Map<string, JournalStep[]>();
  for (const s of visible) {
    const arr = byTopic.get(s.topic) ?? [];
    arr.push(s);
    byTopic.set(s.topic, arr);
  }
  const topics = [...byTopic.entries()].sort(
    (a, b) => (b[1][b[1].length - 1]?.ts ?? '').localeCompare(a[1][a[1].length - 1]?.ts ?? ''),
  );

  const threadBlocks: string[] = [];
  for (const [topic, arr] of topics) {
    const recent = arr.slice(-perTopic);
    const block = [`# ${topic} (${arr.length})`, ...recent.map(stepLine)].join('\n');
    threadBlocks.push(block);
  }

  // fit within budget - drop the OLDEST-activity threads first, note the omission
  let body = lines.join('\n');
  const kept: string[] = [];
  for (const block of threadBlocks) {
    const candidate = `${body}\n\n${[...kept, block].join('\n\n')}`;
    if (candidate.length > RENDER_BUDGET) {
      kept.push(`(+${threadBlocks.length - kept.length} older topics - reply /mc all)`);
      break;
    }
    kept.push(block);
  }
  body = `${body}\n\n${kept.join('\n\n')}`;
  return body.length <= 4096 ? body : `${body.slice(0, 4090)}\n...`;
}
