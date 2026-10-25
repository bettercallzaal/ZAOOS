---
topic: agents
type: audit
status: research-complete
last-validated: 2026-10-23
superseded-by:
related-docs: "agents/2138-spore-phase3-cross-runtime-conformance, agents/2702-dreamnet-state-2026-10-22, agents/2124-spore-interop-federation-v0.2"
original-query: "re-run the Spore conformance check against Brandon's current SDK ref (ahead_by 2, RFC 8785) and record the real pass count. Fetch and run, but change no live endpoint." (messenger lane, 2026-10-23, from doc 2702's first Next Action)
tier: QUICK
---

# 2707 - Spore conformance re-check against SDK f230dd0: 35/35 on fixtures, the 12 live checks not run

> **Goal:** Find out whether ZAO's Spore runtime still conforms to Brandon Ducar's `dreamnet-spore-sdk` at its current head, `f230dd0`. The live endpoint advertises 47/47 against the older pin `4072102a` (doc 2702).

**Credit:** the Spore SDK and its canonicalization are Brandon Ducar's (DreamNet, Apache-2.0 per the LICENSE file at `f230dd0`).

## Key Decisions

| # | Recommendation | Why |
|---|---|---|
| 1 | **KEEP the live endpoint's claim as it is for now, but do not re-word it to name `f230dd0`.** | The 35 fixture checks pass. The 12 live checks against `f230dd0` were not run (see Result), so nothing here proves conformance to the new head. |
| 2 | **RUN the 12 live checks in a lane allowed to execute the SDK, with `SPORE_SDK_PATH` pointing at a `f230dd0` checkout.** | That is the one measurement still missing. This session was blocked from installing the SDK's dependency. |
| 3 | **DECIDE whether ZAO should match the SDK's new refusal of `undefined`.** | From the source: ZAO omits `undefined` and the SDK at `f230dd0` throws on it. For inputs that hold `undefined`, ZAO hashes bytes the SDK refuses to produce. No fixture covers that case. |

## Result

| Check | Count | Ran on | Result |
|---|---|---|---|
| Fixture mode, `npx tsx scripts/spore-conformance.ts` with no `SPORE_SDK_PATH` | 35 checks | ZAOOS worktree at `a256df5a`. Its `src`, `scripts`, `bot` and `packages` are identical to `origin/main` `e86864932` (`git diff --stat` is empty) | **35 passed, 0 failed**, exit 0 |
| Live mode: 10 "LIVE sdk bytes match" plus 2 digest recomputations (`scripts/spore-conformance.ts:139`, `:148`, `:151`) | 12 checks | not run | **NOT RUN.** Installing the SDK's one dependency (`canonicalize@5`) was refused by this session's auto-mode classifier, reason "[Code from External]". Running the SDK is the same action, so it was not attempted another way |
| Proxy: an RFC 8785 implementation already installed in ZAOOS (`canonicalize@2.1.0`, via `@privy-io/node`) applied to the 10 pinned vectors | 10 vectors | same worktree | **10 identical, 0 different.** A control (`{b:1,a:2}` against its unsorted form) was detected as different |

So 35 + 12 = 47 is the doc 2138 total, and today 35 of those 47 are re-measured. The proxy is evidence, not proof: it is a different major version (2.1.0) from the SDK's dependency (`^5.0.0`), and it does not run the SDK's own guards.

## What changed in the SDK between the pin and `f230dd0` (read, not run)

`git diff --stat 4072102a f230dd0` on the cloned SDK shows `src/canonicalization.ts` (+51, new) and `src/contracts/index.ts` (78 lines changed).

- `canonicalJsonStringify` now calls `canonicalizeJson` (`src/contracts/index.ts:189-191`), which runs input guards and then the `canonicalize` package, an RFC 8785 (JCS) implementation (`src/canonicalization.ts:1`, `:48`). Its doc comment still says "DreamNet Sorted JSON v0" (`src/contracts/index.ts:187`).
- The new guards throw on anything that is not finite JSON (`canonicalization.ts:24`), including `undefined`; on cycles (`:25`); on depth over 64 or more than 100,000 nodes (`:20`); on lone UTF-16 surrogates (`:13-16`); on sparse arrays (`:35`); and on output over 1 MiB (`:49`).
- ZAO's canonicalizer omits `undefined` object values and writes `null` for `undefined` array items (`src/lib/eyes/observation.ts:43`, `:49`). On those inputs ZAO produces a hash where the SDK throws.
- The fixture named `undefined-omission` is stored as JSON, so its input holds no `undefined` and cannot test this.

## Evidence split

- **Proven:** 35/35 fixture checks at the stated ref; 10/10 pinned vectors byte-identical under an RFC 8785 implementation, with a control.
- **Hypothesis:** the 12 live checks pass against `f230dd0`, because JCS and sorted-JSON v0 agree on all 10 vectors. Not tested.
- **Known divergence, from source only:** the handling of `undefined` and lone surrogates differs. ZAO's surrogate handling was not read in this check.

## Also See

- [Doc 2138](../2138-spore-phase3-cross-runtime-conformance/) - the original 47/47 run against `4072102a`
- [Doc 2702](../2702-dreamnet-state-2026-10-22/) - why this re-check was asked for (in review as ZAOOS #4145)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Run `SPORE_SDK_PATH=<f230dd0 checkout> npx tsx scripts/spore-conformance.ts` in a lane permitted to install and execute the SDK, and append the live count to this doc. Shipped when the doc shows a 47-check result at `f230dd0` | dreamnet lane | PR | 2026-10-30 |
| Add a TypeScript-side vector with an `undefined` value, and decide whether ZAO matches the SDK's refusal. Shipped when a ZAOOS PR adds the vector and the chosen behaviour | dreamnet lane | PR | 2026-11-06 |

## Sources

- [FULL] [github.com/BrandonDucar/dreamnet-spore-sdk](https://github.com/BrandonDucar/dreamnet-spore-sdk), cloned at `f230dd0eaae3c6a235bfb4eff0610708050177a7` (committed 2026-09-27). Read: `src/canonicalization.ts`, `src/contracts/index.ts`, `package.json`, LICENSE (Apache-2.0). Not executed
- [FULL] ZAOOS `scripts/spore-conformance.ts`, `src/lib/spore/__tests__/fixtures/cross-runtime-vectors.json`, `src/lib/eyes/observation.ts`, at `origin/main` `e86864932`
- [FULL] The local fixture-mode run output, 35 PASS lines, captured to a file and counted with `grep -c '^PASS'`
- [FAILED - BLOCKED] the live SDK run: the dependency install was refused by the session's permission classifier ("[Code from External]")
