/**
 * task-classifier.ts - auto-tag a task from its title + notes (doc 983 Rec #4).
 *
 * Deterministic keyword classifier: given a task's text, assign a ZAO brand, a
 * board work-type category, cross-cutting theme tags, and the judgment-routing
 * next_owner. Runs on the write-path (buildTeamTaskRow) so every ZOE-created
 * task self-tags on insert, and in the reconciler to backfill older rows.
 *
 * Pure + dependency-free so it is trivially testable and reusable. Keep the rule
 * tables in sync with the board's canonical brands (lib/brands.ts) + categories
 * and the auto-tagger batch pass that first populated these fields.
 */

export type NextOwner = 'me' | 'agent' | 'review' | 'blocked';

export interface Classification {
  brands: string[];
  category: string;
  themes: string[];
  nextOwner: NextOwner;
}

export interface ClassifyInput {
  title: string;
  notes?: string | null;
  /** already-known delegation target (metadata.delegated_to) -> forces agent */
  delegatedTo?: string | null;
  /** already-known needs_zaal flag -> forces me */
  needsZaal?: boolean;
  status?: string | null;
}

type Rule = [RegExp, string];

// Brand: canonical names from lib/brands.ts. First match wins; default The ZAO.
const BRAND_RULES: Rule[] = [
  [/wavewarz|solana bridge/i, 'WaveWarZ'],
  [/zaostock|art of ellsworth|mainecf|fractured atlas|roddy|parklet/i, 'ZAOstock'],
  [/zabal games|zabal gamez|zabal university/i, 'ZABAL Games'],
  [/\bzuke\b|\bjuke\b/i, 'Juke'],
  [/\bcoc\b|concertz/i, 'COC Concertz'],
  [/hyperagent|\bzoe\b|\bzol\b/i, 'ZOE'],
  [/poidh/i, 'POIDH'],
  [/bonfire/i, 'Bonfire'],
  [/fractal|ordao|respect|whitepaper|governance/i, 'The ZAO'],
];

// Work-type: the board's canonical CATEGORIES enum. First match wins; default Other.
const CATEGORY_RULES: Rule[] = [
  [/whitepaper|mint|permaweb/i, 'ZAO Devz'],
  [/bot|bridge|deploy|migration|vercel|\bci\b|smoke|env var|test-coverage|graduation|integration|repo|skill dup|classifier|technical|data hygiene|wallet fix/i, 'Site / Tech'],
  [/permit|sponsor|kickoff|logistics|facebook event|checklist|outreach|understud/i, 'Ops'],
  [/profile|campaign|101 video|content|post criteria|wiki|newsletter/i, 'Content'],
  [/\bdm\b|socials|farcaster|spaces|cast/i, 'Social'],
  [/research|intel|re-research|doc |novelty|numbers|analytics/i, 'Other'],
];

// Theme: cross-cutting lens. Multiple can match (capped at 2). Default ops.
const THEME_RULES: Rule[] = [
  [/onchain|on-chain|wallet|mint|respect|solana|fractal|ordao|permaweb|nft|dao|token/i, 'web3'],
  [/agent|hyperagent|\bzoe\b|\bzol\b|claude|classifier|automation|intelligence app|research-radar/i, 'ai'],
  [/wavewarz|recording|artist|release|song|music|godcloud|rockumentary/i, 'music'],
  [/zaostock|festival|coc|concertz|palooza|chella|event/i, 'events'],
  [/profile|outreach|campaign|social|university|whop|streaming|bid-on|platform/i, 'growth'],
  [/fractal|ordao|respect|governance|whitepaper|dao/i, 'governance'],
  [/research|intel|re-research|hyperstition|novelty|numbers|analytics/i, 'research'],
];

function firstMatch(text: string, rules: Rule[], fallback: string): string {
  for (const [re, val] of rules) if (re.test(text)) return val;
  return fallback;
}

function allMatches(text: string, rules: Rule[], cap: number): string[] {
  const out: string[] = [];
  for (const [re, val] of rules) {
    if (re.test(text) && !out.includes(val)) out.push(val);
    if (out.length >= cap) break;
  }
  return out;
}

/**
 * Classify a task. Deterministic - same input always yields the same tags.
 * Routing logic (nextOwner):
 * - delegated_to set -> 'agent' (offloaded task)
 * - needs_zaal set -> 'me' (explicit human judgment needed)
 * - status=blocked -> 'blocked'
 * - code-verifiable tasks (build/test/deploy/ci) -> 'agent' (ZOE can verify)
 * - unclear/unmapped tasks -> 'review' (human routes; never auto-dump on one person)
 */
