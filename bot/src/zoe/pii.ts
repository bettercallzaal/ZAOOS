/**
 * pii.ts — PII scan + redaction for anything ZOE writes outward (Bonfire
 * episodes, recap text, committed artifacts).
 *
 * Implements `.claude/rules/pii-hygiene.md` Rule 3 as code. The pii-hygiene
 * doc flags that the Bonfire emit path does NOT yet scan for personal data;
 * doc 796 (Decision 4) makes ZOE write open-loops/commitments to Bonfire as
 * a cross-agent memory source, which is the highest-leakage path in the stack.
 * Every emit runs through `containsPii` and SKIPS on a non-allowlisted match,
 * mirroring the best-effort secret-scan already in recall.ts (`containsSecret`).
 *
 * Pure + dependency-free so it is trivially unit-testable and reusable by any
 * future outward-writing path (recaps, Telegram blocks, meeting episodes).
 */

/** Public emails that may appear unredacted (pii-hygiene allowlist). */
export const EMAIL_ALLOWLIST: ReadonlySet<string> = new Set([
  'zaal@thezao.com',
  'zaalp99@gmail.com',
  'zaal@bettercallzaal.com',
  'zoe-zao@agentmail.to',
  'hello@thezao.com',
  'support@thezao.com',
]);

/** Public ZAO bot handles that may appear unredacted (pii-hygiene allowlist). */
export const TELEGRAM_ALLOWLIST: ReadonlySet<string> = new Set([
  '@zaoclaw_bot',
  '@zoe_hermes_bot',
  '@zaodevz_bot',
  '@zabal_bonfire',
  '@zaostockteambot',
  '@zaocoworkingbot',
]);

export type PiiKind =
  | 'email'
  | 'us-phone'
  | 'intl-phone'
  | 'street-address'
  | 'birthdate'
  | 'credit-card'
  | 'telegram-handle';

// Patterns lifted verbatim from pii-hygiene.md Rule 3. `g` flags so we can
// enumerate every hit; callers must not rely on a shared lastIndex (we always
// build a fresh matcher per scan).
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const US_PHONE_RE = /\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
const INTL_PHONE_RE = /\+\d{1,3}\s*\d{6,}/g;
const STREET_RE = /\d{1,5}\s+\w+\s+(?:St|Ave|Blvd|Rd|Dr|Ln|Way|Pl|Ct|Pkwy)\b/gi;
const BIRTHDATE_RE = /\b(?:0?[1-9]|1[012])[-/](?:0?[1-9]|[12]\d|3[01])[-/](?:19|20)\d{2}\b/g;
const CREDIT_CARD_RE = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
// A Telegram handle is @ + word chars. We treat it as PII only when it is NOT
// on the allowlist (checked at match time, not in the regex).
const TG_HANDLE_RE = /@\w+/g;

/** A single PII hit with its kind and the exact substring matched. */
export interface PiiMatch {
  kind: PiiKind;
  value: string;
}

function isAllowlistedEmail(value: string): boolean {
  return EMAIL_ALLOWLIST.has(value.toLowerCase());
}

function isAllowlistedHandle(value: string): boolean {
  return TELEGRAM_ALLOWLIST.has(value.toLowerCase());
}

/**
 * Scan text for personal data. Returns every non-allowlisted hit. An empty
 * array means the text is clean by the pii-hygiene Rule 3 patterns.
 *
 * Order matters: emails are detected before telegram handles so an email's
 * local-part `@domain` is never re-flagged as a handle. We strip detected
 * emails from the working copy before the handle pass.
 */
export function scanPii(text: string): PiiMatch[] {
  if (!text) return [];
  const matches: PiiMatch[] = [];

  let handleHaystack = text;

  for (const value of text.match(EMAIL_RE) ?? []) {
    if (!isAllowlistedEmail(value)) matches.push({ kind: 'email', value });
    // Remove the email span so its "@domain" tail can't double-fire as a handle.
    handleHaystack = handleHaystack.replace(value, ' ');
  }
  for (const value of text.match(US_PHONE_RE) ?? []) {
    matches.push({ kind: 'us-phone', value: value.trim() });
  }
  for (const value of text.match(INTL_PHONE_RE) ?? []) {
    matches.push({ kind: 'intl-phone', value: value.trim() });
  }
  for (const value of text.match(STREET_RE) ?? []) {
    matches.push({ kind: 'street-address', value });
  }
  for (const value of text.match(BIRTHDATE_RE) ?? []) {
    matches.push({ kind: 'birthdate', value });
  }
  for (const value of text.match(CREDIT_CARD_RE) ?? []) {
    matches.push({ kind: 'credit-card', value });
  }
  for (const value of handleHaystack.match(TG_HANDLE_RE) ?? []) {
    if (!isAllowlistedHandle(value)) matches.push({ kind: 'telegram-handle', value });
  }

  return matches;
}

/**
 * True if the text carries any non-allowlisted PII. Sibling to recall.ts's
 * `containsSecret` — the two together gate every Bonfire emit.
 */
export function containsPii(text: string): boolean {
  return scanPii(text).length > 0;
}

const PLACEHOLDERS: Record<PiiKind, string> = {
  email: '<redacted-email>',
  'us-phone': '<redacted-phone>',
  'intl-phone': '<redacted-phone>',
  'street-address': '<redacted-address>',
  birthdate: '<redacted-date>',
  'credit-card': '<redacted-cc>',
  'telegram-handle': '@<redacted-handle>',
};

/**
 * Replace every non-allowlisted PII hit with its placeholder. Used when a
 * caller would rather salvage a mostly-clean episode than drop it entirely.
 * The emit path defaults to SKIP-on-match (safer); redaction is opt-in.
 */
export function redactPii(text: string): string {
  let out = text;
  for (const { kind, value } of scanPii(text)) {
    out = out.split(value).join(PLACEHOLDERS[kind]);
  }
  return out;
}
