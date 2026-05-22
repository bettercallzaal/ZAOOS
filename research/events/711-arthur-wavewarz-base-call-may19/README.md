---
topic: events
type: meeting-recap
status: research-complete
last-validated: 2026-05-22
related-docs: "701"
tier: STANDARD
---

# 711 - Arthur intro call: WaveWarZ Base agentic version

> **Goal:** Lock in action items + decisions from the 2026-05-19 video call between Zaal, Sam (Samantha / candytoybox), and Arthur (Neynar) covering the ZAO incubator model, the agentic WaveWarZ build on Base, and Arthur joining as a smart-contract collaborator + ZABAL Games mentor.

## Key Decisions

| # | Decision | Owner | Status |
|---|----------|-------|--------|
| 1 | **Zaal sends Arthur the Base WaveWarZ repo** to kick off the collaboration and "start locking that in" | Zaal | TODO |
| 2 | **Zaal creates a Farcaster group chat** - Zaal + Sam + Arthur, then adds Hurric4n3ike so he is pulled onto Farcaster | Zaal | TODO |
| 3 | **Arthur reviews the Base WaveWarZ smart contracts** and gives pointers + security suggestions | Arthur | TODO |
| 4 | **Arthur sends agent-security reference resources** - good repositories with security references for pointing AI agents at | Arthur | TODO |

## Thread 1 - The ZAO incubator + WaveWarZ context

### The Idea

Zaal gave Arthur the background: The ZAO ("the z talent artist organization") is a progressively-decentralized incubator for on-chain music projects, governed by soulbound, illiquid Respect tokens earned weekly through fractal meetings (groups of six reach consensus on contribution, distributed on a Fibonacci curve). The first project incubated out of The ZAO is WaveWarZ - live-traded music battles, founded by Hurric4n3ike with Zaal and Sam. It runs on Solana: 1% of trade volume routes immediately to the artist, the losing side's pool partly feeds the winning side, settled on-chain via smart contract (no custody). To date WaveWarZ has run roughly 456 SOL of volume, producing about $650 / 7.74 SOL in fees (figures garbled in transcript - see Verify / Low-confidence below). WaveWarZ runs 11 shows a week: five morning + five night Mon-Fri, plus Sunday-night battles.

### Why It Matters

This is Arthur's onboarding context - he is new to the ZAO/WaveWarZ orbit. It also frames why the Base build matters: WaveWarZ is The ZAO's revenue driver and the proof case for the incubator model.

## Thread 2 - Agentic WaveWarZ on Base (the core ask)

### The Idea

Sam has started a Base version of WaveWarZ, prompted by the rise of agent payments (x402). The concept: an agentic WaveWarZ where AI agents generate their own music, battle it, and trade on it - settled in a neutral asset (SOL / ETH / USDC) rather than a project token, so it becomes "employment for agents". Zaal's extension: each human trader also runs a paired agent in the agentic version, learning trading strategies (early-buy on the bonding curve, top-selling, end-of-battle sniping) and surfacing them. Sam has two smart contracts on testnet already. The economic hook: a battle costs a roughly fixed program fee, the margin is high, and a pre-funded agent could run an "infinite loop" of battles - any artist (or an agent acting for a musician) entering a song earns the 1% artist cut during the 10-minute battle.

### Decisions Pending

- Whether each trader gets a paired learning agent (Zaal's idea) vs purely autonomous agents (Sam's framing) - not resolved on the call.
- The smart contracts are on testnet but "need to be flushed out by someone who knows what they're doing" - which is the explicit reason for bringing Arthur in.

### Next Step

Zaal sends Arthur the repo; Arthur reviews the contracts and points the team at security references. Arthur flagged the key need plainly: "knowing what resources to point the agents at" plus "great repositories that have security references".

## Thread 3 - Maine event, ZABAL Games, Arthur as mentor

### The Idea

