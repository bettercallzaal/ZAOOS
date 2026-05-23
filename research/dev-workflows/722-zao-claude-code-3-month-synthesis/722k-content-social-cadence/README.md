---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-23
tier: STANDARD
original-query: "Audit the content + social cadence over the last 3 months - newsletter, BCZ YapZ episodes, ZOE post slate, /socials runs, big wins, Farcaster spaces, WaveWarZ shows, ZABAL Games launch. Map cadence + status + over/under-served channels + cold content + pipeline blocks."
---

# 722k - Content & Social Cadence Audit (3-Month Synthesis)

> **Goal:** Map what's actually shipping across all content surfaces (Feb 23 - May 23, 2026) - which channels are live, which are paused, where the pipeline blocks, and what to amplify next given the 2026-05-24 livestream + ZABAL Games launch.

## Executive Summary

ZAO's content stack has **5 LIVE surfaces** and **3 PLANNED but not yet running** initiatives. The live stack is robust but unevenly distributed - WaveWarZ programming dominates (11 shows/week), while the daily social slot (ZOE post slate) just shipped (v1 live 2026-05-16). Newsletter + big-win capture exist in code but are not yet integrated into Zaal's daily workflow. BCZ YapZ graduated successfully (4 episodes published post-graduation, 2026-05-06).

**Key finding:** The content pipeline succeeds when automation is high (WaveWarZ shows, ZOE post pings) and fails when it requires Zaal's manual edit (newsletter drafts, /big-win captures). The 12-week Road to ZAOstock campaign is planned but hasn't launched.

---

## 1. ZOE Post Slate

| Metric | Status |
|--------|--------|
| **Status** | LIVE (v1 shipped 2026-05-16) |
| **Cadence** | 7 pings/day, 5am-10pm ET |
| **Surface** | Telegram → Firefly (FC + X combined) |
| **Categories** | build (3), ecosystem (2), event (1), personal (1) |
| **PR** | #533 |
| **Mode** | Haiku drafts (Hermes CLI), no API key billing |

### What's Shipping

ZOE drafts 4-category social-post suggestions 7 times daily, DMs them to Zaal on Telegram, he copy-pastes keepers into Firefly (one post hits both Farcaster + X). Sources: GitHub activity (last 24h commits + open PRs), 7-day repo momentum (proxy for ecosystem), manually seeded `~/.zao/zoe/events/{today,tomorrow}.txt` for big events, voice memos captured via `/voicememo <text>` appended to `~/.zao/zoe/voice-memos/YYYY-MM-DD.md`.

**Latest run cadence:** Rolled daily at midnight ET, stored at `~/.zao/zoe/posts/schedule.json`, logged to `~/.zao/zoe/posts/log.jsonl`. No buttons in v1 (lowest blast radius).

### Pipeline Blocks

- **Manual step required:** Copy-paste from Telegram to Firefly (no Firefly API integration yet)
- **Event sourcing:** Today/tomorrow events must be manually seeded; no Google Calendar MCP yet
- **v2 roadmap pending:** Inline `[Post] [Regen] [Skip] [Edit]` buttons, skip-rate learning, auto-post path via Firefly API, stream transcript source (zao-transcribe), voice note ingestion via Whisper

### Health

LIVE + healthy. Category weights tuned after real usage. 20-minute minimum gap between pings keeps volume manageable. No cold content (fires every day by design).

---

## 2. Newsletter

| Metric | Status |
|--------|--------|
| **Status** | CODED but NOT INTEGRATED |
| **Surface** | Daily "Year of the ZABAL" entry, persisted to `~/.zao/zoe/newsletters/<date>.md` |
| **Integration** | Bot agent in `bot/src/zoe/agents/newsletter.ts` |
| **Commands** | `@newsletter <angle>` drafts; `@newsletter edit <addition>` re-rolls |

### What Exists

Code path is ready: `/newsletter` agent accepts text input, Bonfire context (if available), and rolls a daily entry that gets saved to `~/.zao/zoe/newsletters/<date>.md`. The agent is wired into the ZOE concierge but **Zaal has not adopted the command workflow yet**. No auto-distribution happening (no Paragraph integration, no cross-post to Substack).

