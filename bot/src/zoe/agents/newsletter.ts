/**
 * @newsletter - draft a Year of the ZABAL daily newsletter entry.
 *
 * Two-source assembly:
 *   1. ZOE side - today's commits, open PRs, recent captures, recent task ops
 *      (gives the "what actually happened today" first paragraph)
 *   2. Bonfire side - @recall query for surrounding context (people, decisions,
 *      ongoing projects connected to the topic). Read-only.
 *
 * Zaal sends a SHORT input ("Tuesday meeting prep + Bonfire wired up" or just
 * "today"). Agent assembles the day-snapshot from both sources and drafts.
 *
 * Voice locked to BetterCallZaal Year-of-the-ZABAL system prompt. No emojis,
 * no em dashes, no preachy. Day first, mindful moment second, signature.
 */
import type { Agent } from './index';
import { callClaudeCli } from '../../hermes/claude-cli';
import { recall } from '../recall';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { ZOE_PATHS } from '../memory';

const NEWSLETTER_SYSTEM = `You are a creative content generator for Year of the ZABAL - a daily 2026 chronicle documenting momentum, discipline, creativity, and personal leadership as ZABAL comes to life.

Each entry pairs a real moment from the day with a mindful takeaway inspired by the You Are a Badass calendar/book. The writing should feel lived-in, grounded, and honest. Never preachy, never performative.

Voice sounds like BetterCallZaal: calm confidence, cultural awareness, self-trust, and clarity. Encouraging without being corny. Direct without being harsh.

1. Auto Metadata (always included)

Detect today's date from the user prompt and format the header EXACTLY like this on the first line:

Year of the ZABAL - Day {{DAY_OF_YEAR}} ({{Day, Month D, Year}})
{{Short subtitle - grounded and reflective, not a slogan}}

___

2. Body Structure (strict order)

(a) The Day - what actually happened
- Write first about the day itself
- Describe what moved forward, launched, shipped, clarified
- Any friction, resistance, uncertainty
- Overall energy
- Personal-journal voice shared with builders and collaborators
- Begin naturally, no label

(b) Mindful Moment - You Are a Badass reflection
- After the day's reflection, introduce a mindful moment inspired by You Are a Badass
- If the user supplied a quote or theme, use it
- Treat as perspective or permission, never instruction
- Mirror or reframe what already happened that day
- Do not explain the book. Let the idea land

(c) Closing line - one short, thoughtful line. Reminder, invitation, quiet challenge. No hype, no CTA labels

3. Signature (always)

End every entry with:

- BetterCallZaal on behalf of the ZABAL Team

4. Format rules
- No emojis
- No hashtags
- No em dashes (use hyphens)
- No extra headers beyond the title/subtitle block
- Short paragraphs, readable aloud
- Clean, simple, human

5. If a calendar quote or photo theme is provided, use it as secondary emotional texture, not the focus. Day first, mindful moment second.`;

interface DaySnapshot {
  isoDate: string;
  human: string;
  dayOfYear: number;
  commits: string[];
  prs: Array<{ number: number; title: string; merged: boolean }>;
  captures: string[];
  bonfire: string;
}

