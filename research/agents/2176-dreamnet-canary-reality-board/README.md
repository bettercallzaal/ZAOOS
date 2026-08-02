# Doc 2176 - DreamNet Federation Canary: Phase 0 Reality Board + Architect's Report

**Status:** DESIGN / AUDIT ONLY. Nothing built, deployed, signed, traded, posted, or granted authority. This is the Reality Board Brandon's Iteration 1 spec requires *before any integration code.*
**Date:** 2026-08-01
**Trigger:** Brandon's "ZAO x DreamNet - Iteration 1: Trapper-to-Proof-to-Whale Federation Canary." Connect ONE ZAO agent to DreamNet through one bounded, independently verifiable, paper-only, read-only workflow - proving federation *without* granting dangerous authority.
**Method:** Two grounded read-only audits - (1) verify the SDK at the exact pinned commit from its code + tests, (2) classify every ZAO-side canary component. Anti-fabrication throughout (Brandon's explicit demand): no "merged = deployed," no "registered = active," every claim cites file:line, graded to the lowest classification the evidence supports.
**Related:** [[project_dreamnet_spore_sdk]], [[project_dreamnet_trust_layer]], docs 2170/2171/2175 (organism + sovereign-agent), `.claude/rules/dreamnet-communication-standard.md`, `anti-fabrication.md`.

---

## 1. Executive Summary (30 seconds)

Brandon wants to prove that an outside AI system (ZAO) can safely plug into DreamNet: receive a small, sandboxed job, do read-only research, produce cryptographically-signed proof it did the work, have a *different* part of the system independently check that proof, and earn "competency evidence" - all without ever touching money, wallets, public posts, or production controls. Before building any of that, the spec (rightly) demands a "Reality Board": an honest, evidence-backed map of what already exists vs what has to be built. We produced it. **The DreamNet protocol library is real and solid; ZAO's side is about 40-50% there but its federation layer is an older, weaker version that has to be upgraded, and the canary-specific parts (the isolated signer, the security gateway, the proof-issuer, the independent verifier) do not exist yet.** So this is mostly a greenfield build on a proven foundation - not a wiring job.

## 2. Why this matters

The whole value of this canary is that it's the first *public-story-quality* proof that a sovereign AI organism can federate **safely** - governed capability in, verifiable evidence out, independent check, zero dangerous authority. If we skip the Reality Board and just start wiring, we'd almost certainly re-discover mid-build that ZAO's Spore can't actually sign or verify with trust (it's "pre-trust"), and that half the pipeline (proof-drop, gateway, signer, verifier) is missing. Knowing that now means we sequence the build correctly and never overclaim a "working integration" that's really a contract.

## 3. Before vs After (what this audit changed)

```
BEFORE this audit
- "ZAO is a conformant DreamNet Spore node" (true for Phase 1-3, but easy to over-read
  as 'ready for the trust-enabled canary').
- Unknown whether the pinned SDK commit even exists or does what it claims.

AFTER
- SDK commit bb5d79a VERIFIED from code + 16 passing tests - every crypto property real.
- ZAO's Spore is INCOMPATIBLE with it (pre-trust vs trust-enabled) - a concrete,
  named gap, not a vibe.
- A component-by-component map of what's LIVE vs MISSING, so the build is sequenced, not guessed.
```

## 4. Explain Like I'm Smart (not a compiler)

- **"Pre-trust vs trust-enabled Spore":** ZAO today can package data and hash it so two machines agree on the bytes - but it can't *sign* who sent it, prove it wasn't replayed, or check the sender's key isn't revoked. The new SDK adds all of that (a signature, a one-time nonce, an expiry, a revocable key). ZAO would need to adopt that stronger version.
- **"Isolated canary signer":** the rule is ZAO's worker must never hold the private key that signs evidence. A separate tiny service holds the key and signs only *approved* packages. So even if the worker is compromised, it can't forge signatures. This doesn't exist yet.
- **"Producer can't verify its own claim":** the thing that *did* the work can't be the thing that *approves* the work - a different worker, different lease, checks it. That independent verifier doesn't exist yet.

## 5. Biological Analogy (the canary as an organ handshake)

Think of it as one organism (ZAO) donating a blood sample to a lab (DreamNet) through a sealed, one-way port:
- **Trapper archive** = a sealed vial of exactly the reagents needed for one test (a governed, minimal capability).
- **Receipt / Proof Drop** = the lab's chain-of-custody label - proof the sample was handled correctly.
- **Isolated signer** = the notary who stamps the label; the technician (worker) never holds the notary's stamp.
- **Verification Factory** = a *second, independent* lab that re-checks the result; the first lab can't sign off on itself.
- **Gateway** = the sealed port itself - it only lets the vial through, never the keys to the building.

## 6. Architecture Diagram (the canonical workflow - do not reorder)

```
Trapper archive (governed capability)
   -> archive verification (hash/manifest/signer, fail-closed)
   -> bounded ZAO assignment (read-only, paper-only market research)
   -> sandboxed execution -> execution trace
   -> TERMINAL receipt (COMPLETED/FAILED/... - exactly one)
   -> Proof Drop (evidence package, claims no more than proven)
   -> [ISOLATED CANARY SIGNER signs] -> signed SporeEnvelope + CloudEvent
   -> independent Claim Factory verification (separate worker+lease; producer != verifier)
   -> ACCEPTED
   -> Whale League PAPER thesis (simulation only, $0, private, pending Brandon)
   -> University competency EVIDENCE (no diploma, no authority)
```

## 7. Evidence (Proven / Hypothesis / Not-yet / Missing)

**PROVEN (verified from code + tests):**
- SDK `BrandonDucar/dreamnet-spore-sdk @ bb5d79a` (full SHA `bb5d79a114872e6d5649be2744a9e29efbe7b9c4`) exists; **16/16 conformance tests pass.** Every required property present with file:line: RFC 8785 canonicalization (`canonicalize.ts:28-101`), Ed25519-only signing (`envelope.ts:165`), domain-separated hashing (`envelope.ts:143-144`), audience binding (`envelope.ts:40` + `trust.ts:238`), nonce replay protection (`trust.ts:226-252`), expiry (`envelope.ts:124`), trusted-key resolution (`trust.ts:20-167`), revocation (`trust.ts:35-214`), fail-closed unknown schema (`trust.ts:52-54`). Legacy monorepo envelope hard-codes **QUARANTINE** (`legacyMonorepo.ts:51-107`) - matches the adversarial spec.
- ZAO receipts + terminal states: **LIVE** (`bot/src/zoe/receipts.ts`, `agent_runs` + `receipts` tables applied, `emitReceipt()` firing on the work-loop).
- ZAO Spore Phase 1-3 (canonical hashing + receipt.v1 + cross-runtime verify 47/47): merged + deployed. `/api/spore/verify` live/public.

**HYPOTHESIS (built, not proven live):**
- Heart leases (`packages/heart-fleet`) - deployed to main but **flag OFF**, so they govern nothing in prod yet.

**NOT-YET / MISSING (no code):**
- **Ed25519 signing on the ZAO side** (ZAO Spore is hash-only, "pre-trust").
- **Isolated Canary Federation Signer** (no separate signer service).
- **Federation Gateway** (no `spore.zao.canary.*` namespace isolation).
- **Proof Drop *emission*** (ZAO can *verify* proof artifacts, `interop.ts:70-95`, but not *create/drop* them - CONTRACT_ONLY).
- **Claim Factory + independent Verification Factory** (no claims table, no producer/verifier separation - MISSING).
- **ZAO candidate identity manifest / DID** (MISSING; ENS resolve exists but no manifest).
- **Trapper archive / warper-keeper** (MISSING in ZAO repos - Brandon's DreamNet-side construct).
- **Whale League + University** (MISSING - Brandon's org constructs).

**THE CRITICAL FINDING:** ZAO's Spore is pinned to an OLDER SDK commit (`4072102`), schema `dreamnet.spore.v0`, non-RFC-8785 hash, **no signatures/audience/nonce/revocation/policy**. It is INCOMPATIBLE with `bb5d79a`. To conform, ZAO needs: schema bump to `spore-envelope.v1`, Ed25519 signing, IssuerKeyResolver, ReplayStore, RevocationResolver, SchemaRegistry, and `verifyEnvelopeWithTrust()`.

## 8. Risks (what can still go wrong)

- **Technical:** ZAO's "pre-trust" Spore could be mistaken for canary-ready; it isn't. Building on it as-is would produce unsigned envelopes the DreamNet verifier must reject.
- **Architectural:** the producer/verifier separation is the security spine; getting it wrong (shared lease/process) invalidates the whole "independent verification" claim.
- **Security:** the isolated-signer rule (worker never holds the key) is non-negotiable; a naive "just sign in the worker" shortcut breaks the entire threat model.
- **Operational:** every new adapter must sit behind a flag defaulting OFF, or a half-built gateway leaks canary work into prod namespaces.
- **Economic/human:** none *introduced* - the canary is paper-only/$0 by construction, and this doc builds nothing.

## 9. Remaining Work (roadmap)

```
COMPLETED:  Spore Phase 1-3 (hash/receipt/cross-runtime), receipts+terminal states,
            Heart lease code, verify endpoint. SDK verified.
IN PROGRESS: this Reality Board (Phase 0).
BLOCKED/MISSING: Ed25519 ZAO signing, isolated signer, Gateway, Proof Drop emission,
            Claim+Verification Factory, candidate identity, Trapper handling, Whale, University.
NEXT:       upgrade ZAO Spore to bb5d79a trust contract (the unlock for everything downstream).
```

## 10. Explain It To A 12-Year-Old

ZAO wants to do a tiny job for a bigger club (DreamNet) to prove it can be trusted - like doing one supervised chore before you're handed the house keys. We checked what tools each side already has. The club's rulebook and lock (the SDK) are real and work great. ZAO has the notebook and the gloves, but its "signature stamp" is an old weak one that the club won't accept, and a few tools (the special sealed mailbox, the stamp-holder who isn't the worker, the second checker) haven't been made yet. So we wrote down exactly what's there and what to build - and we didn't touch any money, mail, or keys.

## 11. Teach Me Something (general engineering)

**Why "the producer can't verify its own claim" matters.** If the same process both does the work and approves it, a bug or a lie in the worker silently becomes "verified truth" - there's no independent check, so errors compound with a stamp of authority. Splitting producer and verifier (different identity, different lease, no shared process) is the same principle as separation of duties in accounting, or a second surgeon confirming the site before an operation. It's slower, and that's the point: the friction is the safety.

## 12. Strategic Impact

- **Spore:** the canary forces ZAO's Spore from pre-trust to trust-enabled - which is the upgrade the whole federation story needs anyway.
- **Claim Factory / University / Whale / Guilds:** all sit *downstream* of "signed evidence + independent verification." This canary builds the first vertical slice of that spine, so everything after inherits it.
- **DreamNet federation:** a passing canary is the reference other nodes copy - ZAO becomes the worked example.
- **Roadmap:** it converts the abstract "sovereign agent" vision into one concrete, safe, demonstrable slice.

## 13. Confidence

```
"SDK bb5d79a is real + has all required properties"     95% (code + 16 passing tests read directly)
"ZAO Spore is incompatible / pre-trust"                 90% (pinned commit, schema, no-signature code confirmed)
"Gateway/signer/ProofDrop/Claim-Verify are MISSING"     85% (no code found; some may be Brandon-side, not ZAO-side)
Unknowns: whether Trapper/Whale/University are meant to live on ZAO's side at all, or DreamNet's.
```

## 14. Next Iteration

**Highest-leverage next step:** upgrade ZAO's Spore to the `bb5d79a` trust contract (schema `spore-envelope.v1` + Ed25519 signing + key resolver + replay store + revocation), behind a flag, with the SDK's conformance fixtures as the test. **Why:** every downstream stage (Proof Drop, signed envelope, verification, University evidence) depends on trust-enabled envelopes; nothing else can be real until ZAO can produce one. **Expected outcome:** ZAO emits one envelope that the DreamNet verifier ACCEPTS. **Alternatives:** (1) build the isolated signer first (needed anyway, but useless without the envelope contract); (2) build the Gateway first (isolation is good, but there's nothing to gate yet); (3) stub the Claim/Verification Factory (premature - no signed claims to verify). **Tradeoff:** the Spore upgrade is the least flashy but unblocks the most. **Complexity:** medium - it's adopting an existing, tested SDK contract, not inventing crypto.

## ARCHITECT'S PROGRESS REPORT

- **What was built:** nothing (Phase 0 is audit-only, by mandate). Two grounded audits + this Reality Board.
- **What was reused/verified:** the SDK (`bb5d79a`, verified real), ZAO's Spore Phase 1-3, receipts, Heart code.
- **What was missing:** the trust layer on ZAO's Spore, the isolated signer, the Gateway, Proof Drop emission, the Claim+Verification Factory, candidate identity, Trapper handling, Whale, University.
- **What is genuinely live:** receipts + terminal states + the verify endpoint (deployed). Heart is deployed but flag-OFF.
- **What remains behind flags:** the Heart canary/lease flags (default OFF) - and every future canary adapter must join them.
- **What the canary would prove:** safe governed federation with cryptographic, independently-verified evidence and zero dangerous authority. **What it would NOT prove:** production readiness, economic capability, or fleet expansion (all explicitly out of scope).
- **Security findings:** ZAO's Spore is unsigned (pre-trust) - it must not be presented as canary-ready; the isolated-signer + producer/verifier-separation rules are the load-bearing security constraints and neither exists yet.
- **Operational overhead:** low for this doc; the real build is medium (Spore trust upgrade) then a series of flag-gated adapters.
- **Highest-leverage next progression:** the ZAO Spore trust upgrade (section 14).
- **Three ranked alternatives:** Spore upgrade (do this) > isolated signer > Gateway. Verifier/ClaimFactory last.
- **1-3 iteration roadmap:** (1) ZAO Spore -> `bb5d79a` trust contract, one ACCEPTED envelope. (2) isolated canary signer + Proof Drop emission. (3) independent Verification Factory + the adversarial test matrix. Whale/University are evidence sinks that come after.
- **Self-critique:** this board reads ZAO's repos; several MISSING items (Trapper, Whale, University) may live on DreamNet's side, so "MISSING in ZAO" is not "MISSING in the system" - confirm the boundary with Brandon. "Merged" Spore Phase 1-3 is deployed, but the trust layer's absence means ZAO's federation is earlier-stage than "conformant node" suggests in isolation.
- **Next logical step, no further prompt needed:** design the ZAO Spore trust-upgrade PR (contract-conformance, flag-gated, SDK fixtures as tests) - design only; no signing key, no deploy, no gated action, until Brandon confirms the ZAO/DreamNet component boundary.

## The four lenses

```
ENGINEER:  SDK bb5d79a verified (16 tests, all crypto props present). ZAO Spore is
           hash-only/pre-trust, incompatible - needs Ed25519 + trust deps. Gateway,
           signer, ProofDrop-emit, Claim/Verify factory = MISSING.
ARCHITECT: The organism has the "sense + hash + receipt" layer but not the "sign +
           independently-verify" layer. The canary builds the first safe vertical
           slice of federated, independently-verified evidence - the spine everything
           sovereign hangs off.
FOUNDER:   This is the first demo-able, public-story proof that ZAO can federate with
           DreamNet SAFELY - governed capability in, verifiable evidence out, zero
           money/keys/authority exposed. Real, and defensible.
INVESTOR:  A federation-conformant, independently-verified, trust-enabled agent
           organism is hard to replicate - it needs the crypto contract, the
           producer/verifier separation, and disciplined anti-fabrication audit. Each
           verified stage raises platform defensibility without adding risk (paper-only, $0).
```

## Hard lines (held throughout, all mandated OFF by the spec)

No real trade, wallet action, token deploy, contract write, public post, production deploy, credential/diploma issuance, trust score, economic authority, or fleet expansion. Paper-only, read-only, `$0`, signer key never in the worker, flags default OFF, human-gated. **This doc builds nothing** - it is the map that precedes the build.
