-- Single-use Sign In With Farcaster nonces (src/lib/nonces.ts), and one member
-- per XMTP address (src/app/api/users/xmtp-address/route.ts answers 409).
-- Not applied anywhere yet. Apply after 0001 to the app's own Supabase project.

create table if not exists public.auth_nonces (
  nonce      text primary key,
  expires_at timestamptz not null
);
create index if not exists auth_nonces_expires_at_idx on public.auth_nonces (expires_at);
alter table public.auth_nonces enable row level security;

-- If 0001 data already holds a duplicate address this fails; resolve the duplicate first.
alter table public.members_seen
  add constraint members_seen_xmtp_address_key unique (xmtp_address);