Zaal walked through ZAO Festivals (ZAO-PALOOZA at NFT NYC 2024, ZAO-CHELLA at Art Basel) and the 2026 plan: an October 3 music event in down east Maine near Acadia, tied to a local art event, with two non-negotiables - come in under budget, and have a live stream. Arthur signed up to mentor for ZABAL Games. Arthur cannot attend the Maine event (it is the day after his daughter's first birthday) but offered to participate virtually and help where he can - noting he is "better with EVM than Solana", which fits the Base build.

### Why It Matters

Arthur is a multi-surface collaborator now: WaveWarZ Base smart contracts + ZABAL Games mentorship + virtual event participation.

## Action Items

| # | Action | Owner | Category | Due |
|---|--------|-------|----------|-----|
| 1 | Send Arthur the Base WaveWarZ repo | Zaal | WaveWarZ | TBD |
| 2 | Create a Farcaster group chat (Zaal, Sam, Arthur, then add Hurric4n3ike) | Zaal | WaveWarZ | TBD |
| 3 | Review the Base WaveWarZ smart contracts, give pointers + security suggestions | Arthur | WaveWarZ | TBD |
| 4 | Send agent-security reference resources / repos for pointing AI agents at | Arthur | WaveWarZ | TBD |
| 5 | Check out "like.fun" on Farcaster for UX influence (similar play loop) | Zaal | WaveWarZ | TBD |
| 6 | Join a WaveWarZ event - Good Boy Music AI-artist tournament, first battle Sun 2026-05-31 7pm ET (open invite, not firm) | Arthur | WaveWarZ | 2026-05-31 |

## Key Quotes

> "You show up and you do work and then you get a voting stake - I think that works better almost every time versus buying a share and being able to vote." - Arthur, on soulbound governance

> "The ones that are not making good music and are not winning these battles should kind of die off, and then the ones that are doing well will be able to pay for their own inference." - Arthur, on agent musicians

> "I have two non-negotiables for the event - come in under budget, and have a live stream." - Zaal, on the October Maine event

> "We always had this thesis with Giveth that the biggest impact you can make is to local communities that you're embedded in." - Arthur

> "Going super hard on Farcaster - it's the right place in web3 that I've landed to find what I need to build out here." - Zaal

## Verify / Low-confidence

Items that need a human check before being treated as fact:

- **WaveWarZ stats numbers** - the transcript span "456 SOL volume / $650 / 7.74 SOL in fees" is garbled; Whisper likely mis-segmented the figures. Confirm the real volume + fee totals against the WaveWarZ stats app before quoting.
- **Action 6 (Arthur joins a WaveWarZ event)** - an open invitation, not a firm commitment. Arthur said he would try to drop in; do not treat as owed.
- **Arthur's name/handle** - on-screen name tag read "Art L"; the transcript has a garbled aside ("topo / tophat / Kevin") where Zaal stumbled on a name. "Arthur" is taken from the recording filename. Confirm his preferred handle.

## Research Seeds

- **like.fun on Farcaster** - prediction/betting markets on likes for short-form content; Arthur flagged its gamified play loop as a UX reference for WaveWarZ.
- **Agentic WaveWarZ on Base + x402** - AI agents generating, battling, and trading music; agent-payment rails as the economic primitive.
- **AI-agent-musician economy** - agents that pay for their own inference by winning battles; "stable" of agent musicians where weak ones die off.
- **WaveWarZ Africa** - an Africa-based team approached WaveWarZ about using the tech to run an on-chain battle league per country. Mentioned in passing; worth its own scoping doc.

## Memory Updates

Files written to `~/.claude/projects/.../memory/`:

- `project_arthur_neynar.md` - new: Arthur (Neynar), smart-contract dev + ZABAL Games mentor, helping the WaveWarZ Base agentic build.

## Also See

- [Doc 701 - ZABAL Games canonical state](../701-zabal-games-canonical-state/) - the build-a-thon Arthur signed up to mentor for
- [[project_candytoybox_samantha]] - Sam = Samantha = candytoybox, WaveWarZ cofounder
- [[project_hurric4n3ike]] - Hurric4n3ike, WaveWarZ founder + lead dev
- [[project_zabal_games]] - ZABAL Games build-a-thon

## Distribution Log

- actions.json: HELD - 6 items prepared; tracker brand-label schema being redesigned (see PR / chat note)
- Bonfire episodes: built (11 episodes - summary + 4 decisions + 6 actions) but skipped at run time - `BONFIRE_API_KEY` / `BONFIRE_ID` not set in env. Re-run `scripts/bonfire-episode.sh /tmp/meeting-bonfire-episodes.json` once the key is present.
- Telegram: block printed in session
- Calendar: skipped (not selected)
- Memory writes: 1 entry (project_arthur_neynar)

## Transcript

Full transcript: [transcript.md](transcript.md)
