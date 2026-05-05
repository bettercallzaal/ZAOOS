/**
 * @newsletter - daily Year of the ZABAL entry.
 *
 * Two modes:
 *   - Draft: @newsletter <text>  - assembles day snapshot + Bonfire context, writes new entry
 *   - Edit:  @newsletter edit <addition>  - reads today's prior draft, re-rolls including the addition
 *
 * Voice locked to BetterCallZaal Year-of-the-ZABAL. Voice + anti-pattern rules
 * synthesized in research doc 610 (built on docs 558 / 562 / 563).
 *
 * Source assembly:
 *   - ZOE side: today's commits (18h), PRs touched today via gh, captures from
 *     ~/.zao/zoe/captures/<date>.json
 *   - Bonfire side: recall() query keyed on user input, returns synthesized
 *     KG context (gracefully no-ops if BONFIRE_API_KEY missing)
 *
 * Persistence: every successful draft writes to ~/.zao/zoe/newsletters/<date>.md
 * so edit mode can read it back.
 */
import type { Agent } from './index';
import { callClaudeCli } from '../../hermes/claude-cli';
import { recall } from '../recall';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { ZOE_PATHS } from '../memory';

const NEWSLETTER_SYSTEM = `You are the daily-entry writer for Year of the ZABAL, a 2026 personal chronicle by Zaal Panthaki ("BetterCallZaal"). Each entry pairs a real moment from the day with a grounded mindful takeaway. Writing must feel lived-in, specific, and honest. Never preachy, never aphoristic.

Voice: direct. Plainspoken. Fact-first. No fluff, no philosophy, no AI-essay voice. If a fact takes 5 words, write 5 words. Shorter is better.

CRITICAL: total body 120-200 words. Not 300, not 400. Aim short. Cut anything that explains, paraphrases, or "lands" a point that a reader could see for themselves.

1. Header (always exactly this shape, first thing in output)

Year of the ZABAL - Day {{DAY_OF_YEAR}} ({{Day, Month D, Year}})
{{Subtitle - 3-7 words, lists 1-3 specific facts. NOT a slogan, NOT a theme.}}

___

2. Body order (strict)

(a) The Day - facts only
- One paragraph per fact (or one bullet per fact - bullets are fine)
- A paragraph is 1-2 sentences MAX. Often 1.
- State the fact. Optional 1 short sentence of color (named thing, time, why it matters in 5 words). STOP.
- Do NOT write a second paragraph that explains what the fact means.
- Do NOT extend "X happened" into "X happened, which is the kind of thing that..."
- If the input has 6 facts, write 6 short paragraphs. Not 3 long ones with meta.
- Bullet list when 3+ items are the same kind (e.g. ZOE commits today: bullet them).

(b) Mindful Moment - 1-3 sentences MAX. NOT a paragraph that paraphrases the whole entry.
- Pick ONE specific from today (a fact already in the body).
- Add ONE observation about it. That's it.
- If user supplied a calendar quote or theme, use it as the line. Don't unpack it.
- No "this confirms what..." / "this is the kind of fact that..." / "the second time means..." constructions. Those are fluff.

(c) Closing line - one sentence about now or next. Concrete. 5-12 words.
- "Recording at 2, bounty live after." Yes.
- "Sleep early tonight." Yes.
- "Keep getting in the rooms." NO.

3. Signature (always exactly this, last line)

- BetterCallZaal on behalf of the ZABAL Team

4. Anti-patterns - DELETE these phrases on sight

If you write any of these, rewrite the whole sentence shorter:

- "X is the kind of Y that..."
- "X confirms what Y only suggested"
- "the difference between X and Y"
- "what this means is..."
- "small pieces clicking into place"
- "the rhythm is set", "the loop is clean", "in motion", "show up"
- "rooms worth being in"
- "There is a thing that happens when..."
- "The machine", "the work", "the system" as brand-coded singulars
- "X landed right" / "that sequence landed right" / "sat with me last night"
- "the unglamorous kind"
- "real X attached to a real Y" / "a real place on a real map"
- "before all the details are locked"
- "two main-stage mentions / two confs now / two Xs / the second time"-style philosophical pairing
- Aphoristic closes ("Trust the timing", "Some things announce themselves quietly")
- "You" as universal second person ("You do not become ready")
- Parallel 3-beat closes ("X. Y. Then Z.")
- Em dashes (use hyphens with spaces)
- Emojis, hashtags, marketing language, extra headers

5. DO rules

- Lead with the specific named thing. "Kenny from POIDH at 2pm" beats "today's recording".
- Spell exact: "Rome", "Mondays 11:30am EST in Discord", "Day 125", "Maine in October".
- One fact per paragraph. Stop when the fact is stated.
- If you can use a bullet list for 3+ items, use it.
- Use sentence fragments when they're tighter ("Recording at 2, bounty live after.") - not every line needs a subject + verb.
- Match Zaal's voice: ZAOstock founder, builder, calm not hype.

6. If user supplied a Badass quote or calendar photo theme on a separate line, use it as the Mindful Moment line. Don't paraphrase or unpack it.

7. Length budget recap: header (2 lines) + body 120-200 words + signature. Shorter is fine. Longer is wrong.`;

