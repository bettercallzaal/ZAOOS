import { describe, expect, it, vi } from 'vitest';

const mockRunCmd = vi.hoisted(() => vi.fn());
vi.mock('../git', () => ({ runCmd: mockRunCmd }));

import { WriteSetError, inWriteSet, listTouchedFiles, normalizeWriteSet, outsideWriteSet, writeSetBrief } from '../write-set';

describe('normalizeWriteSet', () => {
  it('strips ./ and keeps files and dir/ entries', () => {
    expect(normalizeWriteSet(['./bot/src/zoe/a.ts', 'bot/src/zoe/__tests__/'])).toEqual(['bot/src/zoe/a.ts', 'bot/src/zoe/__tests__/']);
  });
  it.each([
    [[], 'empty'],
    [['  '], 'blank'],
    [['/etc/passwd'], 'absolute'],
    [['C:\\x'], 'absolute'],
    [['bot/../../x'], '..'],
    [['bot/src/*.ts'], 'glob'],
  ])('refuses %j (%s)', (entries, word) => {
    expect(() => normalizeWriteSet(entries as string[])).toThrow(WriteSetError);
    expect(() => normalizeWriteSet(entries as string[])).toThrow(word);
  });
});

describe('inWriteSet / outsideWriteSet', () => {
  const set = ['bot/src/zoe/a.ts', 'bot/src/zoe/__tests__/'];
  it('matches an exact file and anything under a dir/', () => {
    expect(inWriteSet('bot/src/zoe/a.ts', set)).toBe(true);
    expect(inWriteSet('bot/src/zoe/__tests__/a.test.ts', set)).toBe(true);
  });
  it('does not match a sibling, a prefix look-alike or a parent', () => {
    expect(inWriteSet('bot/src/zoe/a.tsx', set)).toBe(false);
    expect(inWriteSet('bot/src/zoe/b.ts', set)).toBe(false);
    expect(inWriteSet('bot/src/zoe/__tests__', set)).toBe(false);
  });
  it('lists only the offenders', () => {
    expect(outsideWriteSet(['bot/src/zoe/a.ts', 'bot/src/hermes/runner.ts'], set)).toEqual(['bot/src/hermes/runner.ts']);
  });
});

describe('writeSetBrief', () => {
  it('names every entry', () => {
    const b = writeSetBrief(['x.ts', 'dir/']);
    expect(b).toContain('- x.ts');
    expect(b).toContain('- dir/');
    expect(b).toContain('WRITE-SET (enforced)');
  });
});

describe('listTouchedFiles', () => {
  it('unions tracked edits and untracked new files, deduped', async () => {
    mockRunCmd.mockImplementation(async (_cmd: string, args: string[]) =>
      args[0] === 'diff'
        ? { stdout: 'a.ts\nb.ts\n', stderr: '', exitCode: 0 }
        : { stdout: 'new.ts\na.ts\n', stderr: '', exitCode: 0 },
    );
    expect(await listTouchedFiles('/w')).toEqual(['a.ts', 'b.ts', 'new.ts']);
  });
  it('throws when git fails, so the caller fails closed', async () => {
    mockRunCmd.mockResolvedValue({ stdout: '', stderr: 'not a repo', exitCode: 128 });
    await expect(listTouchedFiles('/w')).rejects.toThrow(WriteSetError);
  });
});
