import { describe, it, expect, vi } from 'vitest';
import {
  checkCapabilities,
  formatPreflightReport,
  hasCriticalFailure,
  runPreflight,
  CAPABILITIES,
  type Capability,
} from '../preflight';

const FULL_ENV: Record<string, string> = {
  ZOE_BOT_TOKEN: 't',
  ZAAL_TELEGRAM_ID: '1',
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'k',
  OPENROUTER_API_KEY: 'o',
  ZAAL_BOTZ_GROUP_ID: '-100',
};

describe('checkCapabilities', () => {
  it('reports all ok when every var is present', () => {
    const res = checkCapabilities(FULL_ENV);
    expect(res.every((r) => r.ok)).toBe(true);
    expect(res).toHaveLength(CAPABILITIES.length);
  });

  it('catches the real incident: missing Supabase creds disables the database capability', () => {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ...noDb } = FULL_ENV;
    const db = checkCapabilities(noDb).find((r) => r.name === 'database');
    expect(db?.ok).toBe(false);
    expect(db?.missing).toEqual(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
    expect(db?.severity).toBe('critical');
  });

  it('treats empty and whitespace-only values as missing', () => {
    const res = checkCapabilities({ ...FULL_ENV, OPENROUTER_API_KEY: '   ' });
    expect(res.find((r) => r.name === 'cheap-ai')?.ok).toBe(false);
  });

  it('reports only the vars actually absent, not the whole group', () => {
    const { SUPABASE_SERVICE_ROLE_KEY, ...partial } = FULL_ENV;
    expect(checkCapabilities(partial).find((r) => r.name === 'database')?.missing).toEqual([
      'SUPABASE_SERVICE_ROLE_KEY',
    ]);
  });

  it('accepts a custom capability list', () => {
    const caps: Capability[] = [{ name: 'x', requires: ['A'], impact: 'i', severity: 'degraded' }];
    expect(checkCapabilities({}, caps)).toEqual([
      { name: 'x', ok: false, missing: ['A'], impact: 'i', severity: 'degraded' },
    ]);
  });
});

describe('formatPreflightReport', () => {
  it('returns null on a clean boot (stay silent when healthy)', () => {
    expect(formatPreflightReport(checkCapabilities(FULL_ENV))).toBeNull();
  });

  it('names the missing vars and the impact so the fix is obvious', () => {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ...noDb } = FULL_ENV;
    const report = formatPreflightReport(checkCapabilities(noDb))!;
    expect(report).toContain('CRITICAL');
    expect(report).toContain('SUPABASE_URL');
    expect(report).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(report).toContain('fail silently');
  });

  it('separates critical from degraded', () => {
    const { OPENROUTER_API_KEY, ...noCheap } = FULL_ENV;
    const report = formatPreflightReport(checkCapabilities(noCheap))!;
    expect(report).toContain('DEGRADED');
    expect(report).not.toContain('CRITICAL');
  });
});

describe('hasCriticalFailure', () => {
  it('is false when only a degraded capability is missing', () => {
    const { ZAAL_BOTZ_GROUP_ID, ...noGroup } = FULL_ENV;
    expect(hasCriticalFailure(checkCapabilities(noGroup))).toBe(false);
  });
  it('is true when a critical capability is missing', () => {
    const { ZOE_BOT_TOKEN, ...noTg } = FULL_ENV;
    expect(hasCriticalFailure(checkCapabilities(noTg))).toBe(true);
  });
});

describe('runPreflight', () => {
  it('alerts once when something is missing', async () => {
    const alert = vi.fn(async (_report: string) => {});
    const { SUPABASE_URL, ...broken } = FULL_ENV;
    await runPreflight(alert, broken);
    expect(alert).toHaveBeenCalledOnce();
    expect(alert.mock.calls[0][0]).toContain('SUPABASE_URL');
  });

  it('stays silent on a healthy boot', async () => {
    const alert = vi.fn(async (_report: string) => {});
    await runPreflight(alert, FULL_ENV);
    expect(alert).not.toHaveBeenCalled();
  });

  it('never throws even if the alert channel fails', async () => {
    const alert = vi.fn(async () => {
      throw new Error('telegram down');
    });
    const { SUPABASE_URL, ...broken } = FULL_ENV;
    await expect(runPreflight(alert, broken)).resolves.toBeDefined();
  });

  it('works with no alert channel wired', async () => {
    const { SUPABASE_URL, ...broken } = FULL_ENV;
    await expect(runPreflight(undefined, broken)).resolves.toBeDefined();
  });
});
