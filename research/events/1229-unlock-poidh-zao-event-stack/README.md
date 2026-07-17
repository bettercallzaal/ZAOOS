---
topic: events
type: design-spec
status: design-complete
last-validated: 2026-07-17
related-docs: 863 (Unlock Protocol research), 625 (POIDH playbook), 626 (POIDH ZABAL airdrop), 994 (ZABAL x POIDH fireside with Kenny Jul 8), 814 (Dcoop/Zaoville), 547 (ZAOstock strategy), 1228 (ZAOville Jul 25 runbook)
original-query: "Propose the full ZAO event stack combining Unlock Protocol NFT ticketing + POIDH bounty engagement. Redo from board task c9edbd9b (prior write did not persist)."
---

# 1229 — ZAO Event Stack: Unlock Protocol + POIDH Bounty Integration

> **Purpose:** Specify how The ZAO runs every event — from RSVP to NFT ticket to post-event bounty — using Unlock Protocol as the ticketing rail and POIDH as the engagement and proof layer. This replaces the current Supabase-email-only RSVP flow and the ad-hoc bounty setup per event.

---

## TL;DR

| Layer | Tool | What it does |
|---|---|---|
| **Ticket / RSVP** | Unlock Protocol (events.unlock-protocol.com) | One lock per event, NFT ticket = proof of attendance, QR check-in |
| **Engagement bounties** | POIDH (poidh.xyz, album: /a/thezao) | Pre-event hype, during-event photos/clips, post-event recaps |
| **Chain** | Base | Both tools deployed on Base; same wallets as ZAO membership gate (188 members) |
| **Who creates** | Zaal (both tools require EOA org wallet) | No code; Unlock = hosted form; POIDH = Warpcast frame |

---

## Event Stack by Phase

### Phase 0 — T-14 days: Create + Promote

**Unlock (ticketing):**
1. Go to `events.unlock-protocol.com` → Create Event.
2. Network = **Base**, price = **$0 (free)** for community events / RSVP approval on.
3. Configure metadata fields: name, email, optional Discord handle.
4. Copy the generated event landing page URL → post to /zao channel + ZAO Telegram.
5. Enable "attendee screening" → applicants submit form → Zaal approves in the dashboard → QR ticket auto-emailed.

**POIDH (pre-event hype bounty):**
- Post a Tier B bounty (0.015 ETH on Base) to `/poidh` + `/zao`:
  > "Show us your hype for [Event Name]! Post a photo, clip, or meme of you getting ready. Proof = best wins."
- Deadline = event day.
- NFT naming: `[Event] Pre-Hype #001`.

### Phase 1 — Day-of: Check In + Capture

**Unlock:**
- QR check-in: any phone camera scans the ticket QR → Unlock dashboard shows valid/invalid.
- Export CSV at end of night: names + emails → import to Supabase `event_rsvps` as backup (keep email mirror per doc 863 recommendation).

**POIDH (during-event capture bounty):**
- Post a second Tier B or C bounty (0.02–0.05 ETH) LIVE at the start of the event:
  > "Proof of [Event]! Best photo/clip from tonight wins. Must be timestamped at the venue."
- Deadline = next morning (18h).
- This creates a permanent onchain record of the event with community-sourced visual proof.

### Phase 2 — T+48h: Post-Event Recap

**POIDH (recap bounty):**
- Post a Tier C bounty (0.03–0.1 ETH):
  > "Best recap/thread/clip of [Event]. What happened, what was real about it. Long-form wins."
- Accept top submission. NFT naming: `[Event] Recap #001`.

**Unlock cleanup:**
- Lock expires automatically based on key expiry setting. No action needed.
- Archive the event in ZAO OS admin (Status = Archived).

---

## Event Calendar Application

| Event | Unlock config | POIDH bounties | Notes |
|---|---|---|---|
| **ZAOville Jul 25** (Laurel MD) | Free RSVPs, approval on, Base | Pre-hype (0.015), Capture (0.03), Recap (0.05) | Physical event; QR check-in high value |
| **COC Concertz** (monthly) | Free, no approval needed (open access) | Battle capture (0.02/show), Monthly recap (0.05) | Online show; Unlock provides the "ticket" as a collectible even for free shows |
| **ZAOstock Oct 3** (Ellsworth ME) | Free GA + Paid VIP (if Stripe KYC done); OR free-only first year | Full 3-phase bounty stack; ZABAL airdrop to attendees (doc 626 pattern) | Largest event; start Stripe Connect KYC 2 months before if charging |
| **Thursday concerts** (weekly) | Free, auto-mint on check-in (no approval) | Single capture bounty (0.01) rotating | Low-overhead; the NFT library builds up passively |
| **Fractal Mondays** (weekly) | Free, auto-mint | Weekly puzzle bounty (0.005 ETH, NFT-is-the-prize tier) | Per doc 625 playbook pattern |

---

## Wallet Setup (required, Zaal-gated)

| Wallet | Purpose | Where |
|---|---|---|
| ZAO Events EOA | Unlock lock manager (deploys locks, approves attendees) | Dedicated EOA — NOT Safe, NOT Coinbase Smart Wallet (protocol reverts contract callers) |
| ZAO Bounty Treasury EOA | POIDH bounty issuer | Dedicated EOA (same constraint: `msg.sender == tx.origin`) — NOT the events wallet |
| Zaal personal EOA | Can claim POIDH bounties (issuer cannot claim own bounty) | Optional |

