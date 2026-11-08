/**
 * scripts/zoe/nightly-redact.mjs against the verbatim lines the nightly run
 * published into public ZAOOS (#3938, #3956, main's 2026-10-13-tasks.md and
 * 2026-10-14-tasks.md, read 2026-10-15). Each class is a red case: the input
 * line is asserted to carry the class before redact() and not after, so a
 * redactor that quietly does nothing fails here.
 */
import { describe, expect, it } from 'vitest';
import { redact, remaining } from '../zoe/nightly-redact.mjs';

const KEY_LINE = '- [ ] **AgentMail env var - Day 149** - `echo "AGENTMAIL_API_KEY=<key>" >> ~/.zao/zao.env`. Key in 1Password "Example Item".';
const DASH_LINE = '- AgentMail inbox inaccessible — Day 149. One-command fix: `echo "AGENTMAIL_API_KEY=<key>" >> ~/.zao/zao.env`';
const PAY_LINE = '- [ ] **Sam $100 USDC - Day 90+** - One action.';
const HEADER_LINE = '*Processed by ZOE Nightly ~22:00 EST. AgentMail inbox: BLOCKED (Day 149 — `echo "AGENTMAIL_API_KEY=<key>" >> ~/.zao/zao.env`, key in 1Password "Example Item")*';

describe('the four classes, verbatim', () => {
  it('a command that writes under ~/.zao and the 1Password item name', () => {
    expect(remaining(KEY_LINE)).toEqual(['private-path', '1password-item']);
    const { text, counts } = redact(KEY_LINE);
    expect(text).toBe('- [ ] **AgentMail env var - Day 149** - `<command in the vault>`. Key in 1Password (item in the vault).');
    expect(counts['private-path']).toBe(1);
    expect(counts['1password-item']).toBe(1);
    expect(remaining(text)).toEqual([]);
  });
  it('an em dash plus the command', () => {
    expect(remaining(DASH_LINE)).toEqual(['private-path', 'dash']);
    const { text } = redact(DASH_LINE);
    expect(text).toBe('- AgentMail inbox inaccessible - Day 149. One-command fix: `<command in the vault>`');
    expect(remaining(text)).toEqual([]);
  });
  it('a payment line about a named person hides the name and the amount (item 203)', () => {
    expect(remaining(PAY_LINE)).toEqual(['name-amount']);
    const { text } = redact(PAY_LINE);
    expect(text).toBe('- [ ] **Payee (amount in the vault) - Day 90+** - One action.');
    expect(remaining(text)).toEqual([]);
  });
  it('the captures header carries three classes at once', () => {
    expect(remaining(HEADER_LINE)).toEqual(['private-path', '1password-item', 'dash']);
    const { text } = redact(HEADER_LINE);
    expect(text).toContain('(Day 149 - `<command in the vault>`, key in 1Password (item in the vault))');
    expect(remaining(text)).toEqual([]);
  });
});

describe('a third-party email address (the pre-commit scanner blocked the sweep on one)', () => {
  it('is replaced; a ZAO allowlisted address stays', () => {
    // Built at run time so no literal third-party address sits in the repo (the
    // pre-commit scanner reads this file too, and rightly so).
    const addr = ['someone', 'example.org'].join('@');
    const line = `- [ ] **Pitch** - Send to ${addr}; cc zoe-zao@agentmail.to.`;
    expect(remaining(line)).toEqual(['email']);
    expect(redact(line).text).toBe('- [ ] **Pitch** - Send to <redacted-email>; cc zoe-zao@agentmail.to.');
    expect(remaining(redact(line).text)).toEqual([]);
  });
});

describe('only some classes', () => {
  it('redact(text, only) leaves the other classes alone', () => {
    const { text, counts } = redact(DASH_LINE, ['private-path']);
    expect(text).toBe('- AgentMail inbox inaccessible — Day 149. One-command fix: `<command in the vault>`');
    expect(counts.dash).toBe(0);
    expect(remaining(text)).toEqual(['dash']);
  });
});

