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

import { commitResearchDoc } from '../research-doc';

afterEach(() => vi.clearAllMocks());

// ── helpers ───────────────────────────────────────────────────────────────────

function execOk(stdout = ''): { stdout: string; stderr: string } {
  return { stdout, stderr: '' };
}

/**
 * Set up mocks for the full happy path.
 * nextDocNum: readdir returns no matching files → max=0 → num=1
 *             gh api for PR titles → stdout '' → no PR numbers → num stays 1+1=2 actually 0+1=1
 * commitResearchDoc git calls: checkout main, pull, checkout -B branch, add, commit, push, checkout main
 * commitResearchDoc gh call for PR: returns URL
 */
function setupHappyPath(num = 1, prUrl = 'https://github.com/org/repo/pull/501') {
  // readdir: ENOENT for all topic dirs (no existing docs)
  mockReaddir.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
  mockMkdir.mockResolvedValue(undefined);
  mockWriteFile.mockResolvedValue(undefined);
  mockAppendFile.mockResolvedValue(undefined);

  // exec calls in order:
  // 1. gh api for open PR titles (nextDocNum)
  // 2. git checkout main
  // 3. git pull --quiet
  // 4. git checkout -B branch
  // 5. git add ...
  // 6. git commit ...
  // 7. git push ...
  // 8. gh api POST create PR → returns URL
  // 9. git checkout main
  mockExec
    .mockResolvedValueOnce(execOk(''))             // gh api PR titles
    .mockResolvedValueOnce(execOk(''))             // git checkout main
    .mockResolvedValueOnce(execOk(''))             // git pull
    .mockResolvedValueOnce(execOk(''))             // git checkout -B branch
    .mockResolvedValueOnce(execOk(''))             // git add
    .mockResolvedValueOnce(execOk(''))             // git commit
    .mockResolvedValueOnce(execOk(''))             // git push
    .mockResolvedValueOnce(execOk(`${prUrl}\n`))   // gh api POST PR
    .mockResolvedValueOnce(execOk(''));            // git checkout main (final)
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
    // gh api returns PR titles with doc numbers
    mockExec
      .mockResolvedValueOnce(execOk('doc 750: some research\ndoc 755: more research\n'))
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
