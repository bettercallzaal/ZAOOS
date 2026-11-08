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
 * Item 203 (Zaal, 2026-11-04) added three classes after 228 public daily files were
 * found to carry the payee's name beside "(amount in the vault)", the names of
 * third parties in deal-memo lines, and overdue Stripe task text:
 *   6. payee-name     a name still sitting before "(amount in the vault)"      -> Payee (amount in the vault)
 *                     (class 3 now writes "Payee" itself, so a new night never leaves a name)
 *   7. deal-names     a list of three or more names on a "deal memo" or
 *                     "verbal confirm" line                                    -> <names in the vault>
 *   8. stripe-overdue a task line that is both about Stripe and overdue; the
 *                     text after its list marker                               -> Overdue payment-links task (details in the vault)
 *
 * Seat-merge's NEEDS_WORK verdicts on #4266 and #4251 (comment ids in the
 * PR that added this class), 2026-11-08: two nights in a row the tasks file carried "Reply to <First
 * Last> - post-event follow-up: ..., <First Last> contact, ...", a private
 * person and a second contact next to event logistics. No class above covers a
 * person named in a to-do, so:
 *   9. task-person    on a list line, a name after a contact verb ("Reply to",
 *                     "Email", "Call", "Follow up with" ...) or a name right
 *                     before "contact"                                         -> <person in the vault>
 *                     Only Zaal and ZOE stay, plus the NAME_STOP words. Any
 *                     other name is redacted, a public one too: a lost name in a
 *                     public to-do costs less than a private one published.
 *
 * Usage:
 *   node scripts/zoe/nightly-redact.mjs docs/daily/2026-10-16-tasks.md ...   rewrite in place, print per-file counts
 *   node scripts/zoe/nightly-redact.mjs --check <files...>                    exit 1 if any file still carries a class
 *   node scripts/zoe/nightly-redact.mjs --only private-path,email <files...>  only those classes (the sweep of old
 *                                                                              files on main leaves their dashes alone)
 * Exit 2 with no files: a redaction of nothing is not a pass.
 */

import { readFileSync, writeFileSync } from 'node:fs';

// A private path: anything under ~/.zao or ~/.claude, a dotenv file in a home
// subfolder (~/n8n/.env), or any absolute path under /Users/<name> or
// /home/<name>, which carries the machine's username (evaluator on #3957).
const HOME = '(?:~|\\$HOME)';
const SEG = '[A-Za-z0-9_.*-]+';
const PRIVATE_PATH = new RegExp(
  `${HOME}\\/(?:\\.zao|\\.claude|${SEG}\\/\\.env)(?:\\/${SEG})*|\\/(?:Users|home)\\/[A-Za-z0-9_.-]+(?:\\/${SEG})*`,
  'g',
);
const BACKTICK_WITH_PATH = new RegExp(`\`[^\`\\n]*(?:${PRIVATE_PATH.source})[^\`\\n]*\``, 'g');
// A 1Password item: quoted after "1Password", with or without a word between
// ("1Password under "X"", "in", "at", "item", "entry"), an unquoted "1Password
// item X", or an op:// reference.
const OP_ITEM = /1Password\s+(?:(?:item|under|in|at|entry|as)\s+)?["“][^"”\n]+["”]|1Password\s+item\s+[A-Za-z0-9 _-]+|op:\/\/[^\s)]+/g;
// A name (one or two capitalised words), then up to one short word ("next",
// "owes", "paid", "- next"), then an amount with a currency sign or code.
const NAME_AMOUNT = /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)(\s+(?:-\s+)?(?:owes|owed|paid|pay|payment|payout|invoice|to|next|gets|get|receives|due)?\s*)(?:\$\s?\d[\d,]*(?:\.\d+)?(?:\s*(?:USDC|USD|ETH|SOL|k))?|\d[\d,]*(?:\.\d+)?\s*(?:USDC|USD|ETH|SOL))\b/g;
// Capitalised words that sit next to an amount without being a person: sentence
// starts, quantities, products and chains. Measured on main's 546 daily docs
// 2026-10-15: without this list "Next $100 on July 1", "Under $5/day",
// "Min $45/hr" and "Neynar $0.01/cast" were redacted as payments to people.
const NAME_STOP = new Set([
  'The', 'This', 'That', 'Day', 'Days', 'Pool', 'Total', 'Gross', 'Net', 'Sales', 'Price', 'Pay', 'Fee', 'Fees',
  'Week', 'Month', 'Season', 'Next', 'Under', 'Over', 'About', 'Around', 'Min', 'Max', 'One', 'Two', 'Three', 'Per',
  'Send', 'Sent', 'Entry', 'Jul', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Cost', 'Costs', 'Budget', 'Spend', 'Revenue', 'Prize', 'Prizes', 'Bounty', 'Tier', 'Plan', 'Target', 'Cap',
  'Stripe', 'Neynar', 'Vercel', 'Claude', 'Anthropic', 'OpenRouter', 'Ollama', 'Base', 'Solana', 'Ethereum', 'Farcaster',
  'Supabase', 'Hostinger', 'Luma', 'Paragraph', 'Bonfire', 'Artizen', 'Grant', 'Grants', 'Match', 'Deal', 'Deals',
  'Payee',
]);

