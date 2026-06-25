# ecosystem-monitor

Read-only census of the ZAO **code estate + live fleet** -> a markdown digest ZOE
reports back. Part of ZOE's "monitor and report on the whole codebase and ecosystem"
capability.

## What it does

- Surveys every GitHub repo across the ZAO accounts (`bettercallzaal`, `ZAODEVZ`):
  last push, open items (issues+PRs), archived flag, language.
- Buckets by freshness: active (<=30d), stale (>90d), archived.
- Lists the top stale repos (cleanup candidates).
- Checks the live fleet (systemd `--user` units on the fleet box) and flags any
  expected unit that is DOWN.
- Flags active repos with open items ("needs attention").

## Sibling tool

- `scripts/estate-audit` covers **infra/billing** (Vercel + Supabase projects, costed
  kill-list).
- This covers **repos + fleet health**.

Together they answer "what's in the estate, what's alive, what's dead, what's billing."

## Usage

```bash
bash scripts/ecosystem-monitor/monitor.sh
# report -> ~/.zao/ecosystem-monitor/REPORT.md (off-repo, never committed)
```

Override via env:

- `ECOSYSTEM_ACCOUNTS` - space-separated GitHub logins (default `bettercallzaal ZAODEVZ`)
- `ECOSYSTEM_REPORT` - output path
- `FLEET_HOST` - ssh target for fleet health (default `zaal@31.97.148.88`)

## Security

Read-only. Uses the already-authenticated `gh` CLI - no tokens written or printed.
The generated report goes off-repo and is never committed (same convention as
estate-audit). No writes to any repo, no spend, no new processes.

## Roadmap (ZOE integration)

1. (this PR) Standalone read-only tool.
2. Scheduled run on the fleet box -> digest posted to ZOE's Telegram (the "report back" channel).
3. Deeper signals: open-PR titles, stale-PR age, failing CI.
4. Dump each digest to the ZABAL Bonfire graph as the shared-memory ecosystem feed.
