---
topic: media
type: decision
status: needs-zaal-decisions
last-validated: 2026-07-30
related-docs: 2135, 2136, 2141, 695, 353, 606
original-query: "/zao-research how ZAO does media + build deep media aggregation into ZM (ZAO Media) - all ZAO media/content/podcasts/shows, feeding ZABAL Gamez, replacing ZNN. Anchor: an earned-media podcast (Just DAO It) to share + log."
tier: DEEP
---

# 2153 - ZM (ZAO Media): the deep media aggregation system

> **Goal:** One home + one system for ALL ZAO media - owned (streams, casts) AND earned (appearances, features) - that logs once and generates outward (a page, the tracker, the ZABAL Gamez hub, the clip pipeline). Anchored on a real first entry: Zaal's Just DAO It podcast appearance. This is the design + the seed; the [decisions] are Zaal's.

## Where ZAO does media TODAY (the honest baseline)

We already have the PIECES, scattered - no single home:
- **Owned-media plan:** doc 2135 (the content-everywhere map) - preserve first, one archive, repurpose through ONE pipeline (`zaalclip` + Postiz), Farcaster-home. That covers Zaal's OWN streams/casts.
- **Capture/process skills:** `/meeting` (transcripts -> decisions/recaps/Bonfire), `/socials` (platform posts, Firefly), `/capture` (inbox), `/clipboard`, `/newsletter`, `/onepager`.
- **Publish lib:** `src/lib/publish/` (Farcaster/X/Bluesky/Discord/Lens/Threads + `auto-cast.ts` + `broadcast.ts`).
- **Juke:** recording/embed partnership (docs 695/710/712) - Farcaster Spaces + show recordings route here.
- **Nexus:** `bettercallzaal.com/nexus.html` - the ecosystem DIRECTORY (link list of 14 brands). NOT a media hub.

**The three gaps ZM fills:**
1. **Earned media has no home.** Appearances ON other shows/podcasts (like Just DAO It) aren't logged anywhere - they evaporate. This is credibility + GEO fuel being lost.
2. **No single aggregation surface.** Owned + earned + spaces + streams live in 8 places; there's no "here's all ZAO media" home.
3. **No media BRAND.** ZNN is being retired; ZM (ZAO Media) is the consolidated brand for all of it.

## What ZM IS

