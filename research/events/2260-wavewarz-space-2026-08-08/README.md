---
topic: events
type: incident-postmortem
status: research-complete
last-validated: 2026-08-10
related-docs: "743, 2137, 1372"
original-query: "here is the space i want to analyze (deep analyze this, have the whole transcript for us to ask questions against later) and go through both zaofestivals and zaostock repos and add any additional information that was learned"
tier: STANDARD
---

# 2260 - WaveWarZ battle Space, 2026-08-08: Cannon Jones vs Mose, and what it taught us

> **Goal:** Deep-analyse the 3h19m Space recording Zaal captured, preserve the full transcript for later questioning, and record what it changes about WaveWarZ, ZAOstock, and the festivals dashboard.

## The headline finding, stated first

**This Space is a WaveWarZ battle, not a ZAOstock or festivals meeting.** Zaal asked to fold its learnings into the `zaofestivals` and `ZAOstock` repos. Having read the whole thing: it teaches us about **WaveWarZ**, and almost nothing about either of those. Forcing its content into them would be manufacturing relevance.

Also worth naming, because the repo name misleads: **`bettercallzaal/zao-festivals` is not a festivals website.** Its own description reads *"ZAOstock team dashboard, mobile - Expo/React Native, Privy-embedded-wallet auth over Hats Protocol."* It is a mobile team dashboard. Nothing in this Space belongs in it.

## What it was

| | |
|---|---|
| Date | 2026-08-08 |
| Duration | 3h 19m (199 min) |
| Format | WaveWarZ headline battle, best of three rounds |
| Artists | **Cannon Jones** (Jersey) vs **Mose** (Syracuse) |
| Result | **Cannon Jones won.** Went 1-1 into a third round. Mose: *"welcome to the Wave Wars L Club"* was the host's line; Mose's own was *"I had fun tonight... hard fought battle"* |
| Judges | God Cloud, Catalyst, and the host (a third judge could not be recruited from the room) |
| Named in room | Zeke2Shiny, Nikki Bonds, Dutchess, Steele/SteeLo, Crypto Latina, Firearms, Dave, Miss Gecko, Quakey, Louie, Steve Strange, Cloud FM, Goose, Candy |
| Production | Candy - artwork, livestream, backstage ops. Kid Venom - producer credit on Mose's freestyle beat |

Transcript: `transcript.txt` in this folder, and `~/.zao/transcripts/zaofestivals-space-2026-08-08.txt`. 28,461 words, 3,637 lines, transcribed locally with `whisper-large-v3-turbo`; 85 looped lines were auto-collapsed.

**Speaker attribution caveat:** diarization was NOT run on this recording, so the transcript is one unlabelled stream. Attributions above come from self-identification and direct address in the text. Anything not explicitly named in the transcript is `confidence: low` and should not be quoted as a specific person's words.

## What it CONFIRMS (already in doc 743 - no update needed)

Doc 743 already records the daily 11am EST AMA, the 8:30pm EST nightly Quick Battles, Sunday specials, the triple judging system, and the Audius integration. The Space matches all of it. That is a good sign about the doc, and it means most of this recording is corroboration rather than news.

The battle mechanics as explained live, matching 743:

- Best of three rounds. Each round decided by three factors, majority wins the round: **the judges' vote**, **the X poll** (posted after every round), and **the soul vote** (the SOL trading pool on wavewarz.com).
- Two tracks per artist per round; rounds timed at roughly 12-20 minutes.
- Trading: buy and sell each artist's token live, price rising with demand. At the timer, **40% of the SOL in the loser's pool transfers to the winner's pool**; each pool is then split pro-rata by tokens held. Host's framing: *"not only the artists are at war, but the traders are at war too."*
- Mobile requires the Phantom or Solflare in-app browser to reach wavewarz.com.

## What is NEW - not in doc 743, verified absent by grep

**1. Connecting an Audius profile is broken on mobile.** Desktop-only, confirmed live: *"you can do everything else except connect your audience profile on mobile."* This is the onboarding step for every new artist, so the bug sits directly on the growth path. The host attributes it to Audius's end, and adds that he was removed from the Audius Discord, so the informal channel for reporting it is closed.