describe('the shapes that slipped the first sweep (evaluator on #3957); names and items are stand-ins', () => {
  it('1Password under "<item>"', () => {
    const line = 'Resolution path: `<command in the vault>` - key is in 1Password under "Example Item".';
    expect(remaining(line)).toEqual(['1password-item']);
    expect(redact(line).text).toBe('Resolution path: `<command in the vault>` - key is in 1Password (item in the vault).');
  });
  it('<name> next $<amt> USDC', () => {
    const line = '- **Jul 1** - Sam next $100 USDC';
    expect(remaining(line)).toEqual(['name-amount']);
    expect(redact(line).text).toBe('- **Jul 1** - Payee next (amount in the vault)');
  });
  it('<full name> - next $<amt> USDC', () => {
    const line = '- **July 1 (14 days)** - Sam Example - next $100 USDC';
    expect(remaining(line)).toEqual(['name-amount']);
    expect(redact(line).text).toBe('- **July 1 (14 days)** - Payee - next (amount in the vault)');
  });
  it('a dotenv under a home folder, a ~/.claude path, and an absolute home path with the username', () => {
    for (const p of ['~/n8n/.env', '~/.claude/projects/*/memory/*.md', '/Users/someone/Documents/repo/x.md', '$HOME/.claude/skills/x/SKILL.md']) {
      expect(redact(`see ${p} now`).text).toBe('see <private path> now');
    }
    expect(redact('see /usr/local/bin/gh now').text).toBe('see /usr/local/bin/gh now');
  });
  it('--check honours --only', () => {
    expect(remaining('a — b with 1Password "Example Item"', ['dash'])).toEqual(['dash']);
    expect(remaining('a — b', ['1password-item'])).toEqual([]);
  });
});

describe('what stays', () => {
  it('product numbers with no person next to them', () => {
    const line = '- WaveZStation: "pool size" on the site shows **gross sales (1,947.30 USDC)**, not the actual pool (365.94 USDC claimable).';
    expect(remaining(line)).toEqual([]);
    expect(redact(line).text).toBe(line);
  });
  it('a count of buys and wallets, and a Day counter', () => {
    const line = '| 2668 | WaveZStation on-chain ground truth | 234 buys, 35 wallets, 365.94 USDC unclaimed (18.7% of all-time sales). Day 90+ |';
    expect(redact(line).text).toBe(line);
  });
  it('a capitalised non-name next to an amount: a sentence start, a quantity, a product', () => {
    for (const line of ['Next $100 on July 1', 'Under $5/day at current volume', 'Min $45/hr (~$70k+)', 'Neynar $0.01/cast', 'Prize $1,000 to the top artist']) {
      expect(redact(line).text).toBe(line);
    }
  });
  it('a bare 1Password mention with no item name', () => {
    expect(redact('Key in 1Password.').text).toBe('Key in 1Password.');
  });
  it('a hyphen, not a dash', () => {
    expect(redact('Day 149 - one command').text).toBe('Day 149 - one command');
  });
});

describe('other spellings of the same classes', () => {
  it('$HOME, /home and /Users forms of the private path', () => {
    for (const p of ['$HOME/.zao/zoe/x.json', '/home/zaal/.zao/private/icm-keys.json', '/Users/zaalpanthaki/.zao/zao.env']) {
      expect(redact(`see ${p} now`).text).toBe('see <private path> now');
    }
  });
  it('op:// references and "1Password item Name"', () => {
    expect(redact('read op://Private/ZOE-AgentMail/credential').text).toBe('read 1Password (item in the vault)');
    expect(redact('key in 1Password item ZOE AgentMail').text).toBe('key in 1Password (item in the vault)');
  });
  it('a name with a verb between, and an en dash', () => {
    expect(redact('paid Candy 50 USDC – done').text).toBe('paid Payee (amount in the vault) - done');
  });
});

// Item 203 (Zaal, 2026-11-04): the sweep of the public daily files. Names are stand-ins.
const SC = ['payee-name', 'deal-names', 'stripe-overdue'];
describe('item 203: payee name left beside the marker', () => {
  it('a name before "(amount in the vault)" is removed; red before, clean after', () => {
    for (const line of [
      '- [ ] **Sam (amount in the vault) - Day 99+** - One action.',
      '- **July 9** - Sam next (amount in the vault)',
      '- **Sam Example (amount in the vault) -- OVERDUE**',
    ]) {
      expect(remaining(line)).toEqual(['payee-name']);
      const { text, counts } = redact(line, SC);
      expect(text).toContain('Payee');
      expect(text).not.toContain('Sam');
      expect(counts['payee-name']).toBe(1);
      expect(remaining(text)).toEqual([]);
    }
  });
  it('is idempotent and leaves a stop word alone', () => {
    const once = redact('- **Sam (amount in the vault)**', SC).text;
    expect(redact(once, SC).text).toBe(once);
    expect(redact('Total (amount in the vault)', SC).text).toBe('Total (amount in the vault)');
  });
});

