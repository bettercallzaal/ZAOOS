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
  it('a payment line about a named person keeps the name, hides the amount', () => {
    expect(remaining(PAY_LINE)).toEqual(['name-amount']);
    const { text } = redact(PAY_LINE);
    expect(text).toBe('- [ ] **Sam (amount in the vault) - Day 90+** - One action.');
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
    expect(redact(line).text).toBe('- **Jul 1** - Sam next (amount in the vault)');
  });
  it('<full name> - next $<amt> USDC', () => {
    const line = '- **July 1 (14 days)** - Sam Example - next $100 USDC';
    expect(remaining(line)).toEqual(['name-amount']);
    expect(redact(line).text).toBe('- **July 1 (14 days)** - Sam Example - next (amount in the vault)');
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
    expect(redact('paid Candy 50 USDC – done').text).toBe('paid Candy (amount in the vault) - done');
  });
});
