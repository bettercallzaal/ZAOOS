---
topic: zabal, music, wavewarz
type: how-to-guide
status: ACTIVE — distribute to Track A participants at Week 7 (Oct 13 session). ZOE records milestone when artist submits Sound.xyz/Zora link + Farcaster cast URL. Supplements curriculum doc 1626 which says Week 7 = "plan your first on-chain release."
last-validated: 2026-07-18
related-docs: 1626-zabal-s2-curriculum-spec, 1588-zabal-s2-curriculum-week-by-week, 1567-zabal-s2-participant-tracker-spec, 1622-zao-music-cipher-release-plan, 1677-zabal-s2-zoe-weekly-ops-guide
action-owner: Track A participants (submit release by Week 10); ZOE (record milestone + verify link); Zaal (confirm if artist wants ZAO Music DBA umbrella)
---

# 1696 — ZABAL S2 Track A: On-Chain Release Completion Guide

> **What this is:** The step-by-step guide for ZABAL S2 Track A (Musician) participants to complete their on-chain release requirement. Track A participants must complete an on-chain release by Week 10 (Nov 2). This doc tells them what counts, what the minimum is, and what the full path looks like. ZOE uses Section 4 to verify and record the milestone.
>
> **Who this is for:** ZABAL S2 Track A participants. Not a guide for ZAO Music DBA releases (see doc 1622 for Cipher). This is a self-release — the artist releases their own track on-chain, through their own wallet.
>
> **What counts as "on-chain release":** A track minted on Sound.xyz OR Zora, publicly accessible, with the artist's wallet as the creator. Streaming distribution (Spotify, Apple Music) is optional — the on-chain mint is the requirement.

---

## What "On-Chain Release" Means in ZABAL S2

For Track A graduation, you need **one on-chain release.** Here's what that means:

1. **A track you own** — an original recording, not a cover (copyright matters)
2. **Minted on-chain** — as a Sound.xyz track or a Zora edition on Base
3. **Publicly accessible** — the mint page or Sound.xyz track page is a URL you can share
4. **Linked to your wallet** — your artist wallet is the creator (not Zaal's, not ZAO's)

What counts as completion: you share the Sound.xyz or Zora link in the ZABAL S2 Telegram group. ZOE records it as your `on_chain_release` milestone in Supabase.

Optional upgrades (not required for graduation):
- DistroKid distribution to Spotify/Apple Music (adds ~$20/year, not required)
- Farcaster frame cast (ZOE will help with this — announced to /wavewarz and /zabal)
- 0xSplits integration if you want automatic on-chain royalty splits
- WaveWarZ battle on release day (doc 1622 pattern — "battle as release event")

---

## Minimum Path: Sound.xyz (Recommended)

Sound.xyz on Base is the simplest on-chain release for artists in the ZAO ecosystem. Zora is also accepted. Both use Base (low gas fees, fast settlement).

### Step 1: Prepare your track

- Audio file: MP3 or WAV, 320kbps minimum, ≤10 minutes
- Cover art: 3000×3000px PNG/JPG (minimum 500×500)
- Track title, artist name, genre tags
- Optional: lyrics, credits

You need ONE track. This can be a single, an EP track, or even a 60-second loop. The on-chain release requirement is about demonstrating that you can put your music on-chain — not about length or production value.

### Step 2: Set up your wallet

If you don't have a Phantom or Coinbase wallet on Base:
- Coinbase Wallet (mobile or browser) is simplest for Base
- Or Phantom (works on Base as of 2026)
- You need a small amount of ETH on Base for gas (~$0.50-2.00 typical for minting on Sound.xyz)

To get ETH on Base: use Coinbase (buy ETH, then "Send to Base" or bridge directly). If you're stuck on this step, DM @bettercallzaal.

### Step 3: Create your Sound.xyz release

1. Go to sound.xyz
2. Connect your wallet
3. Click "Create" → "Release"
4. Upload your audio file and cover art
5. Fill in: title, description, genre, credits
6. Choose edition type:
   - **Free edition** (recommended for first release): no cost for collectors to mint; you still earn from secondary sales
   - **Paid edition** ($1-10 suggested): collectors pay to mint; you earn directly
7. Set your royalty split if you have collaborators (or leave 100% to yourself)
8. Click "Mint" — pay the small Base gas fee (~$0.50-2.00)
9. Your track is live. Copy the URL: it looks like `sound.xyz/[handle]/[track-name]`

### Step 4: Submit to ZOE

Post in the ZABAL S2 Telegram group:
```
@zaoclaw_bot milestone: [your-farcaster-handle] zaoos_release [your-sound.xyz-URL]
```

ZOE records this in the `zabal_s2_milestones` table as type `on_chain_release`. You're done.

---

## Recommended Upgrade: Farcaster Announcement Cast

After minting, post to Farcaster with the Sound.xyz link. Sound.xyz releases have automatic Farcaster frame support — anyone who sees the cast can play a preview and mint from within Farcaster.

ZOE will boost your release cast to /wavewarz and /zabal. This is how you build a collector base.

**Cast template:**
```
My first on-chain release is live.

[Track name] — [one line on what the track is about]

Mint: [Sound.xyz link]

Built as a ZABAL S2 Track A participant.
/zabal /wavewarz
```

Share this cast URL with ZOE:
```
@zaoclaw_bot milestone: [your-handle] zaoos_release_cast [farcaster-cast-URL]
```

---

## Alternative Path: Zora Edition

If you prefer Zora over Sound.xyz, the process is similar:

