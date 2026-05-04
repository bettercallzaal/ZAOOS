/**
 * Evening reflection — runs daily at 9pm EST (01:00 UTC next day).
 *
 * Sends a 3-question reflection prompt to Zaal:
 *   1. What shipped today?
 *   2. What's stuck?
 *   3. Tomorrow's first task?
 *
 * Zaal replies free-form. The next concierge turn parses the answers and
 * captures them as Bonfire-eligible notes (status + priorities update).
 */
import { callClaudeCli } from '../hermes/claude-cli';
import { listOpenTasks } from './tasks';

const REFLECT_SYSTEM_PROMPT = `You are ZOE asking Zaal his evening reflection at 9pm EST.

VOICE: Year-of-the-ZABAL - clear, simple, spartan, active voice. No emojis, no em dashes, no marketing.

Output a SHORT 4-block prompt:
  1. greeting line referencing 1-2 specifics from today (a commit, a PR, an open task) so it feels personal not boilerplate
  2. "Three quick:" followed by:
       1. What shipped today?
       2. What's stuck?
       3. Tomorrow's first task?
  3. "Captures from today:" - list any meeting transcripts, voice notes, or tagged DMs from today that should land in Bonfire (per doc 606 capture-process loop). If none, write "(none)" and skip the gate.
  4. closing "Reply free-form. I will capture the highlights."

EXAMPLE:

Evening reflection - Mon May 4 9pm

Today you opened PR #470 (ZOE doc 604) and stopped openclaw container.

Three quick:
1. What shipped today?
2. What's stuck?
3. Tomorrow's first task?

Captures from today:
- Granola transcript: ZAOstock standup 11am
- Voice note 3:42pm "Roddy parking question"
- DM tagged decision: cipher release date
Tap each: Now (push to Bonfire) / Later / Shelve.

Reply free-form. I will capture the highlights.

---

Output exactly this style. No preamble, no marketing language.`;

interface ReflectContext {
  today: string;
  open_tasks: Array<{ priority: string; title: string }>;
  recent_commits: string[];
  recent_prs: Array<{ number: number; title: string }>;
}

import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';

interface TodayCapture {
  kind: 'meeting' | 'voice' | 'dm' | 'web';
  summary: string;
  source?: string;
}

async function loadTodayCaptures(): Promise<TodayCapture[]> {
  const today = new Date().toISOString().slice(0, 10);
  const path = join(ZOE_PATHS.home, 'captures', `${today}.json`);
  try {
    const raw = await fs.readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as TodayCapture[];
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

function loadReflectContext(repoDir: string): ReflectContext {
  let commits: string[] = [];
  try {
    const log = execSync(`git -C ${JSON.stringify(repoDir)} log --since="14 hours ago" --no-merges --pretty=format:"%s"`, {
      encoding: 'utf8',
      timeout: 4000,
    });
    commits = log.split('\n').filter((l) => l.trim()).slice(0, 5);
  } catch {
    commits = [];
  }

  let prs: Array<{ number: number; title: string }> = [];
  try {
    const json = execSync('gh pr list --repo bettercallzaal/ZAOOS --state open --limit 5 --json number,title', {
      encoding: 'utf8',
      timeout: 6000,
    });
    prs = JSON.parse(json) as Array<{ number: number; title: string }>;
  } catch {
    prs = [];
  }

  return {
    today: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    open_tasks: [],  // populated below
    recent_commits: commits,
    recent_prs: prs,
  };
}

export async function generateEveningReflection(opts: { repoDir: string; model?: string }): Promise<string> {
  const ctx = loadReflectContext(opts.repoDir);
  ctx.open_tasks = (await listOpenTasks()).slice(0, 5).map((t) => ({ priority: t.priority, title: t.title }));

  const captures = await loadTodayCaptures();

  const userPrompt = `Generate Zaal's evening reflection for ${ctx.today}.

Today's signals:
- Recent commits: ${ctx.recent_commits.length ? ctx.recent_commits.slice(0, 3).join(' | ') : '(none)'}
- Open PRs: ${ctx.recent_prs.length ? ctx.recent_prs.slice(0, 3).map((p) => `#${p.number}`).join(' ') : '(none)'}
- Top open tasks: ${ctx.open_tasks.length ? ctx.open_tasks.slice(0, 3).map((t) => t.title).join(' | ') : '(none)'}
- Captures from today: ${captures.length ? captures.map((c) => `[${c.kind}] ${c.summary}`).join(' | ') : '(none)'}

Output the reflection prompt in the exact format from your system prompt. Reference 1-2 specifics from today. If captures list is "(none)" omit the Captures from today block entirely; otherwise include it as the doc-606 capture-process gate.`;

  const result = await callClaudeCli({
    model: opts.model ?? 'haiku',
    prompt: userPrompt,
    cwd: opts.repoDir,
    appendSystemPrompt: REFLECT_SYSTEM_PROMPT,
    permissionMode: 'auto',
    bare: true,
  });

  const trimmed = result.text.trim();
  if (trimmed.length < 60) {
    console.error('[zoe/reflect] empty reflection, length=', trimmed.length);
    const fallback = [
      `Evening reflection - ${ctx.today} 9pm`,
      '',
      'Three quick:',
      '',
      '1. What shipped today?',
      '2. What\'s stuck?',
      '3. Tomorrow\'s first task?',
      '',
    ];
    if (captures.length > 0) {
      fallback.push('Captures from today:');
      for (const c of captures) {
        fallback.push(`- [${c.kind}] ${c.summary}`);
      }
      fallback.push('Tap each: Now (push to Bonfire) / Later / Shelve.');
      fallback.push('');
    }
    fallback.push('Reply free-form. I will capture the highlights.');
    return fallback.join('\n');
  }
  return trimmed;
}
