# estate-audit

Census every Vercel project and every Supabase project on the account, map
them to repos, and emit a costed kill-list. Built for the "what infra are we
paying for and which is dead" sweep.

## Why this exists

The ZAO estate sprawls across many Vercel deploys and Supabase projects
(ZAOOS, zaostock, zlank, WaveWarZ, COC Concertz, cowork trackers, demo sites).
Some are live, some are abandoned but still billing. This tool lists them all
so dead ones can be killed.

## Security model (non-negotiable)

- Tokens are **read-only** and **short-lived** (create with 1-day expiry).
- Tokens live **off-repo** at `~/.zao/estate-tokens.env` (never committed).
- Raw API output may contain billing data, so it is written to
  `~/.zao/private/` per `.claude/rules/pii-hygiene.md`, never into the repo.
- The script never prints or logs token values.
- **Supabase PATs are account-wide (no read-only scope).** Revoke immediately
  after the run.

## Setup

1. Vercel token: https://vercel.com/account/tokens -> create, scope = account,
   expiry = 1 day.
2. Supabase token: https://supabase.com/dashboard/account/tokens -> generate
   (`sbp_...`).
3. Write the token file (off-repo):

   ```bash
   printf 'VERCEL_TOKEN=PASTE_VERCEL\nSUPABASE_ACCESS_TOKEN=PASTE_SBP\n' \
     > ~/.zao/estate-tokens.env && chmod 600 ~/.zao/estate-tokens.env
   ```

## Run

```bash
bash scripts/estate-audit/audit.sh
```

Prints two tables (Vercel, Supabase) plus a kill-candidate list for each.
Raw JSON dumps land in `~/.zao/private/{vercel,supabase}-estate-<stamp>.json`.

## After the run

```bash
rm -f ~/.zao/estate-tokens.env
```

Then revoke both tokens in their dashboards.

## Limitations (API gaps)

- Neither the Vercel nor Supabase public API exposes per-project **$ spend**
  or DB size. The script flags *liveness* (last-deploy age, project status);
  cross-check dollar figures against:
  - Vercel: https://vercel.com/account/usage
  - Supabase: https://supabase.com/dashboard/org/_/usage
  - Supabase DB size: `select pg_size_pretty(pg_database_size(current_database()));`

## Tunables

- `DEAD_DAYS` (default 90) - a Vercel project with no deploy in this many days
  is flagged dead.
