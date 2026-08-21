---
topic: governance
type: guide
status: research-complete
last-validated: 2026-07-17
related-docs: 718, 935, 936, 941, 696, 703
original-query: "go hard on the fractal stuff from all our learning - advance the ZAO protocol/fractal whitepaper"
tier: STANDARD
---

# 942 - ZAO Fractal Whitepaper: Outline v2 (reconciled)

> **Goal:** Update the May-2026 whitepaper outline (doc 718) with everything learned since - the monetary-policy research (935), the code-verified governance ground truth (936), and the votable burn/decay proposal (941). This is still the launchpad, not the whitepaper. It fixes one outright error in the v1 outline, folds three new docs into the chapter map, and lists the decisions only Zaal can make before any chapter is drafted.
>
> **Standing rule:** no chapter prose gets written until Zaal brainstorms audience, form, and voice (per doc 718 + the brainstorm-before-writing rule). This doc is structure only.

## Why v2 exists - the one error v1 would have shipped

Doc 718b (feeding Chapter 5, The Respect Game) described the mechanism with **"2% weekly decay, 34-week half-life"** as if ZAO runs it. Doc 936 then checked the code: ZAO's governance weight is `Math.round(ogValue + zorValue)` in `src/lib/respect/voteWeight.ts` - a **raw lifetime sum with NO decay and NO burn**. 718b was describing the canonical Fractally mechanism, not ZAO's live implementation.

If Chapter 5 were drafted straight off 718b it would state a false fact about ZAO's own system. That is the single most credibility-destroying error a governance whitepaper can make. So v2's core correction:

- **Chapter 5 must distinguish the canonical mechanism (has 2% decay) from what ZAO actually runs today (no decay).**
- The decay is a **proposal** (doc 941), not a shipped feature. The whitepaper presents it as roadmap/open-design (Ch 10), not as current architecture (Ch 5/6).
- This turns a bug into a strength: the honest gap between the inherited design and ZAO's live system is exactly the kind of candor doc 718f says makes a governance document canonical.

## Reconciled chapter map (v2)

Same 11-chapter spine as 718, with the new docs folded in and the decay correction applied. Changes from v1 are in **bold**.

| # | Chapter | Voice | Sources (v2) |
|---|---------|-------|--------------|
| 1 | Preamble and Vision | Manifesto | 718g |
| 2 | The Problem (plutocracy, apathy, capital over contribution) | Manifesto / argument | 718a, 718d |
| 3 | Fractal Democracy: First Principles (sortition, small-group consensus, measurement theory) | Argument | 718a |
| 4 | The Respect Token (soulbound reputation; what it is and is not) | Precision | 718b, 718c, **935 (Respect as non-money merit flow)** |
| 5 | The Respect Game (weekly mechanism, Fibonacci curve, consensus thresholds) | Precision | 718b, **936 (verified live mechanism)** - **state clearly: no decay today** |
| 6 | On-Chain Architecture (ORDAO, OREC, soulbound contracts) | Precision | 718c, **936 (verified vote-weight path)** |
| 7 | Why Fractal (vs token-voting, quadratic, Nouns, Moloch) | Argument | 718d |
| 8 | The ZAO Fractal (100+ weeks, music, OG/ZOR, the social client) | Manifesto / narrative | 718g, **703 (current state)** |
| 9 | Limitations and Open Problems | Plain honesty | 718e, **936 + 941 (the decay-gap as a named open problem)**, **1142 (error-recovery / failure-modes framework, grounded in 1139)** |
| 10 | Roadmap (ledger reconciliation, all-members-on-chain, scaling) | Plain | 718g, 696, **935 + 941 (monetary policy: banked/active split, decay adoption path)**, **1142 (error-recovery experiments: decision taxonomy + amendment process)** |
| 11 | Conclusion (the "new governance culture" close) | Manifesto | 718g |