**2. The catalog holds roughly 17 artists.** Said plainly: *"right now I think we got like 17 or something artists in the catalog."* First recorded size figure. The host's pitch is explicitly early-adopter framing: *"you don't want to get there when everybody's there."*

**3. Kalshi and Polymarket were both approached and both ignored it.** Outreach went through staff on X rather than email - a participant pointed out that email is the professional channel and the host conceded the point. Also new: the room independently converged on positioning WaveWarZ as a **music prediction market**, and a pre-battle "pre-poll" has already been trialled as a first step toward a pre-battle wager.

**4. A live timer misconfiguration forced a mid-battle restart.** The host set round one to 5 minutes instead of 20, had to stop mid-song, spin up a replacement battle, and instruct everyone to withdraw from the abandoned pool: *"make sure you withdraw from the last one."* Funds were recoverable through the Past Battles section, so nothing was lost - but a manual, mid-event, money-touching recovery step is a real product risk, and it happened in front of the room.

**5. The Quick Battle queue is more automated than 743 conveys.** Anyone connects an Audius profile, picks any two songs from the catalog, reserves a quick battle, and it enters a queue that **anyone can launch from the front page**. The host: *"we've essentially created an automated way to run Wave Wars."* Artists earn from the trading fees on battles their music appears in.

**6. A stats app exists** at `stats.wavewars.info`, built by Candy - per-trader performance across battles.

**7. The livestream replay is degraded.** Candy's machine had an audio failure across two browser sources mid-stream. The replay will be rebuilt from the Space recording plus the music files. **The file Zaal captured is therefore the better master**, which is a reason to keep it.

## Forward-looking, as stated in the room

- **Next headline battle:** two artists already approved, flyer pending from Candy, possibly the following Sunday. Names deliberately withheld on air pending team confirmation - one was present. A **producer battle** was hinted at.
- **Nightly quick battles all week**, 8:30pm EST, described as newly started.
- Suggested future matchups: Stilo vs Mose; Catalyst needs an opponent, Louie proposed.
- Open call, verbatim: *"if you're a writer, if you're a creator, if you're a musician, if you're a producer, if you're a videographer, if you clip"* - they want collaborators.

## What this changes for the two repos Zaal named

**`ZAODEVZ/ZAOstock` (the public Oct 3 site): nothing.** The Space contains no mention of ZAOstock, the Oct 3 date, Black Moon, the permit, or the lineup. Adding anything from it would be invention.

**`bettercallzaal/zao-festivals` (the mobile team dashboard): nothing.** Wrong product entirely - see the naming note above.

**`bettercallzaal/ZAOOS` doc 743 (WaveWarZ canonical): four additions**, listed above as items 1-4. They are operational facts, not whitepaper changes.

**The zabalgamez.com WaveWarZ brand page** should gain the Quick Battle onboarding path, since it is currently the public explainer and the Space shows onboarding is where artists get stuck.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| File the Audius mobile-connect bug with Audius via email, since the Discord route is closed | @Zaal | Outreach | 2026-08-14 |
| Add a server-side floor to the battle timer so a 5-minute round cannot be set by hand mid-event | @Zaal | PR | 2026-08-17 |
| Fold findings 1-4 into doc 743 as an operations section | @Zaal | PR | 2026-08-14 |
| Add the Quick Battle onboarding path to the zabalgamez WaveWarZ page | @Zaal | PR | 2026-08-17 |
| Re-approach Kalshi and Polymarket by email rather than X staff DMs | @Zaal | Outreach | 2026-08-21 |

## Sources

- `~/.zao/transcripts/zaofestivals-space-2026-08-08.txt` - FULL local transcription of the 199-minute recording Zaal supplied, 2026-08-10. Every quote above is verbatim from it.
- `research/wavewarz/743-wavewarz-whitepaper-v2-deep-dive/` - the canonical WaveWarZ record this corroborates and extends.
- `gh api repos/bettercallzaal/zao-festivals` - FULL, 2026-08-10. Source of the repo-description correction.
