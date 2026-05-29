---
topic: farcaster
type: architecture + build-guide
status: in-flight (Phase 0/1 ops blocked on operator; in-repo scaffold landed)
last-validated: 2026-05-29
original-query: "Build a sovereign multi-agent Farcaster system for ZAO/$ZABAL, orchestrated by ZOE, on Quilibrium stack"
tier: DEEP
branch: ws/zao-farcaster-multiagent
related-docs: [084, 085, 291, 318, 304/haatz, 468, 727, 759]
---

# 761 - ZAO Farcaster Multi-Agent System on the Quilibrium Stack

> **Goal:** A sovereign, multi-agent Farcaster presence for the ZAO/$ZABAL community,
> orchestrated by ZOE, running as much as possible on Cassie Heart's Quilibrium stack
> (Hypersnap reads/events, QKMS signer custody, FFX serverless exec, Klearu safety,
> Router402 x402-metered reasoning later). Reasoning starts on OpenRouter.

## What this doc is

The architecture + step-by-step build guide. A prior cowork session did the research and
locked the decisions; this doc is the build reference. The in-repo scaffold (scripts +
ZOE caster + multi-agent layer) landed on branch `ws/zao-farcaster-multiagent`. The
real-world ops (provision a node, fund a wallet, register an FID, log into QKMS, request
FFX beta) are operator tasks and live in `OPS-RUNBOOK.md` in this directory.

---

## Locked decisions (do not relitigate without new info)

| Plane | Decision | Status |
|-------|----------|--------|
| Reads / events | Self-host a Hypersnap node | UNBLOCKED - build day one |
| Signer custody | QKMS (Ed25519) | INFERRED - VERIFY key-spec; noble fallback shipped |
| Reasoning | OpenRouter (user-selectable models) -> Router402 (x402/USDC-on-Base) later | OpenRouter shipped as sibling path |
| Safety / classification | Klearu ONLY (CLI/socket, no HTTP - wrapped) | wrapper shipped |
| Serverless exec | FFX (Quilibrium private beta) | beta request drafted |
| Orchestrator | ZOE, single-agent/poll/deterministic -> multi-agent/webhook/probabilistic (doc 318) | evolving |

Note: "Lucid" is **not** a real product. The x402-LLM gateways are Router402 / GPU-Bridge /
BlockRun. Do not design against "Lucid".

---

## Load-bearing caveats (read before building)

1. **A self-hosted Hypersnap node is READ-ONLY** (`read_node=true`; doc 586, corroborated by
   doc 304). It CANNOT post casts. Reads/events are free via the node; WRITES (casting) go
   to a write-enabled hub / Neynar write API, metered via x402 (cheap - dozens of casts/day).
   Do **not** design writes against the read node.

2. **QKMS Ed25519 support is INFERRED** from its AWS-KMS compatibility, not directly
   confirmed (Quilibrium docs are login-walled). VERIFY before relying. Fallback (shipped):
   hold the Ed25519 private key in QKMS as custody, sign in-process with `@noble/ed25519`.

3. **Prompt-vs-code drift:** ZOE has no `callLLM` switch. The real path is
   `dispatchConcierge` (bot/src/zoe/index.ts) -> `runConciergeTurn` (concierge.ts) ->
   `callClaudeCli` (bot/src/hermes/claude-cli.ts, Claude Max OAuth). "Add an openrouter case"
   is implemented as a **sibling reasoning path** (`bot/src/zoe/caster/reason.ts`), not a
   switch case, because the caster's draft step is a one-shot text generation, not a
   concierge turn with tools/memory blocks.

---

## Architecture (planes)

```
                          +------------------------------+
   Farcaster network <----| Hypersnap READ node          |  reads + gRPC event stream
                          | :3381 (Neynar v2 HTTP API)   |  FREE, READ-ONLY
                          | :3383 (gRPC subscribe)        |
                          +---------------+--------------+
                                          | events (filtered: bot FID / keywords)
                                          v
   +-------------------------------------------------------------------+
   |  ZOE orchestrator (bot/src/zoe)                                   |
   |                                                                   |
   |   gateway + allowlist + scheduler + concierge + memory (existing) |
   |                          |                                        |
   |   agent registry --> softmax ranker --> guard battery            |
   |                          |                                        |
   |                       caster pipeline:                            |
   |   draftCast (OpenRouter -> Router402 later)                       |
   |       -> safetyCheck (Klearu CLI wrapper, PRE)                    |
   |       -> Telegram approval (human gate)                           |
   |       -> publishCast (sign -> WRITE endpoint)                     |
   |       -> safetyCheck (Klearu, POST, optional)                     |
   +-----------------------------------+-------------------------------+
                                       | signed CastAdd (Ed25519)
                                       v
                          +------------------------------+
                          | WRITE endpoint               |  Neynar write API (x402)
                          | (write-enabled hub)          |  or another write hub
                          +------------------------------+

   Signer custody: QKMS (Ed25519, VERIFY) | fallback: noble in-process
   Serverless exec (Phase 4): FFX - one invocation per ranked action
   Safety: Klearu - davit-infer (images), SLIDE/LLaMA classifier (text)
```