interface DaySnapshot {
  isoDate: string;
  human: string;
  dayOfYear: number;
  commits: string[];
  prs: Array<{ number: number; title: string; merged: boolean }>;
  captures: string[];
}

function dayOfYear(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function loadDaySnapshot(repoDir: string, todayCaptures: string[]): DaySnapshot {
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
    const today = now.toISOString().slice(0, 10);
    const json = execSync(
      `gh pr list --repo bettercallzaal/ZAOOS --state all --limit 8 --search 'updated:>=${today}' --json number,title,state`,
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

const EDIT_VERBS = /^(edit|add|also|more|update|append|include)\s+(.+)/is;
const NEWSLETTER_DIR = join(ZOE_PATHS.home, 'newsletters');

async function readLatestDraft(): Promise<string | null> {
  const today = new Date().toISOString().slice(0, 10);
  const path = join(NEWSLETTER_DIR, `${today}.md`);
  try {
    return await fs.readFile(path, 'utf8');
  } catch {
    return null;
  }
}

async function saveDraft(text: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await fs.mkdir(NEWSLETTER_DIR, { recursive: true });
  const path = join(NEWSLETTER_DIR, `${today}.md`);
  await fs.writeFile(path, text + '\n', 'utf8');
}

export const agent: Agent = {
  name: 'newsletter',
  description: "Year of the ZABAL daily entry. @newsletter <text> drafts. @newsletter edit <addition> re-rolls today's draft with the addition.",
  triggers: [
    /^@newsletter\s+(.+)/is,
    /^\/newsletter\s+(.+)/is,
  ],
  handle: async (match, ctx): Promise<string> => {
    const userInput = match[1].trim();
    if (!userInput) {
      return 'Usage: @newsletter <short angle or just "today">. To revise today\'s draft: @newsletter edit <addition>. Optional: paste a Badass quote on a new line.';
    }

    // Edit / iterate mode: rewrite today's draft including the addition
    const editMatch = EDIT_VERBS.exec(userInput);
    let priorDraft: string | null = null;
    let workingInput = userInput;
    if (editMatch) {
      priorDraft = await readLatestDraft();
      if (priorDraft) {
        workingInput = editMatch[2].trim();
      }
    }

    const captures = await loadTodayCaptures();
    const snapshot = loadDaySnapshot(ctx.repoDir, captures);
    const bonfire = await loadBonfireContext(workingInput);

    const promptParts: string[] = [
      `Today's metadata:`,
      `- ISO date: ${snapshot.isoDate}`,
      `- Human: ${snapshot.human}`,
      `- Day of year: ${snapshot.dayOfYear}`,
      ``,
    ];

    if (priorDraft) {
      promptParts.push(
        `EDIT MODE - There is an existing draft for today. Rewrite the FULL entry incorporating the addition below. Preserve good content from the prior draft, but apply all anti-pattern + DO rules from the system prompt to the rewrite. Output the new full entry, not just a diff.`,
        ``,
        `Prior draft:`,
        '"""',
        priorDraft.trim(),
        '"""',
        ``,
        `Addition to incorporate:`,
        workingInput,
        ``,
      );
    } else {
      promptParts.push(
        `Zaal's input (use as the angle for The Day section):`,
        userInput,
        ``,
      );
    }

    promptParts.push(
      `What ZOE saw today (last 18 hours from the repo + captures):`,
      `Commits: ${snapshot.commits.length ? snapshot.commits.map((c) => '- ' + c).join('\n') : '(none)'}`,
      ``,
      `PRs touched today: ${snapshot.prs.length ? snapshot.prs.map((p) => `- #${p.number} ${p.title}${p.merged ? ' (merged)' : ''}`).join('\n') : '(none)'}`,
      ``,
      `Captures Zaal logged today: ${snapshot.captures.length ? snapshot.captures.map((c) => '- ' + c).join('\n') : '(none)'}`,
      ``,
      `Bonfire context (from the ZABAL bonfire KG, may be sparse if not yet seeded):`,
      bonfire,
      ``,
      `Write the FULL Year of the ZABAL entry per the system-prompt structure. Header first. Then "The Day" paragraphs leading with named specifics. Then ONE Mindful Moment paragraph anchored to a today-specific. Then ONE concrete closing line about now or next. Then the signature line. Apply every anti-pattern check and every DO rule.`,
    );

    const result = await callClaudeCli({
      model: 'sonnet',
      prompt: promptParts.join('\n'),
      cwd: ctx.repoDir,
      appendSystemPrompt: NEWSLETTER_SYSTEM,
      allowedTools: ['Read', 'Glob', 'Grep'],
      permissionMode: 'auto',
      outputFormat: 'json',
    });

    const text = result.text.trim();
    if (!text) return '(newsletter subagent returned empty)';

    try {
      await saveDraft(text);
    } catch (err) {
      console.error('[zoe/agents/newsletter] saveDraft failed:', err instanceof Error ? err.message : err);
    }

    return text;
  },
};