describe('item 203: names on a deal-memo line', () => {
  it('a comma list after "verbal confirms"', () => {
    const line = '- [ ] **Deal memos to 4 verbal confirms - Alpha Band, Beta, Gamma, Delta Echo. Doc 1234. Written.**';
    expect(remaining(line)).toEqual(['deal-names']);
    const { text } = redact(line, SC);
    expect(text).toBe('- [ ] **Deal memos to 4 verbal confirms - <names in the vault>. Doc 1234. Written.**');
    expect(remaining(text)).toEqual([]);
  });
  it('sentence style and slash style lists', () => {
    expect(redact('The deal memos went out. Alpha Band. Beta. Gamma. Delta Echo. Plus a call.', SC).text).toBe(
      'The deal memos went out. <names in the vault>. Plus a call.',
    );
    expect(redact('deal memos to Alpha Band / Beta / Gamma (day 9+).', SC).text).toBe('deal memos to <names in the vault> (day 9+).');
  });
  it('what stays: a deal line with no name list, and a name list on a line that is not about deals', () => {
    for (const line of ['- [ ] **Send deal memos** - DAY 9 OVERDUE (see URGENT)', 'Real stage. Real people. Real music. Real.', 'Pick one of Alpha, Beta, Gamma.']) {
      expect(redact(line, SC).text).toBe(line);
      expect(remaining(line)).toEqual([]);
    }
  });
});

describe('item 203: overdue Stripe task text', () => {
  it('replaces the text after the list marker, keeps the marker', () => {
    const cases: Array<[string, string]> = [
      ['- [ ] **Stripe Payment Links - DAY 9+ OVERDUE** - Two links -> some-issue 9.', '- [ ] Overdue payment-links task (details in the vault)'],
      ['3. **Clear the overdue queue** - Stripe links (day 9), deal memos (day 9).', '3. Overdue payment-links task (details in the vault)'],
      ['- Stripe Payment Links: if not shipped today, this is Day 9 overdue.', '- Overdue payment-links task (details in the vault)'],
    ];
    for (const [line, want] of cases) {
      expect(remaining(line)).toEqual(['stripe-overdue']);
      expect(redact(line, SC).text).toBe(want);
      expect(remaining(want)).toEqual([]);
    }
  });
  it('what stays: Stripe without overdue, overdue without Stripe', () => {
    for (const line of ['- Stripe Payment Links deadline: Sep 26 (4 days)', '- [ ] **Send the invoice** - DAY 9 OVERDUE', '- Stripe fee is 2.9 percent']) {
      expect(redact(line, SC).text).toBe(line);
    }
  });
});

describe('item 203: the sweep only touches its own classes', () => {
  it('--only keeps dashes and unrelated lines byte for byte', () => {
    const doc = ['# Tasks', '', '- [ ] **Sam (amount in the vault) — Day 9**', '- unrelated line — with a dash', ''].join('\n');
    const out = redact(doc, SC).text;
    expect(out).toBe(['# Tasks', '', '- [ ] **Payee (amount in the vault) — Day 9**', '- unrelated line — with a dash', ''].join('\n'));
  });
});

describe('task-person: a person named in a to-do (seat-merge on #4266 and #4251); names are stand-ins', () => {
  // The shape of the line both nights carried, with stand-in names.
  const line =
    '- [ ] **Reply to Alex Rivera** - Post-event follow-up: porta potties, the DJ, Sam Ortiz contact, the poster.';

  it('redacts the person after the verb and the person before "contact"', () => {
    const r = redact(line);
    expect(r.text).toBe(
      '- [ ] **Reply to <person in the vault>** - Post-event follow-up: porta potties, the DJ, <person in the vault> contact, the poster.',
    );
    expect(r.counts['task-person']).toBe(2);
    expect(remaining(line)).toContain('task-person');
    expect(remaining(r.text)).not.toContain('task-person');
  });

  it.each([
    ['- Call Jordan about the venue', '- Call <person in the vault> about the venue'],
    ['1. Follow up with Casey Lin on the poster', '1. Follow up with <person in the vault> on the poster'],
    ['* Send Robin the deck', '* Send <person in the vault> the deck'],
    ['- [x] Ask Morgan for the file', '- [x] Ask <person in the vault> for the file'],
  ])('redacts %j', (input, out) => {
    expect(redact(input, ['task-person']).text).toBe(out);
  });

  it.each([
    ['- [ ] Reply to Zaal about the poster'],
    ['- Send ZOE the log'],
    ['- Call Friday at noon'],
    ['- Send Zoom link to the group'],
    ['- Follow up with Water and Music on the brief'],
    ['Reply to Alex Rivera in a sentence that is not a list item'],
    ['- [ ] Reply to the venue contact (post-event follow-up)'],
  ])('leaves %j alone', (input) => {
    expect(redact(input, ['task-person']).text).toBe(input);
    expect(remaining(input, ['task-person'])).toEqual([]);
  });
});
