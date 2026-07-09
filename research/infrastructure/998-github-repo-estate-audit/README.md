---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-07-09
superseded-by:
related-docs: 836, 601, 997
original-query: "Analyze all of our past GitHub repos (bettercallzaal + ZAODEVZ) - inventory, cluster, find duplication and dead experiments, recommend what to keep/consolidate/archive."
tier: DEEP
---

# 998 - GitHub Repo Estate Audit (bettercallzaal + ZAODEVZ)

> **Goal:** Map all 129 repos across both accounts, cluster them, find the duplication/sprawl/dead weight, and recommend keep / consolidate / archive. Sibling to doc 836 (ZAOOS-internal census); this is the cross-repo estate view.

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | The estate is 5x too big | **~20-25 repos are canonical; archive ~60-70 dead/one-off** | 129 repos, but only ~20 are live products. The rest are experiments, client one-offs, and monthly rebuilds. Archiving (not deleting) preserves history and makes the estate legible. |
| 2 | The fractalbot pattern | **STOP the monthly-rebuild habit - iterate ONE repo** | There are ~10 fractalbot repos (v1old, V3June2025, FRACTAL-BOTV2, nov2025, dec2025, feb2026, march2026, april2026, july2026) + ZAOfractal. Nine are stale monthly reboots. Keep `fractalbotjuly2026` (the "fresh rebuild" per docs 981/982) + `ZAOfractal`; archive the other 8. Then iterate, don't respawn. |
| 3 | WaveWarZ sprawl (8 repos) | **Keep wwbase + wavewarzapp + wwtracker + wavewarz-overlay; archive ww, wwtest1, wwinfo1, WARZAI** | 4 are private test/info scratch or 2025 early builds. wwbase is the canonical public brief. |
| 4 | Newsletter sprawl (5 repos) | **Keep zabalnewsletterbuilder + zaoonparagraph; archive zabalnewsletter, newsletter-bot-1, Newsletterbot1** | Builder is canonical, Paragraph is the distribution surface; the other 3 are dead 2025/early builds (newsletter-bot-1 is a 155MB node_modules corpse). |
| 5 | Naming chaos | **Adopt a naming convention + a canonical-repo ledger** | `ZAO-Video-Editor` vs `ZAOVideoEditor`, `zao-101` vs `ZAO101`, `zao-stock`/`zaostock`/`ZAOstock`, `ZAOscout` x3. No convention = can't tell canonical from cruft. |
| 6 | Repo bloat | **De-bloat or archive the 150MB+ repos** | chat (206MB), songjam-site (165MB), eliza1 (158MB), zaloraV1 (155MB), newsletter-bot-1 (155MB) almost certainly commit `node_modules`/media. Slow clones, wasted storage. Archive the dead ones; `.gitignore` node_modules on any kept. |
| 7 | Two-account graduation path | **Formalize: ZAODEVZ = graduated/team home, bettercallzaal = personal/lab + graveyard** | ZAODEVZ (17 repos, all 2026) is where the newer live products landed (ZAOcowork, Zuke, zabalgames, ZAOstock, ZAO101). This is the right direction - make it the rule and finish migrating. |
| 8 | Tie to harnesses | **A periodic "estate audit" belongs in the operator harness** | This sprawl is the cost of fast experimentation with no consolidation loop. The Personal Operator Cockpit (doc 997) should run a quarterly estate sweep that flags stale/dup repos. |

## Findings

### The numbers
- **129 repos total**: 112 under `bettercallzaal` (personal, the lab + graveyard), 17 under `ZAODEVZ` (team, the graduated home).
- Only **3 are already archived** (zao-101, zao-stock, zaostock) - so the archival discipline exists but is barely used.
- **~15 repos over 10MB**; six over 150MB (chat 206MB, songjam-site 165MB, ZAOOS 165MB [legit], eliza1 158MB, zaloraV1 155MB, newsletter-bot-1 155MB).
- Languages: mostly TypeScript, with Python (the fractalbots, video editors, budget) and HTML (event/client sites).

### Canonical / active estate (~20-25 - KEEP)
- **The lab:** `ZAOOS` (monorepo), `zao-claude-skills` (skills sync).
- **thezao.xyz + surfaces:** `ZAOcowork` (site/papers/board), `Zuke` (audio spaces), `ZAONEXUS` (+ `zaonexus-iman-ui`), `theZAOZone`, `ZAOmemberz`.
- **Products:** `zaalcaster` (personal FC client), `zpoidh` + `poidh-v2-contracts` (POIDH), `zabalgames` (ZABAL Games), `ZAOstock` (festival), `CoCConcertZ`, `zlank` (+ `zlank-snap-template`, `zlank-iman-version`), `ZAOartizen`, `ZAOpoker`, `channelz` (private FC client), `ZAOVideoEditor` (video pipeline), `ZAOscout`/`farscout` (scout), `ZOUNZ` (music mini-app).
- **Agents:** `hermes-orchestrator` (the supervisor framework, MIT, build-in-public).
- **Fractal:** `ZAOfractal` (Astro) + `fractalbotjuly2026` (canonical bot).
- **Newsletter:** `zabalnewsletterbuilder` + `zaoonparagraph`.
- **WaveWarZ:** `wwbase` (public brief) + `wavewarzapp` (demo) + `wwtracker` + `wavewarz-overlay`.
- **Finance/ops:** `finance-os`, `finance-hq` (private).