### What the new docs contribute
- **935 (Monetary Policy for Merit):** the framing that Respect is an inflationary, decaying *flow* that measures current relevance and routes money - not money itself, not buyable/sellable. Feeds Ch 4 (what Respect is/is not) and the Ch 10 roadmap case for decay. Precedent set: Gitcoin 90-day expiry, Coordinape epoch reset, Colony 50%/90-day, SourceCred cred/grain split.
- **936 (Fractal Governance Design, verified):** the code-checked ground truth for Ch 5 + Ch 6, and the honest no-decay gap for Ch 9.
- **941 (Burn/Decay votable proposal):** the six-vote ballot (banked/active split, 180-day half-life, multi-signal participation, earned grace, Y3 legacy migration, bounty routing). This is Ch 10 roadmap material - the *proposed* future, explicitly not current architecture.
- **1142 (Error Recovery & Failure Modes Framework):** grounded in Rachmany's DAO-failure analysis (doc 1139), it names the failure modes that threaten ZAO Fractal and gives a detection -> containment -> recovery -> prevention pattern for each. Three pieces feed the whitepaper directly: (a) a **reversible-vs-irreversible decision taxonomy** - mark which governance calls can be undone *before* making them - for Ch 9; (b) an **amendment process** - Snapshot poll if reversible, else a new Fractal consensus vote, never a unilateral undo, with the "post-execution amendments > 15%/quarter = crisis" tripwire - for Ch 9 + Ch 10; (c) the **failure feedback loop** Rachmany says most DAOs lack - a required pre-impact "if this goes wrong, here's what breaks and how we fix it" note before major OREC proposals, plus a public post-mortem when an irreversible call goes bad. This is ZAO's biggest DAO-fail exposure (irreversible money/culture/governance decisions with no recovery path) stated honestly, which is exactly Ch 9's job.

## Gaps to close before drafting (per chapter)

| Chapter | Gap / verification needed |
|---|---|
| 4, 5, 6 | Re-verify the OG/ZOR/OREC contract addresses + chain on-chain before publish (718 already flagged; 718c cites Optimism). Confirm which chain is canonical now. |
| 5 | Confirm the live Fibonacci curve + consensus threshold against current code/process, not just 718b's description. |
| ~~8~~ | ~~Refresh the "90+ weeks" count~~ → **CLOSED 2026-07-17:** use "100+ weekly Respect Games (Discord-recorded), with 63 weeks of verified on-chain Respect settlement on Optimism" (doc 1201 + doc 1202). OG/ZOR ledger split: 157 unique holders (doc 1200). |
| 9 | Confirm the "two wallets drive OREC" operating-core claim is still true (it drives the honesty chapter). |
| 9 | Weave in doc 1142's error-recovery framework: the reversible/irreversible decision taxonomy, the amendment process, and the failure feedback loop. State the "irreversible decisions with no recovery path" exposure (doc 1139) as a named open problem, not hidden. |
| 10 | 941's on-chain pieces (gas-free relayer submit, Snapshot-strategy bounty routing) are buildable-but-unbuilt - frame as roadmap, never as shipped. |

## Verification log (2026-07-02, against current code)

Four of the pre-draft gaps above are now closed by direct code check - these facts are safe to state in the whitepaper as current:

| Claim | Verified location | Result |
|---|---|---|
| No decay / no burn today | `src/lib/respect/voteWeight.ts:58` | `weight: Math.round(ogValue + zorValue)` - raw sum. Zero decay/half-life references anywhere in `src/lib/respect/` or `src/lib/agents/`. Confirmed. |
| Contract addresses + chain | `respect/transfers/route.ts`, `proposals/vote/route.ts`, `fractals/AboutTab.tsx` | OG `0x34cE89...216957`, ZOR `0x9885CC...E7445c`, OREC `0xcB05F9...6Be532` - all match 718c and resolve to **Optimism** (optimistic.etherscan.io). Confirmed. |
| Vote-weight path | `voteWeight.ts` | OG (ERC-20, formatEther) + ZOR (ERC-1155 integer) via viem multicall. Matches 718c/936. Confirmed. |
| Fibonacci scoring curve | `src/app/(auth)/fractals/AboutTab.tsx:33` | 1x: 55/34/21/13/8/5; 2x: 110/68/42/26/16/10 - matches 718b exactly. Confirmed. |
| Fractal week count (Ch 8) | doc 1201 + doc 1202 (2026-07-17) | Two-layer verified: (1) date-calc — start 2024-07-30, 716 days ÷ 7 = 102 complete weeks as of 2026-07-16; (2) on-chain — 63 distinct settlement weeks (OG 33 + ZOR 31, Blockscout-verified). Cite in Ch 8 as: **"100+ weekly Respect Games (Discord-recorded), with 63 weeks of verified on-chain Respect settlement on Optimism."** Confirmed. |

