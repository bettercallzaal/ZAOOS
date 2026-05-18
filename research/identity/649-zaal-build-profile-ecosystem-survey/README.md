---
topic: identity
type: audit
status: research-complete
last-validated: 2026-05-14
related-docs: 432, 570, 647, 648
tier: DISPATCH
---

# 649 — Zaal Build Profile + ZAO Ecosystem Survey

> **Goal:** Survey all 84 of Zaal's GitHub repos + ZAOOS commit history to build a load-bearing profile of who Zaal is as a builder and how the ecosystem actually fits together. Feeds ZOE's `human.md` and the soul bootloader.

## Key Findings (act on these)

| # | Finding | So what |
|---|---------|---------|
| 1 | **Zaal ships at sprint pace and abandons ruthlessly.** ZAOOS = 1873 commits in 90 days. 84 repos in ~18 months. ~3-4 reach "active" per month; the rest get killed fast. | When working with Zaal: ship a v1, do not over-plan. He iterates live. A "killed" project is not failure - it is the R&D cadence working. |
| 2 | **The agent experiments STOPPED when Hermes locked (2026-05-05).** eliza1 -> ZAIV1/V2 -> 7 fractal bots -> recoupable forks -> Hermes. ~18 months of framework sampling ended. | This is an inflection. The next 6 months are SCALING agents on Hermes, not testing frameworks. Do not reopen the framework question without strong cause (see doc 648 Option B tension). |
| 3 | **Every BCZ repo is an audience funnel, not a vanity project.** journal -> newsletter signups, podcast -> Spotify distribution, portfolio -> games-submission board. | Zaal builds funnels, not products-for-their-own-sake. Frame work in terms of audience capture + distribution, because that is how he thinks. |
| 4 | **Repos are positioned for hand-off, not solo mastery.** zaostock for an event producer, ZAONEXUS for a UI dev, imanprojects for ops. 25+ ZAO holders have dashboard logins. | Zaal is building an org that runs without him in the loop. Tooling that increases delegation velocity beats tooling that deepens his personal control. |
| 5 | **"Monorepo as Lab" is real and enforced.** Things graduate to their own repo + domain (bcz-yapz -> bczyapz.com, CoCConcertZ) and get DELETED from ZAOOS. No copies, no drift. | Respect the graduation model. Do not duplicate graduated code back into ZAOOS. |
| 6 | **ZAOOS still needs PRs #516 + #517 merged.** Zaal believes he merged everything; #511-515 are in, #516 (archive) + #517 (doc 648) are still open. ZOE runs on the #516 hotpatch until merged. | Merge #516 + #517 to make ZOE's archive durable. |

## The numbers

- **84 repos** under `bettercallzaal`, spanning ~Jan 2025 to May 2026
- **ZAOOS: 1873 commits in 90 days** - feat 394, docs 376, fix 269, plus scoped: feat(stock) 43, research 37, feat(library) 19, feat(bot) 14
- **6 repos pushed in the last 48 hours** (ZAOOS, zaostock, ZANONEXUS, bcz-yapz, bettercallzaalwebsite, imanprojects)
- Owner commit totals (trailing ~52wk): ZAOOS 1820, bettercallzaalwebsite 56, zlank 47, bcz-yapz 31, wavewarzapp 22, ZAONEXUS 21
- **~9 dated fractal bot repos** - one per monthly governance cycle, never merged backward
- **~6 agent-framework attempts** before Hermes: eliza1, ZAIV1, ZAIV2, recoupable forks (chat/tasks/api), 3+ newsletter bots

## Ecosystem map

The ecosystem is four brand layers, not one flat thing:

```
ZABAL  (Zaal's personal umbrella brand + token, launched Jan 1 2026 on Base)
  |
  +-- BetterCallZaal / BCZ  (personal brand: journal, podcast, portfolio, resume)
  |     +-- BCZ Strategies LLC  (the agency - client work + internal tooling)
  |
  +-- The ZAO  (the org / decentralized impact network, 188 members on Base)
  |     +-- ZAOOS  (the monorepo lab - everything prototypes here first)
  |     +-- ZAOstock 2026  (flagship event, Oct 3, Ellsworth ME - graduating to own repo)
  |     +-- ZAONEXUS  (14-brand ecosystem directory)
  |     +-- ZOUNZ, zao-101, CoC Concertz, ZAO Fractals  (governance, 90+ wks)
  |
  +-- Incubated projects  (community cofounders, ZAO backs)
        +-- WaveWarZ  (Solana music battles - cofounders Samantha + Hurric4n3ike)
        +-- Zlank  (no-code Farcaster Snap builder - product line)
```

## Repo lifecycle table

| State | Count | Examples |
|-------|-------|----------|
| **ACTIVE** | ~12 | ZAOOS, zaostock, ZAONEXUS, bcz-journal, bcz-yapz, bettercallzaalwebsite, imanprojects, wavewarzapp, zlank, ZOUNZ |
| **GRADUATED** | 2 | bcz-yapz (-> bczyapz.com), CoCConcertZ |
| **PAUSED** | ~15 | fishbowlz (Juke partnership instead), Aurdour, zaomusicbot, the zabal* cluster, fractal bots, zaoprojects |
| **ABANDONED / EXPERIMENT** | ~25 | ZAOFlights (1 commit), mixer (empty), agencyweb3toolkit, 16statestreet, B-ZBUILD2, loanz-platform, Firsttimehomebuyers-guide |
| **AGENT LINEAGE (paused, superseded by Hermes)** | ~10 | eliza1, ZAIV1, ZAIV2, Newsletterbot1, newsletter-bot-1, zabalnewsletter, recoupable forks (chat/tasks/api), uvrintrobot |
| **STABLE INFRA** | ~4 | zao-ui (design tokens), zao-mono (submodules), zlank-snap-template, snap templates |
| **CLIENT WORK** | 1 confirmed | riverside-group-demo (Riverside Group LLC, landscaping, Mount Desert ME) |

