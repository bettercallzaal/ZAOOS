---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-28
related-docs: 415, 468, 533, 625, 626, 628, 629, 631, 701, 757, 759
original-query: "ZABAL Games + POIDH bounty patterns. Two-part: (1) survey all past POIDH bounties to identify high-engagement patterns and best practices for writing winning bounties, (2) map ZABAL Games positioning to write Round 3 bounty = ad for zabalgames.com. Hard rule: no random music/audio in submissions (only binaural beats permitted). Output: best-practices distillation + ZABAL Games context map + Round 3 bounty draft."
tier: STANDARD
---

# 768 - POIDH bounty best practices + ZABAL Games Round 3 bounty draft

> **Goal:** Distill what made R1 (Hannah/Farm Drop clip) + R2 (Best 60s POIDH ad from Ep 19) actually work, fold in Kenny's framework + the high-engagement bounties on POIDH lifetime, and ship a paste-ready Round 3 bounty for `zabalgames.com` ad creation. Lock the new hard rule on submission audio. Establish the canonical "branding folder" path for content + assets so future bounties can hand submitters a kit.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Round 3 subject** | Ad for `zabalgames.com` - drive signups (lead.html) + mentor applications + workshop RSVPs. Same rubric structure as R2 (Distribution / Craft / Substance / Bonus) with one new floor rule + one new bonus angle. |
| **Round 3 floor (NEW audio rule)** | **No random background music or ambient audio under dialog. If you want non-silence, USE a binaural beat (single sustained tone, 8-30Hz beat frequency).** Original episode audio = fine. One clear track = fine. Layered ambient / pop music / sound design = floor fail. Lesson from R2 where buried-dialog hurt otherwise strong submissions. |
| **Round 3 source material** | Repo branding folder at `github.com/bettercallzaal/bettercallzaalwebsite/tree/main/assets/zabal-games-brand/`. Must contain: logo SVG + PNG, color palette card, type spec, 3-5 B-roll clips (workshop screenshots, /zabal channel screenshots, Magnetiq portal walkthrough, prize-amount cards), 1 royalty-free binaural beat MP3 (~60s loop), 1 sample social card per platform (Farcaster + X). Build this folder BEFORE casting the bounty - linking to an empty folder kills the bounty. |
| **Prize tier** | 0.0105 ETH on Base, OPEN bounty (lets contributors stack). Same as R2 for continuity. |
| **Duration spec** | KEEP 45-60s. R2 ffprobe data showed 7 of 8 submissions clustered around 60s exactly - the cap shapes craft. Do not loosen. |
| **Verticality** | ENCOURAGE vertical 9:16 (Reels / TikTok / Shorts native) - R2's only vertical entry (@dee-13 at 320x426) hit highest engagement (11 likes). Add "vertical 9:16 preferred" as a Craft bonus box. |
| **Distribution gate** | Lift `/poidh` + `/zao` Farcaster cross-post from optional rubric box to FLOOR. R2 only one submitter (Dee) confirmed cross-posting all 3 Farcaster surfaces; the others left distribution on the table. |
| **Best-practices page** | Ship `bettercallzaal.com/poidh-bounty-best-practices.html` as a permanent reference - mirrors this doc's Part 4 + 5. Cite from every bounty going forward so submitters know the bar. |
| **Round 3 deadline** | 10-14 days from cast (vs R2's 7-day window). Bigger window = better submissions when there's more raw material to work with. |
| **Mentor jury** | R3 judged by Zaal + Kenny + Tyler + Iman (vs R2's Zaal-only). Spreads the call + gives each judge a follow-up channel into the submitter pool. |

---

## Part 1 - What R1 and R2 actually proved

### R1 (Bounty 1151 - Hannah / Farm Drop clip-up, Apr-May 2026)

- 11 claims, 10 unique submitters, 1 winner (@cryptfi-mariano, claim 6368)
- Pulled new editors into the ZAO album (5+ first-time POIDH submitters)
- Took 4+ weeks from cast to winner-accepted on-chain
- Lesson logged in doc 533: clear "what to look for in a clip" beat-by-beat instructions outperform vague creative briefs

### R2 (Bounty 1166 - Best 60s POIDH ad from Ep 19, May 2026)

- 8 claims, 7 unique editors, 1 winner (@joeyofdeus / Monksage, claim 6645)
- Floor pass: 3 (clean), 2 (borderline 0.2-0.5s over), 3 (fail on duration or missing X URL)
- Real-time ffprobe scoring made the 45-60s rule binary and visible
- Per-submission judging page at `bettercallzaal.com/poidh-round2-judging.html` shipped same week as cast - first BCZ POIDH bounty with public scorecards
- Winner picked on substance + spec compliance, not engagement (Dee had higher likes but borderline duration + off-thesis copy)
- $ZABAL distribution flowed to all 7 floor-pass editors via slot 8 of $ZABAL Empire - participation IS the reward

### What broke in R2 that R3 fixes

| Break | R2 outcome | R3 patch |
|-------|-----------|----------|
| Layered music buried Kenny's dialog | Submitters lost substance points because viewers couldn't hear the clip's main argument | Audio floor rule (binaural beats only if non-silence wanted) |
| 91.88s Ebuka submission disqualified | Best B-roll work in the cohort lost on a binary floor it never knew it was crossing | Public duration meter in bounty page + reminder in cast |
| Only 1 submitter (Dee) cross-posted all Farcaster channels | Distribution rubric box mostly unticked | Promote /poidh + /zao cross-post to floor |
| No common B-roll source | Submitters scraped Ep 19 clips themselves, results varied wildly | GitHub branding folder with pre-cleared assets |

---

## Part 2 - The POIDH bounty cohort patterns (lifetime)

Based on data from doc 759 (POIDH history) + the Dune dashboard + Kenny's own examples:

### High-engagement bounty mechanics (across all of POIDH, 2024-2026)

| Pattern | Example | Why it worked |
|---------|---------|---------------|
| **Open bounty + community pool** | The Haberdashery $30K Guinness kickflip (claim 1167 on Degen, Sep 2025) | Many contributors stacked into one pot. Each contributor became a promoter. Result: Guinness World Record broken + 100K+ views. |
| **Whale catalyst** | Jesse Pollak adds 0.25 ETH to a $5 bounty (bounty 906 on Base) | Public deposit by a recognizable wallet triggered a submission wave + amplified the bounty's signal in /poidh. |
| **Specific physical task** | Skateboard kickflip count, NYC rat-zone documentation | Easy to prove. Easy to attempt. Easy to brag about. Vague creative briefs underperform specific physical asks. |
| **Episode-tied / event-tied** | BCZ R1 (Ep 17 clip-up) + R2 (Ep 19 clip-up) | The source content already has an audience. The bounty extends that audience's engagement window. |
| **Brand-aligned NFT collectible** | "ZAO Stock Witness #001" naming pattern from doc 625 | The artifact becomes a permanent record. Submitters keep claim NFTs as a portfolio piece. |
| **Cross-post discipline** | Dee's R2 entry cross-posted /poidh + /zao + general Farcaster + X | Each surface had its own audience; the cast that hit all 3 won the engagement leaderboard. |

### What FAILS reliably

| Anti-pattern | Why it kills the bounty |
|-------------|------------------------|
| Vague creative brief ("make something cool about X") | Nobody knows the bar; submissions vary wildly; winner pick feels arbitrary |
| No source material | Editors scrape what they can find; quality drops; brand drift |
| Hard rules buried at the bottom | Editors miss the floor and submit nine seconds over |
| No upper time limit on video | Submissions balloon past attention-span thresholds (R2 Ebuka at 91.88s) |
| Layered ambient music under dialog | Spoken thesis becomes unintelligible at scroll-volume |
| Solo bounty with broad open call | Loses the contributor-amplification effect of open bounties |
| Long deadline + no mid-window reminder | Editors forget; you get all submissions in the last 24h scramble |
| Issuer judges alone with no rubric | Decisions look opaque; future participation drops |

---

## Part 3 - Kenny's framework (POIDH founder's own lens)

From doc 759 + BCZ YapZ Ep 19 + Kenny's Paragraph posts:

1. **"Use cases I can show family that aren't gambling."** Every bounty should pass this test. If the task can't be explained to a non-crypto person in one sentence as a real thing being done, rewrite.
2. **"Pull money to get specific things done in the real world."** Specific > generic. "Photo at ZAO Stock with the Franklin St sign visible" beats "ZAO Stock photo."
3. **"Permissionless from wallet to wallet."** Anyone with a wallet can claim. No profile, no application. The bounty cast is the entire onboarding.
4. **"Proof required = pic OR it didn't happen."** The artifact is the proof. The collectible NFT is the receipt. Both flow from the same submission.
5. **"Voting is the wisdom-of-crowds layer."** Open bounties hand the contributors a real role: verify the work. Solo bounties skip the layer for speed.

For Round 3, the ad-creation framing should explicitly invoke Kenny's frame: "Make an ad for `zabalgames.com` that shows your non-crypto friend why they should care."

---

## Part 4 - The bounty-writing checklist (canonical)

Every BCZ POIDH bounty from R3 onward MUST hit every box on this list. Lifted from R2 lessons + doc 625 templates + Kenny's framework.

### Title

- Specific noun + verb + duration cap. Pattern: `[Best/First/Most] [duration-bounded artifact] from [source/event]`
- Examples: "Best 60s POIDH ad from Ep 19 w/ Kenny" (R2 - worked), "First photo from ZAO Stock 2026" (doc 625)
- AVOID: "Make something about X" / "Help promote Y" / "Share your story"

### Description body

- One-paragraph WHY this bounty exists (link to source episode / event / page)
- **THE BAR** section with 3-5 floor rules in numbered list - the hard "do these or you're not in the running" gate
- **THE RUBRIC** section grouped by Distribution / Craft / Substance / Bonus with checkboxes - "more boxes ticked = stronger judging weight"
- **WHERE TO FIND THE STRONGEST BEATS** - if clip-based, timecode hints into the source
- **THE REWARD** - prize amount + winner-cast distribution + Empire Builder ZABAL trail for all submitters
- **DEADLINE** - exact PT date/time + judging window + winner cast date
- **ASSET KIT** - link to GitHub branding folder (new for R3+)
- **AUDIO RULE** - no random music; binaural beats only if non-silence wanted

### Cast itself

- Drop bounty link first (POIDH frame renders inline)
- Embed bounty page screenshot OR poidh.xyz auto-embed
- Tag `@kenny` + `@poidhxyz` so they amplify
- Cross-post to `/poidh` + `/zao` Farcaster channels + X via Firefly
- Pin the cast in `/zao` for the duration of the window

### Mid-window reminder (NEW for R3)

- Day 5 of 10-14: reply-cast in the original thread with "X submissions so far, deadline in N days, link to live submitter gallery"
- Link to `bettercallzaal.com/poidh.html` so submitters see the leaderboard growing

### Judging discipline

- Run `ffprobe` on every video for actual duration BEFORE rubric scoring
- Floor-fail per spec; do NOT inflate verdict to clear the bounty
- Publish per-submission scorecard page on bettercallzaal.com within 48h of deadline
- Winner cast leads with congrats; the mechanics + leaderboard go in the second paragraph
- DM honorable mentions privately (template in doc 759 + R2 clipboard)

### Post-bounty

- Trigger `submitClaimForVote` on POIDH if open bounty -> ~48h contributor vote -> `resolveVote` -> winner withdraws
- Add winner clip to `bettercallzaal.com/poidh.html` past-bounties gallery
- Update `poidh-leaderboard.json` so EB distributes the new round's ZABAL on next refresh
- Push final state to GitHub before the next round opens

---

## Part 5 - The hard audio rule (NEW 2026-05-28)

### The rule

> No random background music or ambient audio under dialog in any BCZ POIDH bounty submission video. If you want non-silence under your edit, use a binaural beat (single sustained tone with a 8-30Hz beat frequency between left/right channels). Original source-episode audio is always fine. One clear instrumental track is fine if it does not compete with spoken dialog. Layered music + dialog = automatic floor fail.

### Why

- Spoken thesis is the substance. If a viewer scrolling at 50% volume can't hear the words, the ad does no work.
- R2 had submissions where Kenny's voice was buried under cinematic ambient pads - the editor's craft was real but the message disappeared.
- POIDH ads are watched on Farcaster + X + mobile with subtitles ON 60%+ of the time. Audio competing with captions distracts both eyes and ears.

### Why binaural beats specifically

- A binaural beat is two slightly-offset tones (e.g. 240Hz left + 244Hz right = 4Hz perceived beat). Brain hears the difference frequency as a low pulse.
- Sub-bass / pulse is non-melodic = doesn't compete with melody-perception centers in the brain
- 8-30Hz range = alpha/beta band, doesn't pull attention
- Royalty-free + easy to generate (Audacity, online generators, Apple Logic free preset)
- Sounds like "ambient hum" rather than "music" so it doesn't make the clip feel scored

### Approved sources

| Type | Source | Notes |
|------|--------|-------|
| Generator | `binauralbeatsfreak.com` (free download) | Pick alpha (8-12Hz) for chill, beta (12-30Hz) for energy |
| Generator | Audacity `Generate -> Tone` (DIY) | 240Hz L + 244Hz R = 4Hz beat (alpha/theta border) |
| Generator | Apple Logic Pro built-in Test Oscillator | Set L + R freqs separately |
| Pre-built clip | `assets/zabal-games-brand/binaural-60s.mp3` (we ship this in the brand folder) | Pre-cleared for ZABAL Games R3 use |

### What does NOT count as binaural beats

- Lo-fi beats / chillhop
- Cinematic pads
- Movie trailer build-up tracks
- Any track with a melody, chord progression, or vocal
- Library music from Epidemic Sound / Artlist / Soundstripe (those are tracks with melody)

If an editor wants to score the ad, they can use original episode audio. If they want backing texture, they use binaural beats only.

---

## Part 6 - The ZABAL Games asset kit (what goes in the GitHub folder)

Path: `github.com/bettercallzaal/bettercallzaalwebsite/tree/main/assets/zabal-games-brand/`

### Required (ship before bounty cast)

| File | Purpose | Source |
|------|---------|--------|
| `README.md` | Manifest + usage license (CC-BY) + brand voice one-pager | Write fresh from doc 701 brand context |
| `logo.svg` | ZABAL Games wordmark vector | Generate from existing zabalgames.html header |
| `logo-dark.png`, `logo-light.png` | Raster fallbacks 1024x1024 | Export from SVG |
| `palette.png` | Color swatches with hex values | Match zabalgames.com palette |
| `type-spec.md` | Font names + weights + sizing scale | Capture from zabalgames.com CSS |
| `b-roll-workshop-1.mp4` | 10-15s screen capture of a recorded workshop | Pull from Lu.ma recordings once they exist; placeholder for R3 = recorded zabalgames.html scroll |
| `b-roll-channel-walkthrough.mp4` | 10-15s screen capture of `/zabal` Farcaster channel | Record live, /browse helps |
| `b-roll-magnetiq-portal.mp4` | 10-15s screen capture of Magnetiq portal | Coordinate with Tyler Stambaugh |
| `prize-card-500usdc.png` | "$500 USDC + $ZABAL + collectibles" 1080x1080 | Quick Figma export |
| `prize-card-tiers.png` | "Top 8 paid, top 16 earn ZABAL, all finishers get NFT" 1080x1080 | Same |
| `binaural-60s.mp3` | 60s pre-cleared binaural beat at 4Hz alpha | Generate via Audacity (240Hz L / 244Hz R) |
| `social-template-farcaster.png` | 1200x630 Farcaster embed card | Match BCZ aesthetic |
| `social-template-x.png` | 1200x675 X card | Same |

### License

Everything in the folder ships CC-BY 4.0. Submitters can remix, mash up, recolor, re-time, re-voice - just keep "ZABAL Games" + the zabalgames.com link visible somewhere in the final ad.

---

## Part 7 - Round 3 bounty draft (paste-ready)

### Title

```
Best 60s ad for zabalgames.com - 3 months, $500 USDC, all welcome
```

### Description body

```
Make a 45-60 second edited clip that works as an ad for ZABAL Games.

Watch the source page: https://zabalgames.com

ZABAL Games is 3 months of building with The ZAO. June workshops (recorded + live), July open build-a-thon, August Finals with embedded ZAO mentors. $500 USDC for top 8, $ZABAL for top 16, permanent collectible NFT for everyone who ships. Free. Anyone welcome.

The ad needs to get a stranger to click zabalgames.com/lead.html, RSVP a workshop on Lu.ma, or join the /zabal Farcaster channel.

ASSET KIT (use anything from this folder, CC-BY licensed):
https://github.com/bettercallzaal/bettercallzaalwebsite/tree/main/assets/zabal-games-brand

Logo, color palette, type spec, B-roll clips (workshop + channel + Magnetiq portal), prize cards, social templates, and the pre-cleared binaural beat track if you want background audio.

THE BAR (do these or you're not in the running)
1. 45 to 60 seconds. Edited - cuts, not a raw screen recording.
2. Post the clip on X with @bettercallzaal tagged.
3. Cross-post the same clip to BOTH /poidh and /zao on Farcaster.
4. Submit the X post URL on POIDH at this bounty page.
5. AUDIO RULE: no random background music or ambient music under dialog. If you want non-silence, use a binaural beat (single sustained tone with 8-30Hz beat between L+R channels - the brand folder has a pre-cleared 60s MP3 you can drop in). Original source audio fine. One clear instrumental fine if it doesn't compete with dialog. Layered melodic music = floor fail.

THE RUBRIC (more boxes ticked = stronger judging weight)

Distribution
+ Tag @kennyiscoding on X / @kenny on Farcaster
+ Tag @poidhxyz on X / @poidh on Farcaster
+ Tag @yerbearserker on Farcaster (Empire Builder co-founder)
+ Cross-post on any additional Farcaster feed beyond /poidh + /zao (the floor minimum)

Craft
+ Vertical 9:16 format (mobile-native, Reels/TikTok/Shorts ready)
+ Hook in the first 3 seconds (don't bury the lead)
+ Captions for sound-off scrolling
+ ZABAL Games wordmark or logo visible in lower third
+ Clear call to action at the end (e.g. "sign up at zabalgames.com")
+ A short intro / context line before the clip in the post body (not just a drop)

Substance
+ One clear takeaway about why ZABAL Games matters (free, 3 months, real mentors, real shipped builds)
+ Lands an authentic ZAO moment (mentor voice, builder POV, fractal energy) instead of a montage
+ Quotes the strongest line from zabalgames.com in the post caption (e.g. "Free to join. Anyone welcome.")

Bonus angles (rare, big multiplier)
+ Includes a recorded testimonial pull-quote from a past ZAO mentor (CannonJones, Tyler, Iman, Jordan)
+ B-roll or motion graphics that show what a ZAO build looks like (live URL + repo + demo flow)
+ Frames the clip as a direct invitation to MENTORS (not just builders) - "if you've shipped before, come mentor someone who hasn't"

THE REWARD
One winner takes the full pot. Pot grows in real time as others contribute - track live on POIDH and on bettercallzaal.com/poidh.html. The winning clip becomes ZABAL Games' pinned ad on @bettercallzaal channels and gets shared by @poidhxyz + the ZABAL Games Lu.ma + Magnetiq portal.

Every submitter who clears the floor lands on slot 8 of $ZABAL Empire on Empire Builder. ZABAL distributes to all submitters automatically on every refresh - not just the winner.

DEADLINE
Submissions close 11:59pm PT, Friday June 12, 2026 (16-day window).
Judging happens over the weekend (June 13-14). Winner announced via cast + X post by end of day Sunday June 14, 2026.

One winner. Chosen by me + a mentor jury (Kenny + Tyler + Iman). Craft + distribution + substance + audio compliance per the rubric. Multiple submissions allowed but the leaderboard counts unique wallets only.

Track live: bettercallzaal.com/poidh.html
Brand folder: github.com/bettercallzaal/bettercallzaalwebsite/tree/main/assets/zabal-games-brand
Source page: zabalgames.com
```

### Prize + bounty type

- 0.0105 ETH on Base, **OPEN bounty** (lets Kenny, Jordan, Tyler, the Haberdashery stack into the pot)
- Album: `wethemmedia` (same as R1 + R2 for continuity with Maceo's channel)

### Issuer wallet

- BCZ Treasury EOA `0x7234c36a71ec237c2ae7698e8916e0735001e9af` (per doc 625)

---

## Part 8 - Specific numbers

| Metric | Value |
|--------|-------|
| R2 submissions | 8 claims / 7 unique editors |
| R2 winner share of cohort | 1 of 8 (12.5%) |
| R2 floor-pass rate (strict 45-60s) | 3 of 8 (37.5%) |
| R2 winner duration | 59.70s |
| R2 longest submission | 91.88s (50% over cap, FAIL) |
| R2 highest engagement | 11 likes (Dee, vertical mobile) |
| R3 prize | 0.0105 ETH OPEN bounty on Base |
| R3 deadline window | 16 days (vs R2's 7 days) |
| ZABAL Games prize | $500 USDC + $ZABAL for top 16 + collectibles for all finishers |
| ZABAL Games duration | 3 months (June / July / August 2026) |
| ZABAL Games cost to participants | $0 (free + anyone welcome) |
| Lifetime POIDH bounties created | 2,863 (per doc 759) |
| Lifetime POIDH bounty completion rate | ~55% (1,565 of 2,863) |
| POIDH protocol fee | 2.5% on accepted payouts |
| Min bounty (Base) | 0.001 ETH (protocol min); practical floor 0.005 ETH (per doc 625) |
| Binaural beat frequency range | 8-30Hz (alpha + beta bands) |
| Binaural beat carrier tone | 200-300Hz works for sub-bass feel |

---

## Sources

- [FULL] [zabalgames.com](https://zabalgames.com) - landing page, 3-month structure, $500 USDC + $ZABAL + collectibles, /lead.html signup, /zabal channel, Lu.ma calendar, Magnetiq portal, "Free. Anyone welcome." tagline
- [FULL] [BCZ brands.json](https://github.com/bettercallzaal/bettercallzaalwebsite/blob/main/brands.json) - confirms ZABAL Games entry + canonical links (note: blurb stale, says "Token-game experiments")
- [FULL] Doc 701 - ZABAL Games canonical state (2026-05-22), 24 decisions, June/July/August calendar, open mentor roster, $500 USDC prize tiers, Hats Protocol collectible on Base
- [FULL] Doc 625 - POIDH x ZAO bounty playbook (18 templates, prize curves, judging rules, NFT naming convention, issuer wallet hygiene)
- [FULL] Doc 759 - POIDH history (Kenny + Rhovian + J founder team, 2,863 lifetime bounties, Haberdashery $30K kickflip pattern, Jesse Pollak whale-catalyst bounty, BCZ YapZ Ep 19 framework)
- [FULL] Doc 631 - POIDH x $ZABAL x Sentinel convergence (atomic distribution snippet, EB apiLeaderboard refresh flow, recommended Tier-S moves)
- [FULL] Doc 533 - POIDH clip-up bounty (BCZ YapZ Ep 17 / Hannah / R1 lessons)
- [FULL] `/Users/zaalpanthaki/Documents/BetterCallZaal/poidh-round2-judging.json` - per-submission scorecards for R2 (live page at bettercallzaal.com/poidh-round2-judging.html)
- [FULL] R2 ffprobe data (this session, 2026-05-26) - real durations for all 7 video submissions
- [PARTIAL - asset kit not yet built] `github.com/bettercallzaal/bettercallzaalwebsite/tree/main/assets/zabal-games-brand/` - this folder must be created + populated BEFORE the R3 cast

Cross-repo search: skipped (POIDH-specific repos already mapped in doc 759).

Verified URLs 2026-05-28: zabalgames.com HTTP 200, bettercallzaal.com/zabalgames.html HTTP 200, bettercallzaal.com/poidh.html HTTP 200, github.com/bettercallzaal/bettercallzaalwebsite reachable.

---

## Also See

- [Doc 759 - POIDH history (origin to 2026)](../759-poidh-history-origin-to-2026/) - Kenny's framework + lifetime stats
- [Doc 701 - ZABAL Games canonical state](../../events/701-zabal-games-canonical-state/) - format, calendar, prize tiers
- [Doc 625 - POIDH x ZAO bounty playbook](../../community/625-poidh-zao-bounty-playbook/) - 18 templates, NFT naming, issuer hygiene
- [Doc 631 - POIDH x $ZABAL x Sentinel convergence](../631-poidh-zabal-sentinel-convergence/) - atomic distribution flow
- [Doc 757 - poidh-sentinel fork surface](../../agents/757-poidh-sentinel-fork-surface-zao-sentinel/) - autonomous-bot path for future bounty management

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build + commit `assets/zabal-games-brand/` folder in BCZ repo (logo, palette, B-roll, prize cards, binaural-60s.mp3, README) | @Zaal | PR to BCZ | Before R3 cast |
| Ship `bettercallzaal.com/poidh-bounty-best-practices.html` as a permanent reference page mirroring Parts 4 + 5 of this doc | @Zaal / @ClaudeBot | Static page + nav link | This week |
| Generate the 60s binaural beat MP3 (240Hz L / 244Hz R = 4Hz alpha) via Audacity OR pull from binauralbeatsfreak.com | @Zaal | One-shot audio | Before R3 cast |
| Save the audio rule as a feedback memory so future sessions enforce it on every bounty draft | @ClaudeBot | Memory write | DONE 2026-05-28 (feedback_poidh_audio_rule) |
| Update BCZ `brands.json` ZABAL Games blurb (current is stale; should reflect the June/July/August build-a-thon, not the old "token-game experiments" framing) | @Zaal | PR to BCZ | This week |
| Cast Round 3 bounty on POIDH (open bounty, 0.0105 ETH, 16-day window) - use Part 7 description verbatim | @Zaal | POIDH UI + Farcaster cast | After brand folder ships |
| DM Kenny + Tyler + Iman about mentor-jury role for R3 judging (R2 was Zaal-only judge; R3 adds 3-person jury) | @Zaal | Farcaster DM | Week of R3 cast |
| Schedule mid-window reminder cast on day 5 of R3 (links to live submitter gallery on bettercallzaal.com/poidh.html) | @Zaal | Calendar reminder | Day 5 of R3 window |
| Coordinate with Tyler to record Magnetiq portal walkthrough for the brand folder | @Zaal | Tyler DM | Before R3 cast OR substitute zabalgames.html scroll capture |
| Re-validate this doc in 30 days (after R3 closes) - fold actual R3 outcomes into Part 1 patterns | @Zaal | Doc update | 2026-06-28 |
