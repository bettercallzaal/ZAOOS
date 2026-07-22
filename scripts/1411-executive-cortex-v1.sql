/**
 * Executive Cortex v1 - Database schema
 *
 * GATED MIGRATION: This script is gated to Zaal. Do NOT apply autonomously.
 * The Cortex is advisory (reads only; never executes). These tables store
 * goal hierarchies, work dependencies, and immutable decision receipts.
 *
 * Applied after: PR #2074 (Spine control-plane) is live.
 * Depends on: Supabase RLS, recipes table pattern (from Spine).
 *
 * NOTE: The Cortex reads goals/work_dependencies but does NOT mutate them
 * (writes go through other systems). decision_receipts are append-only logs.
 * For learning/auditing, the Cortex queries decision_receipts to analyze
 * what was recommended vs what actually happened.
 */

-- ============================================================================
-- Goals Table: The mission -> objective -> task hierarchy
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('mission', 'objective', 'task')),
  parent_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,

  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'backlog' CHECK (status IN (
    'backlog', 'ready', 'in_progress', 'blocked', 'completed', 'cancelled'
  )),

  percent_complete INT NOT NULL DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
  confidence DECIMAL(3, 2) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Audit trail
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Indices
  created_idx TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (created_at) STORED
);

CREATE INDEX idx_goals_parent_id ON public.goals(parent_id);
CREATE INDEX idx_goals_status ON public.goals(status);
CREATE INDEX idx_goals_kind ON public.goals(kind);
CREATE INDEX idx_goals_created_at ON public.goals(created_at DESC);

-- ============================================================================
-- Work Dependencies: The directed edges in the task DAG
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.work_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  to_goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,

  kind VARCHAR(20) NOT NULL CHECK (kind IN ('blocks', 'context', 'approval')),
  reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Prevent self-loops
  CONSTRAINT no_self_loop CHECK (from_goal_id != to_goal_id),
  -- Prevent duplicate edges
  CONSTRAINT unique_edge UNIQUE (from_goal_id, to_goal_id, kind)
);

CREATE INDEX idx_work_dependencies_from ON public.work_dependencies(from_goal_id);
CREATE INDEX idx_work_dependencies_to ON public.work_dependencies(to_goal_id);
CREATE INDEX idx_work_dependencies_kind ON public.work_dependencies(kind);

-- ============================================================================
-- Decision Receipts: Immutable Cortex recommendations
-- ============================================================================
-- NOTE: This table mirrors the Spine's receipts pattern for consistency.
-- The Cortex emits receipts; they are never updated (append-only).
CREATE TABLE IF NOT EXISTS public.decision_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  decision_kind VARCHAR(50) NOT NULL CHECK (decision_kind IN (
    'most_important_now',
    'top_5_priorities',
    'what_is_blocking',
    'what_can_be_delayed',
    'what_needs_approval',
    'what_can_parallelize',
    'blockers_and_risks'
  )),

  answer JSONB NOT NULL, -- goal IDs, or a BottleneckReport
  reasoning TEXT NOT NULL,
  confidence DECIMAL(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),

  inputs_snapshot_id UUID, -- reference to the ContextSnapshot used
  recommended_action TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- For auditing: which goals were in context when this receipt was generated
  goals_context_ids UUID[] NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_decision_receipts_decision_kind ON public.decision_receipts(decision_kind);
CREATE INDEX idx_decision_receipts_created_at ON public.decision_receipts(created_at DESC);
CREATE INDEX idx_decision_receipts_confidence ON public.decision_receipts(confidence DESC);

-- ============================================================================
-- RLS Policies: All tables require session + membership check
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_receipts ENABLE ROW LEVEL SECURITY;

-- Goals: all members can read; only ZAO admins can write
CREATE POLICY goals_read ON public.goals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.members WHERE members.user_id = auth.uid()
  ));

CREATE POLICY goals_write ON public.goals FOR INSERT, UPDATE, DELETE
  USING (EXISTS (
    SELECT 1 FROM public.members
    WHERE members.user_id = auth.uid()
      AND members.role IN ('admin', 'moderator')
  ));

-- Work dependencies: same as goals
CREATE POLICY work_dependencies_read ON public.work_dependencies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.members WHERE members.user_id = auth.uid()
  ));

CREATE POLICY work_dependencies_write ON public.work_dependencies FOR INSERT, UPDATE, DELETE
  USING (EXISTS (
    SELECT 1 FROM public.members
    WHERE members.user_id = auth.uid()
      AND members.role IN ('admin', 'moderator')
  ));

-- Decision receipts: all members can read (for learning); only Cortex system can write
CREATE POLICY decision_receipts_read ON public.decision_receipts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.members WHERE members.user_id = auth.uid()
  ));

-- Insert is restricted to a service role (the Cortex's write flow)
-- Not exposed to clients; only the Cortex backend (ZOE) writes these
CREATE POLICY decision_receipts_write ON public.decision_receipts FOR INSERT
  USING (false); -- Clients never write; ZOE writes via service role

-- ============================================================================
-- Triggers: Maintain updated_at automatically
-- ============================================================================
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_updated_at();

-- ============================================================================
-- Views: Strategic snapshots for the Cortex to consume
-- ============================================================================
-- TODO: As the Cortex matures, add views for:
-- - active_goals: goals in ready/in_progress/blocked status
-- - critical_path: goals on the critical path (computed via topological sort)
-- - blockers_summary: aggregated counts of blocked/waiting tasks
-- - goals_by_confidence: goals sorted by confidence (for risk assessment)

-- ============================================================================
-- Comments: Schema documentation
-- ============================================================================
COMMENT ON TABLE public.goals IS
  'Mission -> objective -> task hierarchy. The Cortex reads these to recommend priorities. Writes via ZOE/admins only.';

COMMENT ON TABLE public.work_dependencies IS
  'Directed edges in the task DAG: blocks, context, approval. The Cortex analyzes these to find critical path, detect cycles, identify blocked work.';

COMMENT ON TABLE public.decision_receipts IS
  'Immutable log of Cortex recommendations. Append-only for auditing and learning. Keyed by decision_kind (most_important_now, what_is_blocking, etc.).';

COMMENT ON COLUMN public.decision_receipts.answer IS
  'Recommendation answer: array of goal IDs, or a BottleneckReport JSON object.';

COMMENT ON COLUMN public.decision_receipts.inputs_snapshot_id IS
  'Reference to the ContextSnapshot used to make this decision (for audit trail and learning).';