### The sprawl clusters (CONSOLIDATE)
| Cluster | Repos | Keep | Archive |
|---------|-------|------|---------|
| **Fractalbot** | 10 | fractalbotjuly2026, ZAOfractal | v1old, V3June2025, FRACTAL-BOTV2, nov2025, dec2025, feb2026, march2026, april2026 (8) |
| **WaveWarZ** | 8 | wwbase, wavewarzapp, wwtracker, wavewarz-overlay | ww, wwtest1, wwinfo1, WARZAI (4) |
| **Newsletter** | 5 | zabalnewsletterbuilder, zaoonparagraph | zabalnewsletter, newsletter-bot-1, Newsletterbot1 (3) |
| **Scout** | 3 | ZAODEVZ/ZAOscout | bettercallzaal/ZAOscout (dup), farscout (fold in) |
| **Video editor** | 2 | ZAOVideoEditor | ZAO-Video-Editor (old dup) |
| **Snaps** | 5 | zlank-snap-template | duodo-snap, nouns-snap, zabalsnap1, ltaesnap (one-off snaps) |
| **Early agents (2025)** | 6 | (none - superseded by ZOE/hermes) | eliza1, Agent2, ZAIV1, ZAIV2, WARZAI, zabalbot/zabal-bot-archive |
| **Timeline** | 2 | (pick 1) | zaaltimelinev1 or v1.1 |
| **ZAO101** | 2 | ZAO101 (live) | zao-101 (already archived) |

### One-off / client / event sites (ARCHIVE ~25)
Done or dead: `16statestreet`, `crownvics`, `cedartide`, `riverside-group-demo`, `riverside-internal`, `Zaal-s-Birthday`, `zaotravelz`, `ZAOFlights`, `Firsttimehomebuyers-guide`, `loanz-platform-1`, `RESUMEV1`, `SidebySidev2`, `Viz1`, `mixer` (empty), `textsplitter`, `CustomPDFCreator`, `farmdrop`, `zabalartsubmission`, `zabalsocials`, `ethboulderjournal`, `bcz-journal`, `zmentor`, `zdeepmeeting`, `zingfisher`, `zski`, `zaloraV1`, `songjam-site` (client work), `bettercallzaalwebsite` (if superseded), `ZAO-Leaderboard`, `zaomusicbot`, `fishbowlz` (deprecated), `zaochella-cypher-mp4-file` (media), `uvrintrobot`, `B-ZBUILD2`, `chat` (agentic-label web UI, likely superseded by ZAOOS), `WWA-Onboarding-app`, `zaoscribe`/`ZAOsribeBOT`, `spacetovideo`, `jax`, `Aurdour` (DJ platform - keep IF still a product).

### Private/internal (REVIEW)
`zaal-dotfiles` (keep), `zao-ui` (design tokens - keep or fold into ZAOOS), `zao-mono` (submodule monorepo - likely stale, superseded by monorepo-as-lab), `zaoos-workspace` (ZOE workspace - keep), `quad-sandbox` (dead 4-agent sandbox - archive), `budget2026`, `agencyweb3toolkit`, `unifiedchatclient` (superseded by channelz/zaalcaster - archive).

### What this says about how ZAO builds
The estate is a fast-experimentation machine with no consolidation loop. New ideas spawn new repos (good - low friction to start), but nothing ever gets archived, and some things (fractalbot) get REBUILT monthly instead of iterated. The "monorepo as lab" doctrine (CLAUDE.md) is the right fix for NEW work - but the back catalog needs a one-time cleanup + an ongoing estate discipline. This directly motivates the operator harness (doc 997): a quarterly sweep that flags stale/dup repos and proposes archives (PR-only, human-approved), so the estate stays legible without manual audits.

## Also See
- [Doc 836](../836-zaoos-repo-estate-census/) - the ZAOOS-internal census (routes/components/hooks)
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) - the last big decommission decision
- [Doc 997](../../agents/997-agent-harness-design-zaalcaster/) - the operator harness that should own the ongoing estate sweep

## Next Actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Approve the archive list (this doc's tables) - then archive the ~60-70 dead/dup repos via `gh repo archive` (reversible) | @Zaal | Decision | 2026-07-11 |
| Consolidate fractalbot: archive 8 stale, keep fractalbotjuly2026 + ZAOfractal, note canonical in ZAOfractal README | @Zaal | PR | 2026-07-14 |
| Write a canonical-repo ledger (one row per product -> its one live repo) into ZAOOS CLAUDE.md or a REPOS.md | @Zaal | PR | 2026-07-14 |
| Add a quarterly estate-audit step to the operator harness spec (doc 997) - flags stale/dup, proposes archives PR-only | @Zaal | PR | 2026-07-18 |

## Sources
- `gh repo list bettercallzaal --limit 200` + `gh repo list ZAODEVZ --limit 200` (name, description, pushedAt, diskUsage, isArchived, visibility) `[FULL]` - fetched 2026-07-09, the primary data for this audit.
- Repo descriptions where present `[FULL]`; repos with empty descriptions classified by name pattern + push date + size `[PARTIAL - inferred from metadata, not per-repo README read]`.
- Internal: docs 836 (prior census), 601 (decommission decision), CLAUDE.md monorepo-as-lab doctrine `[FULL]`.

> Note: verdicts on empty-description repos are metadata-inferred (name + last-push + size), not confirmed by reading each repo. Confirm before archiving anything you might still want live - archiving is reversible, but check the ambiguous ones (Aurdour, chat, bettercallzaalwebsite, zingfisher) first.