Still open (need on-chain / live data, not code): the "two wallets drive OREC" operating-core claim (Ch 9) — needs an on-chain/process query, not a grep. ~~Fractal week count~~ → CLOSED 2026-07-17 (see row above).

## "Two wallets drive OREC" - reopened, not resolved (2026-08-21)

Direct on-chain query against the OREC contract `0xcB05F9254765CA521F7698e61E0A6CA6456Be532`
on Optimism (Blockscout API, `/addresses/{addr}/transactions?filter=to`, fully
paginated - 7 pages, 311 total transactions, no further `next_page_params`,
queried 2026-08-21). Method: tallied `from` address and decoded `method` per
transaction.

**What the data shows:**

| Address | ENS (via ensdata.net, 2026-08-21) | vote | execute | other |
|---|---|---|---|---|
| `0x7234c36A71ec237c2Ae7698e8916e0735001E9Af` | confirmed = **Zaal's wallet** (doc 361, direct match) | 154 | 127 | - |
| `0x64A15b1D2DE581097CB48e5D82619203E24BB3e1` | no ENS found; NOT civilmonkey.eth's current address (see below) | 11 | 0 | - |
| `0xAED620c450911c38714E666cd84137767e3D6286` | resolves to **sim31.eth** | 5 | 4 | - |
| 6 more addresses | 1-3 votes each, none previously documented anywhere in the repo | 1-3 each | 0 | - |
| (1 tx from `0xBb7F...`) | - | - | - | contract-creation-shaped input (`0x60806040`), likely a decode artifact - excluded from counts above |

**The doc-703/1206 claim does not match this data as literally stated.**
`civilmonkey.eth` currently resolves (ensdata.net, 2026-08-21) to
`0x368C8A0AF7CBb2e9a7Bc0a0925Efb2AC00210bc1` - an address that does **not**
appear anywhere in the 311-transaction OREC history pulled above. Either (a)
civilmonkey's wallet changed/rotated since doc 703 (May 2026) and the old
address just isn't in this window, (b) the ENS name was reassigned, or (c)
civilmonkey interacts with a different contract in the OREC flow that this
query didn't cover. **Not resolved - flagging, not asserting.**

**What IS solid:** execution (the consensus-finalizing step) is still
concentrated - 131 of 135 total `execute` calls come from 2 addresses
(zaal.eth: 127, sim31.eth: 4). Voting is more distributed than doc 703/1206
state - 8 distinct addresses have cast votes, not 2. So the honest Ch 9
framing is narrower than the old claim: **execution is a 2-address
bottleneck (one of them not previously documented as a signer); voting
participation is wider than previously believed.** The exact "who is
`0x64A15b1D...`" and "did civilmonkey's wallet change" questions are open -
this overlaps `zao-identity`'s seam (trackers/who-decides-what), flagged
there via IN-FLIGHT.md rather than dug further here.

Do not cite "only two wallets, zaal.eth + civilmonkey.eth" in Ch 9 without
resolving the civilmonkey-address mismatch above. Cite instead: "execution
is concentrated in 2 of 9 addresses that have interacted with OREC as of
2026-08-21; identity of the non-Zaal execute-address is unconfirmed."

## Decisions locked (2026-08-21, Zaal via whitepaper-lane grill)

Four of the five original decisions are answered. **Form is DEFERRED** - a
new `zao-identity` lane owns it, because one-doc-vs-constitution turns on
what the constitution would actually contain (the on-chain Hats role/
governance structure, tree 226), which was undocumented until that lane
started walking the tree 2026-08-21. See `handoffs/zao-identity.md` and
`handoffs/whitepaper.md`. Do not re-ask Form; wait for that lane.

1. ~~Form~~ - DEFERRED to zao-identity lane.
2. **Audience: all three** (ZAO members + wider DAO/governance world +
   potential partners).
3. **Math on the page: appendix.** Fibonacci curve + decay math move out of
   the chapter prose into a reference appendix.
