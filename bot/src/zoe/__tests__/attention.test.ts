// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  attentionEnabled,
  classifyHeld,
  computeAttention,
  DIGEST_MAX_CHARS,
  formatAttentionLine,
  readHeldFull,
  recordTap,
  renderHeldDigest,
  showAllKeyboard,
  tapFamily,
  writeHeldFull,
  type AttentionSnapshot,
} from '../attention';
import { renderDeferredBatch, type DeferredSend } from '../send-budget';
import { chunkForTelegram } from '../tg-chunk';

let tmp: string;
beforeEach(async () => {
  tmp = join(tmpdir(), 'zoe-attention-test-' + Math.random().toString(36).slice(2));
  await fs.mkdir(tmp, { recursive: true });
  vi.stubEnv('ZOE_HOME', tmp);
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await fs.rm(tmp, { recursive: true, force: true });
});

// Verbatim previews from the VPS send-budget log, 2026-10-09 (deferred rows).
const RELAY =
  'Relay from zaalpanthaki (11:00):  TAP DIGEST 2026-10-09 07:00 waiting%: fleet 93.2% over 7d (1721.55h waiting';
const BOARD =
  '⚡️ **Voice chat with Jose on the papers - maieutics, dialectics, explore the philosophy layer** [2026-09-26 20:18]';
const HANDOFF_CARD = '⚡️ **Handoff: Grill terminal paused by Zaal 29 Sep 16:44; Vault** WHY: Grill terminal paused';
const HANDOFF = 'Handoff: Finance lane: festival costed and scored';
const PROGRESS = 'Work-loop: researching "Investigate sound gear in Ellsworth" (4 queued)';
const FAILED =
  'Work-loop: "Investigate sound gear in Ellsworth" failed - claude CLI exited 1 [budget: per-call budget cap (--max-budget-usd)]';
const DONE = 'Work-loop done: doc 2650 (verified) -> https://github.com/bettercallzaal/ZAOOS/pull/3850';
const REPO = '[repo-improver] bettercallzaal/wwtracker - API data validation: approved but no fix target (manual).';
const TEAM = 'Team todos - 8 in progress now, 2 people active:  zaal (29):   - [P2] Inbox action: ZAOstock';
const SHIPPED = 'Shipped today - Mon Oct 5  MERGED (none)  COMMITS (none)  RESEARCH DOCS (none)';
const VAULT = 'vault copy: 2303 commits BEHIND, newest here is 2026-09-17 21:34 UTC.';

const held = (text: string, i: number, cls: DeferredSend['cls'] = 'digest'): DeferredSend => ({
  at: `2026-10-08T${String(10 + (i % 12)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00.000Z`,
  cls,
  chatId: -100,
  text,
});

/** The measured 10-08 mix: 52 held, mostly handoffs and work-loop lines. */
function measuredDay(): DeferredSend[] {
  const out: DeferredSend[] = [];
  let i = 0;
  for (let k = 0; k < 20; k++) out.push(held(`Handoff: lane ${k} parked with a long explanation of why ${'x'.repeat(120)}`, i++));
  for (let k = 0; k < 10; k++) out.push(held(PROGRESS, i++, 'status'));
  for (let k = 0; k < 7; k++) out.push(held(FAILED, i++, 'status'));
  out.push(held(RELAY, i++), held(RELAY.replace('11:00', '21:00'), i++));
  for (let k = 0; k < 5; k++) out.push(held(`${BOARD} ${k}`, i++));
  out.push(held(DONE, i++), held(REPO, i++, 'status'), held(REPO, i++, 'status'));
  out.push(held(TEAM, i++), held(SHIPPED, i++), held(VAULT, i++), held(HANDOFF_CARD, i++), held(HANDOFF, i++));
  return out;
}

describe('attentionEnabled', () => {
  it('is on only for the literal 1', () => {
    expect(attentionEnabled({ ZOE_ATTENTION: '1' })).toBe(true);
    expect(attentionEnabled({ ZOE_ATTENTION: 'true' })).toBe(false);
    expect(attentionEnabled({})).toBe(false);
  });
});