**ZM = ZAO Media** - the media brand + aggregation hub for everything ZAO produces or appears in. Not a directory of links (that's Nexus) - it's the media itself, indexed, shareable, repurposable. Replaces ZNN.

### The media taxonomy (what ZM aggregates)
| Class | Examples | Source | Primary action |
|-------|----------|--------|----------------|
| **Earned** | Podcast guest spots, features, press, mentions | other people's shows | LOG + share (credibility) |
| **Live** | Farcaster Spaces, Twitch/Restream streams, X Spaces | Zaal/ZAO hosts | preserve (VODs expire) + clip |
| **Produced** | ZAOstock recaps, WaveWarZ battles, ZABAL Gamez sessions, newsletters | ZAO produces | publish + repurpose |
| **Community** | Member casts, COC Concertz sets, artist spotlights (ZOL) | the 100+ community | curate + amplify |

### The architecture: LOG ONCE, GENERATE OUTWARD (the ICM model)
```
one media log (source of truth, structured)
   |-- generates --> ZM public page ("as seen on" / all ZAO media)
   |-- generates --> ZABAL Gamez media hub section
   |-- feeds --------> the clip pipeline (zaalclip: appearances -> shareable clips)
   |-- syncs --------> the cowork tracker (queryable, capture->crush)
   |-- pushes -------> Bonfire (so ZOE/ZOL can recall + reference in casts)
```
This mirrors `icm-grounding.md` (the box is upstream, downstream is generated) and `feedback_firefly_only` (one source, many mirrors). You never hand-maintain the page AND the tracker AND the hub - you log once.

### The log schema (per entry)
`title, class (earned/live/produced/community), date, host/source, url(s) [yt/audio/transcript], status (upcoming/live/archived), brands[] (ZAO/WaveWarZ/ZAOstock/ZABAL/...), topics[], clip_candidates[], canonical_spelling_check (bool), notes`

## First entry (the anchor - Zaal's Just DAO It appearance)

Logged in this doc's `media-log.md` (this folder). Summary:
- **Title:** Preventing DAO Governance Attacks + Building a Music DAO and AI Agent Legal Entities
- **Class:** earned | **Host:** Adam Miller (@0xthriller / "The Thriller"), Just DAO It podcast | **Date:** 2026-07-30 (live)
- **URLs:** YouTube https://youtu.be/rTQ7nYdh0YI - Transistor https://justdaoit.transistor.fm/episodes/just-dao-it-with-zaal - X announce https://x.com/JustDAOItPod/status/2081879495259431030 - transcript: "Just DAO IT! with Zaal.md" (Zaal's Mac)
- **Topics:** DAO governance attacks (apathy attack), ZAO Respect (soulbound governance), WaveWarZ, ZAOstock (Maine), AI-agent legal entities (ZOL bot + MIDAO)
- **Brands:** The ZAO, WaveWarZ, ZAOstock, ZOL bot | **Canonical-spelling check:** DONE (ZAOstock, ZOL bot, info@thezao.com - Zaal fixed the host's description)
- **Clip candidates:** the Respect-governance explainer (23:43), WaveWarZ live-traded-music (31:46), AI-agent-legal-entity plans (37:06) - prime shareable segments

## The brand-building skill (Zaal's ask: "include the best of all the things we've built")

Spec for a `/zao-brand` (or `/brandkit`) skill that packages what we already have into one brand-building flow:
- **Grounds on the ICM box first** (`icm-grounding.md`) - the brand's canonical truth.
- **Pulls the brand canon** (palette #141e27/#e0ddaa, voice = prose-not-lists, the glossary spellings) from `community.config.ts` + the brand memories.
- **Generates outward:** given a media item or announcement, produces the socials (`/socials`), the page copy, the ZM log entry, the clip brief - all in one pass, all on-brand.
- **Reuses:** `/socials` (posts), `/onepager` (one-pagers), `/clipboard` (shareable), the ICM skill (grounding), the content-map (doc 2135). It's an ORCHESTRATOR of existing skills, not new capability - per `code-restraint.md` rung 2 (reuse before build).
- This is its own build (doc + skill file) after ZM's shape is confirmed - flagged here, not built in this doc.

## Decisions for Zaal (the "ask me questions" answers shape these - confirm)

1. **ZM home surface:** where does the ZM public page live - a new `/media` route on thezao.com (zao-website), a section on zabalgamez.com, or bettercallzaal.com? (Rec: `/media` on thezao.com - it's the brand home + GEO win; mirror a filtered view into zabalgamez.)
2. **The log's source of truth:** a versioned `media-log.md` in the repo (simple, starts now), or a tracker table (queryable, needs a small schema)? (Rec: start with the repo file THIS session, graduate to the tracker when it earns it - don't over-build day 1.)
3. **ZM vs ZNN:** confirm ZNN is fully retired and ZM is the single media brand (so we don't run both).
4. **Auto-generation scope:** do you want the page/hub AUTO-generated from the log (a build step), or hand-curated from it to start? (Rec: hand-curated from the log first, automate once the log has ~10 entries.)
5. **Brand-building skill name:** `/zao-brand`, `/brandkit`, or fold into `/socials`?

## Roadmap (build order, PR-only)

1. **NOW:** the media log seeded with the Just DAO It entry (this PR) + drafted socials to SHARE it today (separate, via `/socials`).
2. The ZM page (once Zaal picks the home surface, decision 1) - generated from the log.
3. The ZABAL Gamez media-hub section - a filtered view of the log (class=live/produced, brand=ZABAL).
4. The brand-building skill (`/zao-brand`) - the orchestrator.
5. Clip-pipeline feed - the log's `clip_candidates[]` become `zaalclip` inputs.

## Sources

- Doc 2135/2136 (owned-media content map + Zaal's channel inventory), 2141 (recordings triage), 695/710/712 (Juke) [FULL]
- First-party: the Just DAO It episode (URLs + transcript from Zaal), the publish lib + media skills read this session [FULL]
- `icm-grounding.md` (log-once-generate-outward), `feedback_firefly_only`, `code-restraint.md` (reuse before build)