function dayOfYear(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function loadDaySnapshot(repoDir: string, todayCaptures: string[]): Omit<DaySnapshot, 'bonfire'> {
  const now = new Date();
  let commits: string[] = [];
  try {
    const log = execSync(
      `git -C ${JSON.stringify(repoDir)} log --since='18 hours ago' --no-merges --pretty=format:'%s' 2>/dev/null`,
      { encoding: 'utf8', timeout: 4000 },
    );
    commits = log.split('\n').filter((l) => l.trim()).slice(0, 8);
  } catch {
    commits = [];
  }

  let prs: Array<{ number: number; title: string; merged: boolean }> = [];
  try {
    const json = execSync(
      "gh pr list --repo bettercallzaal/ZAOOS --state all --limit 8 --search 'updated:>=2026-05-04' --json number,title,state",
      { encoding: 'utf8', timeout: 6000 },
    );
    const parsed = JSON.parse(json) as Array<{ number: number; title: string; state: string }>;
    prs = parsed.map((p) => ({ number: p.number, title: p.title, merged: p.state === 'MERGED' }));
  } catch {
    prs = [];
  }

  return {
    isoDate: now.toISOString().slice(0, 10),
    human: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    dayOfYear: dayOfYear(now),
    commits,
    prs,
    captures: todayCaptures.slice(0, 8),
  };
}

async function loadTodayCaptures(): Promise<string[]> {
  const today = new Date().toISOString().slice(0, 10);
  const path = join(ZOE_PATHS.home, 'captures', `${today}.json`);
  try {
    const raw = await fs.readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as Array<{ kind?: string; summary?: string }>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((c) => c.summary)
      .map((c) => `[${c.kind ?? 'note'}] ${c.summary}`);
  } catch {
    return [];
  }
}

async function loadBonfireContext(topic: string): Promise<string> {
  if (!process.env.BONFIRE_API_KEY || !process.env.BONFIRE_AGENT_ID) {
    return '(Bonfire not configured)';
  }
  try {
    const result = await recall({
      query: topic.length < 200 ? topic : topic.slice(0, 200),
      reason: 'newsletter context grounding',
      expected_kind: 'mixed',
    });
    if (result.kind === 'sdk_response' || result.kind === 'mcp_response') {
      return (result.text ?? '').slice(0, 1500) || '(empty Bonfire reply)';
    }
    return '(manual relay path - Bonfire not auto-queryable)';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `(Bonfire query failed: ${msg.slice(0, 120)})`;
  }
}

export const agent: Agent = {
  name: 'newsletter',
  description: 'Year of the ZABAL daily entry. Auto-pulls day snapshot + Bonfire context, you supply 1-2 lines.',
  triggers: [
    /^@newsletter\s+(.+)/is,
    /^\/newsletter\s+(.+)/is,
  ],
  handle: async (match, ctx): Promise<string> => {
    const userInput = match[1].trim();
    if (!userInput) {
      return 'Usage: @newsletter <short angle or just "today">. Optional: paste a You Are a Badass quote on a new line.';
    }

    const captures = await loadTodayCaptures();
    const snapshot = loadDaySnapshot(ctx.repoDir, captures);
    const bonfire = await loadBonfireContext(userInput);

    const promptParts = [
      `Today's metadata:`,
      `- ISO date: ${snapshot.isoDate}`,
      `- Human: ${snapshot.human}`,
      `- Day of year: ${snapshot.dayOfYear}`,
      ``,
      `Zaal's input (use as the angle for The Day section):`,
      userInput,
      ``,
      `What ZOE saw today (last 18 hours from the repo + captures):`,
      `Commits: ${snapshot.commits.length ? snapshot.commits.map((c) => '- ' + c).join('\n') : '(none)'}`,
      ``,
      `PRs touched today: ${snapshot.prs.length ? snapshot.prs.map((p) => `- #${p.number} ${p.title}${p.merged ? ' (merged)' : ''}`).join('\n') : '(none)'}`,
      ``,
      `Captures Zaal logged today: ${snapshot.captures.length ? snapshot.captures.map((c) => '- ' + c).join('\n') : '(none)'}`,
      ``,
      `Bonfire context (synthesized from the ZABAL bonfire KG, may be sparse if not yet seeded):`,
      bonfire,
      ``,
      `Now write the Year of the ZABAL entry per the system-prompt structure. Use the day metadata in the header. Pull "The Day" content from the commits + PRs + captures + Zaal's input. If a quote or theme appears in Zaal's input, use it for the Mindful Moment section, otherwise pick a fitting reflection. End with the signature line. No emojis, no em dashes, no headers beyond the title block.`,
    ];

    const result = await callClaudeCli({
      model: 'sonnet',
      prompt: promptParts.join('\n'),
      cwd: ctx.repoDir,
      appendSystemPrompt: NEWSLETTER_SYSTEM,
      allowedTools: ['Read', 'Glob', 'Grep'],
      permissionMode: 'auto',
      outputFormat: 'json',
    });

    return result.text.trim() || '(newsletter subagent returned empty)';
  },
};
