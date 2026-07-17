---
topic: governance
type: guide
status: research-complete
last-validated: 2026-07-02
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
| 8 | The ZAO Fractal (90+ weeks, music, OG/ZOR, the social client) | Manifesto / narrative | 718g, **703 (current state)** |
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
| 8 | Refresh the "90+ weeks" count and the OG/ZOR ledger split numbers to the current week (703 is the anchor; re-date it). |
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

Still open (need on-chain / live data, not code): the current fractal week count (718g's "90+ weeks" - re-count before Ch 8) and the "two wallets drive OREC" operating-core claim (Ch 9) - both need an on-chain/process query, not a grep.

## Decisions only Zaal can make (the brainstorm gate)

These block chapter drafting. Unchanged from 718's open questions, restated so the loop can surface them:

1. **Form:** one whitepaper, or whitepaper + a short separate constitution (whitepaper argues; constitution states rules)?
2. **Audience:** ZAO members, the wider DAO/governance world, potential partners, or all three? Changes the voice.
3. **Math on the page:** Fibonacci + decay math inline, or in an appendix?
4. **Voice:** manifesto, academic, or the 718f hybrid (manifesto for vision, precision for mechanics, plain honesty for risks)?
5. **Decay stance in the doc:** does the whitepaper (a) describe only current no-decay reality, (b) present 941's decay proposal as the recommended future, or (c) both, clearly separated? Recommendation: (c) - current in Ch 5/6, proposed in Ch 10.

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
