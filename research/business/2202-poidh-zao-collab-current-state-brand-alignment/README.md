---
topic: business
type: guide
status: research-complete
last-validated: 2026-08-05
related-docs: 759, 415, 625, 626, 631, 468, 533, 768, 994, 1092, 1120, 1139, 1222, 1229, 1534, 2161
original-query: "POIDH and ZAO's collaboration with POIDH/Kenny - full picture. Cover: POIDH protocol architecture (v3 contracts, multi-chain deployment, the /data endpoint, developer docs at docs.poidh.xyz), the history of BCZ/ZAO's bounty rounds on POIDH (R1-R7 in the zpoidh repo), the relationship with Kenny (POIDH founder) and Unlock Protocol, and any other ZAO-ecosystem collaborations with POIDH (Empire Builder integration, $ZABAL leaderboard, ZOL trust-ladder plans). Goal: a research doc that grounds a follow-up brainstorm on a joint BCZ/ZAO x POIDH initiative that aligns both brands."
tier: STANDARD
---

# 2202 - POIDH x ZAO collaboration: current state + brand-alignment ground truth

> **Goal:** One current-state synthesis of everything ZAO has already built on/with POIDH,
> plus POIDH's own protocol facts and Kenny's positioning, so a brand-alignment brainstorm
> starts from ground truth instead of re-deriving history that already exists across 20+
> prior docs.

## Key Decisions

| # | Recommendation | Why |
|---|---|---|
| 1 | **Don't research POIDH from scratch again** - this doc links the 20+ existing docs instead of re-deriving them. | Doc 759 already has the canonical history, 415/625 have the mechanics, 1139 has the current-state pipeline map. Duplicating this work wastes tokens for zero new signal. |
| 2 | **The brand-alignment opportunity is already half-built, just not named as one.** ZAO has shipped: a standalone bounty-creation tool usable by anyone (not just ZAO), a leaderboard/data layer POIDH itself doesn't have, and a documented playbook (18 templates, doc 625) other POIDH bounty-issuers could use. | This is infrastructure POIDH's own team doesn't have bandwidth to build (Kenny is solo-ish, per doc 759's founder-framework context) - the alignment isn't "do a bounty together," it's "ZAO becomes the tooling layer POIDH's ecosystem runs on." |
| 3 | **R4's failure mode is the concrete lesson to build the pitch around**: OPEN-SPLIT bounties don't work without a claim funnel. That's a real product gap in POIDH itself (no native multi-winner split), which ZAO's docs/create-bounty.html + zpoidh's data tooling already partially solves. | Turns an internal ops problem into the actual value proposition for a joint initiative - "we already had to build the missing piece POIDH doesn't have." |

## POIDH protocol - what's actually true (verified this session, not from docs)

- **Contracts are immutable once deployed**, per docs.poidh.xyz - this is POIDH's stated core value (censorship resistance, decentralization). Confirmed the ACTUAL deployed ABI (not GitHub source, which was found to have arguments in the wrong order - see zpoidh commit history, PR "Add optional ERC20 bounty rewards to PoidhV2") via Sourcify's v2 API: `sourcify.dev/server/v2/contract/8453/0x5555fa783936c260f77385b4e153b9725fef1719`.
- **Multi-chain**: Ethereum Mainnet, Arbitrum, Base, Degen Chain. Base and Arbitrum share one contract address: `0x5555fa783936c260f77385b4e153b9725fef1719`. Constructor takes `_minBountyAmount` and `_minContribution` - confirmed live via `eth_call`: `MIN_BOUNTY_AMOUNT = 0.001 ETH`, `MIN_CONTRIBUTION = 0.00001 ETH`.
- **Previously-undocumented `/data` endpoint** (found via Kenny directly, not in docs.poidh.xyz): `poidh.xyz/base/bounty/<id>/data` returns the full bounty object plus every claim, with Farcaster/X handles already resolved and `priceUsd` computed. This is meaningfully better than the tRPC-scrape-plus-web3.bio-lookup pattern zpoidh's own scripts have used since R1 - worth migrating `scripts/refresh-poidh-leaderboard.py` to it (Next Action below).
- **No structured deadline field in practice.** Verified via a live scan (zpoidh's `scripts/scan-poidh-deadlines.py`, PR "Generalize the deadline calendar beyond BCZ's own rounds"): of 100 live open POIDH bounties scanned platform-wide, 0 had the on-chain `deadline` field populated, even though several state a deadline in free text. Confirms this isn't a ZAO-only pattern - it's true of the whole platform.
- **Kenny's own framing** (from doc 759's founder-framework research, and confirmed directly in the 2026-07-08 fireside transcript, doc 994): POID is meant to be "the internet's coordination protocol," not a company - Kenny has said he does not want poidh.xyz to be the only front end, and wants the protocol used/forked/remixed by others. This matters directly for the brand-alignment question: Kenny is *already* on record wanting exactly the kind of "ZAO builds tooling on POIDH" relationship this doc is scoping.

## Unlock Protocol - what's actually true (from the full workshop transcript, doc 994's source recording)

Ceci Sakura (Unlock Protocol) ran a live ZABAL Gamez workshop 2026-06-30
(`zabalgamez.com/recordings/32`), deploying a real certification lock on Base during the
session:

- Unlock lets anyone issue memberships, subscriptions, event tickets, and certifications as
  onchain NFT "keys" - no code required to deploy a lock.
- A lock can be made non-transferable (soulbound) - used live as a proof-of-attendance /
  proof-of-completion pattern, directly relevant to POIDH's own "proof of completion" NFT
  model (POIDH mints an NFT per accepted claim too - same primitive, different use case).
