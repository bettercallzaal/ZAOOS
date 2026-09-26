// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

// exec is promisify(execFile) — mock promisify to return a controllable fn
const mockExec = vi.hoisted(() => vi.fn());
vi.mock('node:util', () => ({ promisify: vi.fn().mockReturnValue(mockExec) }));

const mockReaddir = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());
const mockWriteFile = vi.hoisted(() => vi.fn());
const mockAppendFile = vi.hoisted(() => vi.fn());
vi.mock('node:fs', () => ({
  promises: {
    readdir: mockReaddir,
    mkdir: mockMkdir,
    writeFile: mockWriteFile,
    appendFile: mockAppendFile,
  },
}));

import { assessFindings, commitResearchDoc, stripPreamble } from '../research-doc';

afterEach(() => vi.clearAllMocks());

// ── helpers ───────────────────────────────────────────────────────────────────

function execOk(stdout = ''): { stdout: string; stderr: string } {
  return { stdout, stderr: '' };
}

/**
 * Set up mocks for the full happy path.
 * nextDocNum: readdir returns no matching files → max=0 → num=1
 *             gh api for PR titles → stdout '' → no PR numbers → num stays 0+1=1
 *             git ls-remote for in-flight ws/zoe-research-N branches → stdout ''
 * commitResearchDoc git calls: checkout main, pull, checkout -B branch, add, commit, push, checkout main
 * commitResearchDoc gh call for PR: returns URL
 *
 * Dispatch on the COMMAND, not on call order. A positional
 * mockResolvedValueOnce queue silently breaks whenever the source adds another
 * probe: #2830 inserted a `git ls-remote` in nextDocNum(), which shifted every
 * later slot by one, ran the queue dry mid-run and made `exec` resolve
 * undefined — so all three happy-path tests failed on `r.ok`.
 */
function setupHappyPath(num = 1, prUrl = 'https://github.com/org/repo/pull/501') {
  // readdir: ENOENT for all topic dirs (no existing docs)
  mockReaddir.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
  mockMkdir.mockResolvedValue(undefined);
  mockWriteFile.mockResolvedValue(undefined);
  mockAppendFile.mockResolvedValue(undefined);

  // Only the PR-create call (`gh api -X POST .../pulls`) needs a distinct
  // stdout; every other git/gh call is an empty success.
  mockExec.mockImplementation(async (cmd: string, args: string[]) =>
    cmd === 'gh' && args.includes('-X') ? execOk(`${prUrl}\n`) : execOk(''),
  );
}

// ── commitResearchDoc ─────────────────────────────────────────────────────────

describe('commitResearchDoc', () => {
  it('returns ok:true with num and prUrl on success', async () => {
    setupHappyPath();
    const r = await commitResearchDoc({ question: 'What is ZAO?', findings: 'ZAO is a music DAO.' });
    expect(r.ok).toBe(true);
    expect(r.num).toBe(1);
    expect(r.prUrl).toBe('https://github.com/org/repo/pull/501');
  });

  it('uses the passed topic when it is a valid bucket', async () => {
    setupHappyPath();
    const r = await commitResearchDoc({ question: 'Farcaster protocol overview', findings: '...', topic: 'farcaster' });
    expect(r.ok).toBe(true);
    // The PR URL should still be returned correctly
    expect(r.prUrl).toBeDefined();
  });

  it('falls back to "business" for an unknown topic', async () => {
    setupHappyPath();
    const r = await commitResearchDoc({ question: 'Random question', findings: '...', topic: 'not-a-topic' });
    expect(r.ok).toBe(true);
    // Check that mkdir was called with a path containing 'business'
    expect(mockMkdir.mock.calls[0][0]).toContain('business');
  });

  it('increments doc number above existing files', async () => {
    // One topic dir has a file starting with 500-
    mockReaddir
      .mockResolvedValueOnce(['500-existing-doc']) // first topic dir has an existing file
      .mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' })); // rest ENOENT
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockAppendFile.mockResolvedValue(undefined);
    mockExec
      .mockResolvedValueOnce(execOk(''))  // gh api PR titles
      .mockResolvedValue(execOk('https://github.com/org/repo/pull/502\n')); // all git + gh POST calls
    const r = await commitResearchDoc({ question: 'Next question', findings: '...' });
    expect(r.ok).toBe(true);
    expect(r.num).toBe(501);
  });

  it('parses open PR titles to find the highest doc number', async () => {
    mockReaddir.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockAppendFile.mockResolvedValue(undefined);
    // Call order matters now: nextDocNum asks origin/main FIRST (fetch, then
    // ls-tree), and only falls back to the disk scan and PR titles when the
    // remote read yields nothing. An empty ls-tree here exercises that fallback.
    mockExec
      .mockResolvedValueOnce(execOk(''))  // git fetch origin main
      .mockResolvedValueOnce(execOk(''))  // git ls-tree origin/main research/ - empty
      .mockResolvedValueOnce(execOk('doc 750: some research\ndoc 755: more research\n'))  // gh api PR titles
      .mockResolvedValue(execOk('https://github.com/org/repo/pull/756\n'));
    const r = await commitResearchDoc({ question: 'Another question', findings: '...' });
    expect(r.ok).toBe(true);
    expect(r.num).toBe(756);
  });

  it('returns ok:false with an error message when git fails', async () => {
    mockReaddir.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
    mockExec
      .mockResolvedValueOnce(execOk(''))  // gh api PR titles
      .mockRejectedValue(new Error('git checkout failed: not a repo'));
    const r = await commitResearchDoc({ question: 'Will this fail?', findings: '...' });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('git checkout failed');
  });

  it('writes a markdown file with the question and findings', async () => {
    setupHappyPath();
    await commitResearchDoc({ question: 'What is ZAO?', findings: 'ZAO is a music DAO that...' });
    expect(mockWriteFile).toHaveBeenCalledOnce();
    const content: string = mockWriteFile.mock.calls[0][1];
    expect(content).toContain('What is ZAO?');
    expect(content).toContain('ZAO is a music DAO that');
    expect(content).toContain('topic: business'); // fallback topic
  });
});

