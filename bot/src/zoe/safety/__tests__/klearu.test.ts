// @vitest-environment node
// Tests for klearu.ts safety classifier wrapper.
//
// Two test planes:
//  1. Fail-mode (no spawn): when KLEARU_*_CMD is unset, all exported fns
//     short-circuit to failVerdict — testable without any subprocess mock.
//  2. parseVerdict (spawn mock): JSON + bare-label paths tested through
//     checkText by mocking node:child_process.spawn.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── spawn mock ────────────────────────────────────────────────────────────────
// Hoist so the fn reference is stable before vi.mock hoisting.
const { makeSpawn } = vi.hoisted(() => {
  function makeSpawn(stdout: string, exitCode = 0) {
    return vi.fn(() => ({
      stdout: {
        on: (event: string, cb: (d: Buffer) => void) => {
          if (event === 'data' && stdout) cb(Buffer.from(stdout));
        },
      },
      stderr: {
        on: (_event: string, _cb: unknown) => {},
      },
      stdin: { write: vi.fn(), end: vi.fn() },
      on: (event: string, cb: (code: number) => void) => {
        if (event === 'close') setImmediate(() => cb(exitCode));
      },
      kill: vi.fn(),
    }));
  }
  return { makeSpawn };
});

// Default spawn: succeeds with empty stdout (triggers bare-label fallback with empty string).
let spawnImpl = makeSpawn('');
vi.mock('node:child_process', () => ({
  spawn: (...args: unknown[]) => spawnImpl(...args),
}));

import { checkCast, checkImage, checkText } from '../klearu';

// ── env cleanup ───────────────────────────────────────────────────────────────

const ENV_KEYS = [
  'KLEARU_TEXT_CMD',
  'KLEARU_IMAGE_CMD',
  'KLEARU_FAIL_MODE',
  'KLEARU_BLOCK_LABELS',
  'KLEARU_TIMEOUT_MS',
];

beforeEach(() => ENV_KEYS.forEach((k) => delete process.env[k]));
afterEach(() => ENV_KEYS.forEach((k) => delete process.env[k]));

// ── fail-mode: no cmd set (most common prod path when klearu not installed) ──

describe('checkText — fail-closed (default, no cmd)', () => {
  it('returns safe=false when KLEARU_TEXT_CMD is not set', async () => {
    const v = await checkText('hello');
    expect(v.safe).toBe(false);
  });

  it('returns label "unverified-block"', async () => {
    const v = await checkText('hello');
    expect(v.label).toBe('unverified-block');
  });

  it('includes "fail-closed" in the reason string', async () => {
    const v = await checkText('hello');
    expect(v.reason).toContain('fail-closed');
  });

  it('has score=null (no classifier ran)', async () => {
    const v = await checkText('hello');
    expect(v.score).toBeNull();
  });
});

describe('checkText — fail-open (KLEARU_FAIL_MODE=open, no cmd)', () => {
  beforeEach(() => { process.env.KLEARU_FAIL_MODE = 'open'; });

  it('returns safe=true when fail-open and cmd missing', async () => {
    const v = await checkText('hello');
    expect(v.safe).toBe(true);
  });

  it('returns label "unverified-allow"', async () => {
    const v = await checkText('hello');
    expect(v.label).toBe('unverified-allow');
  });

  it('includes "fail-open" in the reason string', async () => {
    const v = await checkText('hello');
    expect(v.reason).toContain('fail-open');
  });
});

describe('checkImage — fail-mode (no cmd)', () => {
  it('returns safe=false when KLEARU_IMAGE_CMD is not set', async () => {
    const v = await checkImage('/tmp/test.png');
    expect(v.safe).toBe(false);
    expect(v.label).toBe('unverified-block');
  });

  it('returns safe=true when fail-open and cmd missing', async () => {
    process.env.KLEARU_FAIL_MODE = 'open';
    const v = await checkImage('/tmp/test.png');
    expect(v.safe).toBe(true);
    expect(v.label).toBe('unverified-allow');
  });
});

