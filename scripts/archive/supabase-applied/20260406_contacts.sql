-- Contacts table for ROLO digital rolodex
CREATE TABLE IF NOT EXISTS contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  handle          text,
  category        text,
  met_at          text,
  organization    text,
  location        text,
  location_2      text,
  notes           text,
  can_support     text,
  background      text,
  extra           text,
  score           numeric DEFAULT 0,
  checked         boolean DEFAULT false,
  first_met       date,
  last_interaction timestamptz,
  source          text DEFAULT 'import',
  fid             integer,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_contacts_name ON contacts(name);
CREATE INDEX idx_contacts_score ON contacts(score DESC);
CREATE INDEX idx_contacts_category ON contacts(category);
CREATE INDEX idx_contacts_first_met ON contacts(first_met DESC);
CREATE INDEX idx_contacts_handle ON contacts(handle);

-- RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read contacts" ON contacts FOR SELECT USING (true);
CREATE POLICY "Service role can insert contacts" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update contacts" ON contacts FOR UPDATE USING (true);
CREATE POLICY "Service role can delete contacts" ON contacts FOR DELETE USING (true);
