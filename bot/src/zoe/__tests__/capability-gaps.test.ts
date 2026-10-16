import { mkdtempSync, promises as fs, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  appendGap,
  buildGapGoal,
  cleanWant,
  DIGEST_TOP,
  extractGap,
  formatGapDigest,
  GAP_PROMPT_BLOCK,
  type GapRow,
  gapLogEnabled,
  gapUpgradeEnabled,
  gapWords,
  MAX_WANT_CHARS,
  pickUpgrade,
  readGaps,
  summarizeGaps,
  MAX_GAP_FILE_BYTES,
  gapWeekKey,
} from '../capability-gaps';

const NOW = new Date('2026-10-18T18:30:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
const row = (want: string, days = 1): GapRow => ({ ts: daysAgo(days), want });

describe('flags', () => {
  it('are both off unless set to exactly 1', () => {
    expect(gapLogEnabled({})).toBe(false);
    expect(gapLogEnabled({ ZOE_GAP_LOG: 'true' })).toBe(false);
    expect(gapLogEnabled({ ZOE_GAP_LOG: '1' })).toBe(true);
  });

  it('never queue an upgrade without the log on', () => {
    expect(gapUpgradeEnabled({ ZOE_GAP_UPGRADE: '1' })).toBe(false);
    expect(gapUpgradeEnabled({ ZOE_GAP_LOG: '1' })).toBe(false);
    expect(gapUpgradeEnabled({ ZOE_GAP_LOG: '1', ZOE_GAP_UPGRADE: '1' })).toBe(true);
  });
});

describe('extractGap', () => {
  it('leaves a reply with no GAP line exactly as it was', () => {
    const reply = 'Done. The PR is open.\n\nMind the GAP: it is wide.';
    expect(extractGap(reply)).toEqual({ reply, gap: null });
  });

  it('takes the GAP line off and returns the want', () => {
    const r = extractGap('I cannot set a timed reminder yet, but I added it to your tasks.\nGAP: set a reminder for a clock time');
    expect(r.reply).toBe('I cannot set a timed reminder yet, but I added it to your tasks.');
    expect(r.gap).toBe('set a reminder for a clock time');
  });

  it('takes off every GAP line, wherever it sits, and keeps the first want', () => {
    const r = extractGap('GAP: speak the reply aloud\nI can only type for now.\n  GAP: something else\nMore text.');
    expect(r.reply).toBe('I can only type for now.\nMore text.');
    expect(r.gap).toBe('speak the reply aloud');
  });

  it('never sends an empty message when the reply was only a GAP line', () => {
    const r = extractGap('GAP: send an email');
    expect(r.reply).toBe('I cannot do that yet. I have noted it.');
    expect(r.gap).toBe('send an email');
  });

  it('takes off an empty GAP line and records nothing', () => {
    const r = extractGap('Here you go.\nGAP:   ');
    expect(r.reply).toBe('Here you go.');
    expect(r.gap).toBeNull();
  });
});

describe('cleanWant', () => {
  it('flattens to one line, drops markup characters, and caps the length', () => {
    expect(cleanWant('  send <b>an</b>\n email `now` ')).toBe('send ban/b email now');
    expect(cleanWant('x'.repeat(500))).toHaveLength(MAX_WANT_CHARS);
  });

  it('redacts an email address and a phone number', () => {
    // Built at run time so no address or number sits in the repo as a literal.
    const email = ['someone', 'example.org'].join('@');
    const phone = ['207', '555', '0147'].join('-');
    const out = cleanWant(`email ${email} or call ${phone}`);
    expect(out).not.toContain(email);
    expect(out).not.toContain(phone);
    expect(out).toContain('email');
  });
});

describe('summarizeGaps', () => {
  it('groups different wordings of the same want and counts them', () => {
    const groups = summarizeGaps(
      [
        row('set a reminder for a clock time', 1),
        row('remind him at a set clock time', 2),
        row('speak the reply aloud', 3),
        row('setting reminders at a time', 4),
      ],
      NOW,
    );
    expect(groups.map((g) => [g.want, g.count])).toEqual([
      ['set a reminder for a clock time', 3],
      ['speak the reply aloud', 1],
    ]);
  });

  it('leaves out rows older than the window, from the future, or with a bad timestamp', () => {
    const groups = summarizeGaps(
      [
        row('send an email', 8),
        { ts: new Date(NOW.getTime() + 60_000).toISOString(), want: 'send an email' },
        { ts: 'yesterday', want: 'send an email' },
        row('add a calendar event', 6),
      ],
      NOW,
    );
    expect(groups).toEqual([{ want: 'add a calendar event', count: 1, lastTs: daysAgo(6) }]);
  });

  it('leaves out a want with no meaning-bearing words', () => {
    expect(gapWords('to do it for me').size).toBe(0);
    expect(summarizeGaps([row('to do it for me')], NOW)).toEqual([]);
  });

  it('puts the most recent first when counts tie', () => {
    const groups = summarizeGaps([row('send an email', 5), row('speak aloud', 1)], NOW);
    expect(groups.map((g) => g.want)).toEqual(['speak aloud', 'send an email']);
  });
});

describe('pickUpgrade', () => {
  it('picks nothing for a gap asked once', () => {
    expect(pickUpgrade(summarizeGaps([row('send an email')], NOW))).toBeNull();
    expect(pickUpgrade([])).toBeNull();
  });

  it('picks the single most-asked gap once it was asked twice', () => {
    const groups = summarizeGaps([row('send an email', 1), row('send email', 2), row('speak aloud', 3)], NOW);
    expect(pickUpgrade(groups)?.want).toBe('send an email');
  });
});

describe('formatGapDigest', () => {
  it('says nothing when there is nothing', () => {
    expect(formatGapDigest([], null)).toBe('');
  });

  it('lists the top gaps with counts, and mentions a queued check only when one was queued', () => {
    const groups = summarizeGaps([row('send an email', 1), row('send email', 2), row('speak aloud', 3)], NOW);
    const plain = formatGapDigest(groups, null);
    expect(plain).toBe(
      'Things you asked me for this week that I could not do:\n1. send an email (2 times)\n2. speak aloud (once)',
    );
    expect(formatGapDigest(groups, groups[0])).toContain('I queued an upgrade check for number 1.');
    expect(formatGapDigest(groups, groups[0])).toContain('It writes no code.');
  });

  it('caps the list and says how many were left off', () => {
    const many = ['alpha one', 'bravo two', 'charlie three', 'delta four', 'echo five', 'foxtrot six', 'golf seven'];
    const text = formatGapDigest(summarizeGaps(many.map((w, i) => row(w, i * 0.1)), NOW), null);
    expect(text.split('\n').filter((l) => /^\d+\. /.test(l))).toHaveLength(DIGEST_TOP);
    expect(text).toContain('And 2 more.');
  });

  it('carries no emoji and no em dash', () => {
    const text = formatGapDigest(summarizeGaps([row('send an email'), row('send email', 2)], NOW), null);
    expect(text).not.toMatch(/[—\u{1F300}-\u{1FAFF}☀-➿]/u);
  });
});

describe('buildGapGoal', () => {
  it('names the want and the count, and forbids code and outbound', () => {
    const goal = buildGapGoal({ want: 'set a reminder for a clock time', count: 3, lastTs: daysAgo(1) });
    expect(goal).toContain('"set a reminder for a clock time"');
    expect(goal).toContain('asked ZOE 3 times');
    expect(goal).toContain('Do not write or change any code. Nothing outbound.');
    expect(goal).toContain('EXTEND <exact file we already have>');
  });
});

describe('the prompt block', () => {
  it('asks for one final GAP line and says when not to write one', () => {
    const text = GAP_PROMPT_BLOCK.join('\n');
    expect(text).toContain('GAP: <what he wanted');
    expect(text).toContain('Not when you refuse');
    expect(text).toContain('At most one GAP line per reply');
  });
});

describe('appendGap and readGaps', () => {
  const file = () => join(mkdtempSync(join(tmpdir(), 'zoe-gaps-')), 'state', 'capability-gaps.jsonl');

  it('reads a missing file as an empty log', async () => {
    expect(await readGaps(file())).toEqual({ rows: [], skipped: 0 });
  });

  it('appends cleaned rows, creating the folder, and reads them back', async () => {
    const path = file();
    expect(await appendGap('  send an   email ', NOW, path)).toBe(true);
    expect(await appendGap('speak aloud', NOW, path)).toBe(true);
    expect(await readGaps(path)).toEqual({
      rows: [
        { ts: NOW.toISOString(), want: 'send an email' },
        { ts: NOW.toISOString(), want: 'speak aloud' },
      ],
      skipped: 0,
    });
  });

  it('writes nothing for an empty want', async () => {
    const path = file();
    expect(await appendGap('  <> ', NOW, path)).toBe(false);
    expect(await readGaps(path)).toEqual({ rows: [], skipped: 0 });
  });

  it('skips and counts lines that are not rows, and keeps the good ones', async () => {
    const path = file();
    await appendGap('send an email', NOW, path);
    writeFileSync(path, `${readFileSync(path, 'utf8')}not json\n{"ts":5,"want":"x"}\n\n`);
    const out = await readGaps(path);
    expect(out.rows).toHaveLength(1);
    expect(out.skipped).toBe(2);
  });
});

describe('marker spellings a model plausibly writes (Evaluator, #3918)', () => {
  it.each([
    ['gap: set a reminder at 3pm'],
    ['Gap: set a reminder at 3pm'],
    ['GAP : set a reminder at 3pm'],
    ['**GAP:** set a reminder at 3pm'],
    ['**GAP: set a reminder at 3pm**'],
    ['__GAP__: set a reminder at 3pm'],
    ['> GAP: set a reminder at 3pm'],
    ['- GAP: set a reminder at 3pm'],
    ['* GAP: set a reminder at 3pm'],
    ['1. GAP: set a reminder at 3pm'],
  ])('%j is stripped and recorded', (marker) => {
    const r = extractGap(`Sure, here is what I can do.\n${marker}`);
    expect(r.reply).toBe('Sure, here is what I can do.');
    expect(r.gap).toBe('set a reminder at 3pm');
  });

  it('a carriage-return line end is handled', () => {
    const r = extractGap('Here you go.\r\nGAP: send an email\r\n');
    expect(r.reply).toBe('Here you go.');
    expect(r.gap).toBe('send an email');
  });

  it('a marker alone inside a code fence leaves no empty fence behind', () => {
    const r = extractGap('Answer first.\n\n```\nGAP: speak the reply aloud\n```');
    expect(r.reply).toBe('Answer first.');
    expect(r.gap).toBe('speak the reply aloud');
  });

  it('the word inside a sentence is still left alone and not recorded', () => {
    const r = extractGap('There is a gap: the venue closes at 9.');
    expect(r).toEqual({ reply: 'There is a gap: the venue closes at 9.', gap: null });
  });
});

describe('gapWeekKey', () => {
  it.each([
    ['2026-10-18T18:30:00Z', '2026-10-18'], // Sunday itself
    ['2026-10-19T09:00:00Z', '2026-10-18'], // Monday after
    ['2026-10-24T23:59:00Z', '2026-10-18'], // Saturday after
    ['2026-10-25T00:00:00Z', '2026-10-25'], // next Sunday
  ])('%s -> %s', (iso, key) => {
    expect(gapWeekKey(new Date(iso))).toBe(key);
  });
});

describe('the gap file', () => {
  it('is written owner-only and stops growing at the cap', async () => {
    const dir = await fs.mkdtemp(join(tmpdir(), 'zoe-gaps-'));
    const path = join(dir, 'capability-gaps.jsonl');
    try {
      expect(await appendGap('send an email', new Date('2026-10-18T10:00:00Z'), path)).toBe(true);
      expect((await fs.stat(path)).mode & 0o777).toBe(0o600);
      await fs.writeFile(path, 'x'.repeat(MAX_GAP_FILE_BYTES));
      expect(await appendGap('another want', new Date(), path)).toBe(false);
      expect((await fs.stat(path)).size).toBe(MAX_GAP_FILE_BYTES);
    } finally {
      await fs.rm(path, { force: true });
      await fs.rmdir(dir);
    }
  });
});

describe('the wiring', () => {
  const src = (name: string) => readFileSync(join(__dirname, '..', name), 'utf8');

  it('takes the GAP line off the DM reply right after the turn, before anything else reads it', () => {
    const index = src('index.ts');
    const turn = index.indexOf('const result = await runConciergeTurn({');
    const gate = index.indexOf('if (gapLog) {', turn);
    const strip = index.indexOf('result.reply = extracted.reply;');
    const firstUse = index.indexOf('if (result.task_ops.length > 0) {', turn);
    expect(turn).toBeGreaterThan(0);
    expect(gate).toBeGreaterThan(turn);
    expect(strip).toBeGreaterThan(gate);
    expect(firstUse).toBeGreaterThan(strip);
    // Nothing between the turn and the gate reads the reply.
    expect(index.slice(turn, gate)).not.toContain('result.reply');
  });

  it('asks for the GAP line from exactly one turn, the one that strips it', () => {
    const index = src('index.ts');
    expect(index).toContain("const gapLog = gapLogEnabled() && blocks.chat_scope === 'private';");
    const turns = index.split('runConciergeTurn({').slice(1);
    expect(turns.length).toBeGreaterThanOrEqual(3);
    // Any spelling of the option counts: shorthand, `gapLog: true`, `gapLog: x`.
    // The first version matched the shorthand only, so a second call site
    // written `gapLog: true` would have passed (Evaluator, #3918).
    const asking = turns.filter((t) => /\bgapLog\b\s*[:,}\n]/.test(t.slice(0, t.indexOf('});'))));
    expect(asking).toHaveLength(1);
    // And no other file that runs a concierge turn passes it at all.
    for (const other of ['discord.ts', 'concierge.ts']) {
      const calls = src(other).split('runConciergeTurn({').slice(1);
      for (const t of calls) expect(t.slice(0, t.indexOf('});')), other).not.toMatch(/\bgapLog\b\s*[:,}\n]/);
    }
    expect(index.match(/extractGap\(/g)).toHaveLength(1);
    // concierge.ts adds the block from the option, never from the env flag.
    const concierge = src('concierge.ts');
    expect(concierge).toContain('...(isPrivate && gapLog === true ? GAP_PROMPT_BLOCK : []),');
    expect(concierge).not.toContain('gapLogEnabled');
  });

  it('runs the weekly digest only with the log on, and queues only behind the second flag', () => {
    const scheduler = src('scheduler.ts');
    const at = scheduler.indexOf("'30 18 * * 0'");
    const block = scheduler.slice(at, scheduler.indexOf('{ timezone:', at));
    expect(at).toBeGreaterThan(0);
    const flagCheck = block.indexOf('if (!gapLogEnabled()) return;');
    expect(flagCheck).toBeGreaterThan(0);
    expect(flagCheck).toBeLessThan(block.indexOf("claimFire('capability-gaps')"));
    expect(block).toContain('const candidate = gapUpgradeEnabled() ? pickUpgrade(groups) : null;');
    expect(block).toContain('if (upgrade) await enqueueWork(buildGapGoal(upgrade));');
    expect(block).toContain('if (groups.length === 0) return;');
    expect(block.match(/enqueueWork\(/g)).toHaveLength(1);
  });

  it('queues at most one upgrade per week: its own sentinel, claimed before the queue, never released', () => {
    const scheduler = src('scheduler.ts');
    const at = scheduler.indexOf("'30 18 * * 0'");
    const block = scheduler.slice(at, scheduler.indexOf('{ timezone:', at));
    const claim = block.indexOf('claimFire(`capability-gaps-upgrade-${gapWeekKey(new Date())}`)');
    expect(claim).toBeGreaterThan(0);
    expect(claim).toBeLessThan(block.indexOf('enqueueWork('));
    // The only release in the job is the digest's own; the upgrade claim stays.
    expect(block).not.toMatch(/releaseFire\(`capability-gaps-upgrade/);
    expect(block.match(/releaseFire\(/g)).toHaveLength(1);
  });
});
