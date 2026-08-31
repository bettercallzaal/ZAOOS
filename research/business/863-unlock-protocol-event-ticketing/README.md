---
topic: business
type: decision
status: research-complete
last-validated: 2026-08-31
superseded-by:
related-docs: 814, 547
original-query: "Unlock Protocol locks for future ZAO events - feasibility of deploying one Unlock lock per upcoming event (ticketing/membership NFT gating). Glossary: https://docs.unlock-protocol.com/getting-started/glossary  Org repos: https://github.com/orgs/unlock-protocol/repositories  Context: Zaal will re-enter via FlowStage later."
tier: STANDARD
---

# 863 — Unlock Protocol for ZAO Event Ticketing

> **Goal:** Decide whether to deploy one Unlock lock per upcoming ZAO event (Zaoville, ZAOstock, Thursday concert series, FlowStage events) as the ticketing / membership-NFT layer.

## Key Decisions

| Decision | Call | Why |
|----------|------|-----|
| Use Unlock for ZAO event ticketing | **YES - via EVENTS by Unlock Labs (events.unlock-protocol.com)**, not hand-rolled locks | Hosted app auto-deploys one lock per event, generates a shareable landing page, QR check-in, CSV export. No code. Battle-tested at EthCC, Dappcon, ETHMexico, ETHTaipei. |
| Network | **Base** | Unlock deployed on Base L2; The ZAO already lives on Base (188-member gate). One chain, cheap gas, same wallets. |
| One lock per event | **YES** | Unlock's model = 1 lock = 1 event/ticket tier. Each ZAO event gets its own lock = its own NFT ticket collection. Multiple tiers (GA/VIP/sponsor) = multiple locks under one event page. |
| Free RSVP events | **YES - free lock + attendee screening** | Free ticket = lock priced 0. Approval workflow: attendee applies w/ email+name, organizer approves, QR ticket emailed. Replaces current Supabase email-only RSVP (`src/app/api/events/rsvp/route.ts`) with onchain proof + check-in. |
| Credit-card / fiat tickets | **VIABLE, not deferred** (revised 2026-08-31) - needs a Stripe connection made through the Unlock dashboard + KYC + min $0.50 price | **The 10% surcharge this doc claimed in June was wrong.** Unlock's protocol fee is **1%**, set by the Unlock DAO onchain in May 2024. Unlock Labs charges a separate **credit-card** fee, tiered: $1.00 flat under $10, **3% above $10**, capped at $10 - and that one is **paid by the purchaser**, not deducted from the organizer. Plus Stripe's own 2.9% + $0.30. On a $50 ticket: buyer pays $51.50, organizer nets about $47.75. The blocker is the multi-day Stripe approval, not the economics. |
| Custom builds vs hosted app | **Hosted app first; SDK (`@unlock-protocol/unlock-js`) only if embedding into ZAO OS later** | FlowStage integration can wrap the hosted event page now; deep embed via paywall/checkout SDK is a later lab task. |

## Findings

### What Unlock is (glossary, verbatim)
- **Lock** - "A smart contract that creates (or 'mints') NFTs" and can ensure members-only access. One lock per event/tier.
- **Key** - "An NFT (minted by a Lock)... such as an expiration date." = the ticket.
- **Lock Manager** - highest-permission role on a lock; the ZAO org wallet holds this.
- **Key Manager** - per-key role allowing transfer/share/cancel.

### EVENTS by Unlock Labs (the relevant product)
- Lives at **events.unlock-protocol.com**. Created to showcase the protocol; used for conferences (EthCC, Dappcon, ETHMexico, EthTaipei) AND small side gatherings.
- Creating an event **auto-deploys a lock** (smart contract) - handles minting, payments, ticket management. No Solidity.
- Paid OR free events.
- Tickets can be **transferable or non-transferable (soulbound)**.
- **Multiple tiers** (VIP / GA / sponsor) and **early-bird limited quantities**.
- **Attendee screening / approval**: applicant submits email + full name + optional wallet -> gets confirmation email -> organizer approves -> QR ticket emailed.
- **QR check-in**: any phone camera scans the ticket QR to verify validity. No special hardware.
- **Distribution**: auto landing page (shareable URL), airdrop tickets to individuals/groups, embed checkout on a custom site, email delivery w/ QR.
- **Data**: configurable metadata collection (name, email, t-shirt size, etc.), CSV export of attendees.

### Network: Base
- Unlock is deployed on **Base L2** (`unlock-protocol.com/blog/base`). Deploy via Dashboard or code, same process as any network.
- Aligns with The ZAO's existing Base footprint -> same wallets, low gas.

