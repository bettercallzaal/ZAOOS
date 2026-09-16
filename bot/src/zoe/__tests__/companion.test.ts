import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  getTimeOfDayRhythm,
  getDaysUntilZaostock,
  parseBlackboardPulse,
  renderCompanionOverview,
  generateCompanionCheckin,
  type EstatePulse,
} from '../companion';
import { ZOE_PATHS } from '../memory';

describe('companion: getTimeOfDayRhythm', () => {
  it('identifies morning-kickoff (06:00 - 11:59 ET)', () => {
    const date = new Date('2026-09-15T13:00:00Z');
    expect(getTimeOfDayRhythm(date)).toBe('morning-kickoff');
  });

  it('identifies midday-flow (12:00 - 17:59 ET)', () => {
    const date = new Date('2026-09-15T18:30:00Z');
    expect(getTimeOfDayRhythm(date)).toBe('midday-flow');
  });

  it('identifies evening-reflection (18:00 - 23:59 ET)', () => {
    const date = new Date('2026-09-16T00:00:00Z');
    expect(getTimeOfDayRhythm(date)).toBe('evening-reflection');
  });

  it('identifies night-quiet (00:00 - 05:59 ET)', () => {
    const date = new Date('2026-09-15T07:00:00Z');
    expect(getTimeOfDayRhythm(date)).toBe('night-quiet');
  });
});

describe('companion: getDaysUntilZaostock', () => {
  it('calculates exact countdown days from 2026-09-15 to 2026-10-03', () => {
    const date = new Date('2026-09-15T16:00:00Z');
    const days = getDaysUntilZaostock(date);
    expect(days).toBe(18);
  });

  it('returns 0 if date is past festival date', () => {
    const postDate = new Date('2026-10-05T12:00:00Z');
    expect(getDaysUntilZaostock(postDate)).toBe(0);
  });
});

describe('companion: parseBlackboardPulse', () => {
  const sampleBlackboard = `# BLACKBOARD - the live state of ZAO

## WORK PACKETS
| Lane | What is claimed | Where | When |
|---|---|---|---|
| zaoonparagraph | v4 of the ZAOstock Paragraph edition | ~/Desktop/repos/zaoonparagraph | 2026-09-14 |
| antigravity | Tasks 2, 1, 3 executed: ZOE Button Bar (PR #3521) | ~/.worktrees/ZAOOS | 2026-09-15 |
| zaofestivals | **PARKED 2026-09-15 11:19 - top task done** | handoffs/status/zaofestivals.md | 2026-09-15 |

## BLOCKERS
- Local ~/zaal-dotfiles main diverged from origin.
- Hermes Agent gates are prompt-enforced only.

## WAITING FOR ZAAL
- [ ] Card 1: Review lodging options for artists.
- [ ] Card 2: Approve sound equipment rental deposit.
`;

  it('extracts active lanes, blockers, and waiting counts correctly', () => {
    const parsed = parseBlackboardPulse(sampleBlackboard);
    expect(parsed.activeLanes.length).toBe(3);
    expect(parsed.activeLanes[0].name).toBe('zaoonparagraph');
    expect(parsed.activeLanes[0].state).toBe('active');
    expect(parsed.activeLanes[2].name).toBe('zaofestivals');
    expect(parsed.activeLanes[2].state).toBe('parked');

    expect(parsed.blockers.length).toBe(2);
    expect(parsed.blockers[0]).toContain('zaal-dotfiles main diverged');

    expect(parsed.waitingCount).toBe(2);
  });
});

describe('companion: renderCompanionOverview', () => {
  const samplePulse: EstatePulse = {
    now: 1789500000000,
    timeOfDay: 'midday-flow',
    timeString: '14:30',
    zaostockCountdownDays: 18,
    activeLanes: [
      { name: 'antigravity', state: 'working', details: 'ZOE companion upgrade' },
      { name: 'zaoonparagraph', state: 'active', details: 'ZAOstock newsletter draft' },
    ],
    blockers: ['dotfiles diverged from origin'],
    waitingCount: 1,
    source: 'blackboard',
  };

  it('renders overview containing countdown, lanes, blockers, and recommendations', () => {
    const text = renderCompanionOverview(samplePulse);
    expect(text).toContain('ZOE Companion Pulse: 18 days until ZAOstock (Oct 3, 2026).');
    expect(text).toContain('Rhythm: midday-flow (14:30 ET).');
    expect(text).toContain('ACTIVE LANES (2):');
    expect(text).toContain('- antigravity [working]: ZOE companion upgrade');
    expect(text).toContain('BLOCKERS / WAITING ON ZAAL (1):');
    expect(text).toContain('SUGGESTED NEXT ACTIONS:');
  });

  it('strictly adheres to house style: zero emojis and zero em dashes', () => {
    const text = renderCompanionOverview(samplePulse);
    expect(text).not.toContain('\u2014');
    expect(text).not.toContain('\u2013');
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(text)).toBe(false);
  });
});

describe('companion: generateCompanionCheckin', () => {
  let tmpDir: string;
  let origZoeHome: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), 'zoe-test-' + Date.now().toString(36));
    await fs.mkdir(tmpDir, { recursive: true });
    origZoeHome = process.env.ZOE_HOME ?? '';
    process.env.ZOE_HOME = tmpDir;
    ZOE_PATHS.home = tmpDir;
  });

  afterEach(async () => {
    if (origZoeHome) process.env.ZOE_HOME = origZoeHome;
    else delete process.env.ZOE_HOME;
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns null during night quiet hours (EDT)', async () => {
    const night = new Date('2026-09-15T07:00:00Z').getTime();
    const cand = await generateCompanionCheckin(night);
    expect(cand).toBeNull();
  });

  it('returns null if last seen was recent (< 3 hours)', async () => {
    const now = new Date('2026-09-15T18:00:00Z').getTime();
    const lastSeen = now - 2 * 3_600_000;
    await fs.writeFile(join(tmpDir, 'last-seen.txt'), String(lastSeen), 'utf8');
    const cand = await generateCompanionCheckin(now);
    expect(cand).toBeNull();
  });

  it('generates a companion check-in candidate when inactive > 3 hours during day', async () => {
    const now = new Date('2026-09-15T19:00:00Z').getTime();
    const lastSeen = now - 4 * 3_600_000;
    await fs.writeFile(join(tmpDir, 'last-seen.txt'), String(lastSeen), 'utf8');
    const cand = await generateCompanionCheckin(now);
    expect(cand).not.toBeNull();
    expect(cand?.kind).toBe('companion-pulse');
    expect(cand?.score).toBe(0.65);
    expect(cand?.tier).toBe('standard');
    expect(cand?.message).toContain('until ZAOstock.');
    expect(cand?.message).toContain('Everything on track');
  });
});