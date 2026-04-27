---
topic: community
type: decision
status: research-complete
last-validated: 2026-04-27
related-docs: 415, 468, 477, 490
tier: STANDARD
---

# 533 — POIDH Clip-Up Bounty: BCZ YapZ Ep 17 (Hannah / Farm Drop)

> **Goal:** Ship a copy-paste-ready POIDH bounty that pays community members to clip + repost the best 30-90s moment from BCZ YapZ Ep 17 (Hannah / Farm Drop, `youtu.be/hw-6IHaziV0`). Establish the format as a recurring weekly competition called "ZAO Clip-Up" so every BCZ YapZ episode (and future ZAO content) drops with a paid clip pot attached.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Platform | USE POIDH on **Base** — same chain as $ZAO, 1-10c gas, contract `0xb502c5856f7244dccdd0264a541cc25675353d39`, audited V3 by 0xSero |
| Bounty type | USE **Open** bounty — community pots up, 48hr weighted vote on winner. Lets ZAO members fund the prize alongside Zaal |
| Starting pot (week 1) | **0.005 ETH (~$15-20)** seed from Zaal. Open-bounty mode lets community top up. Doc 415 saw $5 lowballs boosted to 0.25 ETH by community |
| Required intro phrase | "**This is for the ZAO**" — said on camera in first 3 seconds. Direct port of POIDH convention ("this is for poidh", base/522, base/544). Non-negotiable disqualifier |
| Required platforms (claimant must post on AT LEAST ONE) | X **OR** Instagram **OR** Farcaster. Tag @thezao (X), @zaomusic (IG), or /thezao channel (FC) |
| Proof artifact (POIDH claim) | Screenshot of the live post + clickable link to the post + the clip itself (mp4 or yt-short link). All 3 in one POIDH claim |
| Clip length | 30-90 seconds. Anything <20s or >2min = invalid |
| Source video | BCZ YapZ Ep 17 — `https://youtu.be/hw-6IHaziV0` — Zaal x Hannah (Farm Drop), 30 min, recorded 2026-04-21 |
| Voting period | 48 hours (POIDH default). Top contributors weighted; Zaal seed = ~50% if no top-ups |
| Cadence | Run **weekly**, one bounty per BCZ YapZ episode going forward. 17 back-catalog episodes = 17 retroactive bounties available later |
| Reference channel | We Them Media (`poidh.xyz/a/wethemmedia`) — proven open-call clip pattern. Album currently empty; we go fund our own ZAO album |
| ZAO album | CREATE a `poidh.xyz/a/thezao` album so all clip-up bounties share a hub. Single URL to share everywhere |
| Skip | SKIP custom contract, custom voting UI, SKIP Degen chain for ep clips (artist/music bounties stay on Degen per doc 415; ZAO content lives on Base) |

---

## Why Clip-Up Bounties Work for ZAO

1. **Distribution multiplier.** Ep 17 is a 30-min sit-down. ~98% of social viewers won't sit through it. A 60s clip with a hook does. Paying $15-25 once turns N members into N distribution channels.
2. **Algorithm-aware.** Each clip gets posted to the clipper's own X/IG/FC account = native algorithm exposure across N follower graphs, not just Zaal's.
3. **NFT receipt.** POIDH claim = ERC-721 minted on Base. ZAO ends up holding an on-chain archive of every winning clip. Free archival side effect.
4. **Member engagement, not member homework.** Doc 415 flagged: members hate "homework" tasks (bio + IRL photo). They will do clip work because it's creative + the ROI is non-zero. Reframes contribution.
5. **Audience-tested format.** POIDH's "this is for poidh" intro pattern (base/522, base/544) is already a recognized meme on Base. Forking it as "this is for the ZAO" plugs into existing primitive instead of inventing.

---

## The Bounty (Copy-Paste Ready)

### Title

```
Clip the best 60s of BCZ YapZ Ep 17 — Hannah / Farm Drop (this is for the ZAO)
```

### Description (POIDH paste)

