# COC Concertz #7 — WaveWarZ Takeover: Virtual Concert as ZAO IP

**Type:** DOC
**Date:** 2026-07-17 (show: 2026-07-18 4PM EST)
**Status:** Pre-show writeup — factual claims sourced from codebase only

---

## What COC Concertz Is

COC Concertz is ZAO's live virtual concert series running inside Spatial.io (venue: Dope
Stilo Music Club). Shows are free to attend; anyone in the world can walk in from a browser.
The series is co-produced by The ZAO and Community of Communities (CoC). Stream runs
simultaneously on Twitch (bettercallzaal). The seventh show is happening 2026-07-18.

This makes COC Concertz a tangible ZAO IP asset — a recurring cultural event series now
seven shows deep, with an on-chain archive model and an experiment in open vs gated access.

## COC #7 — The WaveWarZ Takeover

COC #7 (July 18, 2026, 4PM EST) is a WaveWarZ-themed show: DJ Zaal + WaveWarZ
battle-circuit artists performing live in the Spatial.io venue. The WaveWarZ on-chain music
battle platform is integrated directly into the site — visitors can vote on live battles
in real-time via the BattleVote widget during the show.

COC #7 is also a deliberate pilot: the wallet gate is being dropped for this show to
measure what open access does to attendance.

## The Archive Architecture

Every COC show produces a set of Arweave-archived content: fan gallery uploads, artist
photos, show recordings. The archive is implemented as a Next.js upload pipeline:

- **Upload route:** `/api/upload` — multipart FormData → Cloudinary → Arweave permanent
  storage via bundlr (UDL license set per upload: community-share / collectible / premium /
  open)
- **ZABAL wallet gate:** access to archived uploads requires holding ZABAL token on Base
  (contract address + min balance from env). Gate is checked client-side via
  `NEXT_PUBLIC_WALLET_GATE_ENABLED`
- **COC #7 pilot:** `NEXT_PUBLIC_WALLET_GATE_ENABLED=false` for this show — anyone can
  access the archive, no token required. This is a deliberate UX experiment

The license presets are defined in `concertz.config.ts`:
- `community-share`: no commercial use, derivatives OK, attribution required
- `collectible`: no commercial use, no derivatives, attribution required
- `premium`: commercial use OK, no derivatives, attribution required
- `open`: commercial use + derivatives OK, no attribution required

This gives ZAO fine-grained IP control over each uploaded asset, encoded on Arweave
permanently at upload time.

## COC #7 Metrics Capture

A pilot-specific metrics endpoint (`/api/metrics/coc7`) was added to capture:

- `concurrentViewers`: live concurrent viewer count
- `walletConnected` vs `walletNotConnected`: split of visitors by wallet state (shows
  whether having the wallet gate off actually changes who shows up)
- `archiveUploads`: count of archive uploads and storage volume
- `pilotStatus`: whether the pilot gate is active (`wallet_gate_enabled` flag)
- `battleVotes`: WaveWarZ battle interaction count during the show

These metrics are sourced from Supabase (archive_uploads table) and will feed a
Saturday post-show pilot report. The report will answer the core question: does
dropping the wallet gate for one show meaningfully change the audience?

## WaveWarZ Integration at COC #7

WaveWarZ (Solana-based music battle platform) is the central format of COC #7. The
integration adds:

- **BattleVote widget**: real-time voting on active battles; anonymous one-vote-per-session
  with a live PoolBar showing the split
- **Show-night control**: `npx tsx scripts/manage-battle.ts create|close|status` to open
  and close battles during the show
- **WaveWarZ history section**: baked snapshot of 1,000+ battles and 484+ SOL volume
  (data from wwtracker public analytics)

The goal: COC attendees become WaveWarZ participants — converting a passive concert
audience into active voters on the battle platform.

## Key Decisions Made for COC #7

**Drop the wallet gate.** The ZABAL wallet gate was the default. COC #7 turns it off
to maximize first-time attendance at a WaveWarZ-themed show. The gate can be re-enabled
per-show via a single Vercel env flip.

**Capture wallet-vs-gateless split.** Instead of just opening access and moving on, the
metrics endpoint captures whether users are wallet-connected even when the gate is off.
This gives future shows data to make the gating decision with.

**Archive upload FormData audit.** The archive upload was 100% broken before COC #7 (field
name mismatch between ArchiveUploader component and the `/api/upload` route). This was
caught and fixed in the COC #7 sprint. Lesson: audit FormData keys before every show.

**Live streaming link wired into the app.** COC #7 adds `streamLink` to the event Firestore
doc, enabling the LiveMode "Watch on Twitch" button to appear automatically when the show
is live, without needing a code deploy.

## North Star Alignment

COC Concertz directly advances both North Star claims:

1. **The ZAO = THE case study of a successful DAO.** Seven shows completed by a
   decentralized community running a virtual event series. COC is a repeatable cultural
   operation — proven format, proven tech stack, documented lessons. The COC #7 pilot
   (open access + metrics capture) is the kind of deliberate experimentation that
   distinguishes a case study from a one-off event.

2. **ZAO IP = a staple in onchain art, music and culture.** Every COC show produces
   Arweave-archived content with UDL licenses — permanent, on-chain, ZAO-controlled.
   COC #7 adds WaveWarZ on-chain battle voting directly inside the virtual venue. The
   IP isn't just stored; it's active during the show.

## Pre-Show Blockers (Zaal-gated)

For the record, two items were gated on Zaal's action before the show:

1. **Cloudinary key rotation**: CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET need to be
   updated in Vercel (key was revoked during the COC #7 sprint cycle)
2. **Wallet gate env flip**: `NEXT_PUBLIC_WALLET_GATE_ENABLED=false` must be set in Vercel
   and a redeploy triggered before 4PM EST July 18

Both are single Vercel env updates — ~5 min work.
