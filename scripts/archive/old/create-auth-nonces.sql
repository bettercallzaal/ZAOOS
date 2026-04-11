-- Auth nonces table — replaces in-memory nonce store
-- Fixes login failures on Vercel serverless (each function instance has separate memory)

CREATE TABLE IF NOT EXISTS auth_nonces (
  nonce TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-cleanup expired nonces daily
SELECT cron.schedule('cleanup-auth-nonces', '0 */1 * * *',
  $$DELETE FROM auth_nonces WHERE expires_at < NOW()$$);
