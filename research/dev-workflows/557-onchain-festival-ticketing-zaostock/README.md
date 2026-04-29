---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-04-29
related-docs: 549, 551, 556
tier: STANDARD
---

# 557 - Onchain Festival Ticketing for ZAOstock Oct 3 2026

> **Goal:** ZAOstock is locked Oct 3 2026 (memory `project_zao_stock_confirmed`) - Franklin St Parklet, Ellsworth, Maine, $5-25K budget, Wallace Events tents. 5 months out. Decide the onchain ticketing + sponsor pass + RSVP attribution stack now so the spinout repo (memory `project_zaostock_spinout`) can build it.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Use **Unlock Protocol** as the canonical NFT ticket / membership layer | **YES** | Open-source, MIT-philosophy, DAO-governed, **migrated to Base in 2024**, used at EthCC, Devcon, Dappcon, ETHTaipei, ETHWarsaw. ZAO is on Base. PublicLock contract pattern fits ticket-as-membership. Free protocol; we pay only the gas (which is sponsored per [Doc 556](../556-gasless-onboarding-stack-zaostock/)). |
| Use **POAP** for proof-of-attendance issued at the door | **YES, COMPLEMENTARY** | POAP = the social signal ("I was there"). Lollapalooza precedent. Attendees get an Unlock ticket NFT (functional access) + POAP (commemorative). Two different tokens, two different jobs. |
| Use **Highlight.xyz** for sponsor-pass NFTs + ZAOstock-tier collectibles | **EVALUATE** | No-code drop platform. Email + credit card onboarding (no wallet required). Supports music artists (Moon Boots, Futurebirds use it). For sponsors who don't want to think about wallets, Highlight removes friction. Decide after one Highlight test drop. |
| Skip **Tixbase** for the onchain layer | **YES, SKIP for v1** | Tixbase pivoted to AI-driven traditional ticketing (per fetch 2026-04-29); their landing emphasises Meta/Google Ads/HubSpot integrations, not blockchain. EXIT Festival case is real but the current product isn't crypto-native. Revisit if they reintroduce NFT tickets. |
| Skip **Tropee** | **YES, SKIP** | Could not verify the platform exists at scale - search returned no relevant results. May be misremembered or pre-launch. |
| Use Lu.ma for guest-list CRM + email comms | **YES** | Already in use across ZAO events (memory `project_zao_festivals_umbrella`). Lu.ma handles RSVP collection, email reminders, headcount. Pair with onchain layer = Lu.ma collects email + Farcaster handle, ZAO OS issues Unlock NFT after Farcaster verify. |

## Stack Summary (Verified 2026-04-29)

| Layer | Tool | Cost | Status for ZAO |
|---|---|---|---|
| Auth + RSVP form | Existing ZAO OS V1 + Lu.ma | Free | Live |
| Wallet (gasless) | Coinbase Smart Wallet + CDP Paymaster (Doc 556) | $15K free credits | Doc 556 |
| Ticket NFT | Unlock Protocol PublicLock on Base | Free protocol; gas sponsored | New, this doc |
| Sponsor-tier NFT | Highlight.xyz | Free + tx fees / TBD | Spike pending |
| Proof-of-attendance | POAP | Free distribution; small protocol fees | New, day-of-event |
| CRM / segmentation | Email export from ZAO OS + Lu.ma + (later) farcaster.fyi | Free / low | Existing |

## Concrete ZAOstock Token Architecture

### Layer 1 - "ZAOstock 2026 Attendee" NFT (Unlock PublicLock on Base)

- One contract, one tier (or several tiers if priced)
- Mint trigger: RSVP confirmed in ZAO OS spinout repo
- Gas: sponsored via CDP Paymaster (Doc 556 allowlist `Lock.purchase()`)
- Holder benefits: gate access to event-day content, post-event recap, future ZAOstock pre-sale
- Transferable: yes (per Unlock default), with optional non-transferable mode if we want anti-scalp