**One-time setup for Zaal:**
1. Create two dedicated EOAs (MetaMask or Rabby, name them "ZAO Events" + "ZAO Bounty Treasury").
2. Fund each with 0.05 ETH on Base for gas runway.
3. Connect "ZAO Events" wallet to events.unlock-protocol.com.
4. Fund "ZAO Bounty Treasury" monthly from ZAO operating treasury.

---

## POIDH Budget Template (per event)

| Bounty | Amount (ETH) | USD (~$2,700/ETH) | Deadline | NFT Name pattern |
|---|---|---|---|---|
| Pre-hype | 0.015 | ~$40 | Event day | `[Event] Pre-Hype #001` |
| Capture (during) | 0.030 | ~$80 | T+18h | `[Event] Moment #001` |
| Recap (post) | 0.050 | ~$135 | T+48h | `[Event] Recap #001` |
| **Total per event** | **0.095 ETH** | **~$255** | | |
| POIDH protocol fee (2.5%) | 0.0024 | ~$6.50 | | |
| **All-in per event** | **0.097 ETH** | **~$262** | | |

For a monthly cadence (COC + weekly concerts), reduce to capture-only (0.03 ETH) for routine shows. Full 3-bounty stack for quarterly anchor events (Zaoville, ZAOstock).

---

## Integration with ZAO OS

### Short term (no code)

- Unlock event URL → paste into ZAO OS events admin → `external_url` field.
- POIDH bounty Warpcast link → pin in /zao + Telegram at event open.

### Medium term (ZAO OS embed, doc 863 SDK path)

- Import `@unlock-protocol/unlock-js` → deploy lock from ZAO OS admin.
- Embed Unlock checkout widget inline on `/events/[slug]` page (replaces current `rsvp/route.ts` AJAX form).
- ZAO OS webhook → on Unlock key purchase → write to Supabase `event_rsvps` (keeps email mirror).
- POIDH Frame v2 embed → show active bounties inline on the event page.

---

## Open Questions for Zaal

1. **ZAOville Jul 25:** Should tickets be approval-required (Zaal manually approves each RSVP) or open-mint? Given it's at a private home venue, approval-required is safer.
2. **ZAO Bounty Treasury wallet:** Existing wallet or new dedicated EOA? If existing, confirm it's an EOA, not Coinbase Smart Wallet.
3. **ZAOstock paid tier:** Will Zaal start Stripe Connect KYC for ZAOstock? Takes several days. Decide by Aug 1 to have it ready by Oct 3.
4. **POIDH album:** Is `/a/thezao` the intended album for all ZAO events, or a new `/a/zaovents`? Doc 625 recommends keeping everything under one album until 10+ bounties per sub-brand.

---

---

## Additional Engagement Paths (from doc 994 fireside with Kenny, Jul 8)

These are three paths beyond the event-ticketing stack. All validated by POIDH founder Kenny in the Jul 8 fireside (doc 994):

### Path A: POIDH bounties for Unlock onboarding

Post a POIDH bounty: "Get your Unlock key to [event] and post proof." The bounty proof = a screenshot of the Unlock key in your wallet. This drives lock adoption (attendees who previously wouldn't bother with crypto now have incentive) and creates an onchain proof-of-onboarding that compounds into the ZAO bounty album.

- Bounty amount: Tier A (0.005–0.01 ETH), since the effort is just claiming a free key
- Proof criteria: wallet screenshot showing the Unlock key NFT + Farcaster post tagging /zao

### Path B: Unlock-gated POIDH bounty access

For premium or competitive POIDH bounty rounds, gate entry to holders of a specific Unlock key. Pattern: deploy an Unlock lock (price = 0, limited keys = N) → only key holders can submit POIDH claims in that round. Creates an access hierarchy: casual = public bounties; committed = Unlock-gated rounds.

- Use case: ZABAL Gamez builder rounds (only registered builders with ZAO member key can claim)
- Use case: zpoidh R6+ (ZAO member NFT = entry token for exclusive rounds)
- How: POIDH does not natively check Unlock keys; enforcement is social + Warpcast channel restriction (only key holders follow the channel with Unlock-gated access via Warpcast's token-gated channels feature)

### Path C: Unlock crowdfunds POIDH bounties

Zaal's R5 pitch (from doc 994, decision 6): post a small POIDH bounty ($5–10) and let the Unlock community rally contributions to grow the prize pool. Unlock Protocol stewards Danny Toms + Cecilia are actively looking for music-creator + proof-of-work integrations — pitching this as a co-marketing opportunity (Unlock promotes the bounty to their community, ZAO provides the bounty content).

- Action needed: Zaal to complete the pitch DM to Kenny + trigs (board task 4e9a8a93 "Lock R5" — separate from this doc)
- Expected outcome: 3–5 external contributors add ETH to the bounty pool, prize grows from $5 to $25–50

---

## Sources

- Doc 863 — Unlock Protocol for ZAO Event Ticketing (research + decisions)
- Doc 994 — ZABAL Gamez x POIDH Fireside with Kenny (Jul 8) — validation of Paths A/B/C above
- Doc 625 — POIDH x ZAO Bounty Playbook (operational templates + prize curves)
- Doc 626 — Empire Builder ZABAL POIDH Airdrop Architecture
- Doc 1228 — ZAOville Jul 25 Day-of Operational Runbook
- Board task `c9edbd9b` (redo — prior write did not persist to disk)