- Keys can be airdropped to a wallet *or a plain email address* - lower the onboarding bar
  below "you need a wallet already," which POIDH bounties currently do not have (a claimant
  needs a wallet to submit).
- Unlock is run as a DAO with open weekly calls; Ceci's explicit invitation was "contributing
  can start with content, bounties, or an idea."

## BCZ/ZAO's bounty round history on POIDH (zpoidh repo)

| Round | Bounty | Format | State (2026-08-05) |
|---|---|---|---|
| R1 | 1151 | Single-winner OPEN, clip-up | Closed, paid |
| R2 | 1166 | Single-winner OPEN, best-ad | Closed, paid |
| R3 | 1180 | Single-winner OPEN, ZABAL Gamez ad | Closed, paid (confirmed via claim-NFT ownership forensics - the on-chain proof that the claim's NFT moved to the issuer wallet only happens as part of the payout transaction) |
| R4 | 1249 | OPEN-SPLIT (everyone who shipped splits equally) | Deadline passed 5 days ago; closeout in progress. **Real submissions live on zabalgamez's own submission board, not as individual POIDH claims** - only 2 POIDH claims exist on this bounty, same wallet, while 16 unique builders submitted on-site. This is the concrete evidence for Key Decision #3. |
| R5 | none cast | Unlock Protocol clip bounty, Unlock-DAO co-funded pitch | Draft - pitch DM to trigs/Kenny never sent |
| R6 | none cast | Same Unlock Protocol idea, solo-cast by Zaal | Tooling built and live (auto-versioning derived live from POIDH's own bounty feed, no hand-tracked state) - not yet cast |
| R7 | none cast | First CODE bounty - bug fixes for zabalgamez.com | Draft - also scoped as ZOL's first controlled money-action trust-ladder rung |

Also already scoped in prior research but not yet built: R8 (WaveWarZ Mini App bounty) and
R9 (ZABAL marketplace v1 bounty) per doc 1534's 3-bounty campaign design.

## ZAO-built tooling on top of POIDH (this is the actual asset base for a collab pitch)

All in `github.com/bettercallzaal/zpoidh`, all shipped this session or earlier:

- **`docs/create-bounty.html`** - a standalone bounty-creation + claim-submission tool that
  works with *any* browser wallet (MetaMask, Coinbase Wallet, Rainbow via EIP-6963), not
  gated to the Farcaster Mini App. POIDH's own UI requires Farcaster; this doesn't. This is
  the single most reusable-by-others piece of the whole stack.
- **`scripts/refresh-poidh-leaderboard.py`** / **`scripts/scan-poidh-deadlines.py`** /
  **`scripts/build-bounty-calendar.py`** - a data layer POIDH itself doesn't provide: a
  cross-round leaderboard, a deadline calendar derived from free-text parsing, and a
  platform-wide scan (not just ZAO's own bounties).
- **The $ZABAL Empire Builder integration** (slot 8, "POIDH Submitters" leaderboard, doc
  626) - every POIDH submitter across ZAO's rounds earns $ZABAL automatically, scored by
  how many rounds they've compounded across. **Found broken this session**: Empire
  Builder's leaderboard config still points its `api_endpoint` at a stale
  `bettercallzaal.com/poidh-leaderboard.json` snapshot frozen at R2, while zpoidh's own
  data has been correct through R4 for weeks. Root cause is a config drift, not a data
  problem - flagged as a Next Action below.
- **ZOL trust-ladder plan** (R7): POIDH bounties are being used as ZOL's first
  controlled-money-action rung - a human-funded, human-judged bounty ZOL can help scope
  without ever holding funds itself. This is a genuinely novel use of POIDH (agent
  onboarding to money-handling via a bounty-judging role) that doesn't exist elsewhere in
  the research corpus.

## What this doc deliberately does NOT cover (already fully covered elsewhere)

- POIDH's full mechanical rules (solo vs open, 48h voting, 2.5% fee) - see doc 415, 625.
- The Empire Builder airdrop mechanics - see doc 626.
- The Unlock+POIDH event-stack spec (NFT ticket + post-event bounty + attendance proof) -
  see doc 1229, already fully specced.
- The submission-pipeline current-state map (manual tRPC pulls, no webhook) - see doc 1139,
  still accurate as of this doc's validation date.

## Also See

- [Doc 759](../759-poidh-history-origin-to-2026/) - canonical POIDH history + founder framework
- [Doc 1139](../1139-zabal-submission-pipeline-map/) - current-state pipeline map, still accurate
- [Doc 1229](../../events/1229-unlock-poidh-zao-event-stack/) - the Unlock+POIDH event-stack spec this doc's R5/R6 section builds on
- [Doc 994](../994-zabal-gamez-poidh-fireside-unlock-jul8/) - full transcript source for the Kenny + Unlock positioning quoted above
- [Doc 2161](../../identity/2161-zao-brand-audit/) - flags POIDH's own ICM box as a "draft pending publish" gap, now closed by this session's ICM update
- zpoidh repo (`github.com/bettercallzaal/zpoidh`) - all round data + tooling referenced above

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Fix Empire Builder's POIDH Submitters leaderboard `api_endpoint` config to point at zpoidh's own deploy instead of the stale bettercallzaal.com file | Zaal | EB dashboard config | 2026-08-08 |
| Migrate `scripts/refresh-poidh-leaderboard.py` to the `/data` endpoint instead of tRPC + web3.bio | Zaal | PR (zpoidh) | 2026-08-15 |
| Decide + send the R5 vs R6 call (R6 recommended - see Key Decision #3 in zpoidh's own recent session state) | Zaal | Decision | 2026-08-08 |
| Use this doc as the grounding brief for the brand-alignment brainstorm (office-hours or brainstorming skill) | Zaal | Follow-up session | 2026-08-05 |
