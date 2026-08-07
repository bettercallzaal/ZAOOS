---
topic: identity
type: audit
status: research-complete
last-validated: 2026-08-07
related-docs: "2218, 891"
original-query: "Dig into farcascout, find people Zaal is NOT following posting great tips/tricks/alpha on Farcaster about social media, Farcaster, artists, AI, blockchain, builder etc."
tier: STANDARD
---

# 2224 - Farcaster High-Signal Discovery (batch 1, grounded via the graph)

> **Goal:** Accounts @zaal (FID 19640) does NOT follow that many of his follows DO
> - the friends-of-friends signal - every one a REAL FID pulled from the live graph
> via Haatz, with a verified recent cast. No invented handles.

## Method (grounded, keyless)

Fetched @zaal's follow set from Haatz (~2,880 follows), sampled 14 of them, tallied
who THEY follow, and surfaced accounts followed by >=4 of the sample that @zaal does
NOT follow. Each candidate's username + a recent cast were then verified via Haatz
(`userDataByFid` + `castsByFid`). This is popularity-in-Zaal's-network, not
topic-targeted - see the honest caveat below.

## The list (verified: real FID + recent cast, @zaal does not follow)

| Handle | FID | Who | Overlap | Why follow |
|--------|-----|-----|---------|------------|
| @tim | 207 | timbeiko.eth | 8/14 | Ethereum core-dev signal (protocol/builder) |
| @jackson | 106 | Jackson Dahl | 7/14 | /dialectic - going full-time (product/creator thinking); high-signal essays |
| @0xstark.eth | 368 | Josh Stark | 7/14 | Ethereum leadership; ecosystem/builder alpha |
| @vm | 325 | Victor Ma | 7/14 | Farcaster builder |
| @brenner | 60 | Brenner | 6/14 | posting sharp takes on **openclaw agents** + bot/human labeling - directly on-topic (AI agents) |
| @proxystudio | 270504 | omw | 7/14 | builder chatter ("craig is hiring") - practical scene signal |
| @sriramk.eth | 43 | Sriram Krishnan | 6/14 | AI/crypto investor-builder |
| @zoink | 62 | Dylan Field | 6/14 | Figma founder; design/AI |
| @antonio | 53 | agm.eth | 6/14 | Farcaster builder |
| @cdixon.eth | 25 | Chris Dixon | 7/14 | a16z crypto (macro, less tactical) |
| @pmarca | 51 | Marc Andreessen | 7/14 | a16z (macro/hype - lowest tactical value) |
| @libovness | 6 | libovness | 6/14 | early Farcaster; culture signal |

## Honest caveat (and the next pass)

This method surfaces the **most-followed** accounts in Zaal's network, which skews
toward big names (Andreessen, Dixon) he probably already knows - NOT the smaller,
tactical accounts that post the practical tips/tricks/alpha he asked for. The
best-fit rows are the **builder/agent-tactical** ones: @brenner (AI agents), @jackson
(/dialectic), @0xstark + @tim (Ethereum builder), @proxystudio (scene). The next
batch should be TOPIC-targeted (mine casts about AI-agents / artists / social-media
alpha and surface their authors), which is what the ZAOscout/farscout scout does best
once its **NEYNAR_API_KEY is wired** (keyless Haatz can't easily search by topic -
project_zaoscout_repo). Until then, friends-of-friends is the honest keyless proxy.

## Next Actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Skim the list; follow the builder/agent-tactical rows (@brenner, @jackson, @0xstark, @tim, @proxystudio) | Zaal | decision | 2026-08-08 |
| Wire NEYNAR_API_KEY into ZAOscout so the next batch is TOPIC-targeted (AI/artists/social alpha), not popularity | Zaal | gated | 2026-08-13 |
| Overnight loop: run batch 2 (topic-targeted) once the scout has the key | Claude (loop) | PR | after key |

## Sources
- Haatz Snapchain mirror (`haatz.quilibrium.com`, keyless hub API) - @zaal follows + each candidate's userData + recent cast, fetched 2026-08-07 [FULL, real graph].
- [[project_farcaster_fetch_haatz]], [[project_zaoscout_repo]] (the scout that does topic-targeting with a Neynar key), doc 891 (Saltorius bootcamp).
