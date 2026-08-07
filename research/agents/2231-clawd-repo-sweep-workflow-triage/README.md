---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-06
related-docs: 2225, 2228, 2229, 2230
original-query: "test the Workflow tool + broaden research: fan out 6 clawd/Austin repos in parallel, each mapped to a real ZAO need, verify citations, triage which earn a full adopt-spec"
tier: DISPATCH
---

# 2231 - clawd repo sweep: 6-repo parallel Workflow triage (verified)

> **Goal:** Broaden the clawd/Austin research beyond the trust chain by reading 6 more
> repos IN PARALLEL (a Workflow test), verifying the subagents' citations, and grading
> honestly which earn a full ZAO adopt-spec next.

## Method (and the Workflow-tool test result)

Ran a `parallel` fan-out Workflow (run `wf_8c1b8986-871`): one grounded reader agent per
repo, each with the research-grounding preamble (REAL FETCHES ONLY), each returning a
structured finding (schema-forced) with real file:line citations. Result: **6/6 agents,
0 errors, 73 tool_uses (~12/agent), 473k subagent tokens, 158s wall-clock.** The
tool_use count is consistent with real clones + reads, not fabrication.

**Citation verification (orchestrator spot-check, per research-grounding rule).** All 6
agents graded their repo `worth_full_spec: true` - textbook grade-inflation, so I did NOT
trust it. I fetched 3 load-bearing citations from the real repos via `gh api` and confirmed:

- leftclaw `packages/nextjs/lib/postJobFor.ts` - REAL: x402 import, USDC address, `postJobFor`
  ABI, approve logic present (agent's line-range :69-118 was imprecise; content is real). VERIFIED.
- clawdviction `packages/hardhat/contracts/ClawdVictionStaking.sol:8` - REAL: literally
  "Stake $CLAWD tokens to earn clawdviction (amount x time)". VERIFIED.
- claude-p-router `env` - REAL pool/utilization logic (function is `_pool_map` at :208,
  agent said `_poll_pools` at :223-243 - naming/line slip, substance real). VERIFIED.

Verdict: findings are **grounded** (minor line/function-name imprecision, no fabrication).
The Workflow tool is a genuine research-breadth multiplier - 6 grounded reads in one tick.
All repos are **MIT via clawdbotatg / Austin Griffith** (credited).

## The honest triage (NOT "all 6 worth a spec")

### Earn a full ZAO adopt-spec (3)

1. **leftclaw-services -> POIDH bounties.** On-chain job marketplace on Base, CLAWD/USDC,
   with an **x402 -> on-chain job-creation gateway** (`postJobFor.ts`: HTTP x402 USDC ->
   auto USDC->CLAWD Uniswap-V3 swap -> `postJobFor` contract call, with approve/slippage/
   finality). POIDH is a live ZAO Base+CLAWD/USDC bounty system - the payment plumbing +
   on-chain escrow pattern translate directly (POIDH would add identity gating + bounty
   service-types). HIGH fit. FULL SPEC.
2. **clawdviction -> ZAO Respect / ORDAO governance.** Conviction voting (`conviction =
   amount x time`, no lockup) + a **personal AI "larva" agent per holder** that is trained
   to represent them and auto-participates, with vote aggregation (+ a futarchy/prediction-
   market extension). Maps almost exactly onto ZAO Respect + Fractal governance + the
   ZOL/ZAI agent layer. HIGH fit. FULL SPEC.
3. **clawd-clipper -> ZAO content / newsletter.** A 4-stage clip-mining pipeline
   (select -> anchor -> judge -> copy) whose standout is **hallucination-proof word-level
   anchoring**: Claude returns VERBATIM QUOTES (never timestamps), then each quote is
   matched into a word-timed transcript; a clip that can't be anchored to real spoken
   words is DROPPED, never faked. That anti-fabrication-by-construction is a strong,
   ZAO-aligned pattern for episode/COC/ZAOstock clips. HIGH fit + novel. FULL SPEC.

### Already-covered or lower value - adopt ONE idea at most, NOT a full spec (3)

4. **claude-p-router -> ZOE cost routing.** Its try->fallback->degrade->cache pool router
   is real, but **ZOE already has `callCapFallback` + the cheap->frontier fleet failover**
   (`bot/src/zoe/models/router.ts`, per this session's #2889/#2900). The one net-new idea:
   a **read-only "what's cheapest right now" status endpoint** that queries without routing
   (for a ZOE dashboard). Adopt that one idea; no full spec.
5. **claude-p-telegram -> ZOE.** Its `chunk_reply()` (4096-char line-aware chunking) is
   exactly what **ZOE already has in `bot/src/zoe/tg-chunk.ts`** (tonight's first commit
   even hardened it). Per-chat memory + allowlist polling are also already in ZOE. Little
   to adopt; no spec. (Honest: the agent itself flagged "ZOE likely has basic chunking.")
6. **clawd-calendar -> ZABAL Games booking.** A zero-dep Calendly with a clean access-tier
   -> base-config -> per-token-override rules chain. But **ZABAL Games already uses cal.com**
   (glossary: cal.com/bettercallzaal/zabal-games-workshop-slot). The rules-resolution idea
   is nice but cal.com is the chosen tool. No spec unless we leave cal.com.

## Decision

3 full adopt-specs to write next (one per tick): **leftclaw->POIDH x402 payment plumbing**,
**clawdviction->ZAO Respect conviction+AI-agent governance**, **clawd-clipper->content clip
pipeline w/ hallucination-proof anchoring**. The other 3 are already-covered (ZOE
router/chunking) or tool-chosen (cal.com) - adopt at most the one router status-endpoint idea.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Full adopt-spec: leftclaw x402->on-chain-job gateway for POIDH bounties | @Zaal (Claude) | Research doc | 2026-08-07 |
| Full adopt-spec: clawdviction conviction + per-holder AI agent for ZAO Respect/ORDAO | @Zaal (Claude) | Research doc | 2026-08-07 |
| Full adopt-spec: clawd-clipper hallucination-proof clip pipeline for ZAO content | @Zaal (Claude) | Research doc | 2026-08-08 |
| Consider the router "cheapest-provider status endpoint" idea for a ZOE dashboard | @Zaal | Backlog | 2026-08-12 |
| Review this triage in the morning browse pile | @Zaal | Review | 2026-08-07 |

## Sources

- **Workflow run `wf_8c1b8986-871`** - 6 parallel grounded readers, 73 tool_uses, 0 errors.
  Per-agent findings in the run journal. [FULL, this session]
- **Orchestrator spot-checks via `gh api`** (2026-08-06): leftclaw `postJobFor.ts`,
  clawdviction `ClawdVictionStaking.sol:8`, claude-p-router `env` `_pool_map` - all VERIFIED
  against the real files. [FULL]
- **clawdbotatg repos (MIT, Austin Griffith):** leftclaw-services, clawdviction, clawd-clipper,
  claude-p-router, claude-p-telegram, clawd-calendar. [FULL - real clones by the reader agents]
- ZAO context checked: `bot/src/zoe/tg-chunk.ts`, `bot/src/zoe/models/router.ts` (already-have),
  glossary cal.com (ZABAL booking). [FULL, in-repo]

## Also See

- [Doc 2228](../2228-clawd-claude-p-agent-adopt-spec/), [Doc 2229](../2229-clawd-attest-eas-trust-adopt/) - the trust-chain adopt-specs.
