-- Proposals — community members propose projects, others vote with Respect weight
-- Voting power = on-chain OG + ZOR balance at time of vote

CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'approved', 'rejected', 'completed')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'music', 'tech', 'governance', 'treasury')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closes_at TIMESTAMPTZ  -- optional deadline
);

CREATE TABLE IF NOT EXISTS proposal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES users(id),
  vote TEXT NOT NULL CHECK (vote IN ('for', 'against', 'abstain')),
  respect_weight INTEGER NOT NULL DEFAULT 0,  -- voter's total respect at time of vote
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(proposal_id, voter_id)               -- one vote per user per proposal
);

CREATE TABLE IF NOT EXISTS proposal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_author ON proposals(author_id);
CREATE INDEX IF NOT EXISTS idx_proposals_created ON proposals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_proposal ON proposal_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_comments_proposal ON proposal_comments(proposal_id);

-- RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_comments ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at on proposals
CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