export function classifyTask(input: ClassifyInput): Classification {
  const text = `${input.title} ${input.notes ?? ''}`.toLowerCase();
  const brand = firstMatch(text, BRAND_RULES, 'The ZAO');
  const category = firstMatch(text, CATEGORY_RULES, 'Other');
  const themes = allMatches(text, THEME_RULES, 2);
  if (themes.length === 0) themes.push('ops');

  let nextOwner: NextOwner;
  if (input.delegatedTo) {
    nextOwner = 'agent';
  } else if (input.needsZaal) {
    nextOwner = 'me';
  } else if ((input.status ?? '').toLowerCase() === 'blocked') {
    nextOwner = 'blocked';
  } else if (
    // Code-verifiable checks that ZOE/agents can handle (no human judgment needed).
    /build|test|deploy|ci|smoke|typecheck|lint|coverage|esbuild|vitest|tsc/i.test(text)
  ) {
    // These are automated verification tasks; route to agent for post-deploy checks.
    nextOwner = 'agent';
  } else {
    // Unclear/unmapped tasks: route to 'review' for human routing, not auto-assigned.
    // This prevents auto-dumping on a single person (e.g. Iman) and ensures Zaal sees
    // all unclassified work for intentional routing.
    nextOwner = 'review';
  }

  return { brands: [brand], category, themes, nextOwner };
}

/**
 * Merge a classification into a tracker row / metadata object. Non-destructive:
 * only fills brands/category when absent, always refreshes metadata.themes +
 * metadata.next_owner + stamps autotagged. Returns a new object; does not mutate.
 */
export function applyClassification(
  row: Record<string, unknown>,
  c: Classification,
  stampedAt: string,
): Record<string, unknown> {
  const meta = { ...((row.metadata as Record<string, unknown>) ?? {}) };
  meta.themes = c.themes;
  meta.next_owner = c.nextOwner;
  meta.autotagged = stampedAt;
  const out: Record<string, unknown> = { ...row, metadata: meta };
  // brands/category are dedicated columns; only set when the row lacks them so a
  // human/explicit value is never clobbered.
  const existingBrands = row.brands;
  if (!Array.isArray(existingBrands) || existingBrands.length === 0) out.brands = c.brands;
  if (!row.category) out.category = c.category;
  return out;
}

/** A task row as read from the tracker for reconciliation. */
export interface TrackerRow {
  id: string;
  title: string;
  notes?: string | null;
  status?: string | null;
  brands?: unknown;
  category?: unknown;
  metadata?: Record<string, unknown> | null;
}

/** A row needs tagging when it has no theme tags or no next_owner yet. */
export function needsTagging(row: TrackerRow): boolean {
  const meta = row.metadata ?? {};
  const noThemes = !Array.isArray(meta.themes) || (meta.themes as unknown[]).length === 0;
  const noOwner = !meta.next_owner;
  return noThemes || noOwner;
}

export interface ReconcilePatch {
  id: string;
  patch: Record<string, unknown>;
}

/**
 * Pure planner: from a batch of tracker rows, produce the PATCH bodies for the
 * ones that need tagging. Preserves an existing delegated_to/needs_zaal so the
 * next_owner routing stays correct. The network wrapper applies these.
 */
export function planReconciliation(rows: TrackerRow[], stampedAt: string): ReconcilePatch[] {
  const patches: ReconcilePatch[] = [];
  for (const row of rows) {
    if (!needsTagging(row)) continue;
    const meta = row.metadata ?? {};
    const c = classifyTask({
      title: row.title,
      notes: row.notes ?? null,
      delegatedTo: (meta.delegated_to as string) ?? null,
      needsZaal: Boolean(meta.needs_zaal),
      status: row.status ?? null,
    });
    const applied = applyClassification(
      { title: row.title, brands: row.brands, category: row.category, metadata: meta },
      c,
      stampedAt,
    );
    // Only ship the fields the reconciler is allowed to touch.
    const patch: Record<string, unknown> = { metadata: applied.metadata };
    if ('brands' in applied && applied.brands !== row.brands) patch.brands = applied.brands;
    if ('category' in applied && applied.category !== row.category) patch.category = applied.category;
    patches.push({ id: row.id, patch });
  }
  return patches;
}
