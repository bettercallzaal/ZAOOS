# Session handoff - 2026-07-09 21:50
> from Claude Code (mac terminal, session "n8n") -> to ZOE (Telegram bot, VPS 31.97.148.88)
> doc: research/events/session-2026-07-09-n8n-workflow1-secrets-handoff/README.md
> chain: none

## Receiver instructions (read me FIRST, then do exactly this)

You just received a handoff bundle. Do NOT start work yet. Do this:

1. Read ALL sections below (A through E) before responding to anything.
2. Create task entries from section A - these are the "to do" items.
3. Use section B as your "why" - do NOT re-litigate decisions captured there unless new info surfaces.
4. Use section E as your cold-start map for files, repos, and current state.
5. Once integrated, message Zaal back: "Ingested n8n workflow-1 handoff. N tasks queued. Ready."
6. Never print or paste secret values back into any chat, log, or committed file - host `.env` only.

## A. Tasks to absorb (paste these into your TODO list)

- [ ] Provision or locate a real `NEYNAR_API_KEY` and write it into `~/n8n/.env` on 31.97.148.88 (chmod 600 after). Not found anywhere on this VPS after an extensive search this session (see section B) - if you don't already hold one, you may need to create one via the Neynar dashboard/API.
- [ ] Confirm which Telegram bot token to use for `TELEGRAM_BOT_TOKEN` in `~/n8n/.env`. Candidate: `ZOE_BOT_TOKEN` from `~/zao-os/bot/.env` (i.e. n8n posts as you, ZOE). Alternative: a dedicated n8n-alerts bot if you'd rather not post as yourself. Either way, write the chosen token into `~/n8n/.env`.
- [ ] Add `TELEGRAM_CHAT_ID=1447437687` to `~/n8n/.env` if not already present (this is Zaal's confirmed destination chat).
- [ ] `chmod 600 ~/n8n/.env`, then `cd ~/n8n && docker compose up -d` to reload the container with the new env.
- [ ] Manually execute Workflow 1 (id `da785c1c-00ad-4a99-a61e-44d62dbc0772`, named "01 - Farcaster Mentions to Telegram") via `docker exec zao-n8n n8n execute:workflow --id=da785c1c-00ad-4a99-a61e-44d62dbc0772`, or through the n8n UI at `http://localhost:5678` (tunnel: `ssh -L 5678:127.0.0.1:5678 zaal@31.97.148.88`). Confirm a real Telegram message actually lands in chat `1447437687`.
- [ ] Only after a real ping lands: activate Workflow 1 (toggle "active" on, either via UI or `docker exec zao-n8n n8n update:workflow --id=da785c1c-00ad-4a99-a61e-44d62dbc0772 --active=true`).
- [ ] Report back to Zaal the moment the first real ping lands - that is the "it works" signal he is waiting for.
- [ ] Leave Workflows 2 and 3 (newsletter cross-post drafts, GitHub PR tracker - ids `f3a9c1e2-6b4d-4e8a-9c1f-2d7e5a8b3c4f` and `b8e1d4f6-3c2a-4f9b-8e7d-1a6c5b9e0d3f`) INACTIVE. Not in scope for this handoff - do not touch them.

## B. Why - decisions + pivots + ruled-out paths

- **n8n is poll-based, not webhook-based, for all 3 workflows** because it's bound to `127.0.0.1:5678` on the VPS (reachable only via SSH tunnel). A GitHub/Neynar webhook literally cannot reach it without a firewall/public-exposure change, which was explicitly out of scope this session. Don't "fix" this by opening a port without asking Zaal first.
- **Zaal's explicit directive (relayed this session): "don't over-invest in n8n yet - PROVE it with ONE workflow, cheaply."** All 3 doc-1002 top-3 workflows got built anyway (ahead of the proof, per the original build-loop brief), but only Workflow 1 is meant to be tested/activated right now. Workflows 2 and 3 are deliberately parked pending Workflow 1 proving itself over a few days.
- **Blocked on `NEYNAR_API_KEY` all session** - searched `zaostock-bot/.env`, `hermes-agent/.envrc`, `.hermes/.env`, `.env.portal`, `~/zao-os/bot/.env`, `.config/fleet-heartbeat.env` on the VPS. Zero real hits. The only match anywhere was a `NEYNAR_API_KEY` in a `.env.test` inside an unrelated `.paperclip` workspace checkout - too risky to trust as a production key (likely a placeholder/dummy for tests), so it was NOT used. This is the actual reason for handing off to you - you may have direct provisioning access this session didn't.
- **Zaal's own instruction assumed `NEYNAR_API_KEY` + `TELEGRAM_BOT_TOKEN` existed in `~/zao-os/bot/.env`** - verified false, `grep -E '^(NEYNAR_API_KEY|TELEGRAM_BOT_TOKEN)=' ~/zao-os/bot/.env` returns 0 matches. That file's real keys: `AGENTMAIL_API_KEY`, `BONFIRE_API_KEY`, `BONFIRE_AGENT_ID`, `BONFIRE_ID`, `COWORK_TRACKER_KEY`, `COWORK_TRACKER_URL`, `HERMES_BOT_TOKEN`, `ZAAL_TELEGRAM_ID`, `ZAOSTOCK_BOT_TOKEN`, `ZOE_BOT_TOKEN`, `ZOE_DEFAULT_MODEL`/`ZOE_HARD_MODEL`/`ZOE_QUICK_MODEL`, `ZOE_REPO_DIR`. Flagged back to Zaal rather than blind-copying the wrong values.
- **Ruled out speculative dispatch via the `public.bot_commands` Supabase table.** Found it (`bot='zoe', command='ask', args={prompt}`, used successfully by a `verify-script` control-plane check on 2026-06-07) and considered inserting a task row there directly. Ruled out because the actual command vocabulary your poller supports is unconfirmed beyond `ask`/`resume`/`pause`, and `~/zao-os/bot/REGISTRY.md` itself says "no central dispatcher" - too much risk of a silently-ignored row. Zaal chose the safe path: paste this bundle to you directly instead.
- **Workflow 2 (newsletter cross-post) generates DRAFTS only, never auto-posts** to any platform - deliberate choice to keep n8n as plumbing, not reasoning/publishing. Matches the standing architecture rule below.
- **Workflow 3 (GitHub PR tracker) always creates a new tracker row** (the "auto-capture" path) instead of fuzzy-matching PR titles against existing rows to decide update-vs-create. Judged safer for unattended automation than text-similarity matching against manually-created rows - flagged as a deviation from the original spec (doc 1002) in PR #1161.
- **Workflow 1 was revised mid-session** to read a comma-separated `NEYNAR_WATCH_KEYWORDS` env var (default `thezao,zabal`) instead of a hardcoded `"thezao"` search string, per Zaal's ask to make it easy to add more brand terms later without touching the workflow JSON.
- **Standing architecture rule (do not violate):** n8n = plumbing (webhooks, scheduled polls, cross-platform relay). ZOE = reasoning/orchestration. Do not rebuild ZOE-style reasoning inside n8n, and do not have n8n auto-post anything without a human (or you, deliberately) reviewing first.
- **`~/zao-os` on the VPS (your own repo checkout) tracks a stale feature branch, not `main`** per its own `REGISTRY.md` known-gaps list (`~/zao-os` (zoe-bot) tracks `claude/gifted-euler-bYhl7`; should point at `main` now that PRs #795/#804 are merged). Worth fixing while you're in there, but not blocking for this task - the `.env` file location doesn't depend on which branch is checked out.

## C. Git state

- Primary repo: `bettercallzaal/ZAOOS`. All work this session is committed + pushed; no local uncommitted diff (this bundle's own local checkout is clean aside from this new file).
- Open PRs (not merged, all inactive-JSON + docs, safe to merge whenever Zaal reviews):
  - #1159 `infra/n8n-workflow-01-farcaster-mentions` - Workflow 1 JSON (includes the keyword-watchlist revision)
  - #1160 `infra/n8n-workflow-02-newsletter-crosspost` - Workflow 2 JSON
  - #1161 `infra/n8n-workflow-03-github-pr-tracker` - Workflow 3 JSON
  - #1162 `infra/n8n-readme-status-update` - infra/n8n/README.md status log
- Merged PRs (already on `main`):
  - #1166 - doc 1005 (n8n ecosystem expansion research, DEEP tier)
  - #1169 - doc 1005 Next Actions fix
- No diff to apply - all 3 workflow JSONs are already imported (inactive) on the VPS at `zao-n8n` container. You're editing `~/n8n/.env` and toggling activation state, not touching git.

## D. In-flight

- Background bash jobs: none pending.
- Subagents pending: none (the doc-1005 research agent already completed and reported back).
- Scheduled wakeups: none.
- Open AskUserQuestion: none - Zaal already chose "paste it to ZOE myself" as the delivery method for this handoff.

## E. Cold-start map (read if you are confused)

**Files touched this session** (all in `bettercallzaal/ZAOOS`):
- `infra/n8n/workflows/01-farcaster-mentions.json` - created, then revised for the keyword watchlist
- `infra/n8n/workflows/02-newsletter-crosspost.json` - created
- `infra/n8n/workflows/03-github-pr-tracker.json` - created
- `infra/n8n/README.md` - updated twice (status log, then new env vars)
- `research/dev-workflows/1005-n8n-expansion-surface/README.md` - Next Actions table fixed (was listing already-built workflows as future work)

**Skills invoked:** `zao-research` (produced doc 1005, DEEP tier), `setting-secrets` (considered, not used - didn't fit a server-to-server env copy), `handoff` (this bundle).

**Memory writes:** none this session.

**Last-known mental model:** n8n is deployed and running on the ZAO VPS (31.97.148.88, container `zao-n8n`, localhost-bound). All 3 of doc 1002's top-3 workflows are built, PR'd, and imported inactive. Workflow 1 (Farcaster mentions -> Telegram) is fully built including a configurable brand-keyword watchlist, and is blocked purely on two secrets: a real `NEYNAR_API_KEY` (not found anywhere on the VPS) and confirmation of which Telegram bot token to post with. Zaal wants ONE concrete win - a real Telegram ping from Workflow 1 - before any further investment; Workflows 2/3 and the broader ecosystem expansion (doc 1005) are explicitly parked until that happens.

**Open questions for you (ZOE) to resolve, ideally by asking Zaal if unsure:**
- Do you already hold a Neynar API key you use elsewhere, or do you have provisioning access to create one?
- Is posting as `ZOE_BOT_TOKEN` (i.e. the alert appears to come from you) the right call, or would Zaal prefer a distinct "n8n-alerts" bot persona? Default to `ZOE_BOT_TOKEN` if you're not sure - it's the only real candidate found.

## Inline copy-paste block (for fast receiver paste)

```
Ingest the bundle at research/events/session-2026-07-09-n8n-workflow1-secrets-handoff/README.md (repo bettercallzaal/ZAOOS, branch main) and follow receiver instructions at the top. 8 tasks to absorb.
```
