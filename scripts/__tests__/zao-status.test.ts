import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// 2026-10-08 08:10 EDT: a routine deploy notice tagged Zaal because the merged doc's
// title contained "approve". zao-status is now tracked here; these run its real
// decision with ZAO_STATUS_DRY_RUN=1, which prints and sends nothing.
const script = path.resolve(__dirname, '../zao-status');
const run = (msg: string, env: Record<string, string> = {}) =>
  execFileSync('bash', [script, msg], {
    env: { ...process.env, ...env, ZAO_STATUS_DRY_RUN: '1' },
    encoding: 'utf8',
  }).trim();
const TAG = '@' + 'bettercallzaal';
const OK_0810 = 'autodeploy OK: ZOE live on d349d245 - doc 2642: how ZAO holders can approve a ZIP';

describe('zao-status tagging', () => {
  it('red control: the old rule alone tags the 08:10 OK notice', () => {
    expect(
      /\b(ALERT|BLOCKED|needs a human|DECISION NEEDED|action required|FAILED|URGENT|needs you|approve|awaiting)\b/i.test(
        OK_0810,
      ),
    ).toBe(true);
  });
  it('the 08:10 OK notice no longer tags', () => {
    expect(run(OK_0810)).toBe(OK_0810);
  });
  it('a real alarm still tags', () => {
    expect(run('autodeploy BLOCKED: origin/main FAILS boot-verify')).toBe(
      `${TAG} autodeploy BLOCKED: origin/main FAILS boot-verify`,
    );
    // A crash rollback is exactly the alarm. It did not tag before 2026-10-08,
    // because "ROLLED BACK" was not on the list (seat ruling, same day).
    expect(run('autodeploy ROLLED BACK: new code crashed at boot')).toBe(
      `${TAG} autodeploy ROLLED BACK: new code crashed at boot`,
    );
  });
  it('ZAO_STATUS_NO_TAG=1 never tags', () => {
    expect(run('ALERT: disk full', { ZAO_STATUS_NO_TAG: '1' })).toBe('ALERT: disk full');
  });
  it('an OK line with no alarm word is unchanged', () => {
    expect(run('autodeploy OK: ZOE live on 363fc12e - doc 2641')).toBe(
      'autodeploy OK: ZOE live on 363fc12e - doc 2641',
    );
  });
});
