---
topic: events
type: guide
status: research-complete
last-validated: 2026-08-17
superseded-by:
related-docs: "2296, 1128"
original-query: "/meeting /Users/zaalpanthaki/Downloads/Matteo X Zaal X Candy - 2026_08_06 09_58 EDT - Recording.mp4"
tier: STANDARD
---

# 2297 - Matteo x Zaal x Candy: Livepeer, web3 radio, and Harberger ads

> **Goal:** Recap the 2026-08-06 intro-depth call with Matteo Tambussi covering Livepeer's current shape (Daydream), his token-gated web3 radio design, and Harberger-tax advertising.

## Meeting

| | |
|---|---|
| Date | 2026-08-06, 09:58 EDT |
| Duration | 22 min |
| Attendees | Zaal, Matteo Tambussi (Italy bridge, memory `project_matteo_tambussi_italy_bridge`), Samantha (Candy Toy Box) |
| Platform | Video call |
| Transcript | [transcript.md](transcript.md) - diarized at 3, clean (S1 Sam, S2 Matteo, S3 Zaal) |

## What Matteo brought

1. **Livepeer today:** the decentralized-transcoding era is over as the pitch;
   the compute moved to AI. **Daydream** = real-time AI video processing on
   Livepeer infra ("maybe I look like Batman"), and **Daydream VST** = an
   AI-powered audio-responsive plugin. His caution: using Livepeer just to say
   "decentralized" is a gimmick unless it adds experience.
2. **Web3 radio:** token-gated community radio - connect wallet, NFT/ERC-20
   holders push songs into playlists (random or algorithmic), and BOOK THEIR OWN
   SHOWS via RTMP ingest, abstractable through Livepeer. Playlists and show
   calendar live on-chain.
3. **Harberger ads** (his Pensy/ETH-community-fund work): collectively owned ad
   space where bidders set their own resale price and pay ongoing tax on it -
   revenue to the community or the live streamer. Origin: Glen Weyl, Radical
   Markets, anti-gentrification mechanics applied to digital real estate.
   Sam's explicit excitement - "the ads I'm actually super excited to dig into."
4. **Livepeer contacts:** Eric or Doug, office in Brooklyn - the people to reach
   for anything deep.

## Decisions / outcomes

- Telegram group created on the call (Zaal, Matteo, Sam) - links for WaveWarZ,
  web3 radio, and Livepeer ecosystem shared there.
- Matteo cannot help hands-on (committed elsewhere) but is an open connector:
  "ping me on Telegram."
- Sam + Zaal to dig into web3 radio together; Sam owns the Harberger-ads thread
  interest-wise.

## Actions

| Owner | Action | Why | Done when |
|---|---|---|---|
| zaal | Deep-dive the web3 radio link with Sam | Committed on the call after admitting last week was too busy | Read + reaction in the TG group |
| samantha | Dig into Harberger ads material (Matteo sending Medium links when Cloudflare relents) | Her marketing thread since entering web3 | Notes back to the group |
| zaal | Explore Daydream / Daydream VST for WaveWarZ community creators | The community-plays-with-outputs idea - give creators the AI video toys | Tested once |
| Open | Musician trading cards x clips (Sam's idea): can a clip mint as an NFT with Livepeer on-chain event data attached | Matteo: Livepeer does not mint, but stream events are on-chain anchors - "match the truth" | Feasibility known |

## Key quotes

> "Using Livepeer just to show off that you're doing decentralized transcoding... might be just a gimmick." - Matteo

> "I bid by fixing a reselling price and I have to pay taxes on that reselling price... and I pay to the community. Or to the live streamer going on that moment." - Matteo, on Harberger ads

> "Whenever they figure out paid advertising on chain... it's definitely going to be a big one." - Sam

## Also See

- [Doc 2296](../2296-dylan-rizzle-clanker-v5-token-planning-aug4/) - the streamer-tools-on-Livepeer seed from two days earlier connects directly
- [Doc 1128](../../infrastructure/1128-znn-24-7-livepeer-channel/) - the ZNN Livepeer analysis; Daydream is new since it was written
- Memory: `project_matteo_tambussi_italy_bridge`

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Web3 radio deep-dive with Sam | @Zaal | Research | 2026-08-24 |
| Daydream test for WaveWarZ creators | @Zaal | Experiment | 2026-08-31 |
| Fold Daydream into the Livepeer agent-alpha evaluation already in the tracker | @Zaal + Claude | Research | 2026-08-24 |

## ZAO context

WaveWarZ streams via Restream today (all three team members share the account -
the exact multi-operator constraint Zaal named on the call as the reason OBS
alone does not work). Any Livepeer/Daydream adoption threads into the existing
Livepeer evaluation task (agent-alpha scouting) and doc 1128's ZNN analysis,
where the $0 YouTube-RTMP MVP was the standing decision.

## Sources

- [FULL] The recording: 22 min, transcribed + diarized locally. Preserved at `~/.zao/private/meetings/batch-aug17/`.
- Call-stated, UNVERIFIED against docs this run: Daydream + Daydream VST
  (livepeer.org is the entry point; daydream.live is the product site Matteo
  referenced), the web3 radio project, and Pensy (ETH community fund wiki).
- Background on Harberger taxes: Glen Weyl + Eric Posner, Radical Markets
  (radicalxchange.org is the living community). Named on the call; not fetched.
- Matteo's Medium articles on Pensy/Harberger ads: Cloudflare-blocked during
  the call; he is dropping links in the Telegram group - attach them here when
  they land rather than citing from memory.
