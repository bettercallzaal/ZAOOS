/**
 * scripts/zoe/nightly-redact.mjs - what the ZOE nightly processing run must
 * strip from its docs/daily files before it opens the PR, because ZAOOS is
 * public.
 *
 * Measured 2026-10-15 on ZAOOS #3938 and #3956 and on main's
 * docs/daily/2026-10-13-tasks.md and 2026-10-14-tasks.md: every night the
 * generator published a shell command that writes a secret into a file under
 * ~/.zao, the name of the 1Password item that holds the key, a payment line
 * about a named person ("Jose $100 USDC"), and em dashes. The run is a cloud
 * scheduled session; its prompt is not in this repo, so this file is the rule
 * it runs, and the test is the proof the rule holds.
 *
 * Four classes, each replaced by a placeholder that says what was there:
 *   1. a path under ~/.zao, $HOME/.zao, /home/<user>/.zao or /Users/<user>/.zao
 *      (the whole path)                               -> <private path>
 *      and a backtick command that contains one       -> `<command in the vault>`
 *   2. a 1Password or vault item name: 1Password "Name", 1Password item Name,
 *      op://vault/item                                 -> 1Password (item in the vault)
 *   3. an amount next to a person's name: Jose $100 USDC, Jose owes $100,
 *      paid Jose 50 USDC                               -> Jose (amount in the vault)
 *      Amounts with no name next to them stay: a pool of 365.94 USDC is a
 *      product number, not a payment to a person.
 *   4. em and en dashes                                -> " - " and "-"
 *   5. an email address not on the ZAO allowlist (the set in
 *      scripts/git-pii-scan.py EMAIL_ALLOW, mirrored here; the scanner is the
 *      gate, this is the writer's side)                -> <redacted-email>
 *      Found 2026-10-15 when the pre-commit scanner blocked the sweep of
 *      docs/daily on main: a third-party address in 16 files since July.
 *
 * Usage:
 *   node scripts/zoe/nightly-redact.mjs docs/daily/2026-10-16-tasks.md ...   rewrite in place, print per-file counts
 *   node scripts/zoe/nightly-redact.mjs --check <files...>                    exit 1 if any file still carries a class
 *   node scripts/zoe/nightly-redact.mjs --only private-path,email <files...>  only those classes (the sweep of old
 *                                                                              files on main leaves their dashes alone)
 * Exit 2 with no files: a redaction of nothing is not a pass.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const PRIVATE_PATH = /(?:~|\$HOME|\/home\/[A-Za-z0-9_.-]+|\/Users\/[A-Za-z0-9_.-]+)\/\.zao(?:\/[A-Za-z0-9_.-]+)*/g;