describe('checkCast — fail-mode (no cmds)', () => {
  it('returns unsafe when text cmd missing (fail-closed)', async () => {
    const v = await checkCast({ text: 'hello' });
    expect(v.safe).toBe(false);
  });

  it('returns safe when fail-open and no cmds', async () => {
    process.env.KLEARU_FAIL_MODE = 'open';
    const v = await checkCast({ text: 'hello' });
    expect(v.safe).toBe(true);
  });

  it('returns text verdict when fail-open and no imagePaths', async () => {
    process.env.KLEARU_FAIL_MODE = 'open';
    const v = await checkCast({ text: 'hello', imagePaths: [] });
    expect(v.label).toBe('unverified-allow');
  });
});

// ── parseVerdict via spawn mock ───────────────────────────────────────────────

describe('checkText — JSON verdict via spawn', () => {
  beforeEach(() => { process.env.KLEARU_TEXT_CMD = 'klearu classify'; });

  it('returns safe=true from JSON {safe:true}', async () => {
    spawnImpl = makeSpawn('{"label":"safe","score":0.99,"safe":true}');
    const v = await checkText('a nice post');
    expect(v.safe).toBe(true);
    expect(v.label).toBe('safe');
    expect(v.score).toBeCloseTo(0.99);
    expect(v.reason).toBe('klearu-json');
  });

  it('returns safe=false from JSON {safe:false}', async () => {
    spawnImpl = makeSpawn('{"label":"toxic","score":0.87,"safe":false}');
    const v = await checkText('bad content');
    expect(v.safe).toBe(false);
    expect(v.label).toBe('toxic');
    expect(v.score).toBeCloseTo(0.87);
  });

  it('uses blockLabels to decide safety when "safe" field absent in JSON', async () => {
    // Default block labels: unsafe,toxic,nsfw,spam
    spawnImpl = makeSpawn('{"label":"spam"}');
    const v = await checkText('buy now!');
    expect(v.safe).toBe(false);
    expect(v.label).toBe('spam');
  });

  it('uses blockLabels to decide safety for non-blocked label', async () => {
    spawnImpl = makeSpawn('{"label":"clean"}');
    const v = await checkText('good post');
    expect(v.safe).toBe(true);
    expect(v.label).toBe('clean');
  });

  it('returns fail-closed verdict on non-zero exit', async () => {
    spawnImpl = makeSpawn('', 1);
    const v = await checkText('test');
    expect(v.safe).toBe(false);
    expect(v.reason).toContain('fail-closed');
  });
});

describe('checkText — bare-label verdict via spawn', () => {
  beforeEach(() => { process.env.KLEARU_TEXT_CMD = 'klearu classify'; });

  it('returns safe=false when bare label is a block label', async () => {
    spawnImpl = makeSpawn('unsafe');
    const v = await checkText('bad');
    expect(v.safe).toBe(false);
    expect(v.reason).toBe('klearu-bare-label');
  });

  it('returns safe=true when bare label is not a block label', async () => {
    spawnImpl = makeSpawn('clean');
    const v = await checkText('good');
    expect(v.safe).toBe(true);
    expect(v.reason).toBe('klearu-bare-label');
  });

  it('respects custom KLEARU_BLOCK_LABELS env var', async () => {
    process.env.KLEARU_BLOCK_LABELS = 'bad,hate';
    spawnImpl = makeSpawn('hate');
    const v = await checkText('hateful content');
    expect(v.safe).toBe(false);
    // 'unsafe' is NOT in the custom list, so "clean" label from default wouldn't block
    spawnImpl = makeSpawn('unsafe');
    const v2 = await checkText('content');
    // 'unsafe' is not in 'bad,hate' → safe
    expect(v2.safe).toBe(true);
  });
});

describe('checkCast — early-exit on unsafe text', () => {
  beforeEach(() => { process.env.KLEARU_TEXT_CMD = 'klearu classify'; });

  it('returns text verdict (safe) when no images', async () => {
    spawnImpl = makeSpawn('{"label":"safe","safe":true}');
    const v = await checkCast({ text: 'good post' });
    expect(v.safe).toBe(true);
    expect(v.reason).toBe('klearu-json');
  });

  it('returns text verdict without checking images when text is unsafe', async () => {
    spawnImpl = makeSpawn('{"label":"nsfw","safe":false}');
    const v = await checkCast({ text: 'bad post', imagePaths: ['/tmp/img.png'] });
    // Image check never reached — text already blocked
    expect(v.safe).toBe(false);
    expect(v.label).toBe('nsfw');
  });
});
