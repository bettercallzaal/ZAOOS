---
topic: dev-workflows
type: market-research
status: research-complete
last-validated: 2026-04-29
related-docs: 549, 558, 560, 562
tier: STANDARD
---

# 563 - Shann³ (@shannholmberg) Content-Engine Pattern: 17 Markdown Files + 1 Agent = 10 Social Accounts

> **Goal:** Decode the Shann³ "Ronin content engine" pattern from `@shannholmberg` X posts. Map it to ZAO's existing brand-bot-fleet plan (memory `project_tomorrow_first_tasks`) and RaidSharks (memory `project_raidsharks_empire_builder`). Extract the architectural lesson worth lifting.

## Note On Source Access

The specific tweet at `https://x.com/shannholmberg/status/2038636871270424794` could not be fetched. WebFetch returned **HTTP 402** (X paywall on unauthed scraping). See [Doc 562 - Reddit/X scraping meta-eval](../562-reddit-x-scraping-meta-eval-last30days/) for the canonical fix - install `mvanhorn/last30days-skill` (24.3K stars) which carries an X browser-session token to fetch live tweets.

**For this doc, the analysis pivots to the surrounding shannholmberg posts surfaced via Google search (last 30 days), which carry the same content-engine thesis.** The exact wording of `2038636871270424794` will need a manual paste from Zaal once installed, or a re-fetch via last30days-skill.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Adopt Shann³'s "N markdown files + 1 agent = M social accounts" pattern for ZAO brand fleet | **YES, ALREADY ALIGNED** | Memory `project_tomorrow_first_tasks` already plans "ZOE concierge + independent bot per brand + portal /bots + ZOE-as-hub dispatch." Shann³'s public-facing version (Ronin) is essentially the same architecture - confirms ZAO is on the right track and gives us a reference shape to cross-check against. |
| Steal the "17 markdown files" structure literally | **YES, AS A SCAFFOLD** | If Ronin runs 10 accounts off 17 files, ZAO's brand fleet (Research, ZAOstock, Magnetiq, WaveWarZ, POIDH, ZAO Music, BCZ, ZOE Concierge, RaidSharks) needs 15-20 markdown files in a `bot-config/` dir per brand. Concrete file shapes implied: voice, audience, posting cadence, do/don't, current campaigns. |
| Adopt Shann³'s "AI Knowledge Layer" framing for ZOE / brand bot context | **YES** | "Your agents are useless without it" - the markdown-files-as-knowledge-layer is the framing that solves bot-quality problems Zaal complains about (memory `project_zoe_v2_pivot_agent_zero` notes M2.7 hit walls). |
| Reach out to Shann³ for collaboration / DM | **DEFER** | Per `feedback_dont_invent_outreach`. Track + lift patterns. If Zaal wants outreach, do separately. |
| Treat this as net-new research vs duplicating `project_raidsharks_empire_builder` | **NET-NEW PATTERN, SAME GOAL** | RaidSharks does Telegram raids for X amplification. Ronin / Shann³'s pattern is upstream: how to actually generate the 10 accounts' worth of content in the first place. Complementary, not duplicate. |

## What Shann³ (@shannholmberg) Posts About

Verified 2026-04-29 via web search. X account: `@shannholmberg`, name "Shann³", focus "AI marketing & growth and shares every framework as building it."

### Recent posts surfaced

| Tweet ID | One-line content | ZAO relevance |
|---|---|---|
| `2043307903822844087` | "how to build your own content engine - Ronin runs 10 social accounts without writing a single post, no content team, just 17 markdown files and one AI agent here's how it works" | **Highest** - direct architectural lift target |
| `2044111115878326444` | "AI Knowledge Layer (and why your agents are useless without it)" | High - meta framing for bot-context-as-files |
| `2038987271664476521` | "POV: you finally installed superpowers and stopped going back & forth with claude for hours" | Medium - confirms `obra/superpowers` skill stack alignment |
| `2038636871270424794` (the requested one) | **Could not fetch (X 402)** - likely from same content-engine thread | Unknown until fetched via `last30days-skill` or manual paste |

The 4 tweet IDs above all sit within ~5,500 ID-units of each other (X Snowflake IDs are time-ordered). They're all from the same week, mid-April 2026. The thesis cluster is consistent: agents + markdown + content engines + AI knowledge layers.