```
Source: https://youtu.be/hw-6IHaziV0  (BCZ YapZ Ep 17 — Zaal x Hannah from Farm Drop, 30 min)

Make a 30-90 second clip of the strongest moment. Hannah runs a Maine local-food
network with farmers, food pantries, and mutual aid. Pick a quote that lands.

Suggested timestamps if you want a head start:
  04:22 — "if you take a farmer's market and a CSA and they have an online baby,
            you get Farm Drop"
  04:30 — zero waste, farmers only deliver what's pre-purchased
  13:30 — 50lbs of chicken, half cows, custom-butchered lamb
  29:00 — saved their business during the pandemic, fed a grandmother when sick

Rules — claim is invalid if any rule is broken:

  1. Open the clip with you (or a card on screen) saying "this is for the ZAO."
     First 3 seconds. On camera, on mic.
  2. Subtitle the clip. Hannah's quote should be on screen.
  3. Post it to AT LEAST ONE of: X, Instagram, Farcaster.
     Tag the ZAO:
       X:         @thezao
       IG:        @zaomusic
       Farcaster: /thezao  (cast in the channel)
  4. After it's posted, take a screenshot of the live post + grab the link.
  5. In your POIDH claim, upload: the clip (mp4 or short link), the screenshot,
     and the live post URL in the claim text.

Voting: 48 hours after first claim. Pot contributors vote weighted. Best clip wins.
2.5% POIDH protocol fee on payout. Winner also keeps the claim NFT.

Want to top up the pot? Hit "Add funds" — anyone can.
```

### Settings

| Field | Value |
|-------|-------|
| Chain | Base |
| Type | Open |
| Token | ETH |
| Seed | 0.005 ETH |
| Voting | 48hr |
| Tag | `#zao-clipup` (in description) |
| Album | `poidh.xyz/a/thezao` (create on first bounty) |

---

## Recurring Weekly Format ("ZAO Clip-Up")

| Element | Spec |
|---------|------|
| Cadence | New bounty every Monday 9am ET. Closes Sunday 11:59pm ET (7 days submission) + 48hr vote. Winner announced following Tuesday |
| Source content rotation | Week 1: Ep 17 (Hannah). Then back-catalog (1 ep/week, oldest-first or strongest-first). After 17 weeks switch to live drops |
| Pot size escalation | Week 1: $15-20 seed. Cap test community top-ups for 4 weeks. Then anchor to whatever community averages |
| Winner perks | Cash + NFT + featured repost from @thezao (X) and /thezao (FC). Add to Hall of Clips on `/bcz-yapz` page (doc 490) |
| Cross-post | Auto-cast new bounty to /thezao channel via existing publish pipeline (`src/lib/publish/`). Drop link in Telegram + Discord |
| Bot integration | New POIDH-watcher (doc 468 already specs the dual-hub design). Listens for new claims → posts to /thezao → Telegram approval gate before celebratory cast |

---

## Numbers + Mechanics (Verified 2026-04-27)

- **Protocol fee:** 2.5% on completed bounty (POIDH treasury)
- **Gas on Base:** 1-10¢ (cancel/withdraw = gas only, no fee)
- **Voting threshold:** >50% of weighted YES votes among participating contributors. Creator's contribution auto-counts YES
- **Voting window:** 48 hours from claim submission
- **Claim format:** ERC-721 NFT minted on POIDH claim contract (Base)
- **Royalty:** 5% suggested on secondary NFT sale
- **Source video duration:** 30 minutes
- **Source video ID:** `hw-6IHaziV0` (also stored as `youtube_video_id` in transcript frontmatter)
- **Transcript path:** `content/transcripts/bcz-yapz/2026-04-21-hannah-farmdrop.md`

---

## ZAO Ecosystem Integration (file paths)

- `content/transcripts/bcz-yapz/2026-04-21-hannah-farmdrop.md` — source transcript, lifts the 04:22 quote line on demand
- `src/lib/bcz-yapz/config.ts` — surfaces `https://thezao.com` as canonical home; add a `clipupAlbumUrl` constant once album exists
- `src/app/bcz-yapz/page.tsx` (doc 490) — extend with a "Clip-Up Pot" badge per episode pulling from POIDH per-bounty URL
- `src/lib/publish/x.ts` + `src/lib/publish/farcaster/route.ts` — already cast as @thezao. Add a "new clip-up live" auto-cast template
- `src/lib/bounties/poidh.ts` (proposed in doc 415, not yet shipped) — read-only deep-link helper. Same module powers this
- `community.config.ts` — add `poidhAlbumUrl: 'https://poidh.xyz/a/thezao'` once album is created

---

## Risks + Mitigations

