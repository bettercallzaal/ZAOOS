---
topic: handoff
type: resume-pointer
status: active
last-validated: 2026-05-07
related-docs: 620, 621, 622, 624
session-rename: NEXUS
---

# 2026-05-07 evening - NEXUS rebuild handoff to desktop terminal

## One-line context

Just finished: Strategy D rebuild of ZAONEXUS into the canonical Nexus portal (community + ecosystem route groups, 35+ brands, 170+ links, haatz Farcaster integration). 3 PRs shipped today on github.com/bettercallzaal/ZAONEXUS. Now porting to desktop, continuing on memory backfill + corpus drafts.

## Read these in order before responding to Zaal

1. **`research/community/621-zao-context-canon-may7/README.md`** - canonical facts about Zaal, The ZAO, brand+legal architecture, project taxonomy (ZAO Projects vs ZABAL Projects), founder structure, 12mo vision.
2. **`research/community/624-nexus-portal-canon-may7/README.md`** - the Nexus consolidation strategy (Strategy D selected).
3. **`research/_archive/nexus-versions/CAPTURE-MANIFEST.md`** - what was in the 20 deleted legacy NEXUSV* repos.
4. **`research/community/622-impact-networks-david-ehrlichman/README.md`** - The ZAO as impact network (Hats Protocol founder framework).
5. **`research/agents/620-bonfire-push-everything/README.md`** - Bonfire auto-push pipeline. Memory backfill is the gating step.
6. **This file.**

## What's done today

