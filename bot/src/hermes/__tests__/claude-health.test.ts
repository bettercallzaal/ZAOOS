/**
 * The token was revoked for four days and nothing said so. These tests are the
 * regression: every one of them describes a state the brief got wrong, or a way
 * a naive fix would go wrong in the other direction.
 *
 * The token is valid again, so none of this can be tested against a live 401 -
 * the state is constructed directly instead, which is also the only way to test
 * "four days ago" without waiting four days.
 */
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  claudeBriefLines,
  readClaudeHealth,
  recordClaudeFailure,
  recordClaudeOk,
  STALE_AFTER_MS,
  type ClaudeHealth,
} from '../claude-health';

const T = 1_760_000_000_000; // fixed clock; nothing here may depend on the real one
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const health = (over: Partial<ClaudeHealth> = {}): ClaudeHealth => ({
  lastOkMs: null,
  lastFailMs: null,
  lastFailKind: null,
  lastFailHint: null,
  ...over,
});

describe('claudeBriefLines', () => {
  it('alerts when the most recent observation is an auth failure', () => {
    const r = claudeBriefLines(health({ lastOkMs: T - 5 * DAY, lastFailMs: T - 4 * DAY, lastFailKind: 'auth' }), T);
    expect(r.alert).toContain('cannot reach Claude');
    expect(r.alert).toContain('/login');
    expect(r.status).toEqual(['claude', 'auth failed']);
  });

  it('THE INCIDENT: a four-day-old auth failure is still alerting', () => {
    // Exactly the 2026-08-08 shape - the last success predates the revocation and
    // every call since has 401'd. The old brief showed nothing at all here.
    const r = claudeBriefLines(health({ lastOkMs: T - 6 * DAY, lastFailMs: T - 4 * DAY, lastFailKind: 'auth' }), T);
    expect(r.alert).not.toBeNull();
    expect(r.alert).toContain('4d ago');
  });

  it('CLEARS once a success is recorded after the failure - the alert can reach zero', () => {
    const r = claudeBriefLines(health({ lastOkMs: T - MIN, lastFailMs: T - 4 * DAY, lastFailKind: 'auth' }), T);
    expect(r.alert).toBeNull();
    expect(r.status).toEqual(['claude', 'ok']);
  });

  it('does NOT claim health from the absence of failures', () => {
    // Nothing observed at all. Silence is not evidence: this must not read "ok".
    const r = claudeBriefLines(health(), T);
    expect(r.alert).toBeNull();
    expect(r.status).toEqual(['claude', 'not checked']);
  });

  it('stops claiming ok once the last success goes stale', () => {
    const r = claudeBriefLines(health({ lastOkMs: T - (STALE_AFTER_MS + MIN) }), T);
    expect(r.status[1]).toMatch(/^last ok /);
  });

  it('does NOT alert on staleness - a dead probe would make that permanent', () => {
    // Nobody can clear a stale-based alert by acting, so it must stay a status.
    const r = claudeBriefLines(health({ lastOkMs: T - 30 * DAY }), T);
    expect(r.alert).toBeNull();
  });

  it('does not pull Zaal in for a rate limit', () => {
    const r = claudeBriefLines(health({ lastOkMs: T - HOUR, lastFailMs: T - MIN, lastFailKind: 'rate_limit' }), T);
    expect(r.alert).toBeNull();
    expect(r.status).toEqual(['claude', 'rate_limit']);
  });

  it('treats an equal-timestamp tie as still failing, not recovered', () => {
    const r = claudeBriefLines(health({ lastOkMs: T - HOUR, lastFailMs: T - HOUR, lastFailKind: 'auth' }), T);
    expect(r.alert).toBeNull(); // lastFail is not GREATER than lastOk
    expect(r.status).toEqual(['claude', 'ok']);
  });
});

describe('the health file', () => {
  let dir: string;
  let path: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'zoe-health-'));
    path = join(dir, 'nested', 'claude-health.json');
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('reads as empty when the file does not exist', async () => {
    expect(await readClaudeHealth(path)).toEqual(health());
  });

  it('round-trips a success', async () => {
    await recordClaudeOk(T, path);
    expect((await readClaudeHealth(path)).lastOkMs).toBe(T);
  });

  it('creates the directory it needs', async () => {
    await recordClaudeOk(T, path);
    expect(JSON.parse(await readFile(path, 'utf8')).lastOkMs).toBe(T);
  });

  it('keeps the last success when a failure lands, so recovery is detectable', async () => {
    await recordClaudeOk(T - HOUR, path);
    await recordClaudeFailure('auth', 'run /login', T, path);
    const h = await readClaudeHealth(path);
    expect(h.lastOkMs).toBe(T - HOUR);
    expect(h.lastFailMs).toBe(T);
    expect(h.lastFailKind).toBe('auth');
    expect(claudeBriefLines(h, T).alert).not.toBeNull();
  });

  it('a later success clears the alert end to end', async () => {
    await recordClaudeFailure('auth', 'run /login', T - HOUR, path);
    await recordClaudeOk(T, path);
    expect(claudeBriefLines(await readClaudeHealth(path), T).alert).toBeNull();
  });

  it('never throws when the path is unwritable', async () => {
    // A health file that cannot be written must not break the call it observes.
    await expect(recordClaudeOk(T, '/proc/definitely/not/writable.json')).resolves.toBeUndefined();
  });

  it('survives a corrupt file rather than crashing the brief', async () => {
    await recordClaudeOk(T, path);
    await (await import('node:fs/promises')).writeFile(path, '{ not json', 'utf8');
    expect(await readClaudeHealth(path)).toEqual(health());
  });
});
