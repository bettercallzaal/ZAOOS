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

/** Highest doc number across merged dirs + open PR titles, +1. */
async function nextDocNum(): Promise<number> {
  let max = 0;
  for (const t of TOPICS) {
    let entries: string[] = [];
    try { entries = await fs.readdir(join(REPO, 'research', t)); } catch { /* topic dir may not exist */ }
    for (const e of entries) { const m = e.match(/^(\d+)-/); if (m) max = Math.max(max, Number(m[1])); }
  }
  try {
    const { stdout } = await exec('gh', ['api', 'repos/bettercallzaal/ZAOOS/pulls?state=open&per_page=80', '--jq', '.[].title'], { maxBuffer: 1024 * 1024 });
    for (const line of stdout.split('\n')) { const m = line.match(/doc[ #]?(\d{3,})/i); if (m) max = Math.max(max, Number(m[1])); }
  } catch { /* gh optional */ }
  return max + 1;
}

export async function commitResearchDoc(opts: { question: string; findings: string; topic?: string }): Promise<ResearchDocResult> {
  try {
    const topic = pickTopic(opts.topic);
    const num = await nextDocNum();
    const title = opts.question.replace(/https?:\/\/\S+/g, '').trim().slice(0, 70) || 'ZOE research';
    const slug = slugify(opts.question);
    const dir = join(REPO, 'research', topic, `${num}-${slug}`);
    const today = new Date().toISOString().slice(0, 10);
    const body = `---\ntopic: ${topic}\ntype: market-research\nstatus: research-complete\nlast-validated: ${today}\nsuperseded-by:\nrelated-docs:\noriginal-query: ${JSON.stringify(opts.question)}\ntier: STANDARD\n---\n\n# ${num} - ${title}\n\n> Drafted by ZOE's research-worker from "${opts.question}". Auto-committed to main for durability; review + deepen as needed.\n\n${opts.findings.trim()}\n`;

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
      '-f', `title=doc ${num}: ${title} (ZOE research)`, '-f', `head=${branch}`, '-f', 'base=main',
      '-f', `body=Auto-drafted by ZOE's research-worker from: ${opts.question}\n\nReview + deepen as needed.`, '--jq', '.html_url'],
      { cwd: REPO, maxBuffer: 1024 * 1024 });
    await git(['checkout', 'main']);
    return { ok: true, num, prUrl: stdout.trim() };
  } catch (e) {
    return { ok: false, error: (e as Error)?.message?.slice(0, 200) ?? 'unknown' };
  }
}
