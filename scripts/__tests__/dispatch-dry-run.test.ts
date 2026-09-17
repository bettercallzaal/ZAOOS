/**
 * dispatch-dry-run: strict readiness checks, and no path that writes.
 *
 * Fixtures are shaped like real `tasks` rows (the fields and metadata keys the
 * live board returned on 2026-09-17), not bare objects, so a check that reads
 * the wrong key cannot pass by accident.
 */
import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error - plain .mjs so it runs with bare node on any host
import { assess, dryRun, fieldGaps, getJson, render, CHECKS, FIX } from '../autopilot/dispatch-dry-run.mjs';

type Card = Record<string, unknown>;

function card(over: Card = {}, meta: Card = {}): Card {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    legacy_id: '9999',
    title: 'Add a TTL to fleet_status rows so stale working claims expire',
    notes:
      'fleet_status keeps rows that say working for weeks. Add a TTL column and a sweep.\nDone when: a row older than 24h reads stale in the board and a test proves it.',
    archived_at: null,
    updated_at: '2026-09-10T00:00:00Z',
    metadata: { route: 'agent', next_owner: 'agent', repo: 'bettercallzaal/ZAOOS', why: 'stale claims', ...meta },
    ...over,
  };
}

describe('assess', () => {
  it('takes a card that passes every check, and says what it would do', () => {
    const r = assess(card());
    expect(r.take).toBe(true);
    expect(r.action.join('\n')).toContain('bettercallzaal/ZAOOS');
    expect(r.action.join('\n')).toContain('zao-tracker ready 9999');
  });

  it.each([
    ['not-archived', card({ archived_at: '2026-08-04T00:00:00Z' }, { archived_reason: 'no body/owner' })],
    ['agent-owned', card({}, { next_owner: 'review' })],
    ['agent-owned', card({}, { next_owner: undefined })],
    ['has-repo', card({}, { repo: undefined })],
    ['has-repo', card({}, { repo: 'ZAOOS' })],
    ['has-done-when', card({ notes: 'fleet_status keeps rows that say working for weeks. Add a TTL column and a periodic sweep job to it.' })],
    ['has-brief', card({ notes: 'Done when: fixed.' })],
    ['no-one-way-door', card({ title: 'Email Iman the bounty terms' })],
    ['no-one-way-door', card({ notes: 'Add the column, then deploy to prod.\nDone when: live.' })],
  ])('skips on %s', (check, c) => {
    const r = assess(c);
    expect(r.take).toBe(false);
    expect(r.failures.map((f: { id: string }) => f.id)).toContain(check);
  });

  it('done_when in metadata counts as well as a notes line', () => {
    expect(assess(card({ notes: 'fleet_status keeps rows that say working for weeks. Add a TTL column and a periodic sweep job.' }, { done_when: 'stale rows read stale' })).take).toBe(true);
  });

  it('reports every failing check, first one as the reason', () => {
    const r = assess(card({ archived_at: '2026-08-04T00:00:00Z', notes: '' }, { next_owner: 'review', repo: undefined }));
    expect(r.check).toBe('not-archived');
    expect(r.failures.length).toBeGreaterThanOrEqual(4);
  });
});

describe('dryRun and render', () => {
  it('counts first-stop and any-fail per check, and lists near misses', () => {
    const result = dryRun([card(), card({ legacy_id: '1' }, { repo: undefined }), card({ archived_at: '2026-08-04' })]);
    expect(result.take).toBe(1);
    expect(result.byCheck['has-repo']).toBe(1);
    const text = render(result);
    expect(text).toMatch(/^DRY RUN - nothing was claimed, written or spawned\. 3 /);
    expect(text).toContain('WOULD TAKE 1. WOULD SKIP 2.');
    expect(text).toContain('Near misses - one check from being taken: 2');
    expect(text).toContain('needs: set metadata.repo to owner/name');
  });

  it('field gaps count live cards only, most common first, archived listed apart', () => {
    const lines = fieldGaps(
      dryRun([
        card({}, { repo: undefined }),
        card({ notes: 'short' }, { repo: undefined }),
        card({ archived_at: '2026-08-04' }, { repo: undefined }),
      ]),
    );
    expect(lines[0]).toContain('2 live cards');
    expect(lines[1]).toMatch(/^\s+2\s+has-repo/);
    expect(lines.at(-1)).toContain('plus 1 archived');
  });

  it('every check has a fix a person can do', () => {
    for (const [id] of CHECKS) expect(FIX[id]).toBeTruthy();
  });

  it('every check in the table appears in the report, even at zero', () => {
    const text = render(dryRun([card()]));
    for (const [id] of CHECKS) expect(text).toContain(id);
  });
});

describe('read-only by construction', () => {
  it('getJson issues GET and puts the key on stdin, never in argv', () => {
    const run = vi.fn(() => ({ status: 0, stdout: '[]', stderr: '' }));
    getJson('https://example.supabase.co/rest/v1/tasks?select=id', 'not-a-real-key', run);
    const [bin, args, opts] = run.mock.calls[0] as unknown as [string, string[], { input: string }];
    expect(bin).toBe('curl');
    expect(args.slice(args.indexOf('-X'), args.indexOf('-X') + 2)).toEqual(['-X', 'GET']);
    expect(args.join(' ')).not.toContain('not-a-real-key');
    expect(opts.input).toContain('not-a-real-key');
  });

  it('a failed GET throws instead of reading as an empty board', () => {
    const run = vi.fn(() => ({ status: 22, stdout: '', stderr: 'The requested URL returned error: 401' }));
    expect(() => getJson('https://x', 'k', run)).toThrow(/GET failed/);
  });
});
