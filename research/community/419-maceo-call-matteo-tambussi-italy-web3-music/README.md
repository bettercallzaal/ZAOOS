# 419 — Maceo Call: Matteo Tambussi + Italy Web3 Music Ecosystem

> **Status:** Research complete
> **Date:** 2026-04-17
> **Goal:** Evaluate Matteo Tambussi's projects (Web3 Radio Italy, GearSurfing, Pandemic 2026) and Livepeer integration opportunities surfaced in Maceo's intro call.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Matteo relationship | **ONBOARD as ZAO partner + advisor** — ex-pro musician (BBC 6 Music, opened for Nick Cave / Boy George / Blonde Redhead), OG Ethereum (Berlin 2018, livestream op for Livepeer at Devcon4 Prague + Dappcon 2018), founded ETHTurin 2020, co-organized SpaghettETH 2022. He is literally the Italian parallel to Zaal. |
| Livepeer upgrade | **MIGRATE ZAO OS Spaces streams onto Livepeer Studio Pay-As-You-Go** — already wired in `src/lib/livepeer/client.ts`; pricing is $0.33 / 60 min transcoding, $0.03 / 60 min delivery, $0.09 / 60 min storage. 80% cheaper than AWS IVS. Matteo can intro us to Livepeer core team for SPE grant co-applications. |
| Farcaster streaming | **BUILD a ZAO OS live-stream mini app using Streamplace + Livepeer** — Livepeer passed 15,000 LPT Harmonic SPE grant (2025-03-17) specifically to fund Farcaster + Base + Coinbase Wallet streaming. LiveCaster + Video Caster are precedent Farcaster frame apps. |
| web3radio.it | **CO-PROGRAM a ZAO weekly show on Matteo's Italian web radio** — decentralized Italian webradio he runs. Cross-promote ZAO artists to Italian audience. Confirm exact ownership with Matteo on follow-up call. |
| GearSurfing | **WAIT-AND-SEE** — Italian "musicians + venues + musical equipment" platform. Minimal public info. Ask Matteo what stage it's at before committing integration effort. Possible match for ZAO Stock vendor/gear sourcing (Wallace Events equivalent in Italy). |
| Pandemic 2026 | **ASK MATTEO for context** — linktr.ee/pandemic2026 is his personal hub page. Not a festival we can find. May be an umbrella personal brand or event concept. Zero public info returned. |
| Italy expansion path | **MAKE Matteo the ZAO Italy bridge** — he already has the network (SpaghettETH, ETHMilan speakers, MusicTech Germany with Rob Stupay at Ethereum Foundation). ETHMilan 2026 = 2,000+ attendees, 100+ speakers, May 21–22 Milan — target for ZAO first Italian presence. |

---

## Matteo Alessio Tambussi — Profile

| Dimension | Detail |
|-----------|--------|
| Origin | Turin → Berlin → back to Italy |
| Music career | 11 albums since 2000, BBC 6 Music radio plays, European tours, opened for Nick Cave / Boy George / Blonde Redhead |
| Ethereum start | Berlin 2018 — livestream operator for **Livepeer** |
| Events run | Devcon4 Prague 2018, Dappcon Berlin 2018, **ETHTurin 2020** (first Italian ETH hackathon, ESG focus), **SpaghettETH 2022** (first official Italian ETH conference + hackathon) |
| Co-host | "Hi-Fi & DeFi" podcast w/ Oliver Dawson — web3 music |
| Workshop | MusicTech Germany "Music on the Blockchain" w/ Rob Stupay (Ethereum Foundation) |
| Speaker | Most Wanted: Music Berlin, Athens Music Week, Blockchain Forum Italia |
| Company | Audiowallet Ltd (F6S profile) |
| Network node | Hubs Network |
| ZAO parallel | Ex-musician → web3 music community builder. Same archetype as Zaal. |

---

## Livepeer 2026 — What's Relevant

### Pricing (Livepeer Studio)

