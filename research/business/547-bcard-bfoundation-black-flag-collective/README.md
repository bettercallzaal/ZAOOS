---
topic: business
type: decision
status: research-complete
last-validated: 2026-04-28
related-docs: 222, 244, 432, 458
tier: STANDARD
---

# 547 — BCard / B Foundation / Black Flag Collective: ZAO Partnership Opportunity

> **Goal:** Decide whether The ZAO submits to BCard partner program + Black Flag Collective endowment, after Zaal's convo with @links (Al Mithani).

## Key Decisions (Recommendations First)

| Decision | Recommendation | Why |
|---|---|---|
| Submit ZAO as BCard partner community | **YES — submit this week** | Free revenue (interchange fees), 9 existing partners include Nouns + BanklessDAO + Higher (peer tier), aligns with "purpose-driven community" framing. Zaal already has warm intro via @links. |
| Apply Black Flag Collective endowment for ZAOstock | **YES — pitch ZAOstock as flagship IRL** | Black Flag funds IRL meetups globally; ZAOstock Oct 3 2026 is exactly the use case. Endowment = on-chain, public, tracks well with our build-in-public posture. |
| Adopt B Vault (password mgmt) | **DEFER** — re-evaluate Q3 2026 | Useful for ZAO ops but not P0 vs ZAOstock + Empire Builder + bot fleet. |
| Use Taxman (DAO tax calc) | **SHARE with Devz** | Not a ZAO-org need but ZAO contributors getting paid in ZABAL/SANG could use it personally. |

## What Each Thing Is

### B Foundation (bfoundation.me)
Parent org. "Helps purpose-driven communities use web3 tooling to generate revenue and engagement." Tagline: "Purpose over profit."

**Team:**
- Al Mithani — Founder & Managing Director (Farcaster @links, Twitter @almithani, Toronto)
- Chris Biele aka NFThinker — Director & Sales Lead
- Tom Tranmer — Engineering Lead
- Richard von Hagel — Finance Lead

**Products:**
| Product | What | ZAO relevance |
|---|---|---|
| BCard | Debit card; redirects interchange fees to chosen community | Submit ZAO as partner |
| Black Flag Collective | On-chain endowment funding IRL meetups globally | Apply for ZAOstock |
| B Vault | Shared password mgmt for community ops | Defer |
| Taxman | Tax burden calc for DAO contributors paid in tokens | Share with Devz |

### Black Flag Collective (blackflagcollective.org)
On-chain endowment fund. "We are the Black Flag" — IRL social network. Funds meetups globally. Front page is a loading shell as of 2026-04-28; full program details not public-facing yet. Verify scope direct with @links.

### BCard (getbcard.io, app.getbcard.io)
Payment card. "Supporting your community with every swipe." Beta v1.3.1.

- **Mechanic:** Card user picks a community; interchange fees from every swipe redirect to that community treasury.
- **Geographic:** US residents only as of 2026-04-28; international expansion underway.
- **Governance:** Cooperative, cardholders get voting influence, higher reward tiers unlock as adoption grows.
- **Partner intake:** `partners@getbcard.io`. Support: `support@getbcard.io`. Discord open.

### @links (Al Mithani) — the person
- BanklessDAO core contributor; led Grants Committee; spearheaded governance overhauls.
- Founder of B Foundation + BCard.
- Self-description: "tech product craftsman, organization designer, seeker of inspiration."
- Personal: almithani.com.
- Podcast appearances: Just DAO It (Podbean), Making Bank: A BanklessDAO Podcast.

### /bcard Farcaster channel
Branded channel for BCard product. Channel page returned shell content on direct fetch 2026-04-28; needs in-app verification. Likely run by @links + Chris Biele (NFThinker).

## BCard Partner Communities (current roster, 9)

Pulled from `support.getbcard.io/informational-articles/bcard-partner-communities` 2026-04-28:

1. BanklessDAO
2. BCard (self)
3. Glo Dollar
4. Higher
5. Nouns
6. Open Medicine Foundation
7. Origin DAO
8. PoolTogether
9. Purple

**Pattern:** mix of DAO-native (BanklessDAO, Nouns, Purple), public-good (Glo, OMF, PoolTogether), and Farcaster-native (Higher, Purple). The ZAO fits cleanly as Farcaster-native + music community + DAO tooling — adds genre diversity to the roster.

## Why ZAO Fits the BCard Partner Profile

- **Purpose-driven:** music community, build-in-public, ZABAL/SANG token, fractal governance — checks every "purpose over profit" box.
- **Active treasury:** ZAO has on-chain treasury, can route BCard interchange directly.
- **IRL momentum:** ZAOstock 2026-10-03 confirmed (Ellsworth, Franklin St Parklet); Ellsworth Thursday concert series; Roddy parklet meeting 2026-04-28.
- **Farcaster-native:** 188-member gated client (`src/app/api/`, `community.config.ts`), already in the BCard distribution surface.
- **Warm intro:** Zaal had direct convo with @links, so submission is warm not cold.

