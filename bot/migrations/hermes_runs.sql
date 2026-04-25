-- Hermes dual-bot run tracking. See doc 523.
-- Stock-Coder writes the fix; Hermes-Stock grades it; loop until score >= 70 or 3 attempts.

CREATE TABLE IF NOT EXISTS hermes_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by_telegram_id bigint NOT NULL,
  triggered_in_chat_id bigint NOT NULL,
  issue_text text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
    -- pending | fixing | critiquing | ready | failed | escalated
  branch text,
  pr_number int,
  pr_url text,
  fixer_attempts int NOT NULL DEFAULT 0,
  fixer_max_attempts int NOT NULL DEFAULT 3,
  critic_score numeric,
  critic_feedback text,
  fixer_provider text,                  -- 'anthropic' | 'minimax' (fallback)
  fixer_model text,                      -- e.g. 'claude-opus-4-7'
  critic_provider text,
  critic_model text,
  total_input_tokens int,
  total_output_tokens int,
  estimated_cost_usd numeric,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_hermes_runs_status ON hermes_runs (status);
CREATE INDEX IF NOT EXISTS idx_hermes_runs_triggered_by ON hermes_runs (triggered_by_telegram_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hermes_runs_created ON hermes_runs (created_at DESC);

-- RLS: service role only (bot uses service role)
ALTER TABLE hermes_runs ENABLE ROW LEVEL SECURITY;