| Tier | Min spend | Transcode | Storage | Delivery | Viewers |
|------|-----------|-----------|---------|----------|---------|
| Free Sandbox | $0 | 1,000 min/mo | 60 min/mo | 5,000 min/mo | 30 concurrent |
| Pay-As-You-Go | $100/mo | $0.33 / 60 min | $0.09 / 60 min | $0.03 / 60 min | 50,000 concurrent |
| Enterprise | $2,500/mo + annual | custom | custom | custom | unlimited (15%+ volume discount) |

### 2026 Feature Set
- **Daydream** — real-time camera-to-AI video (prompt-driven)
- **Streamplace** — full-stack video layer with **native Farcaster integration**
- **Embody** — real-time AI avatars
- **Live Video Intelligence** — real-time broadcast analysis
- **Sub-second latency** transcoding with adaptive bitrate
- **Harmonic SPE** — 15,000 LPT treasury grant (Mar 2025) for Livepeer ↔ Farcaster / Base / Coinbase Wallet integration

### Current ZAO OS Livepeer Footprint (already built)
- `src/lib/livepeer/client.ts` — stream + clip helpers
- `src/app/api/livepeer/stream/route.ts` — stream create/list
- `src/app/api/livepeer/stream/[id]/route.ts` — stream status/delete
- `src/app/api/livepeer/clip/route.ts` — clip creation
- `src/app/api/broadcast/targets/route.ts` — multi-platform RTMP targets
- `src/lib/spaces/rtmpManager.ts` — Spaces RTMP management
- `src/lib/broadcast/targetsDb.ts` — broadcast target storage
- `src/lib/publish/broadcast.ts` — cross-platform publish
- `src/middleware.ts` — Livepeer webhook CORS

**ZAO OS is already on Livepeer.** The value of the Matteo intro is relationship-depth + SPE grant access + Farcaster streaming mini app co-build.

---

## Comparison — Web Radio / Streaming Platforms

| Platform | Chain | Model | Italian presence | Fits ZAO how |
|----------|-------|-------|------------------|--------------|
| **web3radio.it** (Matteo) | Ethereum-aligned | Decentralized webradio, Italian audience | Native Italian | Cross-program ZAO artists, Italy distribution |
| **Web3 Radio** (@0xkotaromiyabi) | TBD | NFT membership passes, smart-contract royalty, "Royalty Open Vault", dynamic-NFT albums | No | Product-spec reference for FISHBOWLZ/COC Concertz — not a partner |
| **Rug Radio** | Ethereum | $RUG token, RugDAO, celebrity-driven (Farokh) | No | Competitor archetype |
| **Parrot Radio** (Pandemonium) | Ethereum | NFT community radio | No | Competitor archetype |
| **SIAE × Algorand** | Algorand | 4M NFTs for 95,000 Italian author rights | Italy institutional | Rights layer reference, not partner |
| **Livepeer Studio** (infra) | Livepeer (LPT) | Video infra, not a radio | Global | Infra powering our streams |

---

## Comparison — Farcaster Live-Stream Mini App Options

| Option | Lift (1–10) | Build path |
|--------|-------------|------------|
| **Streamplace SDK** | 4 | Native Farcaster integration already shipped. Drop-in for ZAO Spaces. |
| **Livepeer Studio + Frame SDK** | 6 | Use existing `src/lib/livepeer/client.ts`. Wrap playback in a Farcaster Mini App frame. |
| **LiveCaster fork** | 5 | Open-source Farcaster frame precedent (ETHGlobal). |
| **Custom WebRTC** | 9 | Reinvent — skip. |

---

## Maceo / ZAO Follow-Up Plan