## Why Black Flag Endowment Fits ZAOstock

- Black Flag explicitly funds IRL meetups globally — ZAOstock is the IRL flagship.
- $5K-$25K confirmed budget per `project_zao_stock_confirmed` — within typical meetup endowment range.
- On-chain endowment matches ZAO's transparency posture (build-in-public).
- Submission is a research-doc-quality pitch; we already have the asset (one-pager) per `/onepager` skill.

## ZAO Codebase Touchpoints

If we partner, these change:

| File | Change | Tier |
|---|---|---|
| `community.config.ts` | Add BCard partner ref + treasury route | Phase 2 |
| `src/app/(home)/page.tsx` or relevant landing | "Support ZAO with BCard" CTA | Phase 2 |
| `src/components/wallet/` | BCard treasury splits if applicable | Phase 3 |

Don't touch any of these until partnership is confirmed by @links / partners@getbcard.io.

## Submission Plan (sequenced)

1. **Today (2026-04-28):** Zaal posts on Farcaster tagging @links, public ask: "great chat, ZAO community should submit."
2. **This week:** Send `partners@getbcard.io` partnership request. Use `/onepager` skill to draft. Cc @links if appropriate.
3. **This week:** Pitch ZAOstock for Black Flag endowment (separate email or DM @links). Use ZAOstock one-pager.
4. **2 weeks:** If accepted as BCard partner, post "we're now a BCard community" on Farcaster + add to community.config.ts.
5. **Q3 2026:** Re-evaluate B Vault for ops if BCard partnership active.

## Open Questions for @links

- What's the BCard partner application criteria + timeline?
- Black Flag Collective: typical endowment size, application format, on-chain mechanics (which chain, which contract)?
- US-only restriction on cardholders — does that affect partner-community eligibility (ZAO has international members)?
- Is the /bcard Farcaster channel the canonical partner-community announcement surface?

## Risks / Blockers

| Risk | Mitigation |
|---|---|
| US-only cardholders limits ZAO benefit | International expansion underway per BCard docs; revisit when announced. |
| Partner roster public — ZAO's gated client may not align with "discoverable" expectation | Confirm with @links whether partner needs public-facing landing. |
| Black Flag program details not yet public-facing on website | Get specifics from @links direct; do not commit to budget assumptions. |

## Also See

- [Doc 222](../222-payment-infrastructure-stripe-coinbase/) — payment infra context
- [Doc 432](../../community/432-zao-master-positioning/) — ZAO master positioning (music first, community second, tech third)
- [Doc 458](../../community/458-zao-contribution-circles/) — adjacent community-funding pattern
- `project_zao_stock_confirmed.md` (memory) — ZAOstock Oct 3 2026 facts
- `project_zaostock_open_call.md` (memory) — submission-based artist lineup

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Post Farcaster cast tagging @links re: BCard + community submission | Zaal | Social | 2026-04-28 |
| Email partners@getbcard.io with ZAO partnership pitch | Zaal | Outbound | 2026-05-02 |
| Pitch ZAOstock for Black Flag endowment (DM @links) | Zaal | Outbound | 2026-05-02 |
| Confirm BCard channel canonical announcement surface | Zaal | Question | At @links reply |
| If accepted: PR adding partner ref to community.config.ts | Claude | PR | After accept |

## Sources

- [B Foundation](https://bfoundation.me/) — verified 2026-04-28
- [Black Flag Collective](https://blackflagcollective.org/) — page shell only, content loads dynamically (verified 2026-04-28)
- [BCard Support Center](https://support.getbcard.io/) — verified 2026-04-28
- [BCard Partner Communities](https://support.getbcard.io/informational-articles/bcard-partner-communities) — verified 2026-04-28; 9 partners listed
- [Just DAO It! interview with Al Mithani](https://justdaoit.transistor.fm/episodes/just-dao-it-dao-news-interview-with-al-mithani-from-bcard) — @links background
- [Making Bank BanklessDAO podcast — BanklessCard launch](https://rss.com/podcasts/making-bankless-dao/1273308/) — Links + NFThinker interview
- [Al Mithani LinkedIn](https://www.linkedin.com/in/almithani/) — Toronto, ON
- [almithani.com](https://almithani.com/) — personal site
- [Farcaster @links](https://farcaster.xyz/links) — verified handle (page shell)
- [Farcaster /bcard channel](https://farcaster.xyz/~/channel/bcard) — verified URL (page shell)
