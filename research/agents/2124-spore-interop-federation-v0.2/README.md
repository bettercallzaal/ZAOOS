---
topic: agents
type: decision
status: research-complete
last-validated: 2026-07-29
related-docs: 2030, 2064, 2109
original-query: "Brandon's combined 'ZAO Spore Interoperability & Federation - Iteration v0.2' prompt (8 phases, canonical hash -> federation -> vendor-neutral trust protocol) + recap of the DreamNet/Brandon work."
tier: DEEP
---

# 2124 - Spore Interoperability & Federation v0.2 - the DreamNet plan of record

> **Goal:** Capture Brandon's full v0.2 federation spec as the plan of record, record the confirmed Phase 1 result (ZAO's hash is byte-identical to DreamNet's), and lay out the roadmap + the one blocker.

## Where we already are with Brandon (recap)

The ZAO organism is being built alongside DreamNet's, sharing primitives:
- **Organism, live on main:** Spine (receipt envelope + replay dedup, #2515), Cortex v1, Heart (lease-manager + 14-scenario recovery suite + agent_instances liveness + recovery cron, #2502/#2505/#2518/#2520), Bloodstream (Vacuum Spikes, #2548), Memory, Eyes, and the first living end-to-end flow (real Coinbase spike -> bloodstream -> memory, healthy in the Control Plane, #2552).
- **Spore alignment shipped (#2553):** `src/lib/spore/` stamps `sha256:dreamnet-sorted-json:v0` + SSRF-hardened the Vacuum Spike. Same sorted-json hash family as DreamNet - alignment, not a rewrite.
- **Two-plane role map agreed:** Telegram=command, cowork/Supabase=ZAO tasks authority, agent_runs=machine execution, GitHub=research/code, Slack=team+agent comms, Notion=wiki, Linear=cross-team. Connect, don't migrate.
- **Receipt thesis:** WaveWarZ "receiptable by design" (every action emits a verifiable receipt) - resolves the audit's #1 finding.
- **Open gap (still true):** nothing acquires leases yet - the Heart isn't wired into the execution path (see doc 2104-adjacent lease-wiring proposal).

## Phase 1 - CONFIRMED (this session, no SDK needed)

Brandon's v0.2 gives an exact golden vector. Tested against ZAO's **production** `canonicalize` (`src/lib/eyes` - `JSON.stringify(sortDeep(value))`):

- Payload `{"z":100,"a":"dreamnet-spore","m":{"b":true,"a":null}}`
- ZAO canonical output: `{"a":"dreamnet-spore","m":{"a":null,"b":true},"z":100}` - **byte-identical** to DreamNet's reference.
- ZAO SHA-256: `6b560a8869530ac60f9d3795e55d04240d237010140502f8f7a768d190de013a` - **exact match**.

**ZAO is provably a valid Spore node on the hash layer.** Locked as a permanent conformance test: `src/lib/spore/__tests__/dreamnet-conformance.test.ts`. This is the thing Zaal told Brandon he wanted to prove - done, and provable without Brandon's private SDK.

## Brandon's v0.2 - the 8 phases

1. **Canonical Hash Conformance** - golden vector. DONE (above).
2. **Portable Receipt Interchange** - every Vacuum Spike emits immutable `receipt.v1` / `PortableReceipt` (UUID ids, deterministic digest, replay-safe, full provenance).
3. **Cross-Runtime Verification** - DreamNet verifies ZAO receipts and vice versa; identical bytes/hashes/digests, altered-payload rejection, replay protection, edge cases (undefined, nested, arrays, non-finite). **NEEDS the private SDK** (to verify against DreamNet's real impl).
4. **Federation Protocol** - two independent organisms cooperate without sharing DBs/engines/memory: Observation -> Receipt -> Spore Transport -> ZAO Verification -> Claim -> DreamNet Verification. "Trust only protocol, never runtime."
5. **Portable Claims** - `claim.v1` (references receipts, not raw observations; provenance, issuer, supporting receipts, confidence, verification status).
6. **Portable Assignment Federation** - cross-organism assignments (accept/reject/defer/partial), every transition receipted, **sovereign execution** - neither organism controls the other's scheduler.
7. **Federation Verification** - detect tampering, hash drift, unsupported schema versions, invalid receipts/claims. No shared secrets.
8. **Federation Test Suite** - permanent interop fixtures (both directions, replay, corruption, schema evolution, version negotiation).

Each cycle ends with the **Architect's Progress Report** (13 sections) + auto-recommends the next milestone - no waiting for human prompts.

**Long-term vision:** Spore becomes a **vendor-neutral trust protocol** - neither DreamNet nor ZAO owns it. Any third organism that implements the spec + passes the conformance suite interoperates immediately. Trust emerges from deterministic contracts + receipts + verification, not shared infrastructure.

## The one blocker

**Phases 3+ need read access to the private `dreamnet-spore-sdk` repo** (Brandon's reference `PortableReceipt` / `claim.v1` contracts + his conformance vectors) to prove cross-runtime verification against HIS impl, not just our own. Brandon owes zao-assistant that access: *"I went to bed and didn't switch it to public - I'll do it soon and hit u back."* Phases 1 (done) and 2 (our-side receipts) proceed without it; Phase 3 is gated on it.

## Brandon's other open threads (from the catch-up)

- **Hermes (Nous Research)** - Brandon is pushing hard: free tier (Nous Portal, nemotron-550-ultra on high = free), bring Claude + GitHub + Google over, DreamLoops repo as skills. He wants a capabilities report ("tell Claude to give me a report on all current capabilities and where we stand"). Worth a real look + the report.
- **"Cerberus" / GitHub-as-database** - Brandon's hint: "forget databases, GitHub gives you unlimited databases with lightning retrieval via its CLI." (Note: the ZAOcowork terminal independently reached a similar idea.)
- **Govt funding** - Brandon has a Sam.gov entity license (can bid on govt contracts + grants). Cross-pollination, not a ZAO build.
- **Kismet piece** - Brandon's idea: raffle it ($5 tickets) or award to the next WaveWarZ comp winner.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge the Phase 1 golden-vector conformance test | @Zaal | PR | 2026-07-29 |
| Phase 2: upgrade Vacuum Spikes to emit `receipt.v1` (our side, no SDK needed) | @Zaal (ZOE) | Build | 2026-08-05 |
| Get read access to `dreamnet-spore-sdk` from Brandon, then run Phase 3 cross-runtime verification | @Zaal | Blocker | when Brandon grants |
| Give Brandon the capabilities report he asked for | @Zaal (ZOE) | Report | 2026-07-30 |
| Also wire the Heart into the execution path (the standing organism gap) | @Zaal | Build | 2026-08-05 |

## Also See

- [Doc 2030](2030-dreamnet-public-core-organism-contract/) - the organism contract
- [Doc 2064](2064-organism-runtime-memory-governance/) - organism runtime + Memory + governance
- [Doc 2109](2109-buzz-block-dorsey-human-ai-workspace/) - Buzz (adjacent agents-as-teammates substrate)

## Sources

- Brandon's "ZAO Spore Interoperability & Federation - Iteration v0.2" prompt (relayed by Zaal, 2026-07-29) [FULL - the 8 phases + deliverables + acceptance + long-term vision, verbatim]
- First-party: ZAO `src/lib/spore/spore.ts` + `src/lib/eyes/observation.ts` (`canonicalize`), tested live against the golden vector [FULL - byte + hash match confirmed]
