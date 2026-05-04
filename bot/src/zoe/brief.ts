/**
 * Morning brief — runs daily at 5am EST (09:00 UTC).
 *
 * Replaces ~/bin/morning-brief.sh on VPS. Generates a contextual briefing
 * via Claude CLI using current task queue + recent captures + git activity
 * + open PRs. Posts to Zaal's DM.
 *
 * Output format (matches the existing morning brief screenshot Zaal liked):
 *   Morning brief - Mon May 04 5am
 *   TOP PRIORITIES (N P0, M P1)
 *   - P0/P1 list
 *   LAST 24H COMMITS
 *   - list
 *   OPEN PRS
 *   - list
 *   portal.zaoos.com/todos - brain dump
 */
import { callClaudeCli } from '../hermes/claude-cli';
import { listOpenTasks } from './tasks';
import { execSync } from 'node:child_process';

const BRIEF_SYSTEM_PROMPT = `You are ZOE writing Zaal's daily morning brief at 5am EST.

VOICE: Year-of-the-ZABAL — clear, simple, spartan, active voice. No emojis, no em dashes, no marketing. Match the existing brief format exactly.

OUTPUT FORMAT (exact structure):

Morning brief - {Day} {Mon DD} 5am

TOP PRIORITIES ({P0 count} P0, {P1 count} P1)
- P0/P1 priority items, one per line. Group by priority.

LAST 24H COMMITS
- List of commit subjects from last 24h. (none) if nothing.

OPEN PRS
- List of open PRs by number + title.

portal.zaoos.com/todos - brain dump

Output the brief in plaintext. NO markdown headers, NO emojis, NO pleasantries.`;

interface BriefContext {
  today_iso: string;
  open_tasks: Array<{ priority: string; title: string }>;
  commits_24h: string[];
  open_prs: Array<{ number: number; title: string }>;
}

function todayLabel(): { day: string; date: string } {
  const d = new Date();
  const day = d.toLocaleDateString('en-US', { weekday: 'short' });
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { day, date };
}

async function loadBriefContext(repoDir: string): Promise<BriefContext> {
  const tasks = await listOpenTasks();
  let commits24h: string[] = [];
  try {
    const log = execSync(`git -C ${JSON.stringify(repoDir)} log --since="24 hours ago" --no-merges --pretty=format:"%s" 2>/dev/null`, {
      encoding: 'utf8',
      timeout: 5000,
    });
    commits24h = log.split('\n').filter((l) => l.trim()).slice(0, 15);
  } catch {
    commits24h = [];
  }

  let prs: Array<{ number: number; title: string }> = [];
  try {
    const json = execSync('gh pr list --repo bettercallzaal/ZAOOS --state open --limit 10 --json number,title', {
      encoding: 'utf8',
      timeout: 8000,
    });
    prs = JSON.parse(json) as Array<{ number: number; title: string }>;
  } catch (err) {
    console.error('[zoe/brief] gh pr list failed:', (err as Error).message);
    prs = [];
  }

  return {
    today_iso: new Date().toISOString().slice(0, 10),
    open_tasks: tasks.map((t) => ({ priority: t.priority, title: t.title })),
    commits_24h: commits24h,
    open_prs: prs,
  };
}

export async function generateMorningBrief(opts: { repoDir: string; model?: string }): Promise<string> {
  const ctx = await loadBriefContext(opts.repoDir);
  const { day, date } = todayLabel();

  const userPrompt = `Generate the morning brief for ${day} ${date}.

CONTEXT:
- Open tasks: ${JSON.stringify(ctx.open_tasks, null, 2)}
- Last 24h commits: ${ctx.commits_24h.length === 0 ? '(none)' : ctx.commits_24h.join(' | ')}
- Open PRs: ${ctx.open_prs.length === 0 ? '(none)' : ctx.open_prs.map((p) => `#${p.number} ${p.title}`).join(' | ')}

Output the brief now in the exact format from your system prompt.`;

  const result = await callClaudeCli({
    model: opts.model ?? 'sonnet',
    prompt: userPrompt,
    cwd: opts.repoDir,
    appendSystemPrompt: BRIEF_SYSTEM_PROMPT,
    permissionMode: 'auto',
    // bare REMOVED - blocks Max-plan OAuth, see concierge.ts
  });

  return guardEmpty(result.text);
}

const EMPTY_GUARD_MIN = 50;

function guardEmpty(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length < EMPTY_GUARD_MIN) {
    console.error('[zoe/brief] empty/short brief output, length=', trimmed.length, 'raw=', trimmed.slice(0, 200));
    const { day, date } = todayLabel();
    return `Morning brief - ${day} ${date} 5am\n\n(brief generation degraded — see logs)\n\nportal.zaoos.com/todos - brain dump`;
  }
  return trimmed;
}
