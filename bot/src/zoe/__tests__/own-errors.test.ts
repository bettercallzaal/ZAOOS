import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildOwnErrorRow, isOpsFailure, redactForErrorRow, reportOwnError, resetOwnErrorCap, type OwnErrorRow, type OwnErrorStore } from '../own-errors';
import { installCrashGuard } from '../crash-guard';

// The remediation rail reads app_errors (cowork tracker project
// etwvzrmlxeobinrlytza; live columns read 2026-10-08 match
// scripts/2031-app-errors-remediation-rail.sql). Nothing in bot/ wrote to it.
// This feeds ZOE's own code failures in, deduped by stack_hash.

function fakeStore(existing: { id: string; count: number } | null = null) {
  const calls = { find: [] as string[], insert: [] as OwnErrorRow[], bump: [] as [string, number][] };
  const store: OwnErrorStore = {
    find: async (hash) => { calls.find.push(hash); return existing; },
    insert: async (row) => { calls.insert.push(row); return { conflict: false }; },
    bump: async (id, count) => { calls.bump.push([id, count]); },
  };
  return { store, calls };
}

const bug = () => {
  const e = new TypeError("Cannot read properties of undefined (reading 'title')");
  e.stack = "TypeError: Cannot read properties of undefined (reading 'title')\n    at renderCard (/home/zaal/zao-bot-live/bot/src/zoe/backlog-grill.ts:201:31)\n    at runBacklogGrillTick (/home/zaal/zao-bot-live/bot/src/zoe/backlog-grill-runner.ts:540:18)";
  return e;
};

beforeEach(() => resetOwnErrorCap());
afterEach(() => {
  delete process.env.ZOE_OWN_ERRORS_FEED;
});

describe('flag', () => {
  it('off: writes nothing', async () => {
    const { store, calls } = fakeStore();
    expect(await reportOwnError(bug(), 'test', { store })).toBe('off');
    expect(calls.find).toHaveLength(0);
    expect(calls.insert).toHaveLength(0);
  });
});