describe('classifyHeld', () => {
  it.each([
    [RELAY, 'relay'],
    [BOARD, 'board'],
    [HANDOFF_CARD, 'handoff'],
    [HANDOFF, 'handoff'],
    [PROGRESS, 'work-progress'],
    [FAILED, 'work-failed'],
    ['Work-loop error: failed to process "x" - boom', 'work-failed'],
    [DONE, 'work-done'],
    [REPO, 'repo-improver'],
    [TEAM, 'team-todos'],
    [SHIPPED, 'shipped'],
    [VAULT, 'vault-copy'],
    ['something else entirely', 'other'],
  ])('%s -> %s', (text, want) => {
    expect(classifyHeld(text)).toBe(want);
  });
});

describe('renderHeldDigest', () => {
  it('red control: the old batch of the measured day is several Telegram messages', () => {
    expect(chunkForTelegram(renderDeferredBatch(measuredDay())).length).toBeGreaterThan(1);
  });

  it('renders the same day as ONE message under the cap', () => {
    const out = renderHeldDigest(measuredDay());
    expect(out.length).toBeLessThanOrEqual(DIGEST_MAX_CHARS);
    expect(chunkForTelegram(out)).toHaveLength(1);
  });

  it('keeps the text of what needs Zaal and counts the rest', () => {
    const out = renderHeldDigest(measuredDay());
    expect(out).toContain('While you were away: 52 messages held.');
    expect(out).toContain('YOUR RELAYS (2)');
    expect(out).toContain('TAP DIGEST 2026-10-09 07:00');
    expect(out).toContain('BOARD ITEMS (5)');
    expect(out).toContain('and 2 more');
    expect(out).toContain('RESULTS (1)');
    expect(out).toContain('pull/3850');
    expect(out).toContain('22 lane handoffs');
    expect(out).toContain('10 work-loop progress pings');
    expect(out).toContain('7 work-loop failures (last: Work-loop: "Investigate sound gear');
    expect(out).toContain('2 repo-improver notes');
    expect(out).toContain('Tap Show all');
    // Count-only sources never leak their text into the digest.
    expect(out).not.toContain('parked with a long explanation');
  });

  it('leaves out fragments of an earlier batch instead of counting them as held', () => {
    const entries = [held('(1/2) Held back yesterday (3 items, over the daily send cap):', 0), held(HANDOFF, 1)];
    expect(renderHeldDigest(entries)).toContain('While you were away: 1 message held.');
  });

  it('orders the counts loudest first and appends the attention line when data exists', () => {
    const att: AttentionSnapshot = { at: '', windowDays: 7, taps: { bg: 3 }, sent: { handoff: 9 } };
    const entries = [held('a plain other line', 0), held(HANDOFF, 1), held(`${HANDOFF} 2`, 2)];
    const out = renderHeldDigest(entries, att);
    expect(out.indexOf('2 lane handoffs')).toBeLessThan(out.indexOf('1 other messages'));
    expect(out).toContain('Last 7 days: you tapped bg 3; never answered: lane handoffs 9.');
    expect(renderHeldDigest(entries)).not.toContain('Last 7 days');
  });

  it('trims a pathological day rather than splitting it', () => {
    const huge = Array.from({ length: 200 }, (_, k) => held(`${RELAY} ${'y'.repeat(900)} ${k}`, k));
    const out = renderHeldDigest(huge);
    expect(chunkForTelegram(out)).toHaveLength(1);
  });

  it('Show all keyboard carries the held:all callback', () => {
    expect(showAllKeyboard().inline_keyboard[0][0].callback_data).toBe('held:all');
  });
});

describe('held-full store', () => {
  it('round-trips the full list for the Show all button', async () => {
    expect(await readHeldFull()).toBeNull();
    await writeHeldFull('full list');
    expect(await readHeldFull()).toBe('full list');
  });
});

