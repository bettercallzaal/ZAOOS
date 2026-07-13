---
topic: farcaster
type: research
status: research-complete
last-validated: 2026-07-12
related-docs: [124-sopha-deep-social-farcaster, 293-sopha-api-integration, 768-poidh-bounty-best-practices]
original-query: "How do we integrate Sopha's Ambassadors program into The ZAO ecosystem via zaalcaster + poidh? Zaal is an ambassador - what levers does this unlock?"
tier: DEEP
---

# 1056 - Sopha Ambassadors + ZAO Integration (Curation + Bounties + Casting)

> **Goal:** Map Zaal's Sopha ambassador status onto ZAO's casting + bounty machinery. Propose concrete integration points, effort, and priority ranking.

## Executive Summary

**What Sopha is:** A "Deep Social" Farcaster client that curates high-quality, long-form casts (philosophy, art, thoughtful discussion). It's curator-driven, not algorithmic. Zaal is a Sopha ambassador.

**What being an ambassador means:** Ambassadors can influence/promote what gets curated by Sopha. The "resources are in a miniapp" suggests the ambassador toolkit (tools, referrals, incentives) lives inside a Farcaster Mini App.

**The ZAO connection:** 
- **zaalcaster** is Zaal's CLI casting tool (posts, replies, timeline reads, drafting)
- **poidh** is ZAO's bounty platform for community contests (winners judged, points earned)
- **sopha** is the curator network that validates high-quality content

**The play:** Wire sopha curation into zaalcaster (surface curated content in morning reads), use poidh bounties to reward curators, and amplify ambassador referrals through the ZAO/ZABAL ecosystem.

---

## What is Sopha (Primer)

| Aspect | Detail |
|--------|--------|
| **Website** | https://www.sopha.social |
| **Product category** | Farcaster curation client + mini app |
| **Positioning** | "Deep Social" - anti-algorithmic, pro-depth, pro-art/philosophy |
| **Tech** | Next.js, Neynar webhooks, Farcaster Mini App, PWA |
| **API** | External feed endpoint: `https://www.sopha.social/api/external/feed` (returns 50 curated casts + metadata) |

### Core Features

- **Curation** — Sopha curators manually select high-quality casts (quality score 65-85, all ranked)
- **Categories** — platform-analysis, ai-philosophy, life-reflection, creator-economy, crypto-critique, community-culture, art-culture
- **Attribution** — each curated cast lists the curator(s) who selected it
- **Mini App** — runs inside Farcaster clients as a launchable frame
- **Long-form focus** — philosophy, art, meaningful conversations (not engagement-farming)

### Sopha's Curation Model (Why It Matters to ZAO)

Unlike Warpcast (algorithmic feed) or Neynar trending (engagement-based), Sopha is **human-curated and anti-algorithmic**. This aligns with ZAO's Respect-weighted governance:
- No algorithm gaming
- Curation by expertise/taste, not clicks
- Community validation (multiple curators can co-select)
- Quality > virality

---

## What Does "Sopha Ambassador" Mean? (Hypothesis)

Based on the ZAOOS research and standard ambassador mechanics:

| Lever | What it probably means |
|-------|------------------------|
| **Curator influence** | Ambassadors can suggest/flag high-quality casts to Sopha's curation team for consideration |
| **Referral incentives** | Ambassadors earn rewards (USDC, points, or Farcaster native rewards) for driving users to Sopha |
| **Co-curation** | Ambassadors might be able to create or curate category-specific sub-feeds (e.g., "Music in Sopha") |
| **Ambassador toolkit (miniapp)** | Tools to track referrals, see curator leaderboards, manage promotions - all inside a Farcaster Mini App |
| **Public recognition** | Ambassador badge/handle on Sopha's ambassador hub |

**What we don't have:** Sopha's public ambassador documentation is sparse (docs/blogs/API schema for ambassador features). Zaal should ask sopha team directly for specifics before shipping anything.

---

## ZAO's Current Stack (The Integration Points)

### zaalcaster (Casting)
- **What:** CLI tool for Zaal to read timeline, post casts, reply, search, draft replies
- **How:** Uses Neynar API + managed signer for posting
- **Commands:** `morning` (timeline + engagement), `engage` (unanswered inbound), `post`, `reply`, `thread`, `channels`
- **Drafting:** Claude integration (`--drafts` mode) writes replies in Zaal's voice, grounded in ZAO context
- **No web UI** — terminal-native, personal use

