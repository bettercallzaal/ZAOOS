/**
 * scripts/hypersnap-probe.ts
 *
 * Read-only probe of a Hypersnap (or any Neynar-shaped) read base: GETs /v1/info
 * and one call per ZAO user action in doc 2418 D4, and prints status plus a
 * content check per row. Doc 2418 D6 PR 4.
 *
 * Read-only by construction: GET only, no API key, no body, no env read.
 *
 * Run:  npx tsx scripts/hypersnap-probe.ts [--base https://haatz.quilibrium.com] [--fid 3]
 * Exit: 0 every row PASS or EMPTY, 1 a row FAILED, 2 cannot run (bad args, or /v1/info unreachable).
 */

export type Verdict = 'PASS' | 'EMPTY' | 'FAIL';

export interface Row {
  label: string;
  path: string;
  /** The top-level key the body must carry; its value must be a non-empty array to PASS. */
  key: string;
}

export interface RowResult {
  row: Row;
  status: number | null;
  verdict: Verdict;
  detail: string;
}

export type Fetcher = (url: string) => Promise<{ status: number; text: () => Promise<string> }>;

export const DEFAULT_BASE = 'https://haatz.quilibrium.com';

export function buildRows(fid: number): Row[] {
  return [
    { label: 'trending feed', path: '/v2/farcaster/feed/trending?limit=1', key: 'casts' },
    {
      label: 'ZAO channel feed',
      path: '/v2/farcaster/feed/channels?channel_ids=zao&limit=1',
      key: 'casts',
    },
    {
      label: 'following feed',
      path: `/v2/farcaster/feed/following?fid=${fid}&limit=1`,
      key: 'casts',
    },
    { label: 'profile', path: `/v2/farcaster/user/bulk?fids=${fid}`, key: 'users' },
    {
      label: 'profile casts',
      path: `/v2/farcaster/feed/user/casts?fid=${fid}&limit=1`,
      key: 'casts',
    },
    { label: 'followers', path: `/v2/farcaster/followers?fid=${fid}&limit=1`, key: 'users' },
    {
      label: 'notifications',
      path: `/v2/farcaster/notifications?fid=${fid}&limit=1`,
      key: 'notifications',
    },
    { label: 'search people', path: '/v2/farcaster/user/search?q=zao&limit=1', key: 'users' },
    { label: 'search casts', path: '/v2/farcaster/cast/search?q=zao&limit=1', key: 'result' },
    {
      label: 'best friends',
      path: `/v2/farcaster/user/best_friends?fid=${fid}&limit=1`,
      key: 'users',
    },
    { label: 'trending topics', path: '/v2/farcaster/topic/trending?limit=1', key: 'topics' },
    {
      label: 'follow suggestions',
      path: `/v2/farcaster/following/suggested?fid=${fid}&limit=1`,
      key: 'users',
    },
  ];
}

/** Judge one response body. A 200 alone is not a PASS: the key must hold a non-empty array. */
export function judge(row: Row, status: number, body: string): RowResult {
  if (status !== 200) {
    return { row, status, verdict: 'FAIL', detail: `HTTP ${status}` };
  }
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return { row, status, verdict: 'FAIL', detail: 'body is not JSON' };
  }
  if (typeof data !== 'object' || data === null || !(row.key in data)) {
    return { row, status, verdict: 'FAIL', detail: `no "${row.key}" key` };
  }
  let value = (data as Record<string, unknown>)[row.key];
  // cast/search nests its list: { result: { casts: [...] } }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const inner = Object.values(value).find(Array.isArray);
    if (inner) value = inner;
  }
  if (!Array.isArray(value)) {
    return { row, status, verdict: 'FAIL', detail: `"${row.key}" is not a list` };
  }
  if (value.length === 0) {
    return { row, status, verdict: 'EMPTY', detail: `"${row.key}" is an empty list` };
  }
  return { row, status, verdict: 'PASS', detail: `"${row.key}" has ${value.length}` };
}

export async function probeRow(base: string, row: Row, fetcher: Fetcher): Promise<RowResult> {
  try {
    const res = await fetcher(`${base}${row.path}`);
    return judge(row, res.status, await res.text());
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    return { row, status: null, verdict: 'FAIL', detail: `request threw (${reason})` };
  }
}

export interface ProbeReport {
  exitCode: 0 | 1 | 2;
  lines: string[];
}

export async function runProbe(base: string, fid: number, fetcher: Fetcher): Promise<ProbeReport> {
  const lines: string[] = [`hypersnap-probe base=${base} fid=${fid}`];
  let info: { version?: unknown; numShards?: unknown };
  try {
    const res = await fetcher(`${base}/v1/info`);
    if (res.status !== 200) {
      lines.push(`CANNOT RUN: /v1/info answered HTTP ${res.status}`);
      return { exitCode: 2, lines };
    }
    info = JSON.parse(await res.text());
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    lines.push(`CANNOT RUN: /v1/info unreachable or not JSON (${reason})`);
    return { exitCode: 2, lines };
  }
  if (info.version === undefined) {
    lines.push('CANNOT RUN: /v1/info has no "version" key, so this is not a hub');
    return { exitCode: 2, lines };
  }
  lines.push(`/v1/info version=${String(info.version)} numShards=${String(info.numShards)}`);
  lines.push('| row | path | status | verdict | detail |', '|---|---|---|---|---|');

  const results: RowResult[] = [];
  for (const row of buildRows(fid)) {
    const r = await probeRow(base, row, fetcher);
    results.push(r);
    lines.push(
      `| ${row.label} | \`${row.path}\` | ${r.status ?? '-'} | ${r.verdict} | ${r.detail} |`,
    );
  }
  const count = (v: Verdict) => results.filter((r) => r.verdict === v).length;
  lines.push(
    `PASS ${count('PASS')}, EMPTY ${count('EMPTY')}, FAIL ${count('FAIL')} of ${results.length}`,
  );
  return { exitCode: count('FAIL') > 0 ? 1 : 0, lines };
}

export function parseArgs(argv: string[]): { base: string; fid: number } | string {
  let base = DEFAULT_BASE;
  let fid = 3;
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === '--base' && value) {
      base = value.replace(/\/+$/, '');
      i += 1;
    } else if (flag === '--fid' && value && /^\d+$/.test(value)) {
      fid = Number(value);
      i += 1;
    } else {
      return `unknown or incomplete argument: ${flag}`;
    }
  }
  if (!/^https?:\/\//.test(base)) return `--base must start with http:// or https://, got ${base}`;
  return { base, fid };
}

const isMain = process.argv[1]?.endsWith('hypersnap-probe.ts');
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  if (typeof args === 'string') {
    console.error(`CANNOT RUN: ${args}`);
    process.exit(2);
  }
  const fetcher: Fetcher = (url) => fetch(url, { signal: AbortSignal.timeout(20000) });
  runProbe(args.base, args.fid, fetcher).then((report) => {
    for (const line of report.lines) console.log(line);
    process.exit(report.exitCode);
  });
}