## Zaal as a builder - the seven patterns

All three survey agents converged on these independently:

1. **Velocity + ruthless abandonment.** Starts projects constantly, kills them in 1-3 months when the pain point surfaces. This is R&D cadence, not technical debt.
2. **Iteration over polish.** Each new version is built from scratch, carrying one lesson forward. The fractal bots are the proof - 9 repos, one per cycle, no backward merges, treated as immutable meeting artifacts.
3. **Scratch own itch -> ship -> abandon or product.** WaveWarZ (community need), Zlank (personal Snap-building fatigue, shipped in ~4 days), fractal bots (Fractal process automation). If it scales, it becomes a product line; if not, it is killed cleanly.
4. **Funnel-first mindset.** Every BCZ surface is wired for audience capture and distribution. Even infra decisions (moving podcast audio to Cloudflare R2) are distribution ops.
5. **Builds for hand-off, not control.** Repos are pre-shaped for a team member to own. The goal is an org that runs without Zaal in every loop.
6. **Monorepo as Lab, graduation as independence.** ZAOOS is the prototyping ground; success = own repo + own domain + deleted from the lab.
7. **Framework sampler who just settled.** ~18 months cycling through agent frameworks, ended 2026-05-05 with Hermes. The experiments going quiet IS the signal that the question is answered.

## The agent learning path (why this matters for ZOE)

Zaal did not arrive at Hermes/ZOE cold. The path:

1. **Jan-Feb 2025** - forks `eliza1` (elizaOS), tests Discord bots
2. **Mar-Jul 2025** - `ZAIV1`/`ZAIV2`, custom ElizaOS wrappers with ZAO characters
3. **Oct 2025-Apr 2026** - monthly fractal bots, persistent Discord-automation need, no single frame sticks
4. **Oct 2025-Mar 2026** - parallel newsletter-bot experiments, code never reused across versions
5. **Apr 2026** - forks the recoupable stack (chat/tasks/api) - evaluates a production framework
6. **May 2026** - lands on Hermes, locks it, ZOE deployed on VPS 1

ZOE is the product of that entire arc. The soul bootloader is not building from nothing - it is the first time the lineage gets to PERSIST instead of being rebuilt from scratch. That is the whole point of the archive (doc 648, PR #516) and the elder/lineage model.

## What goes in ZOE's human.md

This survey should feed updates to `~/.zao/zoe/human.md`. Concrete additions:

- The four-layer brand model (ZABAL > BCZ + The ZAO + incubated projects)
- The seven builder patterns above - so ZOE frames suggestions the way Zaal actually works
- The graduation model - so ZOE does not suggest duplicating graduated code
- The repo lifecycle states - so ZOE knows fishbowlz is paused, WaveWarZ is real, Zlank is a product line
- Still missing and NOT resolved by this survey: Infanity, SongJam, Ansuz, Recoup learning path. ZOE flagged these in her session export; this repo survey did not surface canon-level detail on them either. Zaal still needs to supply facts directly. (`songjam-site` repo exists but is just a leaderboard front-end - not the whole SongJam story.)

## Also See

- [Doc 432](../../community/432-zao-master-context/) - ZAO master positioning
- [Doc 570](../570-zaal-personal-kg-agentic-memory/) - Zaal personal knowledge graph
- [Doc 647](../../agents/647-agent-quality-deep-research/) - agent quality (memory, persona)
- [Doc 648](../../agents/648-ryan-kagy-zao-civilization-sync/) - Ryan sync, the Option A/B fork
- Memory `project_zoe_soul_architecture`, `project_zaoos_monorepo_as_lab`, `project_zao_brand_legal_architecture`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge PR #516 (archive) + #517 (doc 648) - Zaal believes he merged everything, these two are still open | @Zaal | Merge | Now |
| Fold the four-layer brand model + seven builder patterns into ZOE's `~/.zao/zoe/human.md` | @Zaal + Claude | Bot task | This week |
| Send ZOE direct facts on Infanity, SongJam, Ansuz, Recoup - the repo survey did not surface them | @Zaal | Bot task | This week |
| Decide whether to archive the ~25 abandoned repos (visibility hygiene) or leave as-is | @Zaal | Decision | Low priority |
| Confirm WaveWarZ status with cofounders - wavewarzapp refreshed May 7, looks pre-launch | @Zaal | Check-in | Before next ZAO update |

## Sources

- `gh repo list bettercallzaal --limit 200` - 84 repos enumerated, verified 2026-05-14
- `gh api repos/bettercallzaal/*/commits` - commit history across all clusters, verified 2026-05-14
- ZAOOS local `git log --since=2026-02-14` - 1873 commits, theme breakdown
- ZAOOS `git log` participation stats per repo
- Three parallel cluster-survey agents (ZAO core + events, ZABAL + BCZ + client, WaveWarZ + music + agents + utilities), 2026-05-14