1. **Intro call with Matteo** — confirm scope of web3radio.it, GearSurfing, Pandemic 2026. Ask which is live, which is concept.
2. **Livepeer SPE grant co-app** — Matteo can intro ZAO to Livepeer core. ZAO OS + Streamplace + Farcaster Mini App = credible Harmonic SPE follow-on use case.
3. **Italian weekly show** — ZAO artist spotlight on Matteo's Italian webradio. First 4 episodes: ZABAL top artists.
4. **ETHMilan 2026 (May 21–22)** — ZAO side-event or speaker slot. Matteo can sponsor intro.
5. **GearSurfing integration probe** — only after Matteo confirms platform state. Possible ZAO Stock Italian gear sourcing tie-in.

---

## ZAO Ecosystem Integration

- **ZAO OS Spaces** (`src/app/api/livepeer/*`, `src/lib/spaces/rtmpManager.ts`): already Livepeer-powered. Matteo unlocks grant access + optimization.
- **COC Concertz**: cross-program with Italian web3 radio audience. Virtual concert promoters now have a distribution partner in Italy.
- **FISHBOWLZ successor** (partnered w/ Juke per project_fishbowlz_deprecated): Streamplace-style audio-first Farcaster native integration is the right reference architecture.
- **ZAO Stock 2026-10-03**: GearSurfing could source Italian sound/stage gear if ZAO Stock ever expands internationally — not a 2026 need.
- **Community directory** (`research/community/110-community-directory-crm/`): add Matteo as ZAO Italy bridge + advisor candidate.
- **Partner ecosystem** (`research/community/065-zabal-partner-ecosystem/`): add web3radio.it as distribution partner once scope confirmed.

---

## Open Questions for Matteo (next call)

1. Is web3radio.it live + audience size?
2. GearSurfing — stage? users? tech stack? revenue?
3. Pandemic 2026 — what is it? event, brand, concept?
4. Current Livepeer relationship depth — who at Livepeer can he intro to for SPE?
5. Is he open to a ZAO Italy partner role (retainer / Respect / equity-like)?
6. ETHMilan 2026 speaking/side-event coordination?
7. Interest in co-hosting a ZAO × "Hi-Fi & DeFi" episode?

---

## Sources

- [Blockchain Forum Italia — Matteo Tambussi profile](https://www.blockchainforumitalia.com/en/matteo-tambussi/)
- [Most Wanted: Music Berlin — Matteo speaker page](https://mwm-berlin.de/speaker/matteo-alessio-tambussi/)
- [Athens Music Week — Matteo speaker page](https://www.athensmusicweek.gr/speakers/matteo-tambussi/)
- [Matteo Tambussi on Bandcamp (music catalog)](https://matteotambussi.bandcamp.com/)
- [Matteo Tambussi on Spotify](https://open.spotify.com/artist/6FABMAInCLqiYpazFhoKDs)
- [Livepeer Studio pricing page](https://livepeer.studio/pricing)
- [Livepeer Harmonic SPE Farcaster + Base + Coinbase Wallet proposal](https://forum.livepeer.org/t/web3-social-video-spe-pre-proposal-connecting-livepeer-to-farcaster-base-and-coinbase-wallet/2786)
- [Streamplace — decentralized social video backbone](https://blog.livepeer.org/livepeer-onchain-builders-streamplace-building-the-video-backbone-of-decentralized-social/)
- [LiveCaster — Farcaster + Livepeer frame (ETHGlobal)](https://ethglobal.com/showcase/livecaster-6a5go)
- [Web3 Radio (Futuloka, separate project for reference)](https://paragraph.com/@futuloka/web3-radio-a-decentralized-audio-ecosystem-for-the-new-era)
- [MusicTech Germany — "Music on the Blockchain" workshop (Tambussi × Stupay)](https://www.music-tech.de/en/workshop-music-on-the-blockchain/)
- [ETHMilan 2026](https://www.ethmilan.xyz/)
- [Links from the call: gearsurfing.xyz](https://gearsurfing.xyz/), [linktr.ee/pandemic2026](https://linktr.ee/pandemic2026), [livepeer.org](https://livepeer.org/), [web3radio.it](https://web3radio.it/), [x.com/matteotambussi](https://x.com/matteotambussi)