### Layer 2 - "ZAOstock Sponsor 2026" NFT (Highlight or Unlock)

- One contract, multiple tiers (Bronze / Silver / Gold / Founder)
- Mint trigger: sponsor pays via fiat or USDC
- Gas: sponsored
- Holder benefits: logo on landing, on-stage thank-you, post-event token rebate, future event first-look
- Transferable: no (sponsor identity is part of the cap table)

### Layer 3 - "ZAOstock 2026 - I Was There" POAP

- POAP issued at venue via QR code or geofenced link
- One per attendee
- No gas (POAP handles)
- Permanent commemorative
- Can be requirement for ZAOstock 2027 early-access

### Layer 4 - "ZAOstock Performer 2026" NFT (Unlock soulbound)

- Issued to confirmed performing artists post open-call (memory `project_zaostock_open_call`)
- One per artist
- Soulbound (non-transferable)
- Gates to performer green-room / merch backend

## Why Unlock + POAP Over Tixbase or Custom

- **Unlock is OSS + on Base**, the same chain ZAO is on. Zero new infra.
- **POAP is the network effect.** Lollapalooza, Devcon, EthCC have all done it. Onchain attendees expect it.
- **Tixbase** could replace this if we needed dynamic pricing, fan-resale, and integrated marketing. ZAOstock v1 doesn't need that complexity for ~200-500 attendees on a single day.
- **Custom contract** would be a 3-week build. Unlock is a 2-day integration.

## Concrete Spinout Repo Implementation Sketch

In the new ZAOstock repo (per `project_zaostock_spinout`):

```typescript
// /lib/ticketing/unlock.ts
import { createWalletClient, http } from 'viem'
import { base } from 'viem/chains'

const ATTENDEE_LOCK = '0x...' // deploy via app.unlock-protocol.com
const SPONSOR_LOCK = '0x...'
const PERFORMER_LOCK = '0x...'

export async function issueAttendeeNFT(walletAddress: string) {
  // Sponsored via CDP Paymaster (Doc 556)
  // Calls Lock.purchase(amount, recipient, referrer, data)
}

export async function issueSponsorNFT(walletAddress: string, tier: 'bronze' | 'silver' | 'gold' | 'founder') {
  // Different lock per tier OR same lock w/ tier in metadata
}
```

Frontend: a `<RSVPCard />` component lifted via `/21st` skill (Doc 549e), wired to call `issueAttendeeNFT` after Farcaster verify.

## Sponsor-Tier Pricing (Per memory `project_zao_stock_meeting_apr10`)

Already discussed in ZAOstock meetings; finalised tier pricing TBD. Suggested architecture:

| Tier | Price | Quantity cap | NFT contract |
|---|---|---|---|
| Bronze | $500 | 10 | `SPONSOR_LOCK_BRONZE` |
| Silver | $1,500 | 5 | `SPONSOR_LOCK_SILVER` |
| Gold | $5,000 | 3 | `SPONSOR_LOCK_GOLD` |
| Founder | $10,000+ | 1-2 | `SPONSOR_LOCK_FOUNDER` |

(Numbers placeholder; align with ZAOstock team meeting decisions per memory `project_zaostock_team_meeting`.)

## Risks

| Risk | Mitigation |
|---|---|
| Attendee can't onboard a wallet day-of | Lu.ma email + Farcaster handle is enough; Unlock NFT issues via custodial flow (Coinbase Smart Wallet creates one if missing) |
| Sponsor doesn't want a wallet | Highlight.xyz email+CC onboarding handles this; or issue manual NFT via wallet ZAO custodies for them |
| POAP delivery fails on event day (network at venue) | Pre-print QR codes that resolve to a delivery URL; serve from a relay if WiFi is shaky |
| Scalping / resale | Soulbound mode for performer + sponsor; transferable for attendee if we want secondary market |
| Compliance (selling NFT tickets in Maine) | NFT-as-collectible framing > NFT-as-financial-instrument; tickets sold in fiat as ticket; NFT issued for free as receipt. Not legal advice. |
| Cost of Unlock + POAP + Highlight + Lu.ma stack | All free protocols; cost is gas (sponsored Doc 556) + Lu.ma free tier |