describe('taps and consolidation', () => {
  it('maps callback data to a family', () => {
    expect(tapFamily('bg:yes:123')).toBe('bg');
    expect(tapFamily('q:rl-zoe:YWNr')).toBe('relay');
    expect(tapFamily('q:abc:xyz')).toBe('q');
    expect(tapFamily('held:all')).toBe('held');
    expect(tapFamily('')).toBe('unknown');
  });

  it('counts taps and sends inside the seven-day window only', async () => {
    const now = new Date('2026-10-10T00:00:00Z');
    await recordTap('bg', new Date('2026-10-09T12:00:00Z'));
    await recordTap('bg', new Date('2026-10-08T12:00:00Z'));
    await recordTap('post', new Date('2026-09-01T12:00:00Z')); // outside the window
    const log = [
      { at: '2026-10-09T10:00:00Z', outcome: 'deferred', cls: 'status', chatId: 1, preview: PROGRESS },
      { at: '2026-10-09T10:05:00Z', outcome: 'sent', cls: 'digest', chatId: 1, preview: HANDOFF },
      { at: '2026-09-01T10:05:00Z', outcome: 'sent', cls: 'digest', chatId: 1, preview: HANDOFF },
    ];
    await fs.writeFile(join(tmp, 'send-budget-log.jsonl'), log.map((r) => JSON.stringify(r)).join('\n') + '\n{torn');
    const snap = await computeAttention(now);
    expect(snap.taps).toEqual({ bg: 2 });
    expect(snap.sent).toEqual({ 'work-progress': 1, handoff: 1 });
    const onDisk = JSON.parse(await fs.readFile(join(tmp, 'attention.json'), 'utf8'));
    expect(onDisk.taps.bg).toBe(2);
  });

  it('formats one actionable line, and nothing when there is no data', () => {
    expect(formatAttentionLine({ at: '', windowDays: 7, taps: {}, sent: {} })).toBe('');
    const line = formatAttentionLine({
      at: '',
      windowDays: 7,
      taps: { bg: 5, post: 2 },
      sent: { handoff: 22, board: 4 },
    });
    expect(line).toBe('Last 7 days: you tapped bg 5, post 2; never answered: lane handoffs 22.');
  });
});

describe('entry points used by index.ts and scheduler.ts', () => {
  it('showAllAction: nothing kept, then the kept list', async () => {
    expect(await (await import('../attention')).showAllAction()).toEqual({ answer: 'Nothing kept.', full: null });
    await writeHeldFull('the full list');
    expect(await (await import('../attention')).showAllAction()).toEqual({
      answer: 'Sending the full list.',
      full: 'the full list',
    });
  });

  it('prepareMorningBatch flag off: the old full batch, no button, nothing kept', async () => {
    const { prepareMorningBatch } = await import('../attention');
    const day = measuredDay();
    const b = await prepareMorningBatch(day, {});
    expect(b).toEqual({ text: renderDeferredBatch(day), digest: false });
    expect(await readHeldFull()).toBeNull();
  });

  it('prepareMorningBatch flag on: one-message digest, Show all, full list kept', async () => {
    const { prepareMorningBatch } = await import('../attention');
    const day = measuredDay();
    const b = await prepareMorningBatch(day, { ZOE_ATTENTION: '1' });
    expect(b.digest).toBe(true);
    expect(chunkForTelegram(b.text)).toHaveLength(1);
    expect(b.opts?.replyMarkup.inline_keyboard[0][0].callback_data).toBe('held:all');
    expect(await readHeldFull()).toBe(renderDeferredBatch(day));
  });

  it('prepareMorningBatch falls back to the full batch when the list cannot be kept', async () => {
    const { prepareMorningBatch } = await import('../attention');
    // A FILE where the ZOE home directory should be makes mkdir/writeFile fail.
    const blocker = join(tmp, 'not-a-dir');
    await fs.writeFile(blocker, 'x');
    vi.stubEnv('ZOE_HOME', blocker);
    const day = measuredDay();
    const b = await prepareMorningBatch(day, { ZOE_ATTENTION: '1' });
    expect(b).toEqual({ text: renderDeferredBatch(day), digest: false });
  });

  it('pruneTaps keeps the last 30 days and drops torn lines; computeAttention prunes', async () => {
    const { pruneTaps } = await import('../attention');
    const now = new Date('2026-10-10T00:00:00Z');
    await recordTap('bg', new Date('2026-10-09T00:00:00Z'));
    await recordTap('old', new Date('2026-08-01T00:00:00Z'));
    await fs.appendFile(join(tmp, 'taps.jsonl'), '{torn\n');
    expect(await pruneTaps(now)).toBe(2);
    const left = (await fs.readFile(join(tmp, 'taps.jsonl'), 'utf8')).trim().split('\n');
    expect(left).toHaveLength(1);
    expect(left[0]).toContain('"bg"');
    expect(await pruneTaps(now)).toBe(0);
    await recordTap('old2', new Date('2026-07-01T00:00:00Z'));
    await computeAttention(now);
    expect(await fs.readFile(join(tmp, 'taps.jsonl'), 'utf8')).not.toContain('old2');
  });
});

