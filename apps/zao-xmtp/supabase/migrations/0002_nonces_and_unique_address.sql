-- Single-use Sign In With Farcaster nonces (src/lib/nonces.ts), and one member
-- per XMTP address (src/app/api/users/xmtp-address/route.ts answers 409).
-- Not applied anywhere yet. Apply after 0001 to the app's own Supabase project.

create table if not exists public.auth_nonces (
  nonce      text primary key,
  expires_at timestamptz not null
);
create index if not exists auth_nonces_expires_at_idx on public.auth_nonces (expires_at);
alter table public.auth_nonces enable row level security;

-- Before the constraint: if two members hold the same address (possible under
-- 0001, which had no proof of ownership), keep it on the most recent sign-in and
-- clear it on the others. A cleared member re-registers with a signed claim the
-- next time they connect. Without this step the constraint fails on such data.
with ranked as (
  select fid,
         row_number() over (partition by xmtp_address order by last_login_at desc, fid) as rn
  from public.members_seen
  where xmtp_address is not null
)
update public.members_seen m
   set xmtp_address = null
  from ranked r
 where m.fid = r.fid and r.rn > 1;

alter table public.members_seen
  add constraint members_seen_xmtp_address_key unique (xmtp_address);
