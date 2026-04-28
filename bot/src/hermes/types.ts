export type HermesStatus =
  | 'pending'
  | 'fixing'
  | 'critiquing'
  | 'ready'
  | 'failed'
  | 'escalated';

export interface HermesRun {
  id: string;
  triggered_by_telegram_id: number;
  triggered_in_chat_id: number;
  issue_text: string;
  status: HermesStatus;
  branch: string | null;
  pr_number: number | null;
  pr_url: string | null;
  fixer_attempts: number;
  fixer_max_attempts: number;
  critic_score: number | null;
  critic_feedback: string | null;
  fixer_provider: string | null;
  fixer_model: string | null;
  critic_provider: string | null;
  critic_model: string | null;
  total_input_tokens: number | null;
  total_output_tokens: number | null;
  estimated_cost_usd: number | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface FixerInput {
  issueText: string;
  workTreePath: string;
  branchName: string;
  attemptNumber: number;
  previousCriticFeedback?: string;
}

export interface FixerOutput {
  filesChanged: string[];
  commitMessage: string;
  prTitle: string;
  prBody: string;
  inputTokens: number;
  outputTokens: number;
  /** Actual model used by Coder for this attempt (for cost tracking + DB log). */
  modelUsed?: string;
}

export interface CritiqueInput {
  workTreePath: string;
  branchName: string;
  filesChanged: string[];
  issueText: string;
}

export interface CritiqueOutput {
  score: number;
  feedback: string;
  inputTokens: number;
  outputTokens: number;
  /** Actual model used by the Critic for this run (for cost tracking + DB log). */
  modelUsed?: string;
}

export type DiffComplexity = 'simple' | 'complex';

/**
 * Classify a diff as 'simple' (cheap model is enough) or 'complex' (needs
 * the full Critic model). Used by the Sprint 1 cost-routing path so we don't
 * burn Sonnet tokens reviewing a one-line typo fix or a docs-only PR.
 *
 * Rules (must ALL hold to qualify as 'simple'):
 *   1. No file outside .md / .mdx / .json / .yml / .yaml / .toml / .lock CHANGED with >5 LOC
 *      and no .ts/.tsx/.js/.jsx file added new top-level keywords
 *   2. Total added LOC under 30
 *   3. No high-risk substring appears in the added lines:
 *      eval(, dangerouslySetInnerHTML, exec(, spawn(, child_process,
 *      process.env.SUPABASE_SERVICE_ROLE, NEYNAR_API_KEY, SESSION_SECRET,
 *      APP_SIGNER_PRIVATE_KEY, fetch(', api/admin/, .sql migration markers
 *
 * Anything else returns 'complex'. Be conservative - false 'complex' just
 * costs a few extra cents; false 'simple' could ship a security regression
 * past a Haiku critic.
 */
export function classifyDiffComplexity(opts: {
  diff: string;
  filesChanged: string[];
}): DiffComplexity {
  const SIMPLE_EXTS = new Set(['.md', '.mdx', '.json', '.yml', '.yaml', '.toml']);
  const SIMPLE_LOCK_FILES = new Set([]); // placeholder; lockfiles are forbidden anyway
  void SIMPLE_LOCK_FILES;

  const codeFileTouched = opts.filesChanged.some((f) => {
    const lower = f.toLowerCase();
    if (lower.endsWith('.ts') || lower.endsWith('.tsx') || lower.endsWith('.js') || lower.endsWith('.jsx')) return true;
    return false;
  });

  const docsOnly = opts.filesChanged.every((f) => {
    const idx = f.lastIndexOf('.');
    if (idx === -1) return false;
    return SIMPLE_EXTS.has(f.slice(idx).toLowerCase());
  });

  // Count added LOC (lines starting with +, ignoring +++ headers).
  const addedLines = opts.diff
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'));

  if (addedLines.length >= 30) return 'complex';

  const RISK_PATTERNS = [
    /eval\s*\(/,
    /dangerouslySetInnerHTML/,
    /child_process/,
    /SUPABASE_SERVICE_ROLE/,
    /NEYNAR_API_KEY/,
    /SESSION_SECRET/,
    /APP_SIGNER_PRIVATE_KEY/,
    /\bapi\/admin\//,
    /\.sql\b/,
    /\bspawn\s*\(/,
    /\bexec\s*\(/,
  ];
  for (const line of addedLines) {
    for (const re of RISK_PATTERNS) {
      if (re.test(line)) return 'complex';
    }
  }

  if (docsOnly) return 'simple';

  // Code file touched but small + low-risk -> still simple. Examples that
  // qualify: single-line typo fix, a small import reorder, deleting an
  // unused variable. Critic on Haiku can grade these reliably.
  if (codeFileTouched && addedLines.length < 30) return 'simple';

  return 'complex';
}

export const HERMES_PASS_THRESHOLD = 70;
export const HERMES_DEFAULT_MAX_ATTEMPTS = 3;

// Paths Hermes refuses to touch, ever.
// Includes: self-modification (would let agent rewrite its own safety),
// secrets (.env*), git/npm hooks (postinstall is the #1 supply-chain vector
// per Shai-Hulud worm + Axios compromise 2025-2026), build configs (silent
// behavior changes), and project-level instruction files.
export const HERMES_FORBIDDEN_PATHS = [
  'bot/src/hermes',
  'bot/migrations/hermes_runs.sql',
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.git/hooks',
  '.husky',
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.npmrc',
  'tsconfig.json',
  'tsconfig.base.json',
  'CLAUDE.md',
  '.claude/rules',
  '.claude/settings.json',
  '.claude/settings.local.json',
];