// -- assessFindings + the draft hold --
// Fixtures are the shapes of two real docs from 2026-09-20 that reached public
// main stamped research-complete while saying of themselves they were not.

const DOC_2511_SHAPE = [
  'Some findings.',
  '',
  '## Sources',
  '- [PARTIAL - WebFetch returns model summary, not raw text] "Do Faces Help" - https://example.com/a',
  '- [PARTIAL - search result summary only, not fetched] "Best Practices" - https://example.com/b',
  '- [FAILED - no direct community thread found within budget] Community source. **Shipping blocker per learning 2026-07-12 not resolved.**',
].join('\n');

const DOC_2510_SHAPE = [
  'Budget is critically low. I have enough internal data to synthesize an honest answer.',
  '',
  '## Sources',
  '- [FULL] Doc 1214 - internal doc, read this run',
  '- [FULL] Doc 2501 - internal doc, read this run',
].join('\n');

const GOOD_DOC = [
  'Findings with evidence.',
  '',
  '## Sources',
  '- [FULL] Official docs - https://example.com/docs',
  '- [FULL] GitHub README - https://example.com/readme',
  '- [PARTIAL - summary only] A blog - https://example.com/blog',
].join('\n');

function prCreateArgs(): string[] {
  const call = mockExec.mock.calls.find(([cmd, args]) => cmd === 'gh' && (args as string[]).includes('-X'));
  return (call?.[1] as string[]) ?? [];
}

describe('assessFindings', () => {
  it('holds the doc 2511 shape: no FULL source, a FAILED one, a named shipping blocker', () => {
    const r = assessFindings(DOC_2511_SHAPE);
    expect(r.complete).toBe(false);
    expect(r).toMatchObject({ full: 0, partial: 2, failed: 1 });
    expect(r.reasons).toHaveLength(3);
  });

  it('holds the doc 2510 shape: FULL sources present, but the worker said its budget ran low', () => {
    const r = assessFindings(DOC_2510_SHAPE);
    expect(r.complete).toBe(false);
    expect(r.full).toBe(2);
    // Doc 2510 also cited no URLs at all, which is now its own reason (card 9907).
    expect(r.reasons).toEqual(['the worker said its budget ran low', 'the findings cite no URLs']);
  });

  it('passes a doc with a FULL source, nothing FAILED and no stated blocker', () => {
    expect(assessFindings(GOOD_DOC)).toMatchObject({ complete: true, full: 2, partial: 1, failed: 0, reasons: [] });
  });

  it('holds findings that carry no source marks at all', () => {
    expect(assessFindings('ZAO is a music DAO.').complete).toBe(false);
  });

  it('counts marks in a numbered source list as well as a bulleted one', () => {
    const r = assessFindings('1. [FULL] Source A - https://a.example\n2) [FULL] Source B - https://b.example\n3. [PARTIAL - summary] Source C');
    expect(r).toMatchObject({ complete: true, full: 2, partial: 1, failed: 0 });
  });

  it('counts a mark only at the start of a list item, not a mention in prose', () => {
    expect(assessFindings('The worker said [FULL] access was unavailable.').full).toBe(0);
  });
});