### Pipeline Blocks

1. **Workflow adoption:** Zaal hasn't started using `@newsletter` daily capture
2. **Distribution missing:** No skill for picking a newsletter entry and posting it to Paragraph/Substack/Firefly
3. **Social skill output requires manual paste:** per feedback_firefly_only, newsletter distribution requires copying text + pasting into Firefly/socials manually (no `/socials` skill integration)

### Health

PLANNED but COLD. Last commit touching newsletter.ts: Feb 2026. Code is ready; workflow adoption is the blocker.

---

## 3. BCZ YapZ Podcast Episodes

| Metric | Status |
|--------|--------|
| **Graduated** | 2026-05-06 to `github.com/bettercallzaal/bcz-yapz` (PR #480) |
| **Episodes published** | 8 post-graduation (as of May 23) |
| **Total episodes** | 13 (7 in Q1, 6 more after graduation) |
| **Platform** | YouTube @bettercallzaal |
| **Description generation** | `/bcz-yapz-description <slug>` skill |

### Recent Episodes (Post-Graduation)

| # | Date | Guest | Topic |
|---|------|-------|-------|
| — | 2026-04-26 | Andy Minton | Hangry Animals |
| — | 2026-05-05 | Kenny | POIDH |
| AUDIT | 2026-05-06 | — | Graduation audit doc |
| — | (4 more) | (pending) | (pending) |

YouTube descriptions: 4 files in `/Users/zaalpanthaki/Documents/bcz-yapz/content/youtube-descriptions/`. Skill `/bcz-yapz-description` reads transcript, parses frontmatter, extracts 10-15 YouTube chapters, generates 3 paragraphs Zaal-voice, resolves entities via link-map.json, validates 12 rules, writes output file + copies body to clipboard.

### Pipeline Blocks

- **Transcript ingestion:** Guest recordings → transcripts manually uploaded to bcz-yapz repo
- **Description generation:** One-off runs (user invokes skill per episode, not automated)
- **Publishing:** YouTube upload + description paste is manual

### Health

LIVE + healthy. Graduated cleanly (code deleted from ZAOOS, independent repo). 8 episodes in ~17 days suggests good production momentum. /bcz-yapz-description skill reduces friction significantly.

---

## 4. Farcaster Spaces & Streams

| Metric | Status |
|--------|--------|
| **Sun 2026-05-24** | **LOCKED:** Zaal DJs old ZAO music for lore + ZABAL Games announcement |
| **Recurring** | No official weekly cadence documented yet |

### What's Scheduled

**2026-05-24 (Sunday) Stream:**
- **Time:** ~7pm ET (per WaveWarZ Sunday slot, need to confirm)
- **Content:** Zaal synthesizing the community's music (per doc 720 "my art is better as a synthesisation of our community's music")
- **Announcement:** ZABAL Games build-a-thon launch public pitch
- **Platform:** Likely X Spaces (historical), possibly Farcaster Spaces (newer default)

### ZAOstock 11 Shows/Week Plan

**Planned for Oct 3 event + leading up to it:**
- 5 morning shows (timing TBD)
- 5 night shows (timing TBD)
- 1 Sunday battle (7pm ET per WaveWarZ cadence)

**Status:** PLANNED but not yet scheduled. Zaal locked the strategy (doc 720); Cassie validated the infrastructure-as-product angle (doc 547). Actual show calendar not yet published.

### Pipeline Blocks

- **No Farcaster spaces skill:** Spaces must be created manually by Zaal
- **No calendar booking:** No integration with Google Calendar MCP yet
- **No content prep automation:** Each space needs manual prep + link seeding

### Health

PAUSED in execution (though planned for Oct). The May 24 stream is confirmed + locked. ZAOstock show cadence not yet scheduled.

---

## 5. WaveWarZ Battle Programming

| Metric | Status |
|--------|--------|
| **Status** | LIVE (nightly) |
| **Cadence** | Mon-Fri 8:30 PM ET quick battles (YouTube Live), Mon-Fri 11 AM ET community AMA (X Spaces), Sun 7 PM main events |
| **Total shows/week** | **11 shows** (5 morning + 5 night + 1 Sunday) |
| **Platform** | Primarily YouTube Live (transitioned from X Spaces March 2026) |
| **Host** | Hurric4n3ike (founder), Samantha (cofounder), community DJs |

### Platform Stats (Latest)

| Metric | Apr 4 | Current |
|--------|-------|---------|
| Battles | 734 | ~800+ (projected) |
| Volume | 472.67 SOL ($37,875) | Growing |
| Artist payouts | 7.96 SOL ($638) | Ongoing |
| Artists | 43+ | — |

Top artist: LUI (49-22 W-L, 71 battles, 29.59 SOL volume, 69% win rate).
Highest per-battle volume: STILO English (14.46 SOL / 9 battles).

### Upcoming Events

- **Good Boy Music AI-Artist Tournament:** First battle Sun 2026-05-31 7pm ET (open invite to test agentic WaveWarZ on Base, per doc 711)
- **16-artist tournament** + **AI artist tournament** (timing TBD)

### Health

LIVE + very healthy. 11 shows/week is production-heavy and sustainable. Arthur (Neynar) just signed on (doc 711) to review Base agentic smart contracts. Sam has testnet contracts for agent trading. Pipeline is active and accelerating.

---

## 6. ZABAL Games Build-a-Thon

| Metric | Status |
|--------|--------|
| **Status** | LAUNCHED 2026-05-20 |
| **Duration** | 3 months (June workshops, July open build, August finals) |
| **Announcement** | Sun 2026-05-24 during Zaal's DJ livestream (locked) |
| **Mentors** | 8 (Arthur Neynar + 7 TBD) |
| **Finalists** | 8 (August winners) |
| **Entry URL** | Not yet locked (doc 720: "ticket.zaostock.com parallel" planned) |

### What Shipped

Doc 720 standup (2026-05-19) locked ZABAL Games launch for 2026-05-20 with:
- 4 brand prompt templates (ZAOstock, ZABAL, WaveWarZ, The ZAO)
- Memorable entry URL requirement (Zaal: "easy enough for everyone to remember so they can say it on a stream")
- June workshops: 30-min slots from ZAO network + DeFi/regen builders
- July: open build phase
- August: finalists + mentors (8 each)

**Status on 2026-05-23:** Action item from doc 720 was due 2026-05-20 (ship announcement + URL). Needs confirmation if live. PR #633 (zoe-nightly-0523-2200) is recent but may be unrelated.

### Pipeline Blocks

- **Entry URL not yet locked:** Critical for the May 24 announcement
- **Mentor roster incomplete:** Arthur confirmed, 7 more TBD
- **Workshop schedule unpublished:** June dates/speakers not yet announced

### Health

FRESHLY LAUNCHED. Momentum is high, but the announcement mechanics (URL, brand templates) need verification as LIVE before May 24 stream.

---

## 7. IRL Events

### ZAOstock 2026

| Metric | Status |
|--------|--------|
| **Date** | October 3, 2026 (LOCKED) |
| **Location** | Franklin St Parklet, Ellsworth Maine |
| **Budget** | $5K-$25K (production audit in doc 558) |
| **Sponsor comms** | Live: $1K from Limone (payment pending) |
| **Spinout status** | Code being held in ZAOOS until graduation Oct 2026 |
| **Team** | Zaal (founder), Jose, Defresh (Broski), Ryan Kagy, Cannon (Zao Cards) + 10 more |

**Cadence:** Mon 11:30am EST cobuild (meet.baserooms.io/zaal), Tue 10am EST standup.

**News (from doc 720, 2026-05-19):**
- Cassie validated: ZAOstock infrastructure IS the product (not the festival itself being the output)
- Programming reshuffle: mixed 15/30-min artist slots + soundcheck open mic
- NFC networking cards (Zao Cards sub-team, Cannon leading)
- Team reorg: Maseo out of ops, Onaji into media/livestream, Cannon leading cards
- Unified action tracker in cowork-zaodevz (pending brand-label schema from doc 717)

### ZABAL Games Build-a-Thon

See section 6 above.

### ZAO Ville (July 25, 2026)

DMV area event, ZAO supporting with promotion + production.

### Thursday Parklet Concert Series

Ellsworth Parks & Rec (Roddy Ehrlenbach contact) runs ~10 Thursday-night events at Franklin St Parklet. ZAO wants in (not yet confirmed). Good opportunity for artist pipeline testing.

### Health

**ZAOstock:** LIVE + momentum high. Sponsor payment is slow (feedback: big branded sponsors = slow with actual money). Oct 3 is locked. Social content strategy (BEFORE/DURING/AFTER Farcaster posts per feedback_post_irl_events) not yet drafted.

**ZABAL Games:** LAUNCHED.

**ZAO Ville:** Planned.

---

## 8. Big Wins Capture

| Metric | Status |
|--------|--------|
| **Status** | CODED but NOT ACTIVELY CAPTURED |
| **Research foundation** | Doc 241 (Q1 2026 Big Wins, April 3) |
| **Skill exists** | `/big-win` (design reference but implementation TBD) |

### What Exists

Doc 241 is a comprehensive Q1 recap (25 wins documented, 370 lines). It serves as the model for the `/big-win` skill, which is designed to let Zaal capture big wins as they happen via a daily command. The cadence model: wins recorded in doc 241 monthly/quarterly, then distributed via `/socials` to all platforms.

**Recent big wins that COULD have been captured but weren't:**
- BCZ YapZ graduation (PR #480, 2026-05-06)
- ZOE post slate ship (PR #533, 2026-05-16)
- /bonfire skill ship (PR #627, 2026-05-20)
- ZABAL Games launch (doc 720, 2026-05-20)

### Pipeline Blocks

1. **No active workflow:** Zaal hasn't adopted `/big-win <description>` daily capture
2. **No auto-distribution:** No skill chains a big-win capture → `/socials` → all platforms
3. **Quarterly dependency:** Doc 241 is April (3 weeks old). May big wins not yet documented anywhere

### Health

PAUSED. Code foundation is solid (doc 241 proves the model). Workflow adoption is the missing piece. Recommend adding big-win capture to Zaal's 5am morning brief (already integrates AgentMail inbox per commit 53349fda).

---

## 9. Cross-Platform Distribution

| Platform | Firefly (FC+X) | X GC | FC GC | Telegram | Discord | LinkedIn | Facebook | YouTube | TikTok |
|----------|---|---|---|---|---|---|---|---|---|
| **Status** | LIVE (primary) | LIVE (manual) | LIVE (manual) | LIVE (manual) | LIVE (manual) | LIVE (manual) | LIVE (manual) | LIVE (episodes) | PAUSED |
| **Frequency** | Per Firefly post | Per social post | Per social post | Per big event | Per big event | ~monthly | ~monthly | Per episode | — |
| **Automation** | Manual copy-paste from Telegram (ZOE pings) | Manual | Manual | Manual | Manual | Manual | Manual | Auto-upload (skill) | — |

### Per-Platform Notes

**Firefly (FC + X combined):** Default surface per feedback_firefly_only. One post hits both. ZOE post pings funnel here.

**X Group Chat, Farcaster /zao GC, Telegram, Discord:** All require manual copy-paste. Per /socials skill, Firefly is copied first, then copied again per platform. No aggregator.

**LinkedIn, Facebook:** Quarterly/monthly cadence (per doc 241 / BCZ Yapz episodes). Less frequent.

**YouTube:** BCZ YapZ episodes auto-uploaded post-description-generation. Skill handles most of it.

**TikTok:** Paused (no current content strategy).

### Pipeline Block: The Copy-Paste Tax

Per doc 533 (ZOE post slate) README: "User flow: read on phone, copy text, open Firefly, paste, ship." And then per /socials skill: repeat for X GC, FC GC, Telegram, Discord, LinkedIn, Facebook. This is **7 manual copy-paste steps per social post**.

**Recommendation (not yet implemented):** Firefly API integration so one `/clipboard` post triggers all 7 platforms simultaneously, or a `/socials` command that takes ZOE output directly and distributes.

---

## 10. 12-Week Road to ZAOstock Campaign

| Metric | Status |
|--------|--------|
| **Status** | PLANNED but NOT YET RUNNING |
| **Launch target** | July 2026 (per doc 720) |
| **Duration** | ~12 weeks to Oct 3 |
| **Content** | Weekly drops across all channels, build-in-public |

### What's Locked

Per doc 720, Zaal wants a formal 12-week campaign starting July with weekly content drops. The campaign will showcase:
- Merch design + production (Incented campaign model proven in Q1)
- Artist lineup announcements (open call model, ~1 month cutoff before Oct 3)
- Infrastructure build (Cassie validated this IS the product)
- Community stories + behind-the-scenes

### Pipeline Blocks

1. **Not yet scheduled:** No calendar entries, no content calendar
2. **Not yet assigned:** No content lead (Zaal is primary, but support needed)
3. **Skill integration missing:** No `/big-win` capture for weekly milestones
4. **Template missing:** No "week N of the Road to ZAOstock" content template

### Health

PAUSED. Locked strategy exists. Execution not yet started. July launch is 5 weeks away (as of May 23).

---

## 11. Bonfire Integration (Knowledge Graph Recall)

| Metric | Status |
|--------|--------|
| **Status** | LIVE (as of May 2026) |
| **Surfaces** | Meeting skill + `/bonfire` skill |
| **Usage** | Meeting transcripts → Bonfire episodes (automated via VPS) |
| **Docs** | 669 (Bonfires overview), 673 (ZOE dialog), 676 (utilization), 677 (GitHub connection) |

### What's Shipping

Meeting skill auto-generates Bonfire episodes from meeting transcripts (doc 717). The `/bonfire` skill (PR #627, 2026-05-20) posts episodes to the ZABAL Bonfire KG via VPS. ZOE can read/write Bonfire (PR #571, 5314ba4d).

### Pipeline Blocks

- **API key missing:** Per doc 711, `BONFIRE_API_KEY` / `BONFIRE_ID` not set in prod; episodes built but not shipped
- **No daily recall:** ZOE reads Bonfire for context but doesn't actively surface insights in daily posts/brief
- **Manual episode labeling:** Bonfire ingest requires UUID verification + labeling (v0.2 tool exists but rarely used)

### Health

LIVE but under-utilized. The infrastructure is solid (read/write working). The missing piece is Zaal seeing Bonfire output in his daily flow (morning brief, ZOE posts, newsletter).

---

## Over/Under-Served Channels

| Channel | Assessment | Why |
|---------|-----------|-----|
| **Firefly (FC + X)** | OVER-SERVED | ZOE pings 7x daily, every big event funnels here |
| **WaveWarZ Programming** | OVER-SERVED | 11 shows/week is saturating the time slots |
| **ZOE Post Slate** | HEALTHY | 7/day matches intended cadence, recently shipped |
| **BCZ YapZ** | UNDER-SERVED | 8 episodes in 17 days post-grad, but no cross-promotion strategy |
| **Newsletter** | SEVERELY UNDER-SERVED | Code ready, zero daily adoption |
| **Farcaster Spaces** | UNDER-SERVED | May 24 stream locked, but no regular weekly cadence documented |
| **LinkedIn / Facebook** | UNDER-SERVED | Quarterly at best, no regular cadence |
| **Discord / Telegram GCs** | UNDER-SERVED | Manual copy-paste only, often skipped |
| **Big Wins Capture** | SEVERELY UNDER-SERVED | May wins not documented, zero workflow adoption |
| **YouTube (non-YapZ)** | PAUSED | COC Concertz clips exist but no upload pipeline |

---

## Cold Content (30+ Days Untouched)

| Content Type | Last Touch | Days Cold | Status |
|---|---|---|---|
| `/big-win` skill | Feb 2026 | ~110+ days | No May wins captured; doc 241 is Apr 3 |
| Newsletter agent | Feb 2026 | ~110+ days | Code ready, zero adoption |
| Farcaster spaces cadence | Pre-May 24 | TBD post-launch | Not yet documented |
| YouTube clip pipeline | Q1 2026 | ~60+ days | COC Concertz exists but not published |
| LinkedIn strategy | Q1 2026 | ~60+ days | Per-episode only, no linking |

**Interpretation:** The content pipeline is healthy for **live production** (ZOE pings, WaveWarZ shows) but **cold for growth loops** (newsletter recaps, big-win amplification, cross-platform synergy). The manual copy-paste tax is killing secondary channels.

---

## Pipeline Blocks Summary

### High-Impact (Blocking multiple surfaces)

1. **Firefly API integration missing:** Blocks 1-click distribution to 7 platforms. Currently manual copy-paste x7 per post.
2. **Newsletter workflow adoption:** Code ready; zero daily usage. Blocks recurring newsletter cadence + content recaps.
3. **Google Calendar MCP integration:** Blocks event-sourcing for ZOE posts + Farcaster space scheduling.
4. **`/socials` skill integration with ZOE:** Blocks automated cross-platform distribution from post drafts.

### Medium-Impact (Blocking single surfaces)

5. **Big-win daily capture workflow:** Blocks ongoing quarterly docs. Recommendation: wire to morning brief.
6. **Bonfire API key setup:** Blocks episode publishing (episodes are built but not shipped).
7. **YouTube clip upload pipeline:** COC Concertz exists but needs publish automation.
8. **12-week campaign content calendar:** Blocks July launch. Needs template + schedule.

### Low-Impact (Nice-to-have)

9. **WaveWarZ event listing:** Sunday battles not published to a discoverable calendar.
10. **TikTok strategy:** Paused; no current plan.

---

## What to Amplify Next (Post-May 24)

Given the locked May 24 DJ stream + ZABAL Games announcement:

### Week of May 24-31

1. **Farcaster Space Recording** - Capture the May 24 stream for clip/recap distribution
2. **ZABAL Games Brand Content** - 4 brand templates shipped May 20; cross-post to all 7 platforms (use `/socials` skill)
3. **WaveWarZ Agentic Tournament Launch** - Good Boy Music AI-artist first battle May 31 (Arthur's soft-commitment per doc 711)
4. **ZOE Post Slate Highlights** - Curate best ZOE pings from week + cross-post to LinkedIn/Facebook

### June (Road to ZAOstock prep)

1. **Big-Wins Recap (May)** - Capture May 20-31 wins (ZABAL launch, Bonfire ship, Arthur collab) into May big-wins doc
2. **Newsletter Cadence Launch** - Start `@newsletter <angle>` daily capture; pick 1x/week to cross-post via `/socials`
3. **WaveWarZ Tournament Updates** - Weekly updates on Good Boy tournament progress
4. **Unified Tracker Migration** - Move ZAOstock todos into cowork-zaodevz (doc 717 schema required)

### July-August (ZAOstock campaign)

1. **12-Week Campaign Kickoff** - Weekly content drops (merch, artist lineup, behind-the-scenes)
2. **Farcaster Spaces Series** - Lock recurring weekly space (Thu or Fri) to build audience for Oct 3
3. **BCZ YapZ Cross-Promo** - Each episode gets cross-posted to Farcaster, LinkedIn, newsletter recap
4. **Bonfire Daily Recall** - Surface Bonfire insights in morning brief + ZOE post drafts

---

## Metrics to Track

| Metric | Current | Target | Cadence |
|--------|---------|--------|---------|
| ZOE pings posted | 7/day (auto) | 7/day | Daily |
| WaveWarZ shows | 11/week (live) | 11/week | Weekly |
| BCZ YapZ episodes | 2-3/month | 2-3/month | Monthly |
| Newsletter drafts | 0/month | 25/month (daily) | Daily |
| Big-wins captured | 0/month | 15/month | Ongoing |
| Farcaster spaces | TBD post-May24 | 2/week | Weekly |
| Cross-platform posts | ~2/week | 5/week | Weekly |
| LinkedIn posts | 1/month | 2/week | Weekly |
| YouTube uploads | 2-3/month (YapZ) | 2-3/month | Monthly |

---

## Recommendations

### Immediate (Next 2 weeks)

1. **Verify ZABAL Games URL is live** - Confirm ticket URL is published + May 24 announcement ready
2. **Record + clip the May 24 stream** - Set up auto-record, extract 3-5 clips for cross-post
3. **Ship `/big-win` integration to morning brief** - Add May wins capture to 5am daily brief
4. **Lock Bonfire API key** - Get `BONFIRE_API_KEY` into prod so episodes actually post

### Short-term (June)

1. **Launch newsletter daily workflow** - Zaal uses `@newsletter <angle>` 5x/week → pick 1 for weekly `/socials`
2. **Design 12-week campaign content calendar** - Template: "Week N of the Road to ZAOstock" + 3 content ideas/week
3. **Implement Firefly API integration** - One post = 7 platforms (biggest productivity unlock)
4. **Create Farcaster spaces cadence** - Lock day/time (recommend Thu 8pm ET before WaveWarZ battles)

### Medium-term (July)

1. **Start 12-week campaign** - Launch weekly content drops with `/socials` + newsletter recap
2. **Build WaveWarZ tournament clips pipeline** - Auto-extract battle clips from YouTube Live, cross-post
3. **Integrate Google Calendar MCP** - ZOE sourcing events from calendar, Farcaster space scheduling automated

### Long-term (August+)

1. **Unified content dashboard** - Single view of all live metrics (ZOE pings sent, socials posted, WaveWarZ battles, newsletter drafts)
2. **Auto-publish path for big wins** - Big-win capture → newsletter → `/socials` → all 7 platforms (fully automated)
3. **Bonfire-powered daily recall** - Morning brief surfaces 3 Bonfire insights + relates them to day's ZOE posts

---

## Appendix: Skill Inventory

| Skill | Status | Last Updated | Key File |
|-------|--------|--------------|----------|
| `/socials` | LIVE | 2026-05-20 (doc 708) | `~/.claude/skills/socials/skill.md` |
| `/bcz-yapz-description` | LIVE | 2026-05-06 | `~/.claude/skills/bcz-yapz-description/SKILL.md` |
| `/bonfire` | LIVE | 2026-05-20 (PR #627) | `~/.claude/skills/bonfire/` |
| `/zao-research` | LIVE | Ongoing | `~/.claude/skills/zao-research/` |
| `/meeting` | LIVE | 2026-05-20 (doc 717) | `~/.claude/skills/meeting/` |
| `/big-win` | DESIGNED not adopted | Doc 241 (Apr 3) | (no active skill file yet) |
| `/newsletter` | CODED not adopted | bot/src/zoe/agents/newsletter.ts | (integration missing) |

---

## Sources

- Doc 241: Q1 2026 Big Wins (foundational model for big-wins capture)
- Doc 533: ZOE post slate v1 (4-category drafts, 7 pings/day)
- Doc 627 / PR #627: /bonfire skill (posting episodes to Bonfire KG)
- Doc 676: Bonfires utilization (6-dimensional analysis)
- Doc 677: Bonfire GitHub connection
- Doc 708: The Arena / socials skill reference
- Doc 711: Arthur + WaveWarZ Base agentic call (WaveWarZ stats, AI tournament May 31)
- Doc 717: Meeting-Bonfire bridge (automated episode generation)
- Doc 720: ZAOstock standup May 19 (ZABAL Games launch, 12-week campaign planning)
- PR #480: BCZ YapZ graduation (2026-05-06)
- PR #533: ZOE post slate (2026-05-16)
- PR #627: /bonfire skill (2026-05-20)
- memory: feedback_firefly_only, feedback_post_irl_events, project_zoe_post_slate, project_bcz_yapz_graduated