### Read plane (Phase 0)
Self-hosted Hypersnap node exposes a Neynar v2-compatible HTTP API on `:3381` and a gRPC
event stream on `:3383`. Reads are free and unmetered. This replaces both paid Neynar reads
and the community `haatz.quilibrium.com` dependency for our own traffic. ZAOOS already runs a
dual-provider read setup (`FARCASTER_READ_API_BASE`; HAATZ wired). Point
`FARCASTER_READ_API_BASE` at the node.

### Write plane
The node cannot write. Casting requires a signed `CastAdd` (SIGNATURE_SCHEME_ED25519)
submitted to a **write-enabled** endpoint - the Neynar write API (metered via x402) or
another write-enabled hub. Cost is low (dozens of casts/day).

### Reasoning plane
Caster drafts via OpenRouter (user-selectable models) through a sibling reasoning path. The
base URL is swappable to Router402 for x402/USDC-on-Base metered reasoning later. ZOE's
concierge turns continue to run on Claude Max OAuth via `callClaudeCli` - unchanged.

### Safety plane
Klearu is CLI/socket-only (no HTTP endpoint), used ONLY for classification (never reasoning).
Wrapped as a subprocess module: `davit-infer` for images, SLIDE/LLaMA classifier for text.
Runs as a PRE gate (before publish) and optional POST gate.

### Exec plane (Phase 4)
Per-agent action execution moves onto FFX (Quilibrium serverless, private beta). One
invocation per ranked action. Klearu is also wrapped as an FFX function for the safety gate.

---

## Build phases

### Phase 0 - Hypersnap read node (UNBLOCKED; kills read costs day one)
Operator task. Box spec: 4 vCPU / 16 GB RAM (+32 GB swap) / >=1.5 TB NVMe / public IPv4 /
Ubuntu 24.04 (Hetzner AX-line cost-effective). Full steps in `OPS-RUNBOOK.md`. Endpoint env
after sync:
```
FARCASTER_READ_API_BASE=http://<ip>:3381
FARCASTER_NODE_HTTP=http://<ip>:3381
FARCASTER_NODE_GRPC=<ip>:3383
```

### Phase 1 - Bot FID + signer + on-chain registration (-> first cast)
Operator + scripts. Fund a custody (secp256k1) wallet on Optimism (~$2 - traces to
docs.farcaster.xyz gas + prompt). Register a DEDICATED bot FID via IdGateway (~$1) - separate
from the node-operator FID. Derive the Ed25519 signer pubkey (QKMS GetPublicKey, or noble
fallback). Build EIP-712 `SignedKeyRequest(requestFid, key, deadline)` validated by
SignedKeyRequestValidator; call `KeyGateway.add(1, pubkey, 1, metadata)` on Optimism; wait
for hub sync. Sign a `CastAdd` and submit to the WRITE endpoint. Scripts:
- `scripts/register-signer.ts` - both QKMS-Sign path and `@noble/ed25519` fallback branch.
- `scripts/first-cast.ts` - same dual signer; CastAdd -> write endpoint.

### Phase 2 - Single-agent caster under ZOE
- Add `caster` to ZOE dispatch (`bot/src/zoe/index.ts`).
- Subscribe to the Hypersnap gRPC stream (`:3383`), filtered to bot FID/keywords -> enqueue a
  ZOE task.
- Pipeline: `draftCast` (OpenRouter sibling path) -> `safetyCheck` (Klearu) -> Telegram
  approval -> `publishCast` (sign -> write endpoint).

### Phase 3 - Multi-agent (doc 318)
- Agent registry: `{agent_id, persona_prompt, topics[], activity_budget, cooldown_seconds,
  thread_max_depth, priority_weight, schedule{}, persona{tone,domain,risk,social,engagement}}`.
