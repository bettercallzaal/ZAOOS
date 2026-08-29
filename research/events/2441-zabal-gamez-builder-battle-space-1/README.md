# 2441 - ZABAL Gamez builder battle, Space 1 (opening)

**Date:** 2026-08-29 | **Duration:** ~86 min of talk (music at both ends) | **Platform:** X Space on the WaveWarZ account, "ZABAL GAMEZ BUILDER BATTLE FINALZ SPACE #1"
**Project:** ZABAL Gamez (with WaveWarZ and ZAOstock)
**Recording:** `space_2026-08-29T16-33-32-981Z.mp4` (local, audio only) | **Transcript:** [transcript.md](transcript.md) (speaker-labeled) | **Extraction:** [extracted.json](extracted.json)

**Attendees** (Space roster, 12 listed): Zaal (host, WaveWarZ account), Candy (WaveWarZ co-founder, ran the stream), Thy Revolution, Iman Afrikah, paperhandpapi, Mauro / jdwalka (finalist), Brandon / ghostmintops (finalist), GodclouD, N3M, Hurricane, Emergent, Steve Strange, zee3, RAK PHO.

The Space opened the 24 hour builder battle: noon Saturday 29 August to noon Sunday 30 August ET. It ran from about 11:00 to 12:25, and the battle was created live on WaveWarZ at 12:00.

## Decisions

