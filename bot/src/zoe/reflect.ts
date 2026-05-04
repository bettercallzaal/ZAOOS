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

VOICE: Year-of-the-ZABAL — clear, simple, spartan, active voice. No emojis, no em dashes, no marketing.

Output a SHORT 3-question prompt. Reference 1-2 specifics from today (a commit, a PR, an open task) so it feels personal not boilerplate. Use "today" not "the day."

EXAMPLE:

Evening reflection — Mon May 4 9pm

Today you opened PR #470 (ZOE doc 604) and stopped openclaw container. Three quick:

1. What shipped today?
2. What's stuck?
3. Tomorrow's first task?

Reply free-form. I will capture the highlights.

---

Output exactly this style. No more questions, no preamble, no marketing language.`;

interface ReflectContext {
  today: string;
  open_tasks: Array<{ priority: string; title: string }>;
  recent_commits: string[];
  recent_prs: Array<{ number: number; title: string }>;
}

import { execSync } from 'node:child_process';

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

  const userPrompt = `Generate Zaal's evening reflection for ${ctx.today}.

Today's signals:
- Recent commits: ${ctx.recent_commits.length ? ctx.recent_commits.slice(0, 3).join(' | ') : '(none)'}
- Open PRs: ${ctx.recent_prs.length ? ctx.recent_prs.slice(0, 3).map((p) => `#${p.number}`).join(' ') : '(none)'}
- Top open tasks: ${ctx.open_tasks.length ? ctx.open_tasks.slice(0, 3).map((t) => t.title).join(' | ') : '(none)'}

Output the reflection prompt in the exact format from your system prompt. Reference 1-2 specifics from today.`;

  const result = await callClaudeCli({
    model: opts.model ?? 'haiku',
    prompt: userPrompt,
    cwd: opts.repoDir,
    appendSystemPrompt: REFLECT_SYSTEM_PROMPT,
    permissionMode: 'auto',
    // bare REMOVED - blocks Max-plan OAuth, see concierge.ts
  });

  const trimmed = result.text.trim();
  if (trimmed.length < 60) {
    console.error('[zoe/reflect] empty reflection, length=', trimmed.length);
    return [
      `Evening reflection — ${ctx.today} 9pm`,
      '',
      'Three quick:',
      '',
      '1. What shipped today?',
      '2. What\'s stuck?',
      '3. Tomorrow\'s first task?',
      '',
      'Reply free-form. I will capture the highlights.',
    ].join('\n');
  }
  return trimmed;
}