## Day-of Operational Plan

| Time | Task | Tool |
|---|---|---|
| 7 days pre-event | Final sponsor NFT mints | Highlight or Unlock |
| 1 day pre-event | Email reminder w/ wallet link | Lu.ma |
| Event day - gates | Attendee scans QR -> issues Unlock NFT (gasless) | Spinout repo + Coinbase Paymaster |
| Event day - mid-event | POAP QR posted on stage / printed cards | POAP delivery |
| Event day - performer access | Soulbound performer NFT pre-minted | Manual via wallet ZAO controls |
| Day after | Recap email referencing token-gated content | Lu.ma + ZAO OS |
| 1 week after | Open ZAOstock 2027 pre-list to attendee NFT holders | Token-gating via Unlock |

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Deploy Unlock attendee lock on Base sepolia for testing | Zaal | One-shot | June 2026 |
| Confirm sponsor tier pricing with team | Zaal | ZAOstock team meeting | Next Tuesday |
| Spike Highlight.xyz drop with a fake sponsor tier | Zaal | Spike | June 2026 |
| Wire CDP Paymaster allowlist to include `Lock.purchase` | Zaal | Doc 556 + this | Week 2 of Doc 556 rollout |
| Lock POAP designs by August 2026 | Zaal + design | Design ask | August |
| Day-of runbook | Zaal | Spec doc | September |
| Ship attendee NFT issuance flow | Zaal in spinout repo | PR | August |
| Ship sponsor NFT issuance flow | Zaal in spinout repo | PR | July |

## Also See

- [Doc 556 - Gasless onboarding stack](../556-gasless-onboarding-stack-zaostock/) - the gasless layer ticketing depends on
- [Doc 549e - /21st skill spec](../549e-21st-dev-zao-skill-spec/) - source of UI components for sponsor-tier card
- [Doc 548 - Lazer Mini Apps](../../farcaster/548-lazer-miniapps-cli-evaluation/) - Foundry contract patterns for custom Locks
- Memory `project_zao_stock_confirmed` - Oct 3 lock
- Memory `project_zaostock_spinout` - infra moves out of ZAO OS V1
- Memory `project_zaostock_master_strategy` - festival = proof, infra = product
- Memory `project_zaostock_team_meeting` - Tuesday 10am info-share format
- Memory `project_zaostock_open_call` - artist submission flow
- Memory `project_zao_festivals_umbrella` - umbrella branding

## Sources

- [Unlock Protocol litepaper](https://docs.unlock-protocol.com/getting-started/what-is-unlock/litepaper) - PublicLock model
- [Unlock DAO Base migration](https://unlock-protocol.com/blog/unlock-protocol-dao-completes-migration-to-base) - confirmed on Base
- [Unlock - Devcon proposal](https://forum.devcon.org/t/onchain-tickets-powered-by-unlock-protocol/3360) - production case
- [Highlight.xyz](https://highlight.xyz) - no-code NFT toolkit, music-artist-friendly
- [Highlight ProductHunt](https://www.producthunt.com/posts/highlight-xyz)
- [Highlight $11M raise](https://www.digitalmusicnews.com/2022/05/23/highlight-11-mm-raise/) - team validation
- [Tixbase landing](https://tixbase.com/) - AI-ticketing-not-NFT pivot confirmed 2026-04-29
- [POAP for events guide](https://www.dropchain.network/post/event-hosts-guide-to-using-poap-nfts-for-event-engagement)
- [Coachella / Tomorrowland NFT precedent](https://finance.yahoo.com/markets/crypto/articles/crypto-festivals-2026-real-access-100216612.html)

## Staleness Notes

Re-validate Unlock + Highlight + Tixbase pricing/feature status by 2026-06-29. Pricing tiers in this doc are placeholders; lock with ZAOstock team before any sponsor outreach.
