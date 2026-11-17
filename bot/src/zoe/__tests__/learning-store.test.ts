import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { appendApprovedLearning, readLearnings } from '../learning-store';

const homes: string[] = [];

async function home(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'zoe-learning-store-'));
  homes.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(homes.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('approved learning storage', () => {
  it('appends approved lines while preserving the existing file contents', async () => {
    const dir = await home();
    const path = join(dir, 'learnings', 'persona.md');
    await appendApprovedLearning('persona', 'Answer directly.', dir);
    const first = await readFile(path, 'utf8');
    await appendApprovedLearning('persona', 'Name the next action.', dir);
    const updated = await readFile(path, 'utf8');
    expect(updated).toContain(first.trim());
    expect(updated).toContain('Answer directly.');
    expect(updated).toContain('Name the next action.');
    expect(await readLearnings('persona', dir)).toContain('Name the next action.');
  });

  it('refuses a non-missing read error without replacing the destination', async () => {
    const dir = await home();
    const path = join(dir, 'learnings', 'persona.md');
    await mkdir(path, { recursive: true });
    await expect(appendApprovedLearning('persona', 'Do not overwrite this directory.', dir)).rejects.toThrow();
    expect((await readFile(join(path, '..', 'persona.md'), 'utf8').catch(() => '')).length).toBe(0);
  });
});