| Risk | Mitigation |
|------|-----------|
| Zero submissions week 1 | Seed by asking 3 known clip-makers (DCoop, AttaBotty, FailOften) directly. POIDH base/522 took 3 weeks to first claim — patience required |
| Low-effort spam claims (raw clip, no intro phrase, no post) | Rules 1-4 are auto-disqualifiers. Open-bounty voting filters; non-compliant claims get NO weighted votes |
| Farm Drop / Hannah feels weird about commercialization | Clip is for ZAO promo, not Farm Drop. Hannah already gave full interview consent (recorded + posted). Notify her as courtesy; share winning clip |
| Member confusion on "where do I post?" | The 3 platforms are OR, not AND. Pick one. Repeat in description + reply to first 3 confused comments |
| Wallet onboarding friction (no Base ETH for new claimers) | Direct first-time claimants to bridge via portfolio.metamask.io or Coinbase. Note in onboarding cast |
| Tag spam from non-ZAO accounts hijacking the post | Open-bounty voting, contributor-weighted. Random tags can't claim; only POIDH claim with full proof wins |

---

## Open Questions (Resolve Before Launch)

1. Confirm Zaal has 0.01+ ETH on Base in the deploying wallet. Doc 415 lists POIDH treasury behavior; doesn't audit our balance.
2. ZAO album creation — does POIDH allow self-create at `/a/thezao`, or does it auto-generate from username? Test on first bounty.
3. IG handle final answer: `@zaomusic` is what's in `src/lib/nexus/links.ts`. Confirm vs any newer ZAO IG handle Zaal owns.
4. Hannah's permission to feature winning clip on @thezao social — assume yes (interview already public), but a courtesy DM before launch is cheap insurance.
5. Cross-post pipeline: does `src/lib/publish/farcaster/route.ts` support posting from a Base-link card? Test on a throwaway cast.

---

## Action Bridge / Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm ETH balance on Base for deploying wallet | @Zaal | Infra check | Before week-1 launch |
| Create `poidh.xyz/a/thezao` album by posting first bounty | @Zaal | POIDH UI action | Week 1 launch day |
| Post the bounty (paste from "The Bounty" section above) | @Zaal | POIDH | Week 1 launch day |
| DM Hannah with link to winning clip post-vote | @Zaal | Outreach | Week 2 |
| Auto-cast bounty to /thezao Farcaster channel | ZOE / cron | Bot task | Tied to weekly cadence |
| Add "Clip-Up Pot" badge to `/bcz-yapz` page per episode | Claude | PR to ZAO OS | After 3 successful weeks |
| Wire `src/lib/bounties/poidh.ts` helper (per doc 415 sketch) | Claude | PR | Before 4-week mark |
| Decide week-2 source: Ep 16, oldest ep, or strongest replay-value ep | @Zaal | Editorial | End of week 1 |
| Add `poidhAlbumUrl` to `community.config.ts` | Claude | PR | After album exists |

---

## Also See

- [Doc 415 — POIDH Bounties for ZAO + WaveWarZ](../415-poidh-bounties-zao-wavewarz/) — full mechanics + 11 bounty templates
- [Doc 468 — ZAO Farcaster Hub: POIDH + HyperSub + dual-hub design](../../agents/468-zao-farcaster-hub-poidh-hypersub-dual-hub/) — POIDH-watcher bot architecture
- [Doc 477 — YouTube SEO for BCZ YapZ](../../dev-workflows/477-youtube-seo-bcz-yapz/) — `/bcz-yapz-description` skill
- [Doc 490 — BCZ YapZ Archive Page (`/bcz-yapz`)](../../dev-workflows/490-bcz-yapz-archive-page/) — public archive, single source of truth

---

## Sources

- [POIDH homepage](https://poidh.xyz/)
- [We Them Media album (reference)](https://poidh.xyz/a/wethemmedia)
- [Bounty base/1096 — Preach POIDH & We Them Media](https://poidh.xyz/base/bounty/1096)
- [Bounty base/522 — Bounce the ball like Tiger (intro phrase pattern)](https://poidh.xyz/base/bounty/522)
- [Bounty base/544 — split the G (intro phrase pattern)](https://poidh.xyz/base/bounty/544)
- [Bounty base/404 — proof of football skill ("this is for farcaster" variant)](https://poidh.xyz/base/bounty/404)
- [Open multiplayer bounties explained (poidh blog)](https://words.poidh.xyz/poidh-open-multiplayer-bounties-explained)
- [POIDH FAQ](https://info.poidh.xyz)
- [BCZ YapZ Ep 17 — Hannah / Farm Drop (YouTube)](https://youtu.be/hw-6IHaziV0)
- [Farm Drop](https://farmdrop.us)
- Local: `content/transcripts/bcz-yapz/2026-04-21-hannah-farmdrop.md`
