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
}

export const HERMES_PASS_THRESHOLD = 70;
export const HERMES_DEFAULT_MAX_ATTEMPTS = 3;

// Paths Hermes refuses to touch, ever.
export const HERMES_FORBIDDEN_PATHS = [
  'bot/src/hermes',
  'bot/migrations/hermes_runs.sql',
  '.env',
  '.env.local',
  '.env.production',
];