## The Ronin Pattern (Synthesised from `2043307903822844087`)

Per the surfaced tweet:

| Element | Value |
|---|---|
| Output | 10 social accounts |
| Inputs | 17 markdown files |
| Operator | 1 AI agent |
| Human content team | None |

Reasonable inference about what those 17 files contain (matching standard "AI knowledge layer" patterns + Shann³'s framing):

| File | Purpose |
|---|---|
| `voice.md` | Tone, vocabulary, do/don't phrases per brand |
| `audience.md` | Who reads each account, what they care about |
| `cadence.md` | Posting schedule per platform |
| `pillars.md` | 3-5 content pillars / themes |
| `swipe-file.md` | Links + screenshots of high-performing reference posts |
| `do-not.md` | Banned topics, words, takes |
| `accounts.md` | Per-platform handle + bio + link strategy |
| `current-campaigns.md` | What's the current 2-week push? |
| `metrics.md` | Engagement targets per platform |
| `feedback-loop.md` | What worked / didn't last week |
| `bio-archive.md` | Past bio iterations |
| `crisis.md` | What to do if something blows up bad |
| `partnerships.md` | Active brand collabs |
| `legal.md` | What we cannot say (FTC, securities, etc.) |
| `style-guide.md` | Capitalisation, punctuation rules |
| `media-library.md` | Approved images, videos, GIFs |
| `system.md` | The agent's operating instructions tying it all together |

That hits 17. **This is an inference, not Shann³'s actual list.** Verify when the original tweet is accessible.

## Mapping To ZAO Brand-Fleet (Memory `project_tomorrow_first_tasks`)

ZAO already plans 10+ branded bots:

| ZAO bot | Brand | Status |
|---|---|---|
| ZOE Concierge | The ZAO | ZOE v2 in flux per memory |
| ZAO Devz bot | ZAOOS Devz | Live |
| ZAOstock Team Bot | ZAOstock | **Live** per memory `project_zaostock_bot_live` |
| Research bot | The ZAO research | Planned |
| Magnetiq bot | Magnetiq brand | Planned |
| WaveWarZ bot | WaveWarZ | Planned |
| POIDH bot | POIDH bounty | Planned |
| RaidSharks | Raids + amplification | Live (memory `project_raidsharks_empire_builder`) |
| BCZ Strategies bot | BetterCallZaal | Planned |
| ZAO Music bot | ZAO Music label | Planned |

If each brand gets a Ronin-style 17-file knowledge layer in its bot's repo (or in the central `bot-config/` dir), the agent quality jumps without rebuilding agents. **This is cheaper than the M2.7 -> Agent Zero pivot already discussed in memory `project_zoe_v2_pivot_agent_zero`.**

## Concrete ZAO Implementation Sketch

### Step 1 - One brand at a time, starting with ZOE

```
bot-config/
└── zoe/
    ├── voice.md           # Concierge tone, helpful, direct
    ├── audience.md        # 188 ZAO members, plus inbound leads
    ├── cadence.md         # Telegram only, response within 5 min
    ├── pillars.md         # ZAOstock prep, Music releases, agent stack updates
    ├── do-not.md          # Don't autocomplete brand names; per memory rules
    ├── accounts.md        # @ZOE on Telegram only for now
    ├── current-campaigns.md   # ZAOstock Oct 3, Cipher mint, RaidSharks
    ├── feedback-loop.md   # Per session-end reflections
    ├── crisis.md          # Defer to Zaal on policy issues
    ├── style-guide.md     # No em dashes, no emojis, hyphens only (memory rules)
    ├── partnerships.md    # Juke partnership, Black Flag Collective, BCard
    ├── legal.md           # Never claim ZABAL is a security; never imply endorsement
    ├── system.md          # ZOE's operating instructions
    ├── memory-pointers.md # Where to read project memory
    ├── escalation.md      # When to ping Zaal vs handle alone
    ├── voice-examples.md  # Real Zaal-approved replies as few-shot
    └── kpis.md            # Reply time, satisfaction, escalation rate
```

That's 17 files. Ronin shape applied to ZOE.

### Step 2 - Replicate per brand

ZAOstock, RaidSharks, BCZ, etc. each get their own 17-file dir. Most files will reuse a base template + brand-specific overrides.

### Step 3 - Centralise via ZOE-as-hub

ZOE reads all `bot-config/*/system.md` and routes inbound questions to the right brand bot. Architecture matches memory `project_tomorrow_first_tasks`.

### Step 4 - One agent runs each

Per `feedback_prefer_claude_max_subscription`, run each brand's agent via Claude Code CLI on VPS 1. QuadWork (memory `project_vps_skill`) is the orchestrator.

## Why This Beats Just-Giving-It-A-Big-Prompt

Shann³'s "AI Knowledge Layer" thesis: dumping context into a single prompt is brittle. Splitting into named files lets:

- Edit one file without touching others (versioned in git)
- Different agents read different subsets
- Humans can review + approve voice changes per file
- Onboarding new brand bots = duplicate the dir, edit 5 files

This is essentially what Lazer's `references/source/` pattern (Doc 548) does for code. Different domain, same idea.

## Risks

| Risk | Mitigation |
|---|---|
| 17 files per brand x 10 brands = 170 files of context drift | Quarterly audit (similar to Doc 552 skill audit) |
| Agent reads stale `current-campaigns.md` | Auto-update via `/morning` skill or cron |
| Voice files diverge from actual Zaal voice | Pin examples in `voice-examples.md` from real Zaal-approved messages |
| Crisis playbook exists but no one runs the drill | Annual test, scheduled |
| Lifting Shann³'s pattern without attribution | This doc credits him; any public ZAO write-up references his thread |

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Once `last30days-skill` is installed (Doc 562), refetch tweet `2038636871270424794` for verbatim | Zaal | One-shot | After Doc 562 install |
| Build first 17-file knowledge layer for ZOE under `bot-config/zoe/` | Zaal or ZAO Devz | PR | This sprint |
| Validate Shann³'s actual 17 files (DM, podcast appearance, or public unroll) | n/a | Watch X | Ongoing |
| Replicate for ZAOstock bot (already live, easy first port) | Zaal | PR | Next sprint |
| Replicate for RaidSharks once Empire Builder V3 lands (memory `project_raidsharks_empire_builder`) | Zaal | PR | When V3 ready |
| Update memory `project_tomorrow_first_tasks` to reference this doc as architecture spec | Zaal | Memory | This week |

## Also See

- [Doc 549 - 21st.dev hub](../549-21st-dev-component-platform/) - sibling "skills as filesystem" pattern
- [Doc 558 - Anbeeld WRITING.md](../558-anbeeld-writing-md/) - prose hygiene the bots' outputs run through
- [Doc 560 - OpenWhisp](../560-openwhisp-local-speech-to-text/) - voice-first input layer for Zaal-approved examples that feed `voice-examples.md`
- [Doc 562 - Reddit/X scraping meta-eval](../562-reddit-x-scraping-meta-eval-last30days/) - sister doc; explains why specific tweet not fetched
- Memory `project_tomorrow_first_tasks` - bot-fleet plan
- Memory `project_raidsharks_empire_builder` - existing raid amplification bot
- Memory `project_zoe_v2_pivot_agent_zero` - alternative ZOE pivot path
- Memory `project_zaostock_bot_live` - first brand bot in production

## Sources

- [Shann³ on X / @shannholmberg](https://x.com/shannholmberg) - account verified 2026-04-29
- [Tweet `2043307903822844087`](https://x.com/shannholmberg/status/2043307903822844087) - "how to build your own content engine" (Ronin pattern)
- [Tweet `2044111115878326444`](https://x.com/shannholmberg/status/2044111115878326444) - "AI Knowledge Layer (and why your agents are useless without it)"
- [Tweet `2038987271664476521`](https://x.com/shannholmberg/status/2038987271664476521) - superpowers skill stack alignment
- Tweet `2038636871270424794` - **could not fetch (X 402); see Doc 562 for fix**

## Staleness Notes

- Specific tweet `2038636871270424794` content unverified - flagged
- 17-file list above is INFERRED, not Shann³'s actual list - flagged
- Re-validate after Doc 562 install allows full X scrape
- Re-validate quarterly while Shann³ is publicly posting
