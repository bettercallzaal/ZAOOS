# n8n on the ZAO VPS

Self-hosted n8n as the ZAO glue/automation layer (research: doc 1002). n8n owns
the dumb-but-reliable event plumbing (webhooks, scheduled syncs, cross-platform
relay); ZOE keeps the reasoning/orchestration. Build-in-public log below.

## Status
- **Deployed 2026-07-09** on 31.97.148.88, `~/n8n/docker-compose.yml`, container `zao-n8n`, n8n **v2.29.9**.
- Bound to **127.0.0.1:5678** (localhost only) - reach the UI via SSH tunnel: `ssh -L 5678:127.0.0.1:5678 zaal@31.97.148.88` then open http://localhost:5678. No public exposure, no firewall change.
- VPS headroom at deploy: 7.8GB RAM (6.5 free), 2 vCPU, 27GB disk free. Plenty.

## Secrets (relay pattern - never in a committed file)
Real values live in `~/n8n/.env` on the host (chmod 600), NOT in git. Workflows
reference them as `{{$env.VAR}}` so no key lands in a workflow JSON. Host `.env`:

```
NEYNAR_API_KEY=...          # Farcaster reads (from bot/.env)
NEYNAR_ZAAL_FID=19640        # optional, workflow 1 defaults to 19640 if unset
NEYNAR_WATCH_KEYWORDS=thezao,zabal   # optional, comma-separated brand watchlist for workflow 1 - add words here, no JSON edits needed
TELEGRAM_BOT_TOKEN=...       # ZOE bot or a dedicated n8n-alerts bot
TELEGRAM_CHAT_ID=1447437687
COWORK_TRACKER_URL=...       # Supabase PostgREST
COWORK_TRACKER_KEY=...
GITHUB_TOKEN=...             # read-only, watched repos
```

## Workflow build queue (doc 1002 top-3, built in a loop)
1. **Farcaster mention -> Telegram** - scheduled poll of Neynar mentions for @zaal + a keyword watchlist (`NEYNAR_WATCH_KEYWORDS` env, default `thezao,zabal` - add more brand terms there, no workflow edit needed) -> Telegram alert. Poll-based (no inbound webhook = no public exposure needed). `workflows/01-farcaster-mentions.json`.
2. **Newsletter publish -> auto cross-post** - Paragraph/RSS new-post -> draft cross-posts. `workflows/02-newsletter-crosspost.json`.
3. **GitHub PR merged -> tracker row + announce** - PR merge -> cowork tracker row + Telegram. `workflows/03-github-pr-tracker.json`.

Workflows are git-committed JSON (portable, no lock-in) and imported headlessly:
`docker exec zao-n8n n8n import:workflow --input=/path/to/workflow.json`.

## Safety
- Localhost-bound; UI via tunnel only.
- Secrets via host `.env` + `{{$env}}` refs, never committed.
- Outbound-posting workflows stay INACTIVE until Zaal tests + activates them.
- Reversible: `cd ~/n8n && docker compose down` (add `-v` to wipe the volume).
