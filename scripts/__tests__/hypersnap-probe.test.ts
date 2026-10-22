// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildRows, type Fetcher, judge, parseArgs, runProbe } from '../hypersnap-probe';

const row = { label: 'profile', path: '/v2/farcaster/user/bulk?fids=3', key: 'users' };

/** A fetcher answering from a path -> [status, body] table; no network, no fetch mock. */
function tableFetcher(table: Record<string, [number, string]>): Fetcher {
  return async (url) => {
    const path = url.replace('https://node.example', '');
    const hit = table[path];
    if (!hit) throw new Error(`no route ${path}`);
    return { status: hit[0], text: async () => hit[1] };
  };
}

const INFO = JSON.stringify({ version: '0.14.1', numShards: 2 });

describe('judge', () => {
  it.each([
    [200, '{"users":[{"fid":3}]}', 'PASS'],
    [200, '{"users":[]}', 'EMPTY'],
    [200, '{"next":{}}', 'FAIL'],
    [200, 'Not Found', 'FAIL'],
    [404, 'Not Found', 'FAIL'],
    [200, '{"users":"x"}', 'FAIL'],
  ])('status %i body %s -> %s', (status, body, verdict) => {
    expect(judge(row, status, body).verdict).toBe(verdict);
  });

  it('reads the nested list in a cast/search result', () => {
    const r = { label: 'search casts', path: '/x', key: 'result' };
    expect(judge(r, 200, '{"result":{"casts":[{"hash":"0x1"}]}}').verdict).toBe('PASS');
    expect(judge(r, 200, '{"result":{"casts":[]}}').verdict).toBe('EMPTY');
  });
});

describe('runProbe', () => {
  it('exits 2 when /v1/info cannot be reached', async () => {
    const report = await runProbe('https://node.example', 3, tableFetcher({}));
    expect(report.exitCode).toBe(2);
    expect(report.lines.at(-1)).toMatch(/^CANNOT RUN: \/v1\/info unreachable/);
  });

  it.each(['null', '42', '"text"'])('exits 2 when /v1/info is the JSON %s', async (body) => {
    const report = await runProbe(
      'https://node.example',
      3,
      tableFetcher({ '/v1/info': [200, body] }),
    );
    expect(report.exitCode).toBe(2);
  });

  it('exits 2 when /v1/info is not a hub answer', async () => {
    const report = await runProbe(
      'https://node.example',
      3,
      tableFetcher({ '/v1/info': [200, '{}'] }),
    );
    expect(report.exitCode).toBe(2);
  });

  it('exits 0 when every row passes or is empty, and prints one line per row', async () => {
    const table: Record<string, [number, string]> = { '/v1/info': [200, INFO] };
    for (const r of buildRows(3)) table[r.path] = [200, JSON.stringify({ [r.key]: [{}] })];
    table['/v2/farcaster/topic/trending?limit=1'] = [200, '{"topics":[]}'];

    const report = await runProbe('https://node.example', 3, tableFetcher(table));
    expect(report.exitCode).toBe(0);
    expect(report.lines).toContain('/v1/info version=0.14.1 numShards=2');
    expect(report.lines.at(-1)).toBe(
      `PASS ${buildRows(3).length - 1}, EMPTY 1, FAIL 0 of ${buildRows(3).length}`,
    );
  });

  it('exits 1 when a row 404s or throws', async () => {
    const table: Record<string, [number, string]> = { '/v1/info': [200, INFO] };
    for (const r of buildRows(3)) table[r.path] = [200, JSON.stringify({ [r.key]: [{}] })];
    table['/v2/farcaster/user/best_friends?fid=3&limit=1'] = [404, 'Not Found'];
    delete table['/v2/farcaster/topic/trending?limit=1'];

    const report = await runProbe('https://node.example', 3, tableFetcher(table));
    expect(report.exitCode).toBe(1);
    expect(report.lines.at(-1)).toMatch(/FAIL 2 of/);
  });
});

describe('parseArgs', () => {
  it('defaults to haatz and fid 3', () => {
    expect(parseArgs([])).toEqual({ base: 'https://haatz.quilibrium.com', fid: 3 });
  });

  it('strips a trailing slash from --base', () => {
    expect(parseArgs(['--base', 'http://node.local:3381/', '--fid', '19'])).toEqual({
      base: 'http://node.local:3381',
      fid: 19,
    });
  });

  it.each([[['--fid', 'abc']], [['--base', 'node.local']], [['--write']]])('refuses %j', (argv) => {
    expect(typeof parseArgs(argv)).toBe('string');
  });
});
