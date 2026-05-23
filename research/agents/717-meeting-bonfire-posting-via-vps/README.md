---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-22
related-docs: "673, 676, 680, 665, 620, 709"
original-query: "Can ZOE post Bonfire knowledge-graph episodes on behalf of the /meeting skill? ZOE runs on the VPS and already has BONFIRE_API_KEY + BONFIRE_ID in its env. The /meeting skill runs on Zaal's mac and has no Bonfire key locally, so bonfire-episode.sh skips. Research the cleanest way to route /meeting episode-posting through ZOE on the VPS so the mac never needs the key."
tier: STANDARD
---

# 717 - Posting /meeting Bonfire episodes via the VPS

> **Goal:** Route the `/meeting` skill's Bonfire episode posting so the API key never has to live on Zaal's mac - the VPS already has it.

## Key Decisions

| # | Decision | Reason |
|---|----------|--------|
| 1 | **Route posting through the VPS over SSH - reuse the env that already holds the key.** Add a VPS fallback branch to `bonfire-episode.sh`. | The `/meeting` skill already SSHes to the VPS (`transcribe.sh` VPS-fallback path, `root@187.77.3.104`). Same pattern, no new transport. |
| 2 | **Do NOT build a ZOE bot command for this.** | ZOE is a Telegram + node-cron bot with no HTTP server and no programmatic batch entry point (grep confirmed: no `createServer`/`listen`/`express` in `bot/src/zoe/`). "Use ZOE to post" would mean building a new command + message parser + queue - complexity for zero gain. The key, not the bot, is what is needed. |
| 3 | **Do NOT copy the key to the mac.** | Secret hygiene: the key stays on the VPS. SSH-running the POST there means the mac never holds `BONFIRE_API_KEY`, and key rotation stays single-point. |
| 4 | **Two-tier, mirroring `transcribe.sh`.** Local key present (`~/.zao/bonfire.env` or env) -> POST locally. Absent -> `scp` the episodes JSON to the VPS and `ssh`-run the POST there, sourcing the VPS env file. | One consistent pattern across the skill: local-first, VPS-fallback. |

## Findings

### "Use ZOE" means "use the VPS env", not "use the ZOE bot"

ZOE (`bot/src/zoe/`) is a Telegram bot plus a `node-cron` scheduler. It loads env via `dotenv` (`index.ts`). There is no HTTP listener, no RPC, no queue an external caller can drop work into. Making ZOE-the-bot post episodes on the skill's behalf would require building a brand-new command path. That is the wrong read of the request.

What the request actually needs is the **key**, and the key lives in an env file on the VPS host where ZOE runs. The clean move is to run the POST on that host so it inherits that env - ZOE-the-bot is never in the data path.

### The Bonfire write path is already proven and trivial

`bot/src/zoe/recall.ts` `remember()` is a best-effort `POST /knowledge_graph/episode/create` (Bearer `$BONFIRE_API_KEY`, `bonfire_id: $BONFIRE_ID`). `scripts/bonfire-episode.sh` (doc 680) is the bash twin of exactly this call and already secret-scans every body. Nothing about the API needs to change - only *where* the curl runs.

### The skill already has the VPS transport

`transcribe.sh` already does `scp` + `ssh` to `root@187.77.3.104` for the Whisper fallback. `bonfire-episode.sh` gaining a `scp episodes.json` + `ssh "source <env> && post"` branch is the same shape, ~20 lines.

## Options Compared

| Option | How | Verdict |
|--------|-----|---------|
| **A. SSH to VPS, reuse the env (RECOMMENDED)** | `bonfire-episode.sh`: no local key -> `scp` episodes JSON to VPS, `ssh` run the curl loop with `set -a; . <vps-env>; set +a` first | Mirrors `transcribe.sh`. Key stays on the VPS. ~20 lines. Ship this. |
| B. ZOE bot command | New Telegram/cron command in ZOE that accepts an episodes batch and posts it | ZOE has no batch/HTTP entry - this is a new command + parser + queue. Overkill. SKIP. |
| C. Copy the key to the mac | SSH-read `BONFIRE_API_KEY` into `~/.zao/bonfire.env` | Simplest code, but the secret now lives on two machines and rotation gets harder. SKIP on hygiene grounds. |

## Open Items

The exact VPS host running ZOE and the path to the env file holding `BONFIRE_API_KEY` must be confirmed by SSH. The repo shows `bot/systemd/zao-team-bots.service` uses `EnvironmentFile=%h/zaostock-bot/.env` for the team bots; ZOE itself has no systemd unit checked into the repo, so its env path is VPS-side only. One SSH check pins it: `ssh <vps> 'grep -l BONFIRE_API_KEY ~/*/.env ~/.zao/**/.env 2>/dev/null'`.

## Also See

- [Doc 680 - Meeting Skill -> Bonfire Bridge](../680-meeting-skill-bonfire-bridge/) - the bridge this doc fixes the deploy gap for
- [Doc 709 - Meeting transcription pipeline audit](../../dev-workflows/709-meeting-transcription-pipeline-audit/) - same skill, the mlx upgrade
- [Doc 665 - Bonfires deep dive + ZAO integration](../665-bonfires-deep-dive-zao-integration/)
- [Doc 620 - Bonfire push everything](../620-bonfire-push-everything/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| SSH the VPS, confirm the env file path holding `BONFIRE_API_KEY` | @Zaal | Todo | Before implementing |
| Add the VPS-fallback branch to `scripts/bonfire-episode.sh` (scp + ssh, source VPS env) | @Zaal | PR | Next meeting-skill iteration |
| Backfill: post the 11 doc-711 episodes (`/tmp/meeting-bonfire-episodes.json`) via the new path | @Zaal | Todo | After implementation |
| Update doc 680 + the `/meeting` SKILL.md to note the VPS posting path | @Zaal | PR | With the implementation PR |
| Build a `/bonfire` skill - one place documenting how to query + post to the ZABAL Bonfire (wraps `bonfire-episode.sh` + the `recall.ts` read path) | @Zaal | Skill | Once the VPS posting path is live |

## Sources

All internal - the Bonfires API is a partner/internal API with no public docs; this is an internal architecture decision grounded in the codebase.

- `bot/src/zoe/recall.ts` - ZOE's Bonfire bridge, `remember()` episode POST - [FULL]
- `.claude/skills/meeting/scripts/bonfire-episode.sh` - the skill's current posting script - [FULL]
- `.claude/skills/meeting/scripts/transcribe.sh` - the existing scp+ssh VPS pattern to mirror - [FULL]
- `bot/systemd/zao-team-bots.service` - VPS env-file convention - [FULL]
- `bot/src/zoe/index.ts` - confirms ZOE is Telegram + dotenv, no HTTP server - [FULL]
- Doc 680 (`research/agents/680-meeting-skill-bonfire-bridge/`) - the bridge design + verified Bonfire API shape - [FULL]
