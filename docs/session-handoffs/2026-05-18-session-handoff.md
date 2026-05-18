# Session Handoff — 2026-05-17 → 2026-05-18

> **For:** the next Claude Code terminal Zaal opens after closing this one.
> **Why this exists:** this session ran long (multiple branches, 13+ PRs, deep research dispatches, 1 brand kit shipped, 1 brand audit, 1 agent improvement audit, 1 Bonfires deep-dive, 1 fractal/Farcaster research). The fresh session needs the load-bearing context without re-grinding the search.
> **How to use:** read this file top to bottom. Then read the active branches list + memory snapshot. Then read the "first move" recommendation at the bottom. You should be productive within 5 minutes of opening.

## TL;DR — what changed this session

1. **ZABAL Brand Kit shipped** at `bettercallzaal.com/kit.html` ([PR #5 on bettercallzaalwebsite](https://github.com/bettercallzaal/bettercallzaalwebsite/pull/5)). 31 brands across 9 categories with per-brand entrepreneurial CTAs (Sponsor / Collab / Customer / Contribute + contact). Machine-readable manifest at `bettercallzaal.com/brands.json`. Docs 666 + 667 in ZAOOS cross-reference + audit.
2. **Agent improvement DEEP audit** at [PR #555](https://github.com/bettercallzaal/ZAOOS/pull/555) — Doc 668 hub + 4 sub-docs on bots/agents. Top P0: ship the ZAOcoworking ↔ Bonfires pipe (Phase 1, ~4 hours, full spec in 668d).
3. **ZOE's `~/.zao/zoe/human.md` updated on VPS** (zaal@31.97.148.88) at 11:24 UTC — appended 4 project clarifications. File grew 5021 → 6362 bytes. Backup at `human.md.bak-20260518-112414`. Resolves the gap ZOE flagged in her own session export.
4. **/stock redirect verified working** — zaoos.com/stock → zaostock.com per PR #544 (merged earlier).
5. **5 sites health-checked** via gstack browse — all return 200. Found CSP issue blocking inline scripts on every site (P1 to fix).
6. **Iman onboarded to @ZAOcoworkingBot** via `/adduser 7955994215 IMan admin` (Zaal action this session).
7. **Doc-number collision protocol identified** — 58 historical collisions plus 659 + 662 collisions this session. Pre-commit hook spec'd in Doc 663g.

## What's LIVE in production (verify any of these)

| Surface | URL | Notes |
|---|---|---|
| ZAO OS app | https://zaoos.com | Gated Farcaster client; 200 OK |
| ZAOstock festival site | https://zaostock.com | Spun-out repo, 36+ PRs merged, last commit 2026-05-15. 138-day countdown to Oct 3. |
| BetterCallZaal brand | https://bettercallzaal.com | "Got a problem? BetterCallZaal." landing |
| **ZABAL Brand Kit (NEW)** | https://bettercallzaal.com/kit.html | 31 brands, JSON manifest, filter + search |
| ZABAL Nexus (legacy) | https://bettercallzaal.com/nexus.html | Redirects via vercel.json to broken nexus.thezao.com loader — fix later |
| The ZAO marketing | https://thezao.com | Notable artists list, "Join the ZAO!" CTA |
| ZABAL Bonfire | https://zabal.bonfires.ai | Auto-slug; custom slug rename pending from Ryan/Joshua.eth |

## Active branches + PRs (as of close)

Run `gh pr list --repo bettercallzaal/ZAOOS --state open` for live state. Approximate snapshot:

| PR | Branch | Title |
|---|---|---|
| #555 | ws/agent-improvement-668 | Doc 668 agent improvement (4 sub-docs) |
| #553 | ws/brand-kit-completeness-audit-667 | Doc 667 brand kit audit |
| #552 | ws/zabal-brand-kit-666 | Doc 666 brand kit cross-ref |
| #547 | ws/zao-research-meta-audit-663 | Doc 663 ecosystem meta-audit |
| #546 | ws/farcaster-discussion-19-fractal-async-664 | Doc 664 Farcaster fractal |
| **bettercallzaalwebsite #5** | ws/brand-kit-master-page | Brand kit page (the one that matters) |
| zaostock #38 | ws/optimize-public-zao-assets | Logo shrink 15.6MB → 904KB |

**Merge order recommendation:** zaostock #38 first (cosmetic, no dependencies), then bettercallzaalwebsite #5 (the kit), then the docs in any order. Docs are reference material.

## The Bonfires build — fully spec'd, waiting on Zaal's 3 data points

The concrete next-build target is **ZAOcoworkingBot → ZABAL Bonfire pipe (Phase 1)**.

Full spec: `research/agents/668-zao-agent-improvement-may-2026/668d-zaocoworking-bonfires-integration/README.md`

**What I told Zaal to send back (he'll do this in your fresh session):**

1. The `BONFIRE_ID` of the ZABAL bonfire (UUID from app.bonfires.ai/dashboard)
2. Confirm `BONFIRE_API_URL` is `https://tnt-v2.api.bonfires.ai` (yes/no)
3. Confirm the API key works (just yes/no after testing `pip install bonfires && bonfire bonfires`)

**Once you have all 3:** ship Phase 1 = `bot/src/teams/bonfire.ts` (~80 LoC subprocess wrapper + spool) + `bot/src/teams/commands.ts` (+15 LoC for hooks on `/add /wip /done /assign`). 3-4 hours of focused work. Subprocess MVP first; swap to Ryan's native SDK when it drops (zero rework).

**Auth rule (do not violate):** API key NEVER lands in chat. Per `feedback_never_accept_pasted_secrets.md`. Key goes in `~/.config/bonfires/config.env` on VPS, chmod 600. Pre-commit hook scans for the literal value.

## ZOE's 4-project clarification (now in her human.md)

Resolves the gap ZOE flagged in her own session export ("I have no context on Infanity / SongJam / Ansuz / Recoup"):

| Project | Status |
|---|---|
| **SongJam · $SANG** | Partner brand of ZABAL. Live audio spaces (NOT music player). Doc 079 has deep dive. Added to human.md. |
| **Recoup learning path** | Zaal building ON TOP OF Recoupable. Active. Don't fabricate specifics. Added. |
| **Infanity** | NOT Zaal's. External Farcaster project. Tagged "do not include in pitches." Added. |
| **Ansuz** | NOT Zaal's. External. Tagged same. Added. |

If ZOE ever forgets, the file is at `~/.zao/zoe/human.md` on `zaal@31.97.148.88`. The append block has header `## Projects - load-bearing context (added 2026-05-18)`.

## Ryan / Joshua.eth status

Ryan is Joshua.eth, founder of Bonfires (NERDDAO). He's in the ZAO Civilization GC with Zaal + Iman. Status as of this session:
- Building "compiled new ZOE" via Bonfires (will replace 8-turn ring buffer with persistent kEngram memory)
- Finalizing Bonfires SDK (Python; new internal version first, then test, then send Zaal a repo)
- Offered a joint session post-sprint
- Pending: custom slug rename for zabal.bonfires.ai

Zaal sent him the 4-project clarification GC message this session. We're not blocked on him for Phase 1 of the bonfire pipe (using existing public CLI).

## Memory snapshot — what the new session should know

These memory files in `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/` were touched or referenced this session:

- `project_bonfires_zao_integration.md` (NEW this session) — full Bonfires context + Ryan partnership
- `project_bz_builds_show.md` (NEW this session) — B-ZBUILD2 repo = Ohnahji + Zaal show
- `project_fractal_process.md` — 90+ weeks of fractal context (informed Doc 664 + brand kit)
- `project_zao_music_entity.md` — ZAO Music DBA brief (informed brand kit additions)
- `project_zaoos_monorepo_as_lab.md` — graduation pattern (informed ZAOstock removal PR #544)
- `feedback_no_emojis.md`, `feedback_no_em_dashes.md`, `feedback_never_accept_pasted_secrets.md` — house style rules (all honored this session)
- `feedback_check_pr_state_always.md` — verified before every push
- `feedback_grill_one_by_one.md` — used for the dead-repo grilling pattern (paused at crownvics question; user pivoted)

## Open conversational threads (paused, not lost)

1. **Crownvics grill** — paused mid-question. Hypothesis: it's the Crown Vics band's site (Steve Peer connection). User pivoted before answering. Resume by asking Zaal: "Is bettercallzaal/crownvics the Crown Vics band's site, your build for them, or something else?"
2. **The 5 unclear repos** — crownvics, bettercallzaal-coding-hub, zski, ww, 16statestreet. Doc 667 has hypotheses for each. Need 1-line each from Zaal.
3. **Autoresearch loop on Doc 663 findings** — was kicked off mid-session but never completed all 4 targets (LICENSE coverage hit 7/7 partially; pre-commit hook not implemented; library hygiene + Frapp-GH answers deferred).
4. **Doc 668 sub-agent stall pattern** — 3 of 4 agents stalled at 10-min watchdog. Filed as honest-failure note in the hub. Worth flagging to the harness operator if recurs in next session.

## The /zao-research v2.2 chain (skill upgrade shipped this session)

`/zao-research` now has **Step 2.5 cross-repo search** via `mcp__grep__searchGitHub` scoped to bettercallzaal org. Doc 663a shipped the skill upgrade. NOTE: grep.app indexing of bettercallzaal returns zero hits — known gap, recommend `gh search code` fallback. Future iteration.

## First moves for the new session

Order of operations to be productive immediately:

1. **`gh pr list --repo bettercallzaal/ZAOOS --state open`** — see what's still open
2. **`cat docs/session-handoffs/2026-05-18-session-handoff.md`** — re-read this file
3. **Ask Zaal**: "Bonfires info ready?" (the 3 data points) → if yes, ship Phase 1 build
4. If Bonfires not ready, pivot to next priority from morning brief (P0 list):
   - Nexus QA + NexusV2 Supabase migration
   - ZAO Protocol Whitepaper rebuild Chapter 2+
   - Doc 601 Phase 2 token cutover to bot/src/zoe
   - CSP fix on the deployed sites (P1 from this session's health check)
5. If Zaal wants to keep grilling unclear repos, resume with crownvics + work through bettercallzaal-coding-hub, zski, ww, 16statestreet.

## What NOT to do in the new session

- Don't accept a pasted API key. Zaal sets `BONFIRE_API_KEY` in `~/.config/bonfires/config.env` on his VPS, chmod 600. Never in chat.
- Don't push to `ws/zoe-post-slate-tz-fix` or any branch you didn't create — there were sibling sessions running today + a couple of branch-collision close calls this session (recovered via cherry-pick).
- Don't claim doc number 659 or 662 — they're collisions already + the pre-commit hook to prevent more isn't built yet.
- Don't restart decommissioned surfaces (openclaw, Composio AO, Agent Zero, FISHBOWLZ-as-paused). FISHBOWLZ revival on Juke per Doc 662 is OK — that's the explicit reverse.

## What changed in the codebase this session (file-level summary)

| Repo | Change | PR |
|---|---|---|
| bettercallzaalwebsite | NEW: kit.html, brands.json + index.html nav card | #5 |
| zaostock | public/zao/ shrunk 15.6 → 0.9 MB | #38 |
| ZAOOS | Docs 660, 661, 662, 663, 664, 665, 666, 667, 668 added | #540, #542, #544, #545, #546, #547, #550, #552, #553, #555 (some merged) |
| ZAOOS | `src/app/stock/` + `src/app/api/stock/` deleted (92 files, 13,672 LoC) | #544 (merged) |
| ZAOOS | LICENSE added to ZAOOS + 5 sibling repos | #548 + cross-repo PRs |
| ZAO OS V1 git tags | `pre-zaostock-removal-2026-05-17` pushed | recovery point if needed |
| ~/.zao/zoe/human.md (VPS) | +14 lines, 4 project clarifications appended | (out-of-repo, on VPS) |
| ~/.claude/skills/zao-research/SKILL.md | v2.2 with Step 2.5 cross-repo search | (out-of-repo, local skill) |
| ~/bin/zao-fetch-x.sh | v2 with --mirrors flag + ARTICLE_DETECTED | (out-of-repo, local script) |

## Active task list at close (from this session's TaskCreate dispatches)

Most marked completed. Remaining open items:

- Crownvics grill (paused mid-question)
- 5 unclear repos to grill (crownvics + 4 others)
- Autoresearch loop Targets 2-4 (library hygiene, Frapp-GH questions, pre-commit hook)
- Bonfires Phase 1 build (waiting on Zaal's 3 data points)

## Final note

If anything in this handoff is stale by the time the new session opens, run `gh pr list --state all --limit 20 --repo bettercallzaal/ZAOOS` to see the latest. Ground in current state, not this snapshot.

— Generated 2026-05-18 by the session that ran 2026-05-17 evening → 2026-05-18 morning.