describe('pruneTaps is crash-safe and does not race recordTap', () => {
  it('a tap recorded while a prune runs is kept', async () => {
    const { pruneTaps } = await import('../attention');
    const now = new Date('2026-10-10T00:00:00Z');
    for (let k = 0; k < 50; k++) await recordTap('old', new Date('2026-07-01T00:00:00Z'));
    // Fire both without awaiting the prune first: the append must not land
    // between the prune's read and its rename.
    const [removed] = await Promise.all([pruneTaps(now), recordTap('bg', new Date('2026-10-09T23:00:00Z'))]);
    expect(removed).toBe(50);
    const left = (await fs.readFile(join(tmp, 'taps.jsonl'), 'utf8')).trim().split('\n');
    expect(left).toHaveLength(1);
    expect(left[0]).toContain('"bg"');
  });

  it('writes through a temp file and leaves none behind', async () => {
    const { pruneTaps } = await import('../attention');
    await recordTap('old', new Date('2026-07-01T00:00:00Z'));
    await recordTap('bg', new Date('2026-10-09T00:00:00Z'));
    await pruneTaps(new Date('2026-10-10T00:00:00Z'));
    const names = await fs.readdir(tmp);
    expect(names).toContain('taps.jsonl');
    expect(names).not.toContain('taps.jsonl.tmp');
  });

  it('a failed write leaves the original file intact', async () => {
    const { pruneTaps } = await import('../attention');
    await recordTap('old', new Date('2026-07-01T00:00:00Z'));
    await recordTap('bg', new Date('2026-10-09T00:00:00Z'));
    const before = await fs.readFile(join(tmp, 'taps.jsonl'), 'utf8');
    // A directory where the temp file goes makes the write fail.
    await fs.mkdir(join(tmp, 'taps.jsonl.tmp'));
    await expect(pruneTaps(new Date('2026-10-10T00:00:00Z'))).rejects.toThrow();
    expect(await fs.readFile(join(tmp, 'taps.jsonl'), 'utf8')).toBe(before);
    // The queue is not wedged by the failure.
    await recordTap('after', new Date('2026-10-09T01:00:00Z'));
    expect(await fs.readFile(join(tmp, 'taps.jsonl'), 'utf8')).toContain('"after"');
  });
});

describe('needsZaalSendClass: what needs Zaal is not held by the cap', () => {
  it('gated under ZOE_ATTENTION, digest (unchanged) without it', async () => {
    const { needsZaalSendClass } = await import('../attention');
    expect(needsZaalSendClass({ ZOE_ATTENTION: '1' })).toBe('gated');
    expect(needsZaalSendClass({})).toBe('digest');
  });

  it('the scheduler runs both needs-Zaal digests under it, and nothing else', async () => {
    const src = await fs.readFile(join(__dirname, '..', 'scheduler.ts'), 'utf8');
    for (const slot of ['morning', 'evening']) {
      const fire = src.indexOf(`claimFire('needs-zaal-${slot}')`);
      expect(fire).toBeGreaterThan(-1);
      const before = src.slice(0, fire);
      const m = [...before.matchAll(/runWithSendClass\(([^,]+),/g)].pop();
      expect(m?.[1]).toBe('needsZaalSendClass()');
    }
    expect(src.split('runWithSendClass(needsZaalSendClass()').length - 1).toBe(2);
  });
});