- Softmax ranker (5 factors: topic match, semantic relevance, recency, budget remaining,
  random noise) between context-assembly and reasoning.
- Pre-LLM guard battery: cooldown >=90s, budget, thread depth, semantic dedup,
  conversation-closed check, Klearu safety, "alive" schedule boolean, 7-day memory decay,
  15-90s humanized delay.
- Memory: 7-day half-life decay + per-user/per-topic/per-agent scoping.

### Phase 4 - Sovereign exec + safety
- Move per-agent action execution onto FFX (one invocation per ranked action).
- Wrap Klearu CLI as an FFX function for the PRE+POST safety gate.
- Optional: swap OpenRouter base URL -> Router402 for x402-metered reasoning.

---

## Human-approval gate (keep, independent of stack)
Drafted casts -> Telegram -> lead y/n before `submitMessage`. Auto-allow reads/likes; require
approval for casts/replies and ALL onchain $ZABAL actions (those stay on the `wallet` agent +
human sign-off).

---

## Verify-before-build checklist
- [ ] **QKMS:** log into qconsole.quilibrium.com -> create key -> confirm key-spec
  `ECC_NIST_EDWARDS25519` / Ed25519. Else use noble fallback (already shipped).
- [ ] **WRITE endpoint:** pick Neynar write API (via x402) or another write-enabled hub.
- [ ] **FFX beta:** request from Cassie (@cassie, FID 1325; prefers GitHub over DMs; offered
  beta in Bootcamp #10). Send her the `FFX-BETA-REQUEST.md` GitHub link after push.
- [ ] **Bootstrap gist (resolved):**
  https://gist.github.com/CassOnMars/cbb2007b2bcb713b81da827180d4ffb7

---

## File map (this build)
```
research/agents/761-.../README.md         <- this doc
research/agents/761-.../FFX-BETA-REQUEST.md
research/agents/761-.../OPS-RUNBOOK.md     <- operator real-world steps
scripts/register-signer.ts                 <- EIP-712 SignedKeyRequest + KeyGateway.add
scripts/first-cast.ts                      <- CastAdd -> write endpoint
bot/src/zoe/farcaster/signer.ts            <- Signer abstraction (noble | QKMS stub)
bot/src/zoe/farcaster/read-node.ts         <- Hypersnap HTTP read client (+ failover)
bot/src/zoe/farcaster/event-stream.ts      <- gRPC :3383 subscribe -> task enqueue
bot/src/zoe/farcaster/write.ts             <- CastAdd build + submit to write endpoint
bot/src/zoe/safety/klearu.ts               <- Klearu CLI wrapper (text + image)
bot/src/zoe/caster/reason.ts               <- OpenRouter sibling reasoning path (Router402 swap)
bot/src/zoe/caster/index.ts                <- caster pipeline (draft->safety->approve->publish)
bot/src/zoe/agents/registry.ts             <- agent registry schema + loader
bot/src/zoe/agents/ranker.ts               <- softmax ranker (5 factors)
bot/src/zoe/agents/guards.ts               <- pre-LLM guard battery
bot/src/zoe/agents/decay.ts                <- 7-day half-life memory decay + scoping
bot/src/zoe/exec/ffx.ts                    <- FFX exec wrapper (marked stub, private beta)
```

---

## Anti-fabrication ledger
Every specific number/date/amount here traces to a source - never extrapolation.

| Claim | Source |
|-------|--------|
| Node read-only (`read_node=true`) | doc 586, corroborated doc 304 |
| HAATZ = Neynar v2 compatible, free, read-only, tested 2026-05-28 | doc 2027 (haatz) |
| Multi-agent registry + softmax + guard battery design | doc 318 (Cassie bootcamp) |
| ~$2 Optimism custody fund / ~$1 FID registration | prompt -> docs.farcaster.xyz gas |
| Cassie @cassie FID 1325, prefers GitHub, offered beta Bootcamp #10 | prompt |
| Bootstrap gist hash | prompt (resolved) |
| QKMS Ed25519 support | **INFERRED** from AWS-KMS compat - UNVERIFIED, login-walled |
| FFX API surface | **UNVERIFIED** - private beta, login-walled |
| Router402/GPU-Bridge/BlockRun are the x402-LLM gateways; "Lucid" is not real | prompt |

UNVERIFIED items are flagged in code as `VERIFY:` stubs that throw descriptive errors rather
than presenting invented API signatures as real.
