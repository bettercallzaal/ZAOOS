---
topic: farcaster
type: audit
status: research-complete
last-validated: 2026-05-29
superseded-by:
related-docs: 318, 468, 484, 761
original-query: "ZAO Farcaster multi-agent system on the Quilibrium stack - verify and deepen the architecture decisions from doc 761: self-hosted Hypersnap read node, QKMS Ed25519 signer custody, FFX serverless exec (private beta), Klearu CLI safety classifier, OpenRouter -> Router402 x402 reasoning, multi-agent registry + softmax ranker + guard battery per doc 318. Confirm the unverified items (QKMS Ed25519 key-spec, FFX API surface, write endpoint options) and surface anything that contradicts the locked decisions."
tier: DEEP
---

# 762 - Quilibrium Stack Verification (companion to doc 761)

> **Goal:** Verify the unverified items in doc 761 (QKMS Ed25519, FFX API, write endpoint) against live sources, and surface anything that contradicts the locked decisions. This doc is the evidence layer behind the doc 761 build (branch `ws/zao-farcaster-multiagent`, PR #729).

## Key Decisions (recommendations first)

| Decision | Verdict | Why |
|----------|---------|-----|
| **Write endpoint: USE Neynar hub `hub-api.neynar.com/v1/submitMessage`** | CONFIRMED | POST raw protobuf (octet-stream), x402 `X-PAYMENT` header (EIP-3009), 0.001 USDC/call on Base to `0xA6a8736f18f383f1cc2d938576933E5eA7Df01A1`. Well-synced (seconds vs public hubs millions behind). |
| **FIX write.ts: it sends a Bearer key, not the x402 `X-PAYMENT` header** | BUG FOUND | The Neynar hub is paid via EIP-3009 `transferWithAuthorization`, not an api_key. Bearer auth will not pay -> writes fail. Corrected on the branch. |
| **FIX register-signer.ts: call `SignedKeyRequestValidator.encodeMetadata()`, do NOT manual-ABI-encode** | BUG FOUND | Neynar docs: manual encoding misses the dynamic offset pointer in the metadata struct. Use the on-chain view function. Corrected on the branch. |
| **Signer: SHIP on `@noble/ed25519` (in-process), treat QKMS Ed25519 as unlikely** | SHARPENED | Quilibrium's native curve is Ed448 / BLS48-581, not Ed25519. AWS KMS only added Ed25519 on 2025-11-07. QKMS (Q1 2026, KMS-compatible) covering the newest AWS key-spec for a curve its own network does not use is improbable. Keep QKMS as optional custody; do not block on it. |
| **Klearu is NOT classification-only - it is a private LLM inference runtime** | CONTRADICTION | Doc 761 locked "Klearu = classification ONLY, never reasoning". Reality: Klearu (github.com/QuilibriumNetwork/klearu) is a LLaMA-compatible E2EE inference + sparse-training stack. It CAN reason. Re-scope: Klearu is a candidate REASONING plane (private inference), and a safety gate is a prompt on top of it - not a separate "classifier-only" product. |
| **"FFX" is not a shipped Quilibrium product - it is a beta codename for the future lambda layer** | CLARIFIED | No "FFX" in public docs. Quilibrium serverless today = QCL via `qclient deploy compute` + `qclient compute execute` (MPC, party/rendezvous). The roadmap lists "lambda functions" + "AI execution" as ETA TBD. FFX exec is NOT an HTTP API today; the exec/ffx.ts HTTP shape is a placeholder, correctly stubbed. |
| **Reasoning: OpenRouter today, Router402 swap CONFIRMED viable** | CONFIRMED | Router402 (router402.xyz, HackMoney 2026 finalist) is an OpenRouter-compatible `/v1/chat/completions` gateway, x402 USDC on Base, ~0.2s Flashblocks settlement. Drop-in base-URL swap = exactly caster/reason.ts's design. Caveat: hackathon-stage, Claude+Gemini only, no SLA. |
| **Self-hosted Hypersnap node = reads/events only** | HOLDS | Corroborated: ecosystem guidance is "run your own mainnet hub and broadcast permissionlessly" OR use a write-enabled 3rd-party hub; reads and writes are separate planes. Writes still need a write-enabled/synced hub (Neynar). No contradiction with doc 761 caveat 1. |

## Findings

### 1. Write endpoint (was: "pick Neynar write API or another hub")

Neynar's autonomous-agent guide is the canonical write path and matches our `farcaster/write.ts` almost exactly:

- Endpoint: `POST https://hub-api.neynar.com/v1/submitMessage`
- Body: raw protobuf message bytes (`Message.encode(message).finish()`), `Content-Type: application/octet-stream`
- Auth/payment: x402 `X-PAYMENT` header = base64(JSON) of an EIP-3009 `transferWithAuthorization` signature. `x402Version: 1`, `scheme: 'exact'`, `network: 'base'`, value `'1000'` (0.001 USDC), `to: 0xA6a8736f18f383f1cc2d938576933E5eA7Df01A1`.
- Sync checks: `GET /v1/onChainIdRegistryEventByAddress?address=` and `GET /v1/onChainSignersByFid?fid=`.
- Verify a posted cast: `GET https://api.neynar.com/v2/farcaster/cast?identifier=<hash>&type=hash`.

**Build correction:** our `write.ts` and `first-cast.ts` set `api_key` / `Authorization: Bearer`. That is wrong for the Neynar hub - it needs the x402 `X-PAYMENT` header. Two valid paths:
- (a) Self-custodied signer + raw `submitMessage` + x402 payment (our design). Requires building the EIP-3009 payment header (we have `@x402/evm` and `viem` in deps).
- (b) Neynar-managed signer + `POST /v2/farcaster/cast` with `signer_uuid` + `x-api-key` (simpler, but Neynar holds the signer - weaker sovereignty).

Updated [762] recommendation: ship (a) for sovereignty; keep (b) documented as the fast fallback.

### 2. Costs (was: "~$2 custody / ~$1 FID" from the prompt)

Verified ecosystem figures (Neynar guide + rishavmukherji/farcaster-agent):

| Operation | Network | Cost |
|-----------|---------|------|
| FID registration | Optimism | ~$0.20 |
| Add signer (KeyGateway.add) | Optimism | ~$0.05 gas |
| ETH -> USDC swap (for x402) | Base | ~$0.10 gas |
| Each write (cast/profile) | Base (x402) | 0.001 USDC |

So the doc 761 "~$1 FID / ~$2 custody" was a high estimate. Real day-one spend is ~$0.30-0.50 of gas plus a few USDC for casts. Fund ~$2-3 total to be safe (covers gas + a swap + headroom).

### 3. QKMS - Ed25519 unconfirmed, and less likely than doc 761 assumed

- QKMS is real, launched Q1 2026 via QConsole, alongside QStorage (S3-compatible), QQ (SQS), QPing (SNS). "Drop-in solution... manage multi party keys... without single points of failure."
- KMS compatibility = "use existing KMS toolsets by changing their endpoints to Quilibrium's" (same model as QStorage/S3). So AWS-KMS SDK/CLI tooling is the integration path.
- Signing is MPC over the network ("utilize the network's Key Management application to perform MPC signing... output key can be used as an ImplicitAccount").
- **Curve mismatch:** Quilibrium's native cryptographic stack is **BLS48-581 / Ed448** (from the network spec), not Ed25519. AWS KMS only added `ECC_NIST_EDWARDS25519` on 2025-11-07. A Q1-2026 KMS-compatible service covering AWS's newest key-spec for a curve Quilibrium itself does not use is improbable.
- **Verdict:** keep `SIGNER_BACKEND=noble` (in-process `@noble/ed25519` via hub-nodejs `NobleEd25519Signer`) as the day-one path. QKMS stays a marked VERIFY stub. To confirm: log into qconsole.quilibrium.com, attempt to create a key with an Ed25519 spec; if absent, the question is settled (noble).

### 4. Klearu - contradicts the "classification-only" locked decision

`github.com/QuilibriumNetwork/klearu` - open-source Rust, 10 crates:

- `klearu-llm`: LLaMA-compatible inference engine (GQA, RoPE, RMSNorm, SwiGLU). Works with any LLaMA-arch model in safetensors. Run: `cargo run --release --bin chat -- ./model`.
- `klearu-private`: end-to-end private LLM inference via 2PC (Ferret OT, Ristretto255 OPRF, Beaver triples).
- `klearu-core` + `SLIDE`: sub-linear deep-learning engine (LSH: SimHash/WtaHash/MinHash), training + inference. ~3.5x CPU speedup vs TensorFlow on large output layers.
- `klearu-dejavu`: transformer sparsity prediction (the "Deja Vu" technique). (The prompt's "davit-infer" maps to this Deja Vu sparsity layer, not an image classifier.)
- `klearu-mpc`, `klearu-dpf`, `klearu-accel` (AVX2/NEON/BF16), `klearu-bolt`, `klearu-mongoose`.

**Implication:** doc 761's "Klearu = safety/classification ONLY (not reasoning)" is factually wrong. Klearu is Quilibrium's *private LLM inference runtime*. Two consequences for the build:
- Klearu could BE the reasoning plane (private, encrypted inference), competing with / complementing OpenRouter+Router402 - especially attractive for privacy.
- A "safety classifier" via Klearu is a prompt/classification head on top of an LLaMA model, not a separate `davit-infer`/`SLIDE` label CLI. Our `safety/klearu.ts` (env-driven command template) still works as a wrapper, but the underlying command is `klearu chat`-style inference, and `KLEARU_TEXT_CMD` should point at a Klearu invocation that returns a label - not assume a bespoke classifier binary.

### 5. FFX - codename, not a shipped HTTP API

- No "FFX" appears in Quilibrium public docs. The serverless/compute surface is **QCL (Quilibrium Compute Language)**: deploy with `qclient deploy compute application.qcl [schema.rdf]`, execute with `qclient compute execute <FullAddress> [<Rendezvous>] [<PartyId>] [k=v ...]`. MPC, multi-party rendezvous coordination, results finalized to the hypergraph, paid in QUIL.
- The roadmap explicitly lists "lambda functions, Redis-like databases" and "AI model training, and execution" as **ETA: TBD** (future phases).
- **Verdict:** FFX is a private-beta codename for the upcoming lambda layer (or a wrapper over QCL compute). Our `exec/ffx.ts` correctly throws-by-default; but its generic-HTTP-POST shape is a placeholder, not the real interface. When access lands, the real exec is likely `qclient deploy compute` + `qclient compute execute` (CLI/QCL), not an HTTP function endpoint. Keep the stub; do not present the HTTP shape as confirmed.

### 6. Router402 / reasoning - confirmed drop-in

Router402 (`router402.xyz`, `github.com/itublockchain/hackmoney-router402`, ETHGlobal HackMoney 2026 finalist, "LI.FI Best AI Smart App"):
- OpenRouter-compatible `/v1/chat/completions`. "Point your existing tools at Router402. Same API shape, same model strings."
- x402 micropayments, USDC on Base, modified OpenFacilitator on Base Flashblocks (~0.2s settlement). Each request settles the *previous* request's exact cost. Funds stay in the user's smart account (Pimlico/ZeroDev session keys).
- Stack: Express/TS, Prisma/Neon, Viem, USDC. Proxies Anthropic (Claude) + Google (Gemini).
- **Caveat:** hackathon-stage (Jan 2026), no SLA, Claude+Gemini only. Fine for the "swap base URL later" plan; do not treat as production-hardened. GPU-Bridge / BlockRun are the named alternatives (per doc 761) if Router402 stalls.

This validates `caster/reason.ts` exactly: keep `OPENROUTER_BASE_URL` swappable; no code change needed to adopt Router402, only env.

## Contradictions / corrections summary

1. Klearu is a reasoning runtime, not a classifier-only product (locked decision wrong).
2. write.ts uses Bearer auth; the Neynar hub needs x402 `X-PAYMENT` (build bug).
3. register-signer.ts manual-encodes metadata; must use `SignedKeyRequestValidator.encodeMetadata()` (build bug).
4. Costs are ~5x lower than the prompt's estimate (FID ~$0.20, not ~$1).
5. QKMS native curve is Ed448/BLS48-581 -> Ed25519 support less likely than "inferred".
6. FFX is a codename for an unreleased lambda layer; real exec is qclient/QCL.

None of these break the doc 761 architecture - the planes are right. They sharpen the signer choice (noble day-one), fix two write-path bugs, and re-open Klearu as a possible private reasoning plane.

## Also See

- [Doc 761](../../agents/761-zao-farcaster-multiagent-quilibrium-stack/) - the architecture + build this verifies
- [Doc 318](../../agents/318-cassie-multi-agent-coordination-bootcamp/) - multi-agent design source
- [Doc 468](../468-zao-farcaster-hub-poidh-hypersub-dual-hub/) - dual-hub read/write split
- [Doc 484](../484-matricula-autonomous-farcaster-agent/) - autonomous Farcaster agent prior art

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Fix write.ts + first-cast.ts to send x402 `X-PAYMENT` (EIP-3009) for the Neynar hub | @Zaal | PR (this branch) | This session |
| Fix register-signer.ts to call `SignedKeyRequestValidator.encodeMetadata()` | @Zaal | PR (this branch) | This session |
| Correct cost figures in doc 761 OPS-RUNBOOK (FID ~$0.20, signer ~$0.05, cast 0.001 USDC) | @Zaal | PR (this branch) | This session |
| Decide: keep Klearu as safety-only OR adopt it as a private reasoning plane | @Zaal | Decision | Before Phase 4 |
| Verify QKMS Ed25519 at qconsole.quilibrium.com (likely absent -> noble) | @Zaal | Manual | Before Phase 1 run |
| When FFX beta lands, re-shape exec/ffx.ts to qclient/QCL compute, not HTTP | @Zaal | PR | On beta access |

## Sources

- [Quilibrium KMS overview](https://docs.quilibrium.com/docs/discover/quilibrium-kms/) [FULL] - MPC, purpose-bound, warm keys
- [Q Service APIs](https://docs.quilibrium.com/docs/build/q-service-apis/) [FULL] - QKMS/QStorage, KMS-compatibility "change endpoints"
- [Quilibrium Credentials](https://docs.quilibrium.com/docs/api/credentials/) [FULL] - QConsole + QKMS CLI + 3rd-party tools
- [Q Story and Roadmap](https://docs.quilibrium.com/docs/discover/q-story/) [FULL] - Q1 2026 APIs launched; lambda/AI exec ETA TBD
- [Quilibrium Compute Commands](https://docs.quilibrium.com/docs/run-node/qclient/commands/compute/) [FULL] - `qclient compute execute`, MPC, rendezvous/party
- [Quilibrium Deploy Commands](https://docs.quilibrium.com/docs/run-node/qclient/commands/deploy/) [FULL] - `qclient deploy compute` QCL
- [Quilibrium Node RPC](https://docs.quilibrium.com/docs/run-node/qclient/rpc/) [FULL] - MPC signing -> ImplicitAccount
- [Quilibrium / Klearu landing](https://qstorage.quilibrium.com/infoquil/index.html) [FULL] - Klearu crates, LLaMA inference, SLIDE, Ed448/BLS48-581 stack
- [Klearu repo](https://github.com/QuilibriumNetwork/klearu) [PARTIAL - landing page describes crates; repo source not deep-read] - klearu-llm, klearu-private 2PC inference
- [AWS KMS EdDSA announcement (2025-11-07)](https://aws.amazon.com/about-aws/whats-new/2025/11/aws-kms-edwards-curve-digital-signature-algorithm/) [FULL] - Ed25519 added Nov 2025
- [AWS KMS key spec reference](https://docs.aws.amazon.com/kms/latest/developerguide/symm-asymm-choose-key-spec.html) [FULL] - ECC_NIST_EDWARDS25519 spec
- [Neynar - Autonomous Farcaster Agent](https://docs.neynar.com/docs/autonomous-farcaster-agent) [FULL] - hub submitMessage, x402 X-PAYMENT, costs, encodeMetadata warning
- [Neynar - Hello World (write to hub)](https://docs.neynar.com/farcaster/developers/guides/basics/hello-world) [FULL] - makeCastAdd + NobleEd25519Signer + submitMessage; run-your-own-hub note
- [Neynar - Post a cast (REST)](https://docs.neynar.com/reference/publish-cast) [FULL] - managed signer_uuid alternative
- [Router402 homepage](https://www.router402.xyz/) [PARTIAL - homepage rendered as binary; content confirmed via GitHub/ETHGlobal]
- [Router402 repo](https://github.com/itublockchain/hackmoney-router402) [FULL] - OpenRouter-compatible, x402 Base Flashblocks
- [Router402 ETHGlobal showcase](https://ethglobal.com/showcase/router402-b717q) [FULL] - HackMoney 2026 finalist, architecture
- [rishavmukherji/farcaster-agent](https://github.com/rishavmukherji/farcaster-agent) [FULL] - corroborates costs + submitMessage flow
