/**
 * scripts/zoe/nightly-check.mjs against the night that failed: ZAOOS #4034,
 * opened 2026-10-19T03:07:54Z, which is 23:07 EDT on Sunday 18 October. It
 * added 2026-10-19-captures.md and 2026-10-20-briefing.md, both one day ahead,
 * for a night main already held as 2026-10-18-captures.md (#4005). The fixed
 * clock is that instant; the file names are the ones it really added.
 */
import { describe, expect, it } from 'vitest';
import { checkNightly } from '../zoe/nightly-check.mjs';

const RUN_4034 = '2026-10-19T03:07:54Z'; // 23:07 EDT, Sunday 18 October
const CLEAN = '# Briefing\n\n- One thing - done.\n';
const onMain = new Set(['docs/daily/2026-10-18-captures.md', 'docs/daily/2026-10-19-briefing.md']);
const EM = String.fromCharCode(0x2014); // an em dash, kept out of the source
const kinds = (ps: { kind: string }[]) => ps.map((p) => p.kind);

describe('checkNightly: the gate a nightly PR has to pass', () => {
  it("#4034 as opened: tomorrow's dates and a night already on main both fail", () => {
    const problems = checkNightly({
      added: [
        { path: 'docs/daily/2026-10-19-captures.md', content: CLEAN },
        { path: 'docs/daily/2026-10-20-briefing.md', content: CLEAN },
      ],
      baseHas: (p: string) => onMain.has(p),
      instant: RUN_4034,
    });
    expect(kinds(problems)).toEqual(['date', 'duplicate', 'date', 'duplicate']);
    expect(problems[0].detail).toContain('2026-10-18');
    expect(problems[2].detail).toContain('2026-10-19');
  });

  it('the same run with the right names and nothing on main passes', () => {
    expect(
      checkNightly({
        added: [
          { path: 'docs/daily/2026-10-18-captures.md', content: CLEAN },
          { path: 'docs/daily/2026-10-19-briefing.md', content: CLEAN },
          { path: 'docs/daily/2026-10-19-newsletter.md', content: CLEAN },
          { path: 'docs/daily/2026-10-19-tasks.md', content: CLEAN },
        ],
        baseHas: () => false,
        instant: RUN_4034,
      }),
    ).toEqual([]);
  });

  it('an em dash fails even when the dates are right', () => {
    const problems = checkNightly({
      added: [
        { path: 'docs/daily/2026-10-19-tasks.md', content: `- AgentMail inbox ${EM} Day 149\n` },
      ],
      baseHas: () => false,
      instant: RUN_4034,
    });
    expect(kinds(problems)).toEqual(['redact']);
    expect(problems[0].detail).toContain('dash');
  });

  it('ignores files that are not nightly output', () => {
    expect(
      checkNightly({
        added: [{ path: 'docs/daily/README.md', content: `a ${EM} b` }],
        baseHas: () => true,
        instant: RUN_4034,
      }),
    ).toEqual([]);
  });
});