// Class 6: a name still sitting before the "(amount in the vault)" marker an
// older night wrote. Same name shape and same stop list as class 3.
const PAYEE_MARKED = /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)(\s+(?:-\s+)?(?:owes|owed|paid|pay|payment|payout|invoice|to|next|gets|get|receives|due)?\s*)\(amount in the vault\)/g;
// Class 7: three or more capitalised names in a row, comma separated, on a
// line about deal memos or verbal confirms.
const DEAL_LINE = /deal memos?|verbal confirm/i;
const NAME_TOKEN = String.raw`[A-Z][A-Za-z0-9'’&-]*(?:\s[A-Z][A-Za-z0-9'’&-]*)?`;
const NAME_LIST = new RegExp(NAME_TOKEN + String.raw`(?:,\s*(?:and\s+)?` + NAME_TOKEN + '){2,}', 'g');
// The same names written as sentences: "Alpha Band. Beta. Gamma. Delta Echo." (four or more).
const NAME_SENTENCES = new RegExp(NAME_TOKEN + String.raw`(?:\.\s+` + NAME_TOKEN + String.raw`){3,}\.`, 'g');
// And slash separated: "Alpha Band / Beta / Gamma".
const NAME_SLASHES = new RegExp(NAME_TOKEN + String.raw`(?:\s+\/\s+` + NAME_TOKEN + '){2,}', 'g');
// Class 8: Stripe and overdue on one task line. Keeps the list marker.
const STRIPE_LINE = /stripe/i;
const OVERDUE_WORDS = /overdue|past due|deadline was|if not shipped/i;
const LIST_MARKER = /^(\s*(?:[-*]\s+(?:\[[ xX]\]\s+)?|\d+\.\s+))/;
const STRIPE_REPLACEMENT = 'Overdue payment-links task (details in the vault)';

// Class 9: a person named in a to-do. Only on list lines (the task files).
const CONTACT_VERB = '(?:[Rr]eply to|[Rr]espond to|[Ee]mail|[Cc]all|[Tt]ext|DM|[Mm]essage|[Pp]ing|[Tt]hank|[Aa]sk|[Ii]ntro|[Ff]ollow[ -]up with|[Cc]heck in with|[Mm]eet with|[Ss]end)';
const PERSON = '[A-Z][a-z]+(?:[ -][A-Z][a-z]+)?';
const VERB_PERSON = new RegExp(String.raw`\b(${CONTACT_VERB}\s+)(${PERSON})\b`, 'g');
const PERSON_CONTACT = /\b([A-Z][a-z]+\s+[A-Z][a-z]+)(\s+contact)\b/g;
const TASK_PERSON_KEEP = new Set([
  'Zaal', 'ZOE', 'Zoe',
  // Not people. Measured 2026-11-08 on main's 614 docs/daily files: these were
  // the only non-person words after a contact verb on a list line.
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Today', 'Tomorrow', 'Tonight',
  'Water', 'Green', 'Zoom', 'Atrium', 'Routing', 'Addresses', 'Loom', 'Telegram', 'Discord', 'GitHub',
]);
const keepPerson = (name) => TASK_PERSON_KEEP.has(name.split(/[ -]/)[0]) || NAME_STOP.has(name.split(/[ -]/)[0]);
const isListLine = (line) => LIST_MARKER.test(line);

const lineIsStripeOverdue = (line) => STRIPE_LINE.test(line) && OVERDUE_WORDS.test(line);
const isNameStop = (name) => NAME_STOP.has(name.split(/\s+/)[0]);

// Keep in step with scripts/git-pii-scan.py EMAIL_ALLOW and .claude/rules/pii-hygiene.md.
const EMAIL_ALLOW = new Set(['zaal@thezao.com', 'zaalp99@gmail.com', 'zaal@bettercallzaal.com', 'zoe-zao@agentmail.to', 'hello@thezao.com', 'support@thezao.com']);
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const thirdPartyEmail = (e) => !EMAIL_ALLOW.has(e.toLowerCase());

