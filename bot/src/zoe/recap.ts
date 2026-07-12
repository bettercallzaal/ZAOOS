/**
 * Nightly recap — runs daily at 9pm EST (02:00 UTC).
 *
 * Backward-looking mirror of the morning brief. Generates a contextual summary
 * of what shipped today via Claude CLI using recent merged PRs + commits +
 * research docs. Posts to Zaal's DM.
 *
 * Silent when nothing shipped (no sends, no sentinel claim).
 *
 * Output format:
 *   Shipped today - {Day} {Mon DD}
 *   MERGED
 *   - list
 *   COMMITS
 *   - list
 *   RESEARCH DOCS
 *   - list
 */
import { callClaudeCli } from '../hermes/claude-cli';
import { execSync } from 'node:child_process';

const RECAP_SYSTEM_PROMPT = `You are ZOE writing Zaal's nightly recap at 9pm EST.

VOICE: Year-of-the-ZABAL — clear, simple, spartan, active voice. No emojis, no em dashes, no marketing.

OUTPUT FORMAT (exact structure):

Shipped today - {Day} {Mon DD}

MERGED
- List of merged PRs. Format: #{number} {title}. (none) if nothing.

COMMITS
- List of commit subjects from last 24h. (none) if nothing.

RESEARCH DOCS
- List of research docs added today. (none) if nothing.

Output the recap in plaintext. NO markdown headers, NO emojis, NO pleasantries.`;

interface RecapContext {
  today_iso: string;
  merged_prs: Array<{ number: number; title: string }>;
  commits_24h: string[];
  research_docs: string[];
}

function todayLabel(): { day: string; date: string } {
  const d = new Date();
  const tz = 'America/New_York'; // Zaal is EST/EDT; VPS runs UTC
  const day = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: tz });
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: tz });
  return { day, date };
}

async function loadRecapContext(repoDir: string): Promise<RecapContext> {
  let mergedPrs: Array<{ number: number; title: string }> = [];
  try {
    const json = execSync('gh pr list --repo bettercallzaal/ZAOOS --state merged --limit 10 --json number,title --search "merged:>24-hours-ago"', {
      encoding: 'utf8',
      timeout: 8000,
    });
    mergedPrs = JSON.parse(json) as Array<{ number: number; title: string }>;
  } catch (err) {
    console.error('[zoe/recap] gh pr list merged failed:', (err as Error).message);
    mergedPrs = [];
  }

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

  // Research docs: scan research/ for files created in the last 24h.
  let researchDocs: string[] = [];
  try {
    const since24hAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const find = execSync(
      `find ${JSON.stringify(repoDir)}/research -name "*.md" -type f -newer /proc/uptime 2>/dev/null | xargs -I {} sh -c 'stat -c "%y %n" "{}" 2>/dev/null | grep -v "^d"' 2>/dev/null || true`,
      { encoding: 'utf8', timeout: 3000, stdio: ['pipe', 'pipe', 'ignore'] },
    );
    researchDocs = find
      .split('\n')
      .filter((l) => l.trim())
      .slice(0, 10)
      .map((l) => {
        const parts = l.split('/');
        return parts[parts.length - 1] || l;
      });
  } catch {
    researchDocs = [];
  }

  return {
    today_iso: new Date().toISOString().slice(0, 10),
    merged_prs: mergedPrs,
    commits_24h: commits24h,
    research_docs: researchDocs,
  };
}

export async function generateNightlyRecap(opts: { repoDir: string; model?: string }): Promise<string | null> {
  const ctx = await loadRecapContext(opts.repoDir);

  // Silent when nothing shipped
  if (ctx.merged_prs.length === 0 && ctx.commits_24h.length === 0 && ctx.research_docs.length === 0) {
    return null;
  }

  const { day, date } = todayLabel();

  const userPrompt = `Generate the nightly recap for ${day} ${date}.

CONTEXT:
- Merged PRs: ${ctx.merged_prs.length === 0 ? '(none)' : ctx.merged_prs.map((p) => `#${p.number} ${p.title}`).join(' | ')}
- Last 24h commits: ${ctx.commits_24h.length === 0 ? '(none)' : ctx.commits_24h.join(' | ')}
- Research docs added today: ${ctx.research_docs.length === 0 ? '(none)' : ctx.research_docs.join(' | ')}

Output the recap now in the exact format from your system prompt.`;

  const result = await callClaudeCli({
    model: opts.model ?? 'sonnet',
    prompt: userPrompt,
    cwd: opts.repoDir,
    appendSystemPrompt: RECAP_SYSTEM_PROMPT,
    permissionMode: 'default',
    bare: false,
  });

  return guardEmpty(result.text);
}

const EMPTY_GUARD_MIN = 50;

function guardEmpty(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length < EMPTY_GUARD_MIN) {
    console.error('[zoe/recap] empty/short recap output, length=', trimmed.length, 'raw=', trimmed.slice(0, 200));
    return null;
  }
  return trimmed;
}