describe('a new code bug becomes one row', () => {
  it('inserts with repo zaoos, the source as route, status new', async () => {
    process.env.ZOE_OWN_ERRORS_FEED = '1';
    const { store, calls } = fakeStore();
    expect(await reportOwnError(bug(), 'uncaughtException', { store })).toBe('inserted');
    const row = calls.insert[0];
    expect(row).toMatchObject({ repo: 'zaoos', route: 'bot/zoe:uncaughtException', status: 'new' });
    expect(String(row.message)).toContain("Cannot read properties of undefined");
    expect(String(row.stack)).toContain('~/zao-bot-live/bot/src/zoe/backlog-grill.ts');
    expect(String(row.stack)).not.toContain('/home/zaal');
    expect(String(row.stack_hash)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('the same bug again bumps the count instead of adding a row', async () => {
    process.env.ZOE_OWN_ERRORS_FEED = '1';
    const { store, calls } = fakeStore({ id: 'row-1', count: 4 });
    expect(await reportOwnError(bug(), 'uncaughtException', { store })).toBe('bumped');
    expect(calls.insert).toHaveLength(0);
    expect(calls.bump).toEqual([['row-1', 5]]);
  });

  it('a race on the unique stack_hash index turns into a bump', async () => {
    process.env.ZOE_OWN_ERRORS_FEED = '1';
    let n = 0;
    const bumped: [string, number][] = [];
    const store: OwnErrorStore = {
      find: async () => (n++ === 0 ? null : { id: 'row-9', count: 1 }),
      insert: async () => ({ conflict: true }),
      bump: async (id, c) => { bumped.push([id, c]); },
    };
    expect(await reportOwnError(bug(), 'x', { store })).toBe('bumped');
    expect(bumped).toEqual([['row-9', 2]]);
  });

  it('same bug at different line numbers hashes the same', () => {
    const a = buildOwnErrorRow(bug(), 'x');
    const e = bug();
    e.stack = e.stack!.replace(':201:31', ':230:9');
    expect(buildOwnErrorRow(e, 'x').stack_hash).toBe(a.stack_hash);
  });
});

describe('operational failures are not code bugs and are skipped', () => {
  it.each([
    'claude CLI exited 1 [budget: error_max_budget_usd]',
    'OpenRouter API error 429: rate-limited upstream',
    'claude CLI timed out after 10000ms',
    'fetch failed: getaddrinfo ENOTFOUND api.telegram.org',
    'connect ECONNREFUSED 127.0.0.1:11434',
    'Request failed with status 503',
    'Not logged in. Please run /login',
  ])('%s', async (msg) => {
    process.env.ZOE_OWN_ERRORS_FEED = '1';
    expect(isOpsFailure(new Error(msg))).toBe(true);
    const { store, calls } = fakeStore();
    expect(await reportOwnError(new Error(msg), 'x', { store })).toBe('skipped-ops');
    expect(calls.find).toHaveLength(0);
  });

  it('a real TypeError is not an ops failure', () => {
    expect(isOpsFailure(bug())).toBe(false);
  });
});

describe('no secrets or PII in the row', () => {
  it('redacts tokens, keys, emails, long ids and home paths', () => {
    // Built at runtime so no token-shaped literal sits in the repo for the
    // secret scanners to (correctly) flag. None of these is a real credential.
    const tg = '1234' + '56789:' + 'AAHdqTcv' + 'X'.repeat(27);
    const ant = 'sk-' + 'ant-api03-' + 'a'.repeat(22);
    const gh = 'ghp' + '_' + 'abc' + 'd'.repeat(33);
    const jwt = 'eyJhbGci' + 'OiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl';
    const hex = '9f2b3c4d5e6f7a8b9c0d' + 'e'.repeat(20);
    const mail = 'someone' + '@' + 'example.org';
    const digits = '98765' + '43210';
    const chat = '-100' + digits;
    const t = redactForErrorRow(
      `bot ${tg} failed; ${ant}; ${gh}; ${jwt}; mail ${mail}; chat ${chat}; /Users/zaalpanthaki/x and /home/zaal/y; key ${hex}`,
    );
    for (const leak of ['AAHdqTcv', 'sk-ant-api03', 'ghp_abc', 'eyJhbGci', mail, digits, 'zaalpanthaki', '/home/zaal', '9f2b3c4d5e6f7a8b9c0d']) {
      expect(t).not.toContain(leak);
    }
    expect(t).toContain('[REDACTED]');
  });

  it('caps message and stack length', () => {
    const e = new Error('x'.repeat(5000));
    e.stack = 'Error\n' + '    at f (/a.ts:1:1)\n'.repeat(1000);
    const row = buildOwnErrorRow(e, 'x');
    expect(String(row.message).length).toBeLessThanOrEqual(500);
    expect(String(row.stack).length).toBeLessThanOrEqual(4000);
  });
});

describe('bounded: a crash loop cannot flood the table', () => {
  it('at most 10 reports per process per hour', async () => {
    process.env.ZOE_OWN_ERRORS_FEED = '1';
    const { store } = fakeStore();
    const out = [];
    for (let i = 0; i < 12; i++) out.push(await reportOwnError(bug(), 'x', { store, now: 1_000_000 + i }));
    expect(out.filter((o) => o === 'inserted')).toHaveLength(10);
    expect(out.slice(10)).toEqual(['capped', 'capped']);
  });

  it('a store that throws never throws out of reportOwnError', async () => {
    process.env.ZOE_OWN_ERRORS_FEED = '1';
    const store: OwnErrorStore = { find: async () => { throw new Error('db down'); }, insert: async () => ({ conflict: false }), bump: async () => {} };
    expect(await reportOwnError(bug(), 'x', { store })).toBe('failed');
  });
});

describe('crash guard feeds the crash before it exits', () => {
  it('uncaughtException: reports the error, alerts, then exits 1', async () => {
    const reportError = vi.fn(async () => 'inserted' as const);
    const fetchFn = vi.fn().mockResolvedValue({ ok: true });
    let exited: number | null = null;
    const done = new Promise<void>((resolve) => {
      const uninstall = installCrashGuard({ botToken: 't', zaalId: 1, fetchFn: fetchFn as never, reportError, onExit: (c) => { exited = c; uninstall(); resolve(); } });
      process.emit('uncaughtException', bug());
    });
    await done;
    expect(reportError).toHaveBeenCalledWith(expect.any(TypeError), 'uncaughtException');
    expect(fetchFn).toHaveBeenCalled();
    expect(exited).toBe(1);
  });

  it('a report that hangs does not hold the exit past its timeout', async () => {
    const reportError = vi.fn(() => new Promise<never>(() => {}));
    let exited: number | null = null;
    const t0 = Date.now();
    await new Promise<void>((resolve) => {
      const uninstall = installCrashGuard({ botToken: '', zaalId: 0, reportError, reportTimeoutMs: 50, onExit: (c) => { exited = c; uninstall(); resolve(); } });
      process.emit('uncaughtException', bug());
    });
    expect(exited).toBe(1);
    expect(Date.now() - t0).toBeLessThan(2000);
  });
});

// Follow-ups from dreamnet-54's review of #3802.
describe('(A) UUID-format keys and short bearer tokens are redacted', () => {
  // Built at runtime: none of these is a real credential.
  const uuidKey = ['8f3c2a1e', '4b6d', '4e2f', '9a1b', '0c3d5e7f9a2b'].join('-');
  const shortBearer = 'Bearer ' + 'abc' + '12345';
  it.each([
    ['a UUID-format API key', `neynar 401 with key ${uuidKey}`, uuidKey],
    ['a short bearer token', `request failed: Authorization: ${shortBearer}`, 'abc12345'],
    ['a token query parameter', 'GET https://api.example/x?token=' + 'q1w2e3' + '&page=2', 'q1w2e3'],
    ['an api_key query parameter', 'GET https://api.example/x?api_key=' + 'z9y8x7' + '&page=2', 'z9y8x7'],
  ])('%s', (_name, input, secret) => {
    const out = redactForErrorRow(input);
    expect(out).not.toContain(secret);
    expect(out).toContain('[REDACTED]');
  });
  it('file paths still survive', () => {
    expect(redactForErrorRow('at handler (~/zao-bot-live/bot/src/zoe/index.ts:10:5)')).toContain('~/zao-bot-live/bot/src/zoe/index.ts');
  });
});

describe('(C) a value that cannot be turned into a string never throws out of reportOwnError', () => {
  it('a null-prototype object', async () => {
    process.env.ZOE_OWN_ERRORS_FEED = '1';
    const weird = Object.create(null) as object;
    const { store } = fakeStore();
    await expect(reportOwnError(weird, 'x', { store })).resolves.toBe('failed');
  });
});