export const CLASSES = ['private-path', '1password-item', 'name-amount', 'dash', 'email', 'payee-name', 'deal-names', 'stripe-overdue', 'task-person'];

/** Class 9 on one line. Returns the line and the hit count. */
function redactTaskPerson(line) {
  if (!isListLine(line)) return { line, hits: 0 };
  let hits = 0;
  const out = line
    .replace(VERB_PERSON, (m, verb, name) => {
      if (keepPerson(name)) return m;
      hits += 1;
      return `${verb}<person in the vault>`;
    })
    .replace(PERSON_CONTACT, (m, name, tail) => {
      if (keepPerson(name)) return m;
      hits += 1;
      return `<person in the vault>${tail}`;
    });
  return { line: out, hits };
}

/** Pure. Returns the redacted text and how many hits of each class were replaced. */
export function redact(text, only = CLASSES) {
  const on = new Set(only);
  const counts = Object.fromEntries(CLASSES.map((c) => [c, 0]));
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
    if (NAME_STOP.has(name.split(/\s+/)[0])) return m;
    counts['name-amount'] += 1;
    return 'Payee' + sep + '(amount in the vault)';
  });
  if (on.has('payee-name')) out = out.replace(PAYEE_MARKED, (m, name, sep) => {
    if (isNameStop(name)) return m;
    counts['payee-name'] += 1;
    return 'Payee' + sep + '(amount in the vault)';
  });
  if (on.has('task-person')) {
    out = out
      .split('\n')
      .map((line) => {
        const r = redactTaskPerson(line);
        counts['task-person'] += r.hits;
        return r.line;
      })
      .join('\n');
  }
  if (on.has('deal-names') || on.has('stripe-overdue')) {
    out = out
      .split('\n')
      .map((line) => {
        if (on.has('stripe-overdue') && lineIsStripeOverdue(line)) {
          counts['stripe-overdue'] += 1;
          return (LIST_MARKER.exec(line)?.[1] ?? '') + STRIPE_REPLACEMENT;
        }
        if (on.has('deal-names') && DEAL_LINE.test(line)) {
          return line
            .replace(NAME_LIST, () => {
              counts['deal-names'] += 1;
              return '<names in the vault>';
            })
            .replace(NAME_SLASHES, () => {
              counts['deal-names'] += 1;
              return '<names in the vault>';
            })
            .replace(NAME_SENTENCES, () => {
              counts['deal-names'] += 1;
              return '<names in the vault>.';
            });
        }
        return line;
      })
      .join('\n');
  }
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
export function remaining(text, only = CLASSES) {
  const on = new Set(only);
  const found = [];
  if (on.has('private-path') && (BACKTICK_WITH_PATH.test(text) || PRIVATE_PATH.test(text))) found.push('private-path');
  if (on.has('1password-item') && OP_ITEM.test(text)) found.push('1password-item');
  const nm = [...text.matchAll(NAME_AMOUNT)].filter((m) => !NAME_STOP.has(m[1].split(/\s+/)[0]));
  if (on.has('name-amount') && nm.length) found.push('name-amount');
  if (on.has('dash') && /[—–]/.test(text)) found.push('dash');
  if (on.has('email') && [...text.matchAll(EMAIL)].some((m) => thirdPartyEmail(m[0]))) found.push('email');
  if (on.has('payee-name') && [...text.matchAll(PAYEE_MARKED)].some((m) => !isNameStop(m[1]))) found.push('payee-name');
  const lines = text.split('\n');
  if (on.has('deal-names') && lines.some((l) => DEAL_LINE.test(l) && (new RegExp(NAME_LIST.source).test(l) || new RegExp(NAME_SENTENCES.source).test(l) || new RegExp(NAME_SLASHES.source).test(l)))) found.push('deal-names');
  if (on.has('stripe-overdue') && lines.some(lineIsStripeOverdue)) found.push('stripe-overdue');
  if (on.has('task-person') && lines.some((l) => redactTaskPerson(l).hits > 0)) found.push('task-person');
  // The regexes above carry the g flag; reset so a second call starts clean.
  for (const re of [BACKTICK_WITH_PATH, PRIVATE_PATH, OP_ITEM, NAME_AMOUNT, EMAIL, PAYEE_MARKED, NAME_LIST, NAME_SENTENCES, NAME_SLASHES]) re.lastIndex = 0;
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
      const left = remaining(text, only);
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
