/**
 * Prompt-injection pattern guard - implements doc 1023's Key Decisions 2-4
 * (research/security/1023-prompt-injection-threat-landscape-2026/).
 *
 * Pure + dependency-free, mirroring containsSecret (zoe/recall.ts) and
 * containsPii (zoe/pii.ts) - same house pattern, third sibling guard.
 *
 * Flags role-reassignment / hidden-instruction shapes in untrusted content
 * (GitHub issue text, fetched ICM persona bodies, Bonfire episode content).
 * Callers decide fail-open-and-flag vs fail-closed based on how privileged
 * the destination is - a flagged GitHub issue body still reaches a
 * tool-restricted, human-reviewed PR pipeline; a flagged ICM body would
 * become a bot's entire persona, so that caller fails closed instead.
 */

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(the\s+)?(previous|prior|above)\s+instructions?/i,
  /disregard\s+(all\s+)?(the\s+)?(previous|prior|above)\s+instructions?/i,
  /forget\s+(everything|all)\s+(above|before)/i,
  /you\s+are\s+now\s+(a|an)?\s*\w+/i,
  /new\s+(system\s+)?instructions?\s*:/i,
  /system\s+prompt\s*:/i,
  /<!--[\s\S]*?(ignore|instruction|system\s*prompt)[\s\S]*?-->/i,
];

/**
 * Returns the source of every pattern that matched (empty array = clean).
 * Never throws.
 */
export function detectPromptInjection(text: string): string[] {
  return INJECTION_PATTERNS.filter((re) => re.test(text)).map((re) => re.source);
}