4. **Voice: academic throughout.** Overrides the 718f hybrid recommendation
   below (kept for the record) - every chapter, including 1/2/3/8/11, is
   precise/citable rather than manifesto-toned. The chapter map's Voice
   column (row below) is stale as of this decision; treat it as "academic"
   uniformly, not per-chapter.
5. **Decay stance: both, clearly separated** (current no-decay reality in
   Ch 5/6, doc 941's proposal as roadmap in Ch 10) - matches the doc's own
   recommendation.

Original brainstorm-gate text, kept for provenance:

> 1. Form: one whitepaper, or whitepaper + a short separate constitution?
> 2. Audience: ZAO members, wider DAO/governance world, partners, or all three?
> 3. Math on the page: inline or appendix?
> 4. Voice: manifesto, academic, or the 718f hybrid?
> 5. Decay stance: (a) current-only, (b) proposed-only, (c) both, separated?

## Decision 6 - two-tier document structure (2026-08-21, added mid-draft)

Zaal, expanding on the appendix decision: *"do more things with the appendix.
Maybe we do a long whitepaper and more technically whitepaper things are all
in the appendix but we still need a normie simplified paper as the first
entry point."*

This is a SEPARATE decision from the deferred Form question (Form was
whitepaper-vs-constitution, i.e. argument-doc vs rules-doc; this is
reading-depth tiering within the whitepaper itself) - it does not wait on
zao-identity.

**Locked shape: two documents, one whitepaper.**

1. **The long whitepaper** (academic voice, all 11 chapters, all-three
   audience). Technical weight - Fibonacci curve derivation, decay-proposal
   math (doc 941), contract addresses, on-chain verification methodology,
   the 718a-g literature review, full citation list - moves OUT of chapter
   prose and into a lettered appendix (Appendix A: Mechanism Math, Appendix
   B: On-Chain Verification, Appendix C: Literature & Citations, growing as
   drafting proceeds). Chapter prose stays readable at academic-but-not-
   footnoted density; a reader who wants the derivation follows an appendix
   pointer.
2. **The normie entry point** (new, short, plain-language). Not a
   constitution, not a summary-by-deletion - a standalone on-ramp: what ZAO
   Fractal is, why it exists, how Respect works, written so someone with zero
   governance-theory background finishes it understanding the shape of the
   thing. Ends with a pointer into the long whitepaper for anyone who wants
   the argument, the citations, or the math. Same academic-honesty standard
   (no live/proposed conflation) at plain-language altitude - closer to
   `dreamnet-communication-standard.md`'s "Explain It To A 12-Year-Old"
   register than to Ch 1's Preamble.

Both documents ship together; the normie doc is not a replacement draft, it
is the front door. Numbering: long whitepaper stays under this 942 lineage;
the normie doc gets its own doc number when drafted (see doc 2358 below).

## Also See
- [Doc 718](../718-zao-fractal-whitepaper-foundations/) - the 7-sub-doc research foundation + v1 outline
- [Doc 935](../935-monetary-policy-for-merit/) - monetary policy for merit
- [Doc 936](../936-fractal-governance-design/) - fractal governance design (verified ground truth)
- [Doc 941](../941-respect-burn-decay-proposal/) - the votable burn/decay proposal
- [Doc 696](../696-respect-fractal-lineage-summary/), [Doc 703](../703-zao-fractal-current-state-may-2026/) - lineage + current state

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Brainstorm the 5 decisions above (form, audience, math, voice, decay stance) | @Zaal + @Claude | Brainstorm | Before any draft |
| Re-verify contract addresses, chain, week count, Fibonacci curve, operating-core claim | @Claude | Verification | Before drafting Ch 4-9 |
| After brainstorm: draft chapter by chapter, each grounded in its mapped v2 sources | @Zaal + @Claude | Writing | Magnum-opus timeline |
| Keep Ch 9 honest - the no-decay gap and the two-wallet core are features of credibility, not things to hide | @Zaal | Principle | Standing |

## Sources
Synthesis doc - no new external research. Reconciles existing ZAO governance docs: 718 (+ sub-docs 718a-g), 935, 936, 941, 696, 703. The one load-bearing new fact (ZAO runs no decay) is code-verified in 936 against `src/lib/respect/voteWeight.ts`. All external figures inherited from 718 still carry 718's "re-verify against primary sources before publish" caveat.
