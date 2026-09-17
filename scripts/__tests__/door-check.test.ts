/**
 * door-check: the one-way door list is data, and every verdict is recorded.
 *
 * Red controls run against DIFFERENT artifacts from the ones under test: a copy
 * of doors.json with one door removed (the verdict must flip, which is what
 * "the list is data" means), and an unwritable log path (no verdict may be
 * given). DOOR_CHECK_DOORS points the whole suite at another door list:
 *   DOOR_CHECK_DOORS=/path/to/doors.json npx vitest run scripts/__tests__/door-check.test.ts
 */
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error - plain .mjs so it runs with bare node on the VPS and the Pi
import { classify, loadDoors, main } from '../autopilot/door-check.mjs';

const DOORS = process.env.DOOR_CHECK_DOORS ?? join(__dirname, '..', 'autopilot', 'doors.json');
const list = loadDoors(DOORS);

const cmd = (c: string) => classify({ commands: [c] }, list);
const path = (p: string) => classify({ paths: [p] }, list);
const tool = (t: string, recipient?: string) => classify({ tools: [t], recipient }, list);

describe('one-way doors stop', () => {
  it.each([
    ['money', 'cast send 0xabc "transfer(address,uint256)" --private-key $K'],
    ['outbound', 'curl -s https://api.telegram.org/bot$T/sendMessage -d text=hi'],
    ['deploy', 'gh pr merge 3538 --squash'],
    ['deploy', 'git push origin main'],
    ['deploy', 'vercel deploy --prod'],
    ['deploy', 'systemctl --user restart zoe-bot'],
    ['migration', 'supabase db push'],
    ['delete', 'rm -rf node_modules'],
    ['delete', 'git push --force origin antigravity/x'],
    ['delete', 'git branch -D old'],
    ['settings', 'gh secret set OPENROUTER_API_KEY'],
  ])('%s: %s', (door, command) => {
    const r = cmd(command);
    expect(r.verdict).toBe('one_way');
    expect(r.doors.map((d: { id: string }) => d.id)).toContain(door);
  });

  it.each([
    ['settings', '.env.local'],
    ['settings', '.claude/settings.json'],
    ['identity', 'agents/ceo/SOUL.md'],
    ['identity', 'agents/DOCTRINE.md'],
    ['identity', 'community.config.ts'],
    ['identity', 'bot/systemd/new-loop.timer'],
  ])('%s: writing %s', (door, p) => {
    const r = path(p);
    expect(r.verdict).toBe('one_way');
    expect(r.doors[0].id).toBe(door);
  });

  it('outbound tools stop', () => {
    expect(tool('mcp__claude_ai_Gmail__send_message', 'a stranger').verdict).toBe('one_way');
    expect(tool('mcp__claude_ai_Slack__slack_send_message').verdict).toBe('one_way');
  });

  it('an exemption for one segment of a compound command does not cover the rest', () => {
    expect(cmd('rm -rf ~/zao-vault && rm -rf "$TMPDIR/x"').verdict).toBe('one_way');
    expect(cmd('npx vitest run; git push origin main').verdict).toBe('one_way');
  });

  it('an action with no declared facts is not classifiable and stops', () => {
    expect(classify({}, list).verdict).toBe('one_way');
  });
});

describe('two-way doors proceed', () => {
  it.each([
    'gh pr create --base main --title x',
    'git push -u origin antigravity/3-door-check',
    'git push origin fix/main-thing',
    'npx vitest run',
    'rm -rf "$TMPDIR/scratch"',
    'rm -rf /tmp/agtest',
  ])('%s', (command) => {
    expect(cmd(command).verdict).toBe('two_way');
  });

  it('writing a migration FILE is reviewable; applying it is not', () => {
    expect(path('bot/migrations/hermes_runs.sql').verdict).toBe('two_way');
    expect(cmd('psql "$URL" -f bot/migrations/hermes_runs.sql').verdict).toBe('one_way');
  });

  it('a Gmail draft is not a send', () => {
    expect(tool('mcp__claude_ai_Gmail__create_draft', 'anyone').verdict).toBe('two_way');
  });
});

describe('standing grants are data too', () => {
  it('email to Venus is opened by the decision file', () => {
    const r = tool('mcp__claude_ai_Gmail__send_message', 'Venus (Artizen)');
    expect(r.verdict).toBe('two_way');
    expect(r.grant.decision).toContain('autopilot-may-email-venus-only');
  });
  it('the grant does not stretch to another recipient, a forward, or a second channel', () => {
    expect(tool('mcp__claude_ai_Gmail__send_message', 'Iman').verdict).toBe('one_way');
    expect(tool('mcp__claude_ai_Gmail__forward', 'Venus').verdict).toBe('one_way');
    const both = classify(
      { tools: ['mcp__claude_ai_Gmail__send_message'], commands: ['curl https://api.telegram.org/bot$T/sendMessage'], recipient: 'Venus' },
      list,
    );
    expect(both.verdict).toBe('one_way');
  });
});

describe('the list is data, not code judgement (red control on a different artifact)', () => {
  it('removing a door from the JSON flips its verdict, with no code change', () => {
    const dir = mkdtempSync(join(tmpdir(), 'doors-'));
    const raw = JSON.parse(readFileSync(DOORS, 'utf8'));
    raw.doors = raw.doors.filter((d: { id: string }) => d.id !== 'migration');
    const without = join(dir, 'doors.json');
    writeFileSync(without, JSON.stringify(raw));
    expect(cmd('supabase db push').verdict).toBe('one_way');
    expect(classify({ commands: ['supabase db push'] }, loadDoors(without)).verdict).toBe('two_way');
  });
});

describe('every verdict is recorded before it is given', () => {
  const dir = mkdtempSync(join(tmpdir(), 'door-log-'));
  const base = ['--lane', 'antigravity', '--summary', 'apply hermes_runs', '--why', 'the runner needs it', '--doors', DOORS];
  afterEach(() => vi.restoreAllMocks());

  it('writes one line with what, why, verdict and the matching pattern', () => {
    const log = join(dir, 'a.jsonl');
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const code = main([...base, '--command', 'supabase db push', '--log', log], {}, new Date('2026-09-17T12:00:00Z'));
    expect(code).toBe(3);
    const line = JSON.parse(readFileSync(log, 'utf8').trim());
    expect(line).toMatchObject({ ts: '2026-09-17T12:00:00.000Z', lane: 'antigravity', why: 'the runner needs it', verdict: 'one_way' });
    expect(line.doors[0]).toMatchObject({ id: 'migration', match: { kind: 'command', value: 'supabase db push' } });
  });

  it('a two-way verdict is recorded too, not only escalations', () => {
    const log = join(dir, 'b.jsonl');
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    expect(main([...base, '--command', 'gh pr create', '--log', log])).toBe(0);
    expect(JSON.parse(readFileSync(log, 'utf8').trim()).verdict).toBe('two_way');
  });

  it('an unwritable log gives no verdict at all', () => {
    const out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const blocker = join(dir, 'file');
    writeFileSync(blocker, '');
    expect(main([...base, '--command', 'gh pr create', '--log', join(blocker, 'under-a-file.jsonl')])).toBe(2);
    expect(out).not.toHaveBeenCalled();
  });

  it('refuses a decision without a why', () => {
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    expect(main(['--lane', 'x', '--summary', 's', '--command', 'gh pr create', '--log', join(dir, 'c.jsonl')])).toBe(2);
  });
});
