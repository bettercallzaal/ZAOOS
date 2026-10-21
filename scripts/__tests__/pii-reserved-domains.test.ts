/**
 * Card 10451: the PII pre-commit hook blocked test@example.invalid in a test
 * fixture on 2026-10-16. Domains reserved for documentation and tests
 * (RFC 2606, RFC 6761) cannot hold a real mailbox, so scripts/git-pii-scan.py
 * now passes them. A real address, and a look-alike of a reserved domain,
 * must still block: that half is the control.
 *
 * vitest, not test_git_pii_scan.py, because that suite runs in no workflow
 * (see pii-scan-merge.test.ts); scripts/**\/*.test.ts is in the vitest include.
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SCANNER = resolve(__dirname, '..', 'git-pii-scan.py');

function emailHits(addrs: string[]): Record<string, boolean> {
  const code = [
    'import importlib.util, json, sys',
    `s = importlib.util.spec_from_file_location("pii", ${JSON.stringify(SCANNER)})`,
    'm = importlib.util.module_from_spec(s); s.loader.exec_module(m)',
    'addrs = json.loads(sys.argv[1])',
    'print(json.dumps({a: any(k == "email" for k, *_ in m.scan([("t.ts", "mail " + a)])) for a in addrs}))',
  ].join('\n');
  const r = spawnSync('python3', ['-c', code, JSON.stringify(addrs)], { encoding: 'utf8', timeout: 30_000 });
  expect(r.status, r.stderr).toBe(0);
  return JSON.parse(r.stdout);
}

describe('git-pii-scan: reserved test domains (card 10451)', () => {
  it('passes addresses at reserved domains and TLDs', () => {
    const got = emailHits([
      'test@example.invalid', 'a@example.com', 'b@example.org', 'c@example.net',
      'd@mail.example.com', 'e@foo.test', 'f@x.example', 'g@host.localhost',
    ]);
    for (const [addr, hit] of Object.entries(got)) expect(hit, addr).toBe(false);
  });

  it('still blocks a real address and every look-alike of a reserved domain', () => {
    const got = emailHits([
      'jane.doe@somecompany.co.uk', 'x@example.co.uk', 'y@myexample.com',
      'z@example.com.evil.io', 'w@invalid.io', 'v@testing.dev',
    ]);
    for (const [addr, hit] of Object.entries(got)) expect(hit, addr).toBe(true);
  });
});