| # | Decision | Owner | Confidence |
|---|---|---|---|
| 1 | The three judges are **Thy Revolution, Iman Afrikah, paperhandpapi**. Thy Revolution judges all three tracks. | zaal | high |
| 2 | The 24 hour challenge is to **build on ZAOstock / ZAO Festivals** for the 3 October event; ideas at zaostock.com/build (a board, ticketing, a Decentraland stage, a WaveWarZ front end). Builders pick their own angle. | zaal | high |
| 3 | Three signals decide it: the **poll** (already live in the pinned thread), the **three judges**, and the **charts** on the WaveWarZ community battle created at noon. 1 percent of trade volume routes to each builder's own wallet, pulled from their Farcaster Solana address. | zaal | high |
| 4 | **Space 2 is Sunday 11:00 AM ET**, an hour before the battle ends; extra Spaces open any hour a builder messages Zaal. | zaal | high |
| 5 | The **finals Farcaster group chat is opened to everyone** in the Space; invite posted from the ZAO Festivals account. | zaal | high, done in-call |
| 6 | The WaveWarZ lore and content store is named the **WaveWarZ Abyssal Plane** (Thy Revolution's suggestion, accepted by Candy who is building it). | candy | medium |

## Actions

| Action | Owner | Due | Conf |
|---|---|---|---|
| Write the three judges into `data/finals.json` and merge | zaal | 2026-08-29 | high |
| Paste the poll URL into the builder row so the Vote button renders | zaal | 2026-08-29 | high |
| DM each judge and both builders (rubric for judges, the Space loop for builders) | zaal | 2026-08-29 | high |
| Give builders the ZAO Festivals content: ZF3 and ZF2 folders, ZF1 finished videos, find the ZF1 raw | zaal | 2026-08-30 | high |
| Post the Space 1 summary with links to what the builders discussed | zaal | 2026-08-29 | high |
| Check Space 2 is scheduled 11 AM, not 11 PM | zaal | 2026-08-30 | medium |
| Answer jdwalka on the Farcaster mini app scroll drop (can it be pinned) | Open | | medium |
| Collect artist jackets and resumes by DM for the Abyssal Plane | candy | | medium |
| Give Iman and N3M an official WaveWarZ artist-board battle | Open | | medium |
| Build the WaveWarZ lore synthesizer (explicitly not in the 24 hours) | zaal | | medium |
| Fix the Hermes bleep timing on stream clips (it bleeps the following word) | zaal | | low |

## What the builders said they built

**Mauro (jdwalka)** finished a poker bot, **Truffle**, named after his guinea pig. It plays on the Chips AI bot platform and has beaten three players on that leaderboard. The design point: the whole game tree is local, so it decides in 2 to 5 milliseconds where rival bots make round trips to remote LLMs and risk the 5 second penalty. He loaded over 1500 pages of range charts and implemented both game theory optimal and exploitative strategies, on the argument that pure GTO only guarantees break-even against another GTO opponent. He is folding the bot back into the Farcaster poker mini app, which he had considered shelving. His one open ask: the mini app drops on scroll and he wants to know whether it can be pinned.

**Brandon (ghostmintops)** built **ProofDrop**, a lightweight open-source build receipt generator: you give a project title, live URL, public repo, Farcaster and X identities, a wallet and an evidence file, and it returns a receipt. The image is never uploaded or retained; its SHA-256 fingerprint is bound into a structured JSON receipt with the project details, ZABAL event info, timestamp, track and submission links, then the whole receipt is serialized deterministically and hashed again, so anyone can check later whether the visible contents still match the original hash. It started as a tool for the ZABAL POIDH submission and was designed to work for any bounty, hackathon or proof-of-work system. He put its general case as agent hiring: given five agents that claim they can do a job, pick the one that can prove it has done it. He also built the **ZABAL Recording Scout**, which turns the workshop recording library into a builder-facing opportunity board, so the Scout helps decide what to build and ProofDrop helps prove what shipped.

The two of them then talked shop for twenty minutes: Fetch.ai and ASI-1 inference credits against Google's pricing, LLMs as managers of agent swarms rather than chatbots, Cloudflare tunnels and R2 and D1, Tailscale as a mesh network (with a plain-language definition demanded and given), the Mullvad exit-node add-on, and persistent memory stacks. Zaal's read afterwards: "while we're doing this competition, it's more about the collaboration of it all."

## Numbers and dates said on the call

- ZAOstock: Saturday 3 October 2026 in Maine; live WaveWarZ event 4 to 6 PM ET; streamed to Decentraland, YouTube and Twitch. Called as 34 days out.
- Season, as recapped live: over 30 workshops, 15 individuals with 30 projects, six finalists. Matches `season-1-results.json`.
- 1 percent of WaveWarZ trade funds to each builder's wallet.
- Truffle: 2 to 5 ms decisions, 5 second penalty threshold, three leaderboard players beaten, 1500-plus pages of range charts.
- ghostmintops: Google offered him 10,000 dollars of inference; he claims about 150,000 dollars of Fetch.ai credits; 5,000 Mbps dark fiber.
- WaveWarZ has run 53 dated events (Candy, building the lore store).
- Same day: Harmony Hub Space at 3 PM ET interviewing Money Miller; Thy Revolution's music Space at 4 PM ET.

## What did not happen

- **Neither builder said what they will build in the 24 hours.** The planned open-floor brainstorm and the pick-naming did not happen as segments; the room went to workflows and WaveWarZ content instead. There is no recorded pick for either finalist.
- The **creator battle winner** was referenced as decided but never named *in this Space*. At real-audio 18:20 to 18:30 Zaal says, verbatim, "we have our artist finalists, we have our creator finalists winner, and now we're here to find our builder", and moves on; neither creator finalist is mentioned anywhere in the 100 minutes, zero hits for presdency or uniquebeing404 across the whole transcript. Note for anyone clipping this recording: the segment timestamps in `transcript.md` run about 95 seconds behind real audio on this file.

  > **CORRECTION, 2026-08-29 17:0x.** This entry originally concluded that the name existed nowhere but Zaal's memory. **That was wrong, and the error is worth naming rather than quietly fixing.** The finding was true of the Space this doc covers and was stated as though it were true in general. It was never memory-only: the announcement is in a *different* recording, the Creator Battle FINALZ Space of 2026-08-27 (`x.com/i/spaces/1dKrPrQkgYVJX`), which nobody had searched because this doc's question was scoped to the opening Space.
  >
  > **The winner is uniquebeing404**, for the ZAO colour paint (ColorZAO, colorzao.signalify.xyz) plus a video. **presdency is runner-up.** At 01:22:03 of that recording: "we have our Zabal Games Creator Battle Finals winner unique being 404 with the ZAO color paint ... Presidency, appreciate you so much for joining us for this finals". All three judge votes in the run-up go the same way, so the call is unanimous. An earlier transcript rendered the handle as "Unique V in 404"; an independent re-transcription of the raw audio window renders it cleanly as "unique being 404". Counting precisely, because the first version of this line overstated it: the name "unique being" appears 18 times in the transcript, and the full form with 404 appears twice, once in the announcement and once in a charts readout at line 835, "we have unique being 404 at 0.03 sol and presidency at 0.01 sol". That second occurrence is the stronger corroboration, because it is an independent context naming both finalists by handle.
  >
  > Artefacts, kept so this cannot recur: audio at `~/zao-vault/meetings/audio/creator-battle-finalz-1dKrPrQkgYVJX.mp3`, transcript at `~/zao-vault/meetings/transcripts/2026-08-29-creator-battle-finalz.txt`. Written to the site in zabalgames PR #654.
  >
  > **The lesson, for the next person who searches a recording for a fact:** "not in this recording" and "not recorded anywhere" are different claims, and only the first one was measured. A negative result inherits the scope of the search that produced it. Say which recording you searched.
- **Mauro's mini app question went unanswered.**
- The **judges rubric was never mentioned**, and nothing was said about how judges submit a pick or by when.
- **Prize payout wallets** were not discussed on air. The 1 percent trade share uses Farcaster Solana addresses. (Resolved out of band the same day: Zaal paid out through Farcaster, so no separate address was needed.)

## Contradictions with the site, as of the call

| The site says | The call said |
|---|---|
| Judges: TBA, TBA, TBA on the builder row | All three named and finalized |
| `poll` is null, so no Vote button | The poll is live in the pinned thread |
| Run sheet: poll posts at 11:05 as its own tweet | It was already up as part of the thread |
| Space 1 at 11:00 AM ET | It was shared out as 11 PM by mistake; Zaal corrected it live |

## Commitments to people

- Zaal to DM all three judges and both builders today.
- Zaal to hand the builders the ZF1, ZF2 and ZF3 content folders from the ZAO Festivals account.
- Hurricane: Wave Station replicant songs dropping today.
- Steve Strange: building out Ignite Radio artist profiles with RJ; named Ignite Radio a WaveWarZ sponsor on air.

## Research seeds

- Chips AI as a poker bot arena, and local game trees as a latency strategy (doc-worthy on its own).
- ProofDrop's receipt hashing as a generic proof-of-work layer for agent hiring and bounties. Related: 2237, 2179.
- Fetch.ai / ASI-1 inference economics against hyperscaler pricing.
- Tailscale plus Mullvad exit-node friction; Cloudflare tunnel as a non-substitute.
- The Abyssal Plane: lore store, weigh-in style artist intros, sports-style promos to route around the YouTube gambling flag.
- Ignite Radio artist profiles and clicks video (2269); content badges for explicit language, suggested by Emergent.

## Provenance

Transcribed locally (mlx-whisper large-v3-turbo), diarized with sherpa-onnx at the roster count of 12, giving 531 segments across 12 clusters merged into 147 speaker turns. Speaker names come from self-introduction, direct address by name, and the Space roster, then cross-checked against the clusters. Candy's authorship of the lore store is a cluster-plus-content identification, not a self-introduction; Zaal's first guess was Emergent, and the audio does not support that. Music at the head and tail is a WaveWarZ track, not conversation.

## Lane weigh-in

Two lanes were asked at 13:0x ET, bounded at 10 minutes. **Neither weighed in**, and the two reasons are different:

- **zabalgamez** - packet delivered to the builder-battle lane pane, which was mid-task on the judges relay and did not reply within the window. Recorded as asked and silent, not as agreement.
- **wavewarz** - **UNDELIVERED**. No live pane in a WaveWarZ repo and the spawn failed, so the lane never received the packet. This is a delivery failure, not silence; nothing in this recap has WaveWarZ lane review behind it.

The extraction stands as written, with no lane corrections merged. The WaveWarZ material in it (the Abyssal Plane, the artist-board battle for Iman and N3M, the lore synthesizer) is transcript-sourced only and has not been checked against the WaveWarZ repo.
