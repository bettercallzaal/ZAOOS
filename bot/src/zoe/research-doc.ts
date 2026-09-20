// research-doc.ts - turn a research-worker's findings into a numbered research
// doc + PR to main. The WORKER stays sandboxed (no Bash/Write/git, by design in
// workers.ts); this trusted Node step does the commit. So "ZOE, research X" can
// land a durable doc on main instead of an ephemeral Telegram answer.
//
// Best-effort: every failure is caught and returned, never thrown into dispatch.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const exec = promisify(execFile);
const REPO = process.env.ZOE_REPO_DIR || process.env.REPO_DIR || `${process.env.HOME}/zao-os`;
const TOPICS = ['agents','music','dev-workflows','infrastructure','governance','community','cross-platform','farcaster','identity','business','events','wavewarz','security'];

export interface ResearchDocResult { ok: boolean; num?: number; prUrl?: string; error?: string; }

function slugify(s: string): string {
  return s.toLowerCase().replace(/https?:\/\/\S+/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').split('-').slice(0,7).join('-') || 'research';
}
function pickTopic(t?: string): string {
  if (t && TOPICS.includes(t)) return t;
  return 'business'; // safe default bucket for ad-hoc ZOE research
}

async function git(args: string[]): Promise<string> {
  const { stdout } = await exec('git', ['-C', REPO, ...args], { maxBuffer: 1024 * 1024 });
  return stdout.trim();
}

/** Highest doc number across merged dirs + open PR titles + in-flight branches, +1. */
/** Highest doc number in a `git ls-tree` listing of research/. Exported for tests. */
export function maxDocNumFrom(lines: string): number {
  let max = 0;
  for (const line of lines.split('\n')) {
    // research/<topic>/<NNNN>-slug  - topic is NOT constrained to the TOPICS
    // list, because the repo has 25 topic dirs and TOPICS names 13. Reading only
    // the known ones would miss whichever dir happens to hold the highest number.
    const m = line.match(/^research\/[^/]+\/(\d{3,4})-/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

async function nextDocNum(): Promise<number> {
  let max = 0;

  // Ask the REMOTE, not a local checkout.
  //
  // This used to read `REPO` off disk, and REPO defaults to ~/zao-os while the
  // bot actually runs from ~/zao-bot-live. Nothing keeps ~/zao-os current, so on
  // 2026-08-15 it was ~6 days behind and numbering picked 2249 - a number
  // already taken by research/agents/2249-cli-messaging-vs-ssh-orchestration.
  // The collision guard caught it, but only after a PR had been opened.
  let sawRemote = false;
  try {
    await exec('git', ['-C', REPO, 'fetch', 'origin', 'main', '--quiet'], { maxBuffer: 1024 * 1024 });
    const { stdout } = await exec('git', ['-C', REPO, 'ls-tree', '-r', '-d', '--name-only', 'origin/main', 'research/'], { maxBuffer: 8 * 1024 * 1024 });
    max = Math.max(max, maxDocNumFrom(stdout));
    sawRemote = max > 0;
  } catch { /* fall through to the disk scan below */ }

  // Disk fallback, and LOUD about it. A silent fallback here is how a stale
  // checkout produced a duplicate number without anyone noticing.
  if (!sawRemote) {
    console.log('[zoe/research-doc] WARNING: could not read origin/main for doc numbering - falling back to the local checkout, which may be stale');
    for (const t of TOPICS) {
      let entries: string[] = [];
      try { entries = await fs.readdir(join(REPO, 'research', t)); } catch { /* topic dir may not exist */ }
      for (const e of entries) { const m = e.match(/^(\d+)-/); if (m) max = Math.max(max, Number(m[1])); }
    }
  }
  try {
    const { stdout } = await exec('gh', ['api', 'repos/bettercallzaal/ZAOOS/pulls?state=open&per_page=80', '--jq', '.[].title'], { maxBuffer: 1024 * 1024 });
    for (const line of stdout.split('\n')) { const m = line.match(/doc[ #]?(\d{3,})/i); if (m) max = Math.max(max, Number(m[1])); }
  } catch { /* gh optional */ }
  // In-flight branches: a doc branched (ws/zoe-research-N) but not yet merged or
  // PR'd collides otherwise (audit afaa850, 2026-08-04). Bound to 3-4 digits so a
  // slug's stray digits/SHA can't poison the max into the trillions (the loose-regex
  // bug the /zao-research skill already learned, 2026-07-22).
  try {
    const { stdout } = await exec('git', ['-C', REPO, 'ls-remote', '--heads', 'origin', 'ws/zoe-research-*'], { maxBuffer: 1024 * 1024 });
    for (const line of stdout.split('\n')) { const m = line.match(/ws\/zoe-research-(\d{3,4})\b/); if (m) max = Math.max(max, Number(m[1])); }
  } catch { /* git optional */ }
  return max + 1;
}

export interface DocReadiness { complete: boolean; full: number; partial: number; failed: number; reasons: string[]; }

// Does the worker's OWN text support calling this doc complete? Until
// 2026-09-20 every doc was stamped `status: research-complete` and its PR was
// auto-merged to public main by docs-automerge.yml, whatever the findings said.
// Two docs in one night said of themselves that they were not done: 2510 opened
// with "Budget is critically low" and made 0 external fetches; 2511 listed 0
// FULL sources and ended "Shipping blocker ... not resolved". Both went to main
// marked complete. This reads the marks the worker already writes; it judges
// nothing the text does not say. Each rule below traces to one of those docs.
// Known limits, on purpose: findings with no source marks at all are held (a
// doc that cites nothing is not complete), and a worker that admits it is
// unfinished in words other than the two phrases below still passes if it has
// a FULL source and no FAILED one. A wrong hold costs one review; a wrong pass
// publishes. Widening the phrase list is a follow-up, not a reason to wait.
export function assessFindings(findings: string): DocReadiness {
  const marks = (tag: string): number =>
    (findings.match(new RegExp(`^\\s*(?:[-*]|\\d{1,3}[.)])\\s*\\[${tag}\\b`, 'gmi')) ?? []).length;
  const full = marks('FULL'), partial = marks('PARTIAL'), failed = marks('FAILED');
  const reasons: string[] = [];
  if (full === 0) reasons.push('no source marked FULL');
  if (failed > 0) reasons.push(`${failed} source(s) marked FAILED`);
  if (/shipping blocker/i.test(findings)) reasons.push('the findings name an unresolved shipping blocker');
  if (/budget is (critically )?low/i.test(findings)) reasons.push('the worker said its budget ran low');
  return { complete: reasons.length === 0, full, partial, failed, reasons };
}

export async function commitResearchDoc(opts: { question: string; findings: string; topic?: string }): Promise<ResearchDocResult> {
  try {
    const topic = pickTopic(opts.topic);
    const num = await nextDocNum();
    const title = opts.question.replace(/https?:\/\/\S+/g, '').trim().slice(0, 70) || 'ZOE research';
    const slug = slugify(opts.question);
    const dir = join(REPO, 'research', topic, `${num}-${slug}`);
    const today = new Date().toISOString().slice(0, 10);
    const ready = assessFindings(opts.findings);
    const status = ready.complete ? 'research-complete' : 'draft';
    const banner = ready.complete ? '' : `> **HELD AS DRAFT, not complete.** ${ready.reasons.join('; ')}. Sources: ${ready.full} FULL, ${ready.partial} PARTIAL, ${ready.failed} FAILED. Needs a person or a redispatch before it is cited.\n\n`;
    const body = `---\ntopic: ${topic}\ntype: market-research\nstatus: ${status}\nlast-validated: ${today}\nsuperseded-by:\nrelated-docs:\noriginal-query: ${JSON.stringify(opts.question)}\ntier: STANDARD\n---\n\n# ${num} - ${title}\n\n> Drafted by ZOE's research-worker from "${opts.question}". ${ready.complete ? 'Auto-committed to main for durability; review + deepen as needed.' : 'Opened as a DRAFT pull request; it does not merge itself.'}\n\n${banner}${opts.findings.trim()}\n`;

    await git(['checkout', 'main']); await git(['pull', '--quiet']);
    const branch = `ws/zoe-research-${num}`;
    await git(['checkout', '-B', branch]);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(join(dir, 'README.md'), body, 'utf8');
    // register a row in the topic README (best-effort; index hook wants it)
    try {
      const readme = join(REPO, 'research', topic, 'README.md');
      const row = `| ${num} | [${title}](./${num}-${slug}/) | DISPATCH | ZOE research: ${opts.question.replace(/\|/g,' ').slice(0,90)} |\n`;
      await fs.appendFile(readme, row, 'utf8');
    } catch { /* topic README may differ */ }
    await git(['add', join('research', topic, `${num}-${slug}`), join('research', topic, 'README.md')]);
    await git(['commit', '--quiet', '-m', `docs: ${topic} research doc ${num} (ZOE auto-research, tier:STANDARD)\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`]);
    await git(['push', '-u', 'origin', branch, '--quiet']);
    const { stdout } = await exec('gh', ['api', '-X', 'POST', 'repos/bettercallzaal/ZAOOS/pulls',
      '-f', `title=doc ${num}: ${title} (ZOE research${ready.complete ? '' : ', DRAFT - not complete'})`, '-f', `head=${branch}`, '-f', 'base=main',
      // GitHub refuses to enable auto-merge on a draft, so docs-automerge.yml cannot
      // merge it; the workflow has no draft check of its own. Seen on #3582
      // (docs-only, opened as a draft 2026-09-19): auto_merge stayed null and the
      // workflow's automerge job went red. Expect that red check on held docs.
      '-F', `draft=${ready.complete ? 'false' : 'true'}`,
      '-f', `body=Auto-drafted by ZOE's research-worker from: ${opts.question}\n\n${ready.complete ? 'Review + deepen as needed.' : `HELD AS DRAFT: ${ready.reasons.join('; ')}. Sources: ${ready.full} FULL, ${ready.partial} PARTIAL, ${ready.failed} FAILED.`}`, '--jq', '.html_url'],
      { cwd: REPO, maxBuffer: 1024 * 1024 });
    await git(['checkout', 'main']);
    return { ok: true, num, prUrl: stdout.trim() };
  } catch (e) {
    return { ok: false, error: (e as Error)?.message?.slice(0, 200) ?? 'unknown' };
  }
}
