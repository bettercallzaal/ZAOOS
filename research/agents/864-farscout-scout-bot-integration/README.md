---
topic: agents
type: guide
status: research-complete
last-validated: 2026-06-17
related-docs: 601, 859, 862, 863
original-query: "here is a bot we have we should add it to the status bords on thezao.xyz under the zao coworks https://github.com/ZAODEVZ/ZAOcowork and have the ZOE monitor it /zao-research this after aswell"
tier: STANDARD
---

# 864 — farscout: the Farcaster research scout, on the board + watched by ZOE

> **Goal:** Capture what farscout is, add it to the thezao.xyz cowork board, and have ZOE monitor it. The monitor link already half-exists: farscout writes to the ZABAL Bonfire, and ZOE reads that graph.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | farscout = a LIVE bot, add it to the board as `status: 'live'` | It posts grounded findings to Discord daily (verified 5/29 - 6/16, ~daily) and runs 24/7 as a systemd service |
| 2 | "ZOE monitors farscout" = watch its Bonfire output, not a new integration | farscout already writes findings to the ZABAL Bonfire; ZOE already delves that graph. Added `farscout` to ZOE's WATCH_TOPICS so she pings if it goes cold (bot down) |
| 3 | Board edit lands in ZAOOS, not ZAODEVZ/ZAOcowork | The thezao.xyz/bots board is `src/app/(auth)/overview/data.ts` in THIS repo. ZAODEVZ/ZAOcowork is the cowork tracker, a different surface (and bettercallzaal is read-only on ZAODEVZ) |
| 4 | Do NOT fold farscout into ZOE | Per doc 601 "no new bots" rule - but farscout already exists, is useful, and is a foundation other tools build on. Keep it standalone, surface it through ZOE's recall |

## What farscout is

A free, mostly-autonomous Farcaster research scout for the ZAO ecosystem, built as a reusable foundation (research engine + grounding stack + memory layer + Discord surface, all modular). Source of truth: `github.com/bettercallzaal/farscout`.

- **Reads** Farcaster (your casts, follow graph, watched builders) via the free no-auth Warpcast API; channels too with a free Neynar key.
- **Grounds** every finding in real sources (Farcaster cast search + web search + live token data) before reasoning. A finding that cannot cite a source URL is dropped - no stale-memory hallucination.
- **Reasons** with OpenRouter free-tier models, or a local Ollama when reachable.
- **Remembers** in the ZABAL Bonfire knowledge graph (this is the ZOE link).
- **Talks** in Discord via real slash commands on an engagement-scaled cadence: `/dig <topic>`, `/brief`, `/ask <q>`, `/now`, `/digest`, `/pause`, `/resume`.
- **Standing watch** on Farcaster Mini Apps, Frames, and Snaps.

### Live status (verified)
- systemd service `farscout.service` on the cowork VPS `187.77.3.104` (`/root/farscout`), 24/7, auto-restart, survives reboots.
- ~1500 LOC, 11 lib modules, 81 unit tests, 3 runtime deps (status README 2026-05-31: 29 commits; the repo has pushed further since).
- Verified live: posted grounded daily digests every day 2026-05-29 through 2026-06-16 in Discord, each with cited source URLs + follow-up questions. Recent digests surfaced ZABAL Gamez mentions, x402/SURGE, Frames v2 monetization, Snapchain.

## The integration (what this doc ships)

1. **Board.** Added a `farscout` row to `botFleet` in `src/app/(auth)/overview/data.ts` (renders at thezao.xyz/bots): `status: 'live'`, source = repo + VPS, board note = "Farcaster research scout - grounds findings in real sources, writes to ZABAL Bonfire (ZOE recalls via delve)".
2. **ZOE monitor.** Added `'farscout'` to `WATCH_TOPICS` in `bot/src/zoe/events.ts`. ZOE's daily graph-staleness check (doc 859) now delves the `farscout` topic; if it goes >10 days with no new finding, ZOE pings Zaal - which is also a liveness check on the bot.
3. **ZOE recall (already works).** Because farscout writes episodes tagged `farscout` to the ZABAL Bonfire, ZOE's `recall()` / delve already surfaces farscout findings inside any relevant turn. Ask ZOE "what has farscout found about Frames v2" and the delve pulls it.

## The two surfaces - do not confuse them

- **thezao.xyz/bots** (the board the request names) = `src/app/(auth)/overview/data.ts` in ZAOOS. Editable here. DONE.
- **ZAODEVZ/ZAOcowork** = the cowork action-tracker repo (Iman-owned org). A different surface; bettercallzaal is read-only on ZAODEVZ. If farscout should also appear in the ZAOcowork tracker UI, that needs Iman or a PR he merges - flagged as a next action, not done here.

## Also See

- [Doc 601](../601-agent-stack-cleanup-decision/) - the 5-surface rule + "no new bots without a doc"
- [Doc 859](../859-zoe-bonfire-proactivity/) - ZOE graph-staleness watch (the monitor mechanism)
- [Doc 862](../862-zoe-multiagent-fanout-bonfire/) - ZOE extraction fan-out (also feeds the same graph)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ship board + WATCH_TOPICS change (this doc's PR) | @Zaal | PR | Now |
| Deploy ZOE so the farscout watch goes live | @Zaal | Deploy (zoe-deploy.sh) | After merge |
| Decide if farscout also belongs in the ZAODEVZ/ZAOcowork tracker (needs Iman) | @Zaal / @Iman | Decision | This week |
| Optional: have ZOE surface farscout's daily digest proactively (not just on staleness) | @Zaal | Claude Code | Later |

## Sources

- github.com/bettercallzaal/farscout - README (what it is, how it works, live status) [FULL]
- Live Discord output 2026-05-29 to 2026-06-16 - daily grounded digests with cited URLs [FULL, primary]
- ZAOOS: `src/app/(auth)/overview/data.ts` (board), `bot/src/zoe/events.ts` (watch), `bot/src/zoe/recall.ts` (delve) [FULL, local]
