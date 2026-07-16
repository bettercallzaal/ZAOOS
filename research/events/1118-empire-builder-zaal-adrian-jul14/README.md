---
topic: events
type: incident-postmortem
status: research-complete
last-validated: 2026-07-15
related-docs: 988, 1063, 1098
original-query: "/meeting the just-chatting Jul 14 Restream (Zaal x Adrian / Empire Builder) - summarize and share to the Empire Builder team"
tier: STANDARD
---

# 1118 - Zaal x Adrian (Empire Builder) call - zaalcaster + creator coins

> **Goal:** Recap of the Jul 14 ZABAL Gamez Restream between Zaal and Adrian (DiviFlyy, Empire Builder) on building creator-coin infrastructure on Farcaster with Empire Builder + Clanker, starting with zaalcaster.

## Meeting

- **Date:** 2026-07-14
- **Duration:** ~34 min
- **Platform:** Restream livestream (ZABAL Gamez branded, public)
- **Attendees:** Zaal (BetterCallZaal), Adrian (DiviFlyy) - founder of Empire Builder. Jordan (Adrian's teammate) referenced throughout, not on the call.
- **Full transcript:** private (`~/.zao/private/empire-builder-zaal-adrian-jul14-transcript.txt`) - token-launch strategy kept off the public repo per the meeting-recap privacy pattern.

## Decisions / agreements

| # | Decision | Owner | Confidence |
|---|----------|-------|-----------|
| 1 | Launch model: split the token ~10 ways at launch via Clanker (multiple recipients set at start, changeable later through Clanker admin). A portion goes to an AI agent + a community fund from day one. | Zaal | high |
| 2 | First move: create the ZABAL Gamez empire soon (tokenless first - leaderboard + NFTs), zaalcaster as the leaderboard; token launched casually later, before the fractal. | Zaal | high |
| 3 | Adrian to send Zaal the private endpoint to attach a token to a tokenless empire (with API key). | Adrian | high |
| 4 | zaalcaster: swap password-gating for Farcaster sign-in (read-only for collaborators). Open-sourced; ~50% of the token earmarked for people forking + building on the platform. | Zaal | high |
| 5 | Run a Farcaster Space on Empire Builder x Clanker integrations - Zaal + Adrian + Jordan + a Farcaster intern, ~6pm EST, ~1 hr. Zaal messages the Farcaster account to find a time. | Both | high |
| 6 | Empire Builder to add multi-recipient split functionality (feature request - not in the UI today, easy to add). | Adrian | medium |

## Actions

| Action | Owner | Category | Due |
|--------|-------|----------|-----|
| Create the ZABAL Gamez empire (tokenless first, zaalcaster as leaderboard) | Zaal | Other | (soon, before fractal) |
| Swap zaalcaster password-gate for Farcaster sign-in (read-only) | Zaal | Site / Tech | |
| Message the Farcaster account to schedule the Space (~6pm EST) | Zaal | Ops | |
| Get Adrian's private endpoint + wire token-attach | Zaal / Adrian | Site / Tech | |
| Integrate WaveWarZ so its transactions feed the token treasury | Zaal | Site / Tech | |
| Add multi-recipient split to Empire Builder | Adrian | (Empire) | |

## Key threads

- **Channels going protocol-level is the central bet.** Farcaster is leaning back into channels. Idea: every channel gets its own empire - a snap that attaches an empire to a channel, then deploys the token. First $25 channel purchase is worth it.
- **The hold-vs-trade catch-22.** You need trading volume for income, but want to incentivize holding. Early buyers/whales dump and the token dies. Jordan is exploring the mechanics/models. Ideas floated: activity-decay airdrops (reward Farcaster-native/active users, cut the bottom ~50% by engagement score), flatter-curve / stable-style launches, and waiting on Clanker v5 for the droid + token functionality.
- **Droids.** Zaal wants zolbot to hold its own FID and self-fund from token distributions - spawning brand-specific agents plus one overall Farcaster voice. Blocker: droids don't hold the FID keys today; needs the Farcaster team + Clanker v5.
- **Empire Builder's biggest problem (Adrian's words):** "People land on it and they don't know what to do." UI/UX + an llms/how-it-works surface is the standing gap.
- **The trio Zaal wants to leverage:** point/points + QR + an agent in the middle, connecting bounty boards (nouns/nars forked the POIDH-style void contract) and rewarding community info to a self-funding agent.

## Key quotes

- Zaal: "I'm probably going to take like 50% of the token and use that specifically for the express purpose of people forking the platform and building things onto it - creating this open-source repo, build on top of all."
- Adrian: "You can split it 10 ways. We don't have the functionality in Empire right now but it's very easy to add if it's a feature request."
- Adrian: "People land on it and they don't know what to do. That's still probably our biggest problem."
- Zaal: "You need that trading volume in order to get income - so is there a way to incentivize holding and building while incentivizing trading, because that's where the income comes from."

## Research seeds

- Clanker v5 - liquidity model + droid/token functionality (waiting on ship).
- Clanker droids - giving FIDs to droids (Farcaster team dependency).
- The DEGEN moment - Zaal wants to study it for launch-timing patterns.
- Splits contract mechanics - mutable/immutable, multi-sig, Clanker admin recipient changes.
- Farcaster channels going protocol-level - a FIP Zaal wants to write.

## Next Actions

| Action | Owner | Type | By When | Shipped criteria |
|--------|-------|------|---------|-----------------|
| Share this recap with the Empire Builder team (Adrian + Jordan) | @Zaal | Outbound | 2026-07-15 | Recap posted in the group chat with Adrian + Jordan |
| Create the ZABAL Gamez empire (tokenless) + set zaalcaster as leaderboard | @Zaal | Build | 2026-07-22 | Empire live on Empire Builder; zaalcaster leaderboard wired |
| Message Farcaster account to schedule the Space | @Zaal | Outbound | 2026-07-18 | Space time confirmed with Adrian + Jordan + Farcaster intern |
| Wire Adrian's token-attach endpoint into zaalcaster | @Zaal | Build | 2026-07-25 | A token can be attached to a tokenless empire via the endpoint |

## Also See

- [Doc 988](../../business/988-zaalcaster-token-launch-plan/) - zaalcaster token launch plan.
- [Doc 1098](../../business/1098-sparkz-master-brief/) - Sparkz (the creator-coin product this feeds).
- [[project_adrian_empire_builder]] - Adrian / Empire Builder. [[project_jordan_oram]] - Jordan.

## External references (tools discussed)

- Clanker (token launch rail) - https://clanker.world
- Farcaster (channels going protocol-level, the FIP thread) - https://farcaster.xyz
- Empire Builder - Adrian's (DiviFlyy) launch platform on Clanker/Base; no public canonical URL captured on the call (add when confirmed).
- Splits (multi-recipient fee contracts) - https://splits.org
- POIDH / void bounty contract (referenced re: nouns/nars fork) - https://poidh.xyz

## Sources

- [FULL] Restream recording `just-chatting-Jul-14-2026-restream.mp4` (2026-07-14, ~34 min), transcribed locally (mlx-whisper). Raw transcript private at `~/.zao/private/`.
- Note: this is a MEETING RECAP, not a tool-research doc - the GitHub/grep.app reference-implementation checks in the research rubric are N/A here. The source is the recording; external tool links added above for the reader.
