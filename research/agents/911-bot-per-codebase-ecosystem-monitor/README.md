---
topic: agents
type: guide
status: research-complete
last-validated: 2026-06-26
superseded-by:
related-docs: 899, 907, 909, 910
original-query: "loop vision: ZOE monitors+reports the whole codebase/ecosystem; eventually a bot per codebase - turn it into an architecture"
tier: STANDARD
---

# 911 - Bot-per-Codebase + Ecosystem Monitor (the architecture)

> **Goal:** Turn the standing vision ("ZOE monitors and reports on the whole codebase/ecosystem; eventually every codebase has its own bot") into a concrete, phased architecture - grounded in what already runs.

## Recommendations (decisions first)
| # | Decision | Call |
|---|----------|------|
| 1 | Architecture | **Hub + spokes**: ZOE = hub, one lightweight PR-only agent per codebase, Zaal approves. |
| 2 | Build path | **Generalize the existing web-improver into a parameterized spoke template** - don't write each from scratch. |
| 3 | First spokes | bcz.com (live), then farscout (improve), then ZAOOS (audit-only first). |
| 4 | Safety | PR-only never main; one change/pass; per-repo validate + secret-scan; critical repos audit-only until proven; rule #0. |
| 5 | Host | Run spokes on the **VPS** (has gh + claude); Pi needs a PAT to host any. |

## Live-state validation (2026-06-26, checked this cycle)
- web-improver: `web-improve.timer` ACTIVE on VPS (verified via `systemctl --user is-active`), shipped PR #28; next fire 14:30 UTC.
- fleet dashboard: tmux `fleet` up on the Pi, HTTP 200 at ansuz:8090 (10/10 agents).
- fleet heartbeat: deployed + cron'd 0 11 UTC, test push delivered.
- 3 researchers (ytr/seor/repor): tmux alive, producing grounded findings.

## The shape: hub + spokes
- **ZOE** = the hub (concierge/orchestrator on the VPS). Aggregates, reports to Zaal, holds memory.
- **Per-codebase agents** = spokes. Each key repo gets a lightweight agent that watches + improves + reports up to ZOE.
- **Zaal** = approves/decides. Spokes are PR-only + report-only; nothing ships or spends without him.

```
repo A agent  \
repo B agent   >--> ZOE (aggregate + memory) --> Zaal (heartbeat + digest + dashboard)
repo C agent  /
```

## Already built (the prototype exists)
The **web-improver** (doc 910 sibling; on the VPS, systemd timer, every 6h) IS spoke #1: it watches bettercallzaal.com, makes ONE PR-only improvement per pass (validated + secret-scanned), and pings Zaal via ZOE. Plus the monitoring layer: **fleet dashboard** (ansuz:8090, doc 907), **fleet heartbeat** (daily push), **daily digest** (research synthesis), **parked.md** ("waiting on you"). So the hub + monitoring + one spoke already run.

## The generalization: a spoke template
Extract the web-improver into a reusable **codebase-agent template** parameterized by:
- `REPO` (clone), `FOCUS` (improve / audit-only / research-only), `CADENCE`, `CONVENTIONS` (the repo's CLAUDE.md), `VALIDATE` (per-repo gate).
- Same spine every spoke: pull main -> branch -> claude makes ONE change per CLAUDE.md -> validate + secret-scan -> PR -> report to ZOE. PR-only, never main.

## Roll-out (candidate spokes, priority)
| Repo | Spoke mode | Why |
|------|-----------|-----|
| bettercallzaal.com | improve (live) | prototype, shipping PRs now |
| ZAOOS (this repo) | audit-only first | big/critical - audit before auto-PR |
| farscout | improve | the grounded research engine; self-improving |
| ZAOscout | improve | keyless fetch toolkit |
| wavewarz sites | improve | top growth surface |
| thezao.com | report-only | Webflow (no repo) - audit-to-ZOE only |

## Guardrails (non-negotiable)
- PR-only, never push main. One change/pass. Per-repo validation gate + secret-scan before commit.
- No spend; agents never autonomously launch/trade tokens (rule #0).
- Critical repos (ZAOOS) start audit-only; promote to auto-PR only after the pattern proves safe.
- Every spoke reports to ZOE; ZOE rolls up to the heartbeat + digest so Zaal sees it in one place.

## Open dependencies (parked on Zaal)
- A **GitHub PAT on the Pi** (or run all spokes on the VPS) - the Pi can't PR without it.
- Whether to **buy (Borker) vs build (posts-v4)** for the *social* spoke - separate from code spokes.
- Bonfire **write key** - so spokes can log to the shared graph (writes 401 today, doc-pending).

## Next Actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Extract web-improver into a parameterized spoke template | @ZOE/VPS | Build | When prioritized |
| Add spoke #2 = farscout (improve mode) | @ZOE/VPS | Build | After template |
| ZAOOS spoke in audit-only mode (reports, no auto-PR) | @Zaal | Decision+Build | After template |
| Get a Pi PAT or commit to VPS-hosted spokes | @Zaal | Decision | Anytime |

## Also See
- [Doc 907](../907-agent-fleet-dashboard/) - the monitoring surface
- [Doc 909](../909-agent-stack-gaps-roadmap/) - the reliability/eval gaps spokes must respect
- [Doc 910](../../farcaster/910-free-farcaster-posting-zol/) - the social spoke's free-posting path
- `~/web-improve/web-improve.sh` (VPS) - spoke #1, the template seed

## Sources
- [reference] Live fleet: web-improver, fleet dashboard (doc 907), heartbeat, digest, researchers - all built this cycle, verified running on VPS + Pi.
- [reference] Hermes auto-PR pattern (bot/src/hermes) - the proven coder+critic+PR loop the spoke template generalizes.