const BACKTICK_WITH_PATH = /`[^`\n]*(?:~|\$HOME|\/home\/[A-Za-z0-9_.-]+|\/Users\/[A-Za-z0-9_.-]+)\/\.zao[^`\n]*`/g;
const OP_ITEM = /1Password\s+(?:item\s+)?["“][^"”\n]+["”]|1Password\s+item\s+[A-Za-z0-9 _-]+|op:\/\/[^\s)]+/g;
// A capitalised word (a name), optional verb, then an amount with a currency sign or code.
const NAME_AMOUNT = /\b([A-Z][a-z]{2,})(\s+(?:owes|owed|paid|pay|payment|payout|invoice|to)?\s*)(?:\$\s?\d[\d,]*(?:\.\d+)?(?:\s*(?:USDC|USD|ETH|SOL|k))?|\d[\d,]*(?:\.\d+)?\s*(?:USDC|USD|ETH|SOL))\b/g;
// Capitalised words that sit next to an amount without being a person: sentence
// starts, quantities, products and chains. Measured on main's 546 daily docs
// 2026-10-15: without this list "Next $100 on July 1", "Under $5/day",
// "Min $45/hr" and "Neynar $0.01/cast" were redacted as payments to people.
const NAME_STOP = new Set([
  'The', 'This', 'That', 'Day', 'Days', 'Pool', 'Total', 'Gross', 'Net', 'Sales', 'Price', 'Pay', 'Fee', 'Fees',
  'Week', 'Month', 'Season', 'Next', 'Under', 'Over', 'About', 'Around', 'Min', 'Max', 'One', 'Two', 'Three', 'Per',
  'Send', 'Sent', 'Entry', 'Cost', 'Costs', 'Budget', 'Spend', 'Revenue', 'Prize', 'Prizes', 'Bounty', 'Tier', 'Plan', 'Target', 'Cap',
  'Stripe', 'Neynar', 'Vercel', 'Claude', 'Anthropic', 'OpenRouter', 'Ollama', 'Base', 'Solana', 'Ethereum', 'Farcaster',
  'Supabase', 'Hostinger', 'Luma', 'Paragraph', 'Bonfire', 'Artizen', 'Grant', 'Grants', 'Match', 'Deal', 'Deals',
]);

// Keep in step with scripts/git-pii-scan.py EMAIL_ALLOW and .claude/rules/pii-hygiene.md.
const EMAIL_ALLOW = new Set(['zaal@thezao.com', 'zaalp99@gmail.com', 'zaal@bettercallzaal.com', 'zoe-zao@agentmail.to', 'hello@thezao.com', 'support@thezao.com']);
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const thirdPartyEmail = (e) => !EMAIL_ALLOW.has(e.toLowerCase());

export const CLASSES = ['private-path', '1password-item', 'name-amount', 'dash', 'email'];

/** Pure. Returns the redacted text and how many hits of each class were replaced. */
export function redact(text, only = CLASSES) {
  const on = new Set(only);
  const counts = { 'private-path': 0, '1password-item': 0, 'name-amount': 0, dash: 0, email: 0 };
  let out = text;
  if (on.has('private-path')) out = out.replace(BACKTICK_WITH_PATH, () => {
    counts['private-path'] += 1;
    return '`<command in the vault>`';
  });
  if (on.has('private-path')) out = out.replace(PRIVATE_PATH, () => {
    counts['private-path'] += 1;
    return '<private path>';
  });
  if (on.has('1password-item')) out = out.replace(OP_ITEM, () => {
    counts['1password-item'] += 1;
    return '1Password (item in the vault)';
  });
  if (on.has('name-amount')) out = out.replace(NAME_AMOUNT, (m, name, sep) => {
    if (NAME_STOP.has(name)) return m;
    counts['name-amount'] += 1;
    return `${name}${sep}(amount in the vault)`;
  });
  if (on.has('dash')) out = out.replace(/\s*—\s*/g, () => {
    counts.dash += 1;
    return ' - ';
  });
  if (on.has('dash')) out = out.replace(/–/g, () => {
    counts.dash += 1;
    return '-';
  });
  if (on.has('email')) out = out.replace(EMAIL, (e) => {
    if (!thirdPartyEmail(e)) return e;
    counts.email += 1;
    return '<redacted-email>';
  });
  return { text: out, counts };
}

/** Pure. The classes still present in a text, for --check. */
export function remaining(text) {
  const found = [];
  if (BACKTICK_WITH_PATH.test(text) || PRIVATE_PATH.test(text)) found.push('private-path');
  if (OP_ITEM.test(text)) found.push('1password-item');
  const nm = [...text.matchAll(NAME_AMOUNT)].filter((m) => !NAME_STOP.has(m[1]));
  if (nm.length) found.push('name-amount');
  if (/[—–]/.test(text)) found.push('dash');
  if ([...text.matchAll(EMAIL)].some((m) => thirdPartyEmail(m[0]))) found.push('email');
  // The regexes above carry the g flag; reset so a second call starts clean.
  for (const re of [BACKTICK_WITH_PATH, PRIVATE_PATH, OP_ITEM, NAME_AMOUNT, EMAIL]) re.lastIndex = 0;
  return found;
}

function main(argv) {
  const check = argv[0] === '--check';
  let only = CLASSES;
  let rest = check ? argv.slice(1) : argv;
  if (rest[0] === '--only') {
    only = rest[1].split(',').filter((c) => CLASSES.includes(c));
    if (!only.length) {
      console.error(`nightly-redact: --only names none of ${CLASSES.join(', ')}`);
      return 2;
    }
    rest = rest.slice(2);
  }
  const files = rest;
  if (!files.length) {
    console.error('nightly-redact: no files given; a redaction of nothing is not a pass');
    return 2;
  }
  let dirty = 0;
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    if (check) {
      const left = remaining(text);
      if (left.length) {
        dirty += 1;
        console.log(`${f}: ${left.join(', ')}`);
      }
      continue;
    }
    const { text: out, counts } = redact(text, only);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (out !== text) writeFileSync(f, out);
    console.log(`${f}: ${total} replaced (${CLASSES.map((c) => `${c} ${counts[c]}`).join(', ')})`);
  }
  if (check) {
    console.log(dirty ? `${dirty} file(s) still carry a class` : `clean: ${files.length} file(s)`);
    return dirty ? 1 : 0;
  }
  return 0;
}

if (process.argv[1] && process.argv[1].endsWith('nightly-redact.mjs')) {
  process.exit(main(process.argv.slice(2)));
}