1. Go to zora.co
2. Connect wallet (Base network)
3. Click "Create" → upload audio + cover art
4. Set as "Edition" (ERC-1155 — allows multiple mints)
5. Set mint price (can be free) and edition size (open or fixed)
6. Deploy — pay small gas fee
7. Share the Zora URL with ZOE via the same `@zaoclaw_bot milestone` command

---

## Optional Full Path: ZAO Music DBA Umbrella

If you want your release to be distributed to Spotify and Apple Music AND be listed under ZAO Music, you can request inclusion under the ZAO Music DBA (BCZ Strategies LLC):

- Zaal confirms you're eligible (currently limited to active ZAO community artists in good standing)
- ZAO Music uses DistroKid for streaming distribution — setup takes ~1 week
- 0xSplits revenue split contract is deployed: you keep 70%, 20% to ZAO treasury, 10% to ZOR holders (see doc 1622 for full model)
- You earn streaming royalties on-chain, distributed via 0xSplits

**To request ZAO Music DBA umbrella:** DM @bettercallzaal after completing your Sound.xyz/Zora release. The DBA umbrella is offered to artists who ship first — don't wait for permission to mint on-chain. Release now, and we can add DistroKid distribution after.

---

## For WaveWarZ Artists: Battle as Release Event

The highest-impact version of your on-chain release combines the release with a WaveWarZ battle on the same day. This is the "battle as release event" pattern from doc 1622:

1. Schedule your WaveWarZ MAIN battle for the day of your release
2. Mint your track on Sound.xyz morning of the battle
3. Include your Sound.xyz link in your battle post
4. ZOE posts: "[Artist] is fighting AND releasing today. Both on-chain."
5. The loser-earns payout from the battle becomes linked to your release day earnings

This pattern turns a regular WaveWarZ battle into a press moment. Your release and your battle result are reported together.

If you want to do this for your ZABAL S2 release, coordinate with Hurricane (WaveWarZ operator) at least 2 weeks in advance. Let Zaal know so ZOE can prepare the announcement cast.

---

## Timeline for ZABAL S2 Track A

| Week | Date | Task |
|------|------|------|
| Week 7 (Oct 13) | Curriculum session: on-chain release planning | Choose your track, set up wallet + Sound.xyz account |
| Week 8 (Oct 20) | Independent work week | Prepare audio + cover art, test mint on testnet (optional) |
| Week 9 (Oct 27) | Independent work week | MINT your track. Submit to ZOE via Telegram. |
| Week 10 (Nov 2) | DEADLINE — on-chain release due | ZOE records milestone; if not submitted, ZOE sends Zaal alert |
| Week 11 (Nov 9) | Portfolio review | Zaal reviews your release link as part of portfolio assessment |

**Hard deadline: Nov 2 (Week 10 session day).** Releases submitted after Nov 2 do not count toward Tier 1 graduation criteria.

---

## ZOE's Verification Checklist (Section 4)

When ZOE receives `@zaoclaw_bot milestone: [handle] zaoos_release [url]`, ZOE:

1. Checks that the URL is a valid sound.xyz or zora.co link (not a Spotify/Apple Music link — those don't count)
2. Confirms the URL is publicly accessible (HTTP 200)
3. Does NOT verify audio quality or whether the track is "good" — only that a link exists
4. Records to `zabal_s2_milestones`:
   ```sql
   INSERT INTO zabal_s2_milestones (participant_id, type, evidence_url, milestone_date)
   VALUES ([id], 'on_chain_release', '[url]', NOW())
   ```
5. Replies in Telegram: "✓ [handle] — on-chain release milestone recorded. [Short URL]. Counts toward graduation."

If the URL is not sound.xyz or zora: ZOE replies "That link doesn't look like a Sound.xyz or Zora release. Share your Sound.xyz or Zora mint page URL."

---

## FAQ

**I don't have any original tracks. What do I do?**

You have until Week 9 (Oct 27) to create one. Even a 60-second original beat or vocal loop counts. The requirement is that YOU created it (not a cover or remix of someone else's copyrighted work). A 1-minute original beat on Sound.xyz is a valid on-chain release.

**Can I release a track I already released on Spotify?**

Yes — but you need to also mint it on Sound.xyz or Zora. The Spotify listing alone doesn't count. You need the on-chain mint.

**What if I already have a Sound.xyz or Zora release from before ZABAL S2?**

If it was released before Aug 22 (ZABAL S2 acceptance date), it does NOT count — you need a release during S2 to show you're actively releasing on-chain. If it was released after Aug 22, submit it.

**Do I need money for this?**

You need a small amount of ETH on Base (~$1-2) for gas fees. If you can't get this, DM @bettercallzaal — ZAO can cover gas for participants who need it (this is a grant, not a loan).

**I want to release with another ZABAL S2 artist. Does a collab count?**

Yes. Both artists can claim the milestone for the same release. Submit the same URL for both handles via `@zaoclaw_bot milestone`.

---

## Sources

- `research/zabal/1626-zabal-s2-curriculum-spec/` — Track A graduation criteria (source of requirement)
- `research/zabal/1588-zabal-s2-curriculum-week-by-week/` — Week 7 "on-chain release planning" session
- `research/zabal/1567-zabal-s2-participant-tracker-spec/` — Supabase schema (zabal_s2_milestones table)
- `research/music/1622-zao-music-cipher-release-plan/` — full ZAO Music DBA release architecture (full path, DistroKid + 0xSplits)
- `research/technology/1644-wavewarz-battle-settlement-mechanics/` — battle payout mechanics (for battle-as-release-event pattern)