### Costs
- **Lock deployment gas**: organizer-paid, on Base (cents). Free events = lock priced 0, attendees pay no ticket cost (may pay trivial mint gas or organizer airdrops).
- **Credit-card path** (only if charging fiat):
  - Lock must be priced in a Coinbase-quotable currency, **min $0.50 USD**.
  - **CORRECTED 2026-08-31.** The "Unlock adds 10% of price" claim in the June version of this doc was wrong, and it was propagated into ZAOstock budget planning before it was caught. The real numbers, from Unlock's own docs and the DAO record:
    - **Protocol fee: 1%.** A DAO "fee switch" set onchain and approved May 2024; it applies to every paid purchase, extend and renewal, crypto or card. Zaal flagged the 10% figure as wrong on 2026-08-31 and he was right.
    - **Unlock Labs credit-card fee**, only on the card path: **$1.00 flat under $10, 3% above $10, capped at $10.00**. Unlock's announcement states these "are paid by the purchasers" - so it rides on top of the sticker price rather than eating the organizer's take.
    - **Stripe: 2.9% + $0.30**, the standard rate, charged on the transaction.
    - Worked example at $50: buyer is charged $51.50; Stripe takes $1.75 and the protocol takes $0.50; organizer nets about **$47.75**, i.e. **4.5%** of face value. Crypto-only on Base skips the Stripe and card legs and costs just the 1% - **$0.50**.
  - Organizer must connect Stripe **through the Unlock dashboard** (Tools > Update Lock Settings > Connect Stripe), signing a message proving lock ownership. Stripe then wants a bank account and identity documents, and "it may take a few days" to approve - the lock cannot take cards until it does. **This approval delay, not the fee, is what makes fiat a lead-time item.**
  - One extra step the June doc missed: a lock manager must **grant Unlock Inc. the "key granting" role** or card payments will not complete. It is revocable at any time (revoking disables cards) and grants no other permission over the lock.
  - (Separate Crossmint integration exists for fiat->crypto conversion on the paywall, but events flow = Stripe.)

### Current ZAO event flow (ground truth)
- `src/app/api/events/rsvp/route.ts`: email + name -> Supabase `event_rsvps` table, dedup on email+slug, no onchain, no ticket, no check-in. Unlock replaces/augments this with an NFT ticket + QR verification while still capturing email.

### Dev tooling (org repos, github.com/orgs/unlock-protocol)
- **unlock** - core monorepo, MIT, TS, actively maintained (updated Jun 16 2026, 874 stars).
- **examples** - curated Next.js integration examples, MIT.
- **scaffold-eth-unlock** - starter template.
- **Hooks** (extend lock behavior at purchase): `discount-hook` (discount codes), `password-required-hook`, `captcha-hook`, `unlock-prime-hook`. Useful later for ZAO member discounts / gated drops.
- **websub-discord** - posts Locksmith (Unlock backend) events to Discord; pattern reusable for ZAO Telegram/Discord ticket-sale pings.
- `@unlock-protocol/unlock-js` SDK for programmatic deploy/embed when ZAO OS wants native checkout.

## Recommended rollout

1. **FlowStage re-entry (Zaal):** create the next event (Zaoville or next Thursday concert) on events.unlock-protocol.com, network = Base, free ticket + approval on. Test the full applicant -> approve -> QR -> check-in loop with the team.
2. **Embed** the generated event landing-page URL into FlowStage / ZAO OS events surface.
3. **Keep** Supabase `event_rsvps` as the email mirror (CSV export -> import) until a native embed exists.
4. **Paid tier (ZAOstock-class only):** start Stripe Connect KYC early (multi-day). Price >= $0.50. Accept the ~13% all-in fee as cost of fiat convenience, or keep paid tickets crypto-only on Base to avoid the surcharge.

## Also See

- [Doc 814 - Dcoop / Zaoville](../../community/) (ZAO x VT day-party under ZAO Festivals - first candidate event to ticket)
- [Doc 547 - ZAOstock master strategy](../../) (infrastructure-is-the-product; ticketing rail fits)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Create next ZAO event on events.unlock-protocol.com (Base, free + approval) | @Zaal | Hosted-app | FlowStage re-entry |
| Embed Unlock event page URL into FlowStage events surface | @Zaal | PR | After test event |
| Start Stripe Connect KYC for paid ZAOstock tickets | @Zaal | Bot task | Before paid event |
| Evaluate `unlock-js` native checkout embed in ZAO OS | @Team | Spike | Post-FlowStage |

## Sources

- [Unlock Glossary](https://docs.unlock-protocol.com/getting-started/glossary) [FULL]
- [Unlock org repositories (77 repos)](https://github.com/orgs/unlock-protocol/repositories) [FULL]
- [How To Sell NFT Tickets for an Event](https://unlock-protocol.com/guides/how-to-sell-nft-tickets-for-an-event/) [FULL]
- [Enabling Credit Cards (fees + KYC)](https://unlock-protocol.com/guides/enabling-credit-cards/) [FULL]
- [Unlock deployed to Base L2](https://unlock-protocol.com/blog/base) [PARTIAL - via search summary, blog not directly fetched]
- [RSVP Event Approval](https://unlock-protocol.com/blog/rsvp-event-approval) [PARTIAL - via search summary]
- [Crossmint x Unlock payment integration](https://unlock-protocol.com/blog/crossmint-unlock-integration) [PARTIAL - via search summary]
- [Bankless Consulting - From Gatekeepers to Community Builders (Unlock at EthCC)](https://banklessconsulting.substack.com/p/from-gatekeepers-to-community-builders) [PARTIAL - community/practitioner source, via search summary]
- ZAO OS codebase: `src/app/api/events/rsvp/route.ts` [FULL - current email-only RSVP flow]