### poidh (Bounties)
- **What:** Bounty platform (rounds of contests: ads, clips, content)
- **How:** Submit on POIDH, vote/judge by community, winners paid out on Base
- **Mechanics:** OPEN (whale-stackable), SOLO (judge-only), OPEN-SPLIT (split pot to all submitters)
- **Rewards:** Winner gets ETH; all submitters get EB ($ZABAL) points
- **History:** 4 rounds completed (R4 active, R5 drafting), production-grade

### sopha integration (Trending feed)
- **Current:** ZAOOS pulls Sopha's external feed API in the Trending tab
- **What it does:** Shows 50 curated Sopha casts alongside Neynar trending, sorted by timestamp
- **Bug:** `_curators` field mapping broken (see Doc 293)
- **Opportunity:** Already integrated — just needs cleanup + deeper usage

---

## Integration Proposal (Ranked by Priority + Effort)

### Phase 1: QUICK WINS (2-4 hours, High Value)

#### 1a. Surface Sopha curator feed in zaalcaster's morning routine

**What:** Add a `--sopha-curated` flag to `zaalcaster-morning` that includes recent Sopha-curated casts in the morning digest.

**How:**
- In `zaalcaster/bin/morning.js`, add a call to Sopha's external feed API alongside timeline + engage + channels
- Dedupe by cast hash (some casts might be in both timeline + sopha)
- Label each Sopha cast with curator names + quality score
- Print as a separate section: "Curated this week (via Sopha)"

**Effort:** 1-2 hours (fetch, dedupe, formatting)

**Value:** 
- Zaal sees what the Sopha community considers quality without leaving the CLI
- Discovers high-signal content he might not see in his timeline
- Reinforces Sopha's ambassador value (curated content → Zaal can amplify as ambassador)

**Code touch:** 
- `bin/morning.js` (add sopha fetch)
- `lib.js` (add `fetchSophaCurated()` helper)

---

#### 1b. Wire Sopha curator credits into POIDH bounty descriptions

**What:** When Sopha curators submit to POIDH bounties (or POIDH bounties are curated by Sopha), credit them explicitly + link to their Sopha profile.