| Item | Status |
|---|---|
| 20 legacy NEXUSV* repos | DELETED + archived (39 files saved) |
| Alchemy + OpenAI key rotation | Already rotated (verified suffixes don't match dashboards) |
| `gh auth` `delete_repo` scope | Dropped after deletes |
| ZAONEXUS PR #1 (Strategy D baseline) | Merged |
| ZAONEXUS PR #2 (full /ecosystem redesign + haatz swap) | Merged |
| ZAONEXUS PR #3 (Webflow data ingest + iykyk + Magnetiq) | Open, Zaal will merge soon |
| BCZ-website redirect (`/nexus.html` -> `nexus.thezao.com/ecosystem`) | Live (committed to main directly per BCZ convention) |

## Open work queue (priority order)

### P0 - finish Nexus consolidation cleanly (Zaal hands)

1. **Webflow new /ecosystem page** - Zaal duplicates ZAO NEXUS page in Webflow Designer, points iframe src at `https://zaonexus.vercel.app/ecosystem`. Then tells next-Claude what URL it ends up at. Possible URLs: `nexus.thezao.com/ecosystem`, `thezao.com/nexus/ecosystem`, `thezao.com/ecosystem`.
2. **Update BCZ vercel.json redirect target** if Webflow URL differs from current `https://nexus.thezao.com/ecosystem`. File at `~/Documents/BetterCallZaal/vercel.json`.

### P1 - actually use what we built

3. **Bonfire memory backfill (135 files)** - doc 620 step 1, the gating step for ZOE @recall to actually return useful answers. Script: read `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/*.md`, POST each to `https://tnt-v2.api.bonfires.ai/ingest_content` with `BONFIRE_API_KEY` (in VPS env at `/home/zaal/zao-os/bot/.env`). 1-shot batch. After this, recall returns real answers.

4. **Bonfire-corpus drafts** - 8 files Zaal asked for at start of today's session: `bonfire-corpus/identity/zaal-bio.md`, `zaal-schedule.md`, `zaal-handles.md`, `org/zao-mission.md`, `zao-four-pillars.md`, `brand-glossary.md`, `system/bot-fleet.md`, `system/vps-infra.md`. Draft from doc 621 + memory canon. Zaal redlines.

### P2 - hydrate /ecosystem brand cards

5. **22 parked mindmap questions** - resume one-by-one grill from doc 621 open questions. LTAW3 acronym + Maru, prizem, Midi-ZAO-NZ, ZAO Cards (NFT? playing cards?), Student $LoanZ, Mindful Moments / Iain, Eden / Bad / Fractal Hours / OP Fractal relationships, conferences that featured Empire Builder + Bonfire, ZAO Festivals legal entity decision, Riverside.fm verification, education, etc. Each answer thickens the brand registry.
6. **Featured links + What's New badges** - data fields shipped in v1.3, just need UI rendering on `/ecosystem` index. Doc 624 v1.4 baseline.
7. **Link-health monitoring cron** - GitHub Action pings each link weekly, status field updates. Doc 624 v1.4.

### P3 - close the loop

8. **@recall in newsletter + social agent drafts** - priority #7 from `feedback_social_pipeline_priorities_may6.md`. Needs P1 #3 (memory backfill) done first.
9. **Per-platform caption tailoring** - priority #4 from same.
10. **Analytics back via Neynar webhook + Bonfire ingest** - priority #5.

## Critical behavioral rules to follow (from memory)

- `feedback_grill_one_by_one.md` - ask ONE question, wait, adjust. No batch essay.
- `feedback_research_before_grill.md` - before any biographical/profile work, /zao-research existing sources first. The bartending misread cost trust earlier today.
- `feedback_no_em_dashes.md` - hyphens only, never em dashes.
- `feedback_no_emojis.md` - no emojis or decorative Unicode.
- `feedback_check_pr_state_always.md` - before any push, `gh pr list --state all` to confirm branch's PR status. Never push to merged-PR branches.
- `feedback_never_push_main.md` - ZAOOS work always via PR. Zaal merges himself.
- `feedback_always_pr.md` - same.
- BCZ-website is exception: direct main pushes OK per their no-build convention.
- `feedback_ship_and_use_not_meta.md` - default to "what does Zaal do TODAY" over "what to build next."
- Caveman mode active (full level) - terse, fragments OK, no fluff.

## Critical canon to NEVER violate

- Zaal is **solo founder of The ZAO**. Community members are cofounders of specific PROJECTS, not of The ZAO itself. (Webflow data showing them as "Co-Founders" is legacy framing - documented but doc 621 wins.)
- Zaal has **NEVER bartended** (April 2026 memory misread, possible-bartending-gig never happened).
- The ZAO started **Jan 2024** as collective. **June 3 2024** = first Fractal Monday.
- 12mo vision (May 2027) = "ecosystem primitives built for any digital creator to bring their brand and scale."
- "Primitive" = INTERNAL only. EXTERNAL copy = "ecosystem of projects + tools for digital creators."
- ZAO Projects (incubated, community cofounders) ≠ ZABAL Projects (Zaal solo, pre-incubation). Conversion = formal proposal to The ZAO requesting collaborators.
- BCZ Strategies LLC = legal hub. ZABAL = umbrella brand. The ZAO = impact network entity (NO legal entity yet, DUNA evaluated and didn't fit).
- WaveWarZ = first ZAO incubator project. Hurric4n3ike = founder + lead dev. Zaal + Samantha (candytoybox, her/she) = cofounders.
- JANGOUU FOREVER (all caps) = origin-story musician from college 2018/19. Semi-active May 2026. Handles: x.com/jangouuforever, beacons.ai/jango.uu.
- Brand glossary spellings (never autocorrect): WaveWarZ, COC Concertz, The ZAO, BetterCallZaal, Joseph Goats, ZABAL, $SANG, FISHBOWLZ, Stilo World, Tom Fellenz, Thy Revolution, ZOE, ZOLs, Hurric4n3ike (lowercase, digits 4+3), JANGOUU FOREVER, Ohnahji B, attabotty, Iman, EZinCrypto.

## Resume sequence on desktop

```bash
# 1. Pull latest on both repos
cd ~/Documents/ZAO\ OS\ V1
git fetch origin
git checkout main && git pull

cd ~/Documents/ZAONEXUS
git fetch origin
git checkout main && git pull

# 2. Open Claude Code in ZAOOS dir (the canonical project)
cd ~/Documents/ZAO\ OS\ V1
claude
```

## First message to paste to desktop Claude

Paste the prompt from `/clipboard` page Zaal opens with this session.