// Card 9907, the remaining half of the doc-2510 fix. Shapes are the real ones:
// doc 2539 (PR #3628) opened "Budget nearly exhausted. Synthesizing from
// verified fetches." then "---" then "## Findings".
const DOC_2539_SHAPE = [
  'Budget nearly exhausted. Synthesizing from verified fetches.',
  '',
  '---',
  '',
  '## Findings',
  '',
  '**Eligibility confirmed.** Body text.',
  '',
  '## Sources',
  '- [FULL, liveness-verified-2026-09-23] [YouTube Help](https://support.google.com/youtube/answer/9277801)',
  '- [FULL] [Tools](https://example.com/tools)',
].join('\n');

describe('card 9907: zero-URL docs, budget wordings, and the preamble', () => {
  it('holds a doc that cites no URLs even with FULL marks', () => {
    const r = assessFindings('## Sources\n- [FULL] Doc 1214 - internal\n- [FULL] Doc 2501 - internal');
    expect(r.complete).toBe(false);
    expect(r.reasons).toContain('the findings cite no URLs');
  });

  it('catches "Budget nearly exhausted" (doc 2539), which the first pattern missed', () => {
    expect(assessFindings(DOC_2539_SHAPE).reasons).toContain('the worker said its budget ran low');
  });

  it.each([
    'Budget is critically low.',
    'Budget nearly exhausted.',
    'budget almost exhausted, wrapping up',
    'Budget is running out.',
    'I ran out of budget.',
  ])('reads %j as a budget warning', (line) => {
    expect(assessFindings(`${line}\n- [FULL] x - https://x.example`).reasons).toContain('the worker said its budget ran low');
  });

  it('does not read ordinary prose about budgets as a warning', () => {
    const r = assessFindings('The festival budget is $5k.\n- [FULL] x - https://x.example');
    expect(r.reasons).not.toContain('the worker said its budget ran low');
  });

  it('strips the chatter before the first heading (doc 2539 shape)', () => {
    const out = stripPreamble(DOC_2539_SHAPE);
    expect(out.startsWith('## Findings')).toBe(true);
    expect(out).not.toContain('Budget nearly exhausted');
  });

  it('keeps findings written as prose before a "## Sources" heading', () => {
    expect(stripPreamble(GOOD_DOC)).toContain('Findings with evidence.');
  });

  it('keeps a long leading block: that is content, not chatter', () => {
    const long = `${'Real finding sentence. '.repeat(30)}\n\n## Detail\nmore`;
    expect(stripPreamble(long).startsWith('Real finding')).toBe(true);
  });

  it('keeps text with no heading at all', () => {
    expect(stripPreamble('Just prose, no heading.')).toBe('Just prose, no heading.');
  });

  it('the written doc omits the chatter and the banner still names the budget', async () => {
    setupHappyPath();
    await commitResearchDoc({ question: 'Super Chat?', findings: DOC_2539_SHAPE });
    const content: string = mockWriteFile.mock.calls[0][1];
    expect(content).not.toContain('Synthesizing from verified fetches');
    expect(content).toContain('## Findings');
    expect(content).toContain('HELD AS DRAFT');
    expect(content).toContain('the worker said its budget ran low');
  });
});

describe('commitResearchDoc holds an incomplete doc as a draft', () => {
  it('writes status: draft with a banner, and opens the PR with draft=true', async () => {
    setupHappyPath();
    const r = await commitResearchDoc({ question: 'Thumbnails?', findings: DOC_2511_SHAPE });
    expect(r.ok).toBe(true);
    const content: string = mockWriteFile.mock.calls[0][1];
    expect(content).toContain('status: draft');
    expect(content).not.toContain('status: research-complete');
    expect(content).toContain('HELD AS DRAFT');
    expect(content).toContain('0 FULL, 2 PARTIAL, 1 FAILED');
    const args = prCreateArgs();
    expect(args).toContain('draft=true');
    expect(args.find((a) => a.startsWith('title='))).toContain('DRAFT');
  });

  it('still stamps research-complete and opens a normal PR when the evidence is there', async () => {
    setupHappyPath();
    const r = await commitResearchDoc({ question: 'Evidence?', findings: GOOD_DOC });
    expect(r.ok).toBe(true);
    const content: string = mockWriteFile.mock.calls[0][1];
    expect(content).toContain('status: research-complete');
    expect(content).not.toContain('HELD AS DRAFT');
    expect(prCreateArgs()).toContain('draft=false');
  });
});