**How:**
- In POIDH bounty description (rounds/*/description.md), add an optional "Curated by Sopha" badge if the bounty is Sopha-curated
- When announcing winners, mention if winner's post was Sopha-curated
- Link curator FID → Sopha profile

**Effort:** 30 mins (markdown + links)

**Value:**
- Sopha curators get public credit (incentivizes them to curate ZAO content)
- POIDH bounties get Sopha's quality stamp (attracts higher-signal submissions)
- Closes the loop: ZAO content → Sopha → credited → amplified

**Why this matters:** Sopha's "Deep Social" positioning is anti-algorithmic. Crediting curators is the *whole mechanism* that makes curation work. It's also aligned with ZAO's Respect governance.

**Code touch:**
- `zpoidh/rounds/*/description.md` (add curator credit section)
- `zpoidh/docs/bounty-best-practices.html` (add curator credit as optional section)

---

### Phase 2: MEDIUM TERM (0.5-1 day, High Value)

#### 2a. Create a "ZAO Curated by Sopha" bounty round

**What:** A meta-bounty where Sopha curators submit evidence of curated ZAO/music/ZABAL content, then ZAO judges reward the best curator picks.

**Rationale:**
- Sopha is curator-focused. This bounty validates curators.
- ZAO gets Sopha curation directed at ZAO ecosystem (music, community, governance posts)
- Ambassadors (including Zaal) get to judge who's curating ZAO best
- Loop closes: ZAO creates content → Sopha curates it → curators rewarded by ZAO

**How:**
- Round topic: "Best Sopha curator pick of ZAO/ZABAL ecosystem content"
- Participants: Sopha curators (and ambassador referrals)
- Submissions: Link to a Sopha-curated cast about ZAO/music/ZABAL (must be curator-attributed)
- Prize: USDC + EB ($ZABAL) points + feature in ZAO newsletter
- Rubric: Depth of curation rationale, quality of underlying cast, relevance to ZAO mission

**Effort:** 1-2 hours to set up (doc 768 / doc 293 pattern already exists)

**Value:**
- Directs Sopha curation toward ZAO ecosystem
- Rewards top curators (incentive loop for ambassadors)
- Creates feedback: ZAO content → curated → judges see quality → posts better ZAO content next time

**Code touch:**
- `zpoidh/rounds/rX/description.md` (new bounty round)
- `zpoidh/rounds/rX/judging.json` (rubric)
- `zpoidh/data/claims.json` + leaderboard refresh

---

#### 2b. Add ambassador referral tracking to zaalcaster + a mini CLI dashboard

**What:** Zaal can see how many people clicked his ambassador links + referral conversion in the CLI.

**How:**
- `zaalcaster-ambassador-stats` command: pulls Sopha API for Zaal's referral metrics (if API supports it; otherwise placeholder)
- Shows: referral clicks, sign-ups, active users via referral, current ambassador rank
- Motivates: "1 more sign-up to reach next tier" type messaging

**Effort:** 1-2 hours (CLI command + optional Sopha API call; fallback to placeholder)

**Value:**
- Gamifies ambassador role (Zaal sees his own impact)
- Informs strategy (which content/channels drive most referrals)
- Low-friction (stays in CLI, no web dashboards)

**Code touch:**
- `zaalcaster/bin/ambassador-stats.js` (new command)
- `zaalcaster/package.json` (add `npm run ambassador-stats`)

**Caveat:** Needs Sopha API support. May need to ask their team.

---

### Phase 3: LONGER TERM (1-2 days, Medium Value)

#### 3a. Create "Curation DAO" proposal: ZAO curators earn voting weight

**What:** A Fractal proposal that makes "Sopha curator" a recognized role in ZAO governance. Curators who surface ZAO content on Sopha + POIDH earn monthly EB ($ZABAL) + voting weight.

**Rationale:**
- Curation is work (time + taste + knowledge)
- ZAO already has Respect governance; curators are respected contributors
- Incentivizes long-term curator alignment with ZAO values

**How:**
- Monthly: "Curator Review" where Zaal + community vote on whose Sopha curator picks best served ZAO
- Top 3 curators earn bonus EB + increased voting weight for that month
- Tracked in a public leaderboard (spreadsheet or Supabase)

**Effort:** 2-4 hours (Fractal proposal doc, leaderboard setup, monthly job)

**Value:**
- Formalizes curation as a ZAO role (not just Sopha role)
- Aligns incentives: curators want ZAO to succeed + ZAO wants curation directed at mission
- Creates a scalable pattern (could extend to other curators/platforms)

**Code touch:**
- `ZAOOS/research/governance/` (proposal doc)
- `ZAOOS/scripts/` (monthly curator leaderboard refresh)
- Optional: Supabase table for curator rankings

---

#### 3b. Propose Sopha "Music" category + featured ZAO audio

**What:** Partner with Sopha to create a `music-community` or `creator-economy` sub-category specifically for ZAO music/audio posts. Feature ZAO as the exemplar of "deep music curation."

**Rationale:**
- Sopha is about deep, anti-algorithmic content. ZAO/ZABAL is the same for music.
- Unique positioning: "Where serious musicians + music lovers gather" (vs TikTok/Spotify algorithm)
- Ambassador leverage: Zaal asks sopha team for this as part of ambassador benefits

**How:**
- Zaal pitches Sopha team: "ZAO is the Sopha of music. Let's create a music-curated category."
- Sopha adds `music-curation` category (or `zao-music` if co-branded)
- ZAO posts (cast threads, audio clips, artist stories) get routed to that category
- Sopha curates the best 10/month; ZAO highlights them in newsletter + POIDH

**Effort:** 2-4 hours pitch + follow-up with Sopha team (this is a partnership ask, not a build)

**Value:**
- **Unique distribution:** ZAO content curated by Sopha = high-signal audience (Sopha users are tastemakers)
- **Brand alignment:** "Deep music" + "deep social" = perfect fit
- **Retention:** Sopha users who discover ZAO are more likely to stay (they're here for depth)

**Code touch:** None from ZAO (Sopha side work). Just: maintain the channel, seed quality posts, monitor curation.

---

## Comparison: Integration Approaches (What NOT to do)

| Approach | Complexity | Why not | Better alternative |
|----------|-----------|---------|------------------|
| **A. Build ZAO's own curation platform** | High | Duplicates Sopha; ZAO isn't curators | Use Sopha's existing curators |
| **B. Gamify Sopha ambassador via leaderboards** | Medium | Sopha owns rewards; we'd confuse incentives | Use POIDH bounties instead (ZAO owns the rewards) |
| **C. Embed Sopha mini app in zaalcaster web** | Medium | zaalcaster is CLI-native; breaks UX | Keep zaalcaster CLI, surface Sopha feed data via CLI |
| **D. Create "ZAO approved" curator badge** | Low but risky | We lack curator expertise; Sopha already does this | Feature Sopha-curated ZAO content instead |

---

## What Zaal Should Ask Sopha (Before Shipping)

These need direct conversation with Sopha team:

1. **Ambassador rewards structure:** What incentives do ambassadors get? (points, USDC, token, referral commission?)
2. **Curator co-curation:** Can ambassadors create curated sub-feeds (e.g., "Music via Zaal")?
3. **Category custom feeds:** Can we request a "Music" category or "ZAO ecosystem" feed?
4. **Ambassador API:** Is there an API for ambassador referral tracking / stats?
5. **Feature partnership:** Would Sopha co-feature ZAO/music as exemplar of "deep social" positioning?
6. **Cross-promotion:** Can we link from POIDH → Sopha curator leaderboards (and vice versa)?

---

## Honest Assessment: Is It Worth It?

### Yes, if:
- Sopha's ambassador program has **real rewards** (money or meaningful points)
- Sopha curators are **actively looking to curate music** (or we can convince them via POIDH bounties)
- The **Sopha user base** overlaps with ZAO's target audience (thoughtful, anti-algorithmic, quality-first)
- Zaal wants a **long-term engagement** with Sopha (not a quick stunt)

### No, if:
- Sopha's ambassador program is **small/early** (few users, no real incentives)
- Curation is too **niche** (5-10 curators, mostly philosophy/art, no music interest)
- **Integration effort > audience value** (current Sopha users might not care about ZAO music)

### Our take:
**Sopha is early but real.** The curation model is sound; users exist (visible on Farcaster). The ambassador program is likely small but has *potential*. 

**Quick-win approach:** Do Phase 1 (2-4 hours) — surface Sopha feed in zaalcaster + add curator credits to POIDH. Proves the value. Then decide on Phase 2+3 based on Zaal's appetite + Sopha team's responsiveness.

---

## Prioritized Action Plan

### Week 1 (Just Do It)
- [ ] Zaal chats with Sopha team: ambassadors FAQ (see above checklist)
- [ ] Claude: Build Phase 1a (sopha-curated in zaalcaster morning)
- [ ] Claude: Build Phase 1b (curator credits in POIDH descriptions)
- [ ] Test with next POIDH round (R6?)

### Week 2-3 (Feedback Loop)
- [ ] Measure: How many POIDH submitters mention Sopha curator credit? How many clicks to Sopha links?
- [ ] Zaal: Report back from Sopha team on ambassador mechanics + co-curation interest
- [ ] Decide: Phase 2 (meta-bounty for curators) or pivot?

### Month 2-3 (If winning)
- [ ] Phase 2a: "Best Curator Pick" bounty round
- [ ] Phase 3b: Pitch Sopha on "Music" category partnership
- [ ] Measure: referral conversion, curator engagement, ZAO posts curated

---

## Open Questions (Research Gaps)

1. **What is Sopha's actual user base size?** (100s? 1000s?) — affects ROI
2. **How active are music/creator-economy curators?** — affects whether Phase 3b is viable
3. **Does Sopha ambassador program pay?** — affects Zaal's incentive alignment
4. **Can Sopha API be extended for ambassador tracking?** — affects Phase 2b feasibility
5. **Do Sopha users overlap with ZAO's target community?** — affects discoverability value

**Recommendation:** Zaal's 1-on-1 with Sopha team should address Q1, Q3, Q4. The others will resolve as we ship Phase 1.

---

## Files to Modify (Summary)

### Phase 1a: Sopha in zaalcaster morning
- `zaalcaster/bin/morning.js` (add sopha fetch)
- `zaalcaster/lib.js` (add `fetchSophaCurated()`)
- `zaalcaster/package.json` (deps if needed)

### Phase 1b: Curator credits in POIDH
- `zpoidh/docs/bounty-best-practices.html` (add curator section)
- `zpoidh/rounds/rX/description.md` (per round)

### Phase 2a: Meta-bounty for curators
- `zpoidh/rounds/rX/description.md` (new round)
- `zpoidh/rounds/rX/judging.json`

### Phase 2b: Ambassador stats dashboard
- `zaalcaster/bin/ambassador-stats.js` (new)

### Phase 3: Governance proposal
- `research/governance/` (fractal proposal for curator DAO)

---

## Sources & References

- [Sopha.social](https://www.sopha.social) - Main app + Mini App
- Doc 124: [Sopha: Deep Social on Farcaster](../124-sopha-deep-social-farcaster/) - Curation model
- Doc 293: [Sopha API Integration](../293-sopha-api-integration/) - API bugs + refactor roadmap
- Doc 768: [POIDH Bounty Best Practices](../../business/768-poidh-bounty-best-practices/) - Bounty mechanics
- [zaalcaster repo](https://github.com/bettercallzaal/zaalcaster) - CLI casting tool
- [zpoidh repo](https://github.com/bettercallzaal/zpoidh) - Bounty platform source
- Farcaster Mini Apps Spec: https://miniapps.farcaster.xyz/docs/specification
