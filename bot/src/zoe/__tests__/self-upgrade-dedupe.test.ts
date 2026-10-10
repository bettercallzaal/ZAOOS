// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { findDocsMatching } from '../research-dedupe';
import { isRecheck, parseResourceLink, repoMentionTest, resourceDecision, resourceInput } from '../self-upgrade';

const link = (text: string) => {
  const l = parseResourceLink(text);
  if (!l) throw new Error(`no link in ${text}`);
  return l;
};

describe('repoMentionTest: which docs count as covering a repo', () => {
  const t = repoMentionTest(link('https://github.com/obra/superpowers'));

  it.each([
    'see https://github.com/obra/superpowers',
    'see https://github.com/obra/superpowers.',
    '(https://github.com/obra/superpowers)',
    'https://github.com/obra/superpowers/blob/main/skills/x/SKILL.md',
    'https://github.com/OBRA/Superpowers.git',
    '`github.com/obra/superpowers`',
  ])('matches %s', (text) => expect(t(text)).toBe(true));

  it.each([
    'https://github.com/obra/superpowers-lab',
    'https://github.com/obra/superpowers.js',
    'https://github.com/obra/super',
    'https://github.com/someone/superpowers',
    'obra/superpowers without the host',
  ])('does not match %s', (text) => expect(t(text)).toBe(false));

  it('a repo name with regex characters is matched literally', () => {
    const dotted = repoMentionTest(link('https://github.com/a/b.c'));
    expect(dotted('https://github.com/a/b.c')).toBe(true);
    expect(dotted('https://github.com/a/bxc')).toBe(false);
  });
});

describe('resourceDecision', () => {
  const sp = link('https://github.com/obra/superpowers');

  it('queues a repo nothing covers', () => {
    expect(resourceDecision(sp, { queuedInputs: [], docs: [], recheck: false })).toEqual({ kind: 'queue' });
  });

  it('points at the docs that already cover it', () => {
    expect(resourceDecision(sp, { queuedInputs: [], docs: ['agents/2652-x'], recheck: false })).toEqual({
      kind: 'researched',
      docs: ['agents/2652-x'],
    });
  });

  it('recheck runs a fresh fit check over a covering doc', () => {
    expect(resourceDecision(sp, { queuedInputs: [], docs: ['agents/2652-x'], recheck: true })).toEqual({ kind: 'queue' });
  });

  it('a repo already queued is not queued twice, recheck or not, whatever link form was queued', () => {
    const queued = [resourceInput(link('https://github.com/OBRA/superpowers/tree/main some steer'))];
    for (const recheck of [false, true]) {
      expect(resourceDecision(sp, { queuedInputs: queued, docs: [], recheck })).toEqual({ kind: 'queued' });
    }
  });

  it('red control: a different repo in the queue does not block', () => {
    const queued = [resourceInput(link('https://github.com/99darwin/nexus'))];
    expect(resourceDecision(sp, { queuedInputs: queued, docs: [], recheck: false })).toEqual({ kind: 'queue' });
  });
});

describe('recheck prefix', () => {
  it('is detected and kept out of the steer note', () => {
    expect(isRecheck('recheck https://github.com/obra/superpowers')).toBe(true);
    expect(isRecheck('Recheck: https://github.com/obra/superpowers the TDD skill')).toBe(true);
    expect(link('recheck https://github.com/obra/superpowers the TDD skill').note).toBe('the TDD skill');
  });

  it('red control: the word elsewhere is not a recheck', () => {
    expect(isRecheck('https://github.com/obra/superpowers recheck the skills')).toBe(false);
    expect(isRecheck('rechecking https://github.com/obra/superpowers')).toBe(false);
  });
});

describe('findDocsMatching over a research tree', () => {
  let root: string;
  beforeEach(async () => {
    root = join(tmpdir(), 'zoe-su-dedupe-' + Math.random().toString(36).slice(2));
    const write = async (rel: string, body: string) => {
      await fs.mkdir(join(root, rel), { recursive: true });
      await fs.writeFile(join(root, rel, 'README.md'), body);
    };
    await write('agents/2652-self-upgrade', 'Sources: https://github.com/obra/superpowers (MIT)');
    await write('agents/2653-other', 'https://github.com/obra/superpowers-lab');
    await write('_archive/0001-old', 'https://github.com/obra/superpowers');
    await write('agents/notes', 'https://github.com/obra/superpowers');
  });
  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('returns the numbered doc that names the repo, skipping archive and unnumbered dirs', async () => {
    const docs = await findDocsMatching(root, repoMentionTest(link('https://github.com/obra/superpowers')));
    expect(docs).toEqual(['agents/2652-self-upgrade']);
  });

  it('red control: a repo no doc names returns []', async () => {
    expect(await findDocsMatching(root, repoMentionTest(link('https://github.com/99darwin/nexus')))).toEqual([]);
  });

  it('a missing research dir fails open to []', async () => {
    expect(await findDocsMatching(join(root, 'nope'), () => true)).toEqual([]);
  });

  it('stops at the limit', async () => {
    expect(await findDocsMatching(root, () => true, 1)).toHaveLength(1);
  });
});

describe('queuedInputs', () => {
  let tmp: string;
  beforeEach(async () => {
    tmp = join(tmpdir(), 'zoe-su-queue-' + Math.random().toString(36).slice(2));
    await fs.mkdir(tmp, { recursive: true });
    vi.stubEnv('ZOE_HOME', tmp);
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('filters by kind', async () => {
    const { enqueueWork, queuedInputs } = await import('../work-loop');
    await enqueueWork('a topic');
    await enqueueWork('https://github.com/obra/superpowers', undefined, 'resource');
    expect(await queuedInputs('resource')).toEqual(['https://github.com/obra/superpowers']);
    expect(await queuedInputs()).toHaveLength(2);
  });
});

describe('index.ts wiring (read as source; index.ts is never imported, agent-loops rule 21)', () => {
  const src = readFileSync(fileURLToPath(new URL('../index.ts', import.meta.url)), 'utf8');
  const branch = src.slice(src.indexOf('const resource = claimResourceLink('));

  it('decides before it enqueues, and returns on queued and researched', () => {
    const decide = branch.indexOf('resourceDecision(resource');
    const enqueue = branch.indexOf("enqueueWork(resourceInput(resource), { chatId: dmChatId }, 'resource')");
    expect(decide).toBeGreaterThan(-1);
    expect(enqueue).toBeGreaterThan(decide);
    const between = branch.slice(decide, enqueue);
    expect(between).toContain("decision.kind === 'queued'");
    expect(between).toContain("decision.kind === 'researched'");
    expect(between.match(/return;/g)?.length).toBe(2);
  });

  it('both dedupe reads fail open', () => {
    const decide = branch.slice(branch.indexOf('resourceDecision(resource'), branch.indexOf('recheck: isRecheck(text)'));
    expect(decide).toContain("queuedInputs('resource').catch(() => [])");
    expect(decide).toContain('repoMentionTest(resource)).catch(() => [])');
  });
});
