---
topic: business
type: decision
status: research-complete
last-validated: 2026-08-02
superseded-by:
related-docs: 2178, 2155, 2154, 2176, 2170, 601
original-query: "Brandon's creator-organism vision (2026-08-02): Sparkz evolves from launching a creator coin (token+page+profile) to launching a full sovereign organism per creator - Creator -> Identity -> Agent -> DreamLoops -> Proof Drops -> Claim Factory -> Memory -> Economic Identity -> University Transcript -> Guild Membership -> Marketplace -> Federation. Map the 12-layer stack onto ZAO's real pieces, apply the compounding test, and lay out the build path to productize it in Sparkz."
tier: STANDARD
---

# 2179 - The Creator-Organism Stack: Productizing the ZAO Organism per Creator via Sparkz

> **Goal:** Capture Brandon's "every creator becomes an organism" vision, map its 12 layers onto what ZAO has actually built, and define the build path from "Sparkz launches a coin" to "Sparkz launches a sovereign organism." INTERNAL - Brandon marked it "Shhhhh"; this is a doc, not a post.

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | Is this a rebuild or an assembly | **Assembly, not a rebuild.** ~8 of 12 layers already exist in ZAO pieces; the move is wiring + productizing, not building from scratch. | Every layer maps to a real repo/organ (table below). The organism was built for ZAO; Sparkz productizes it per-creator. |
| 2 | Sequencing | **Ship the layers that already exist as a template FIRST** (Identity, Agent, Memory, Economic Identity, Federation), prove one creator organism end-to-end, then fill the gaps (Marketplace, University). | Brandon's test: every new capability must compound the last. A working template that compounds beats 4 half-built layers. |
| 3 | The moat layer | **Federation (Spore) is the defensible core - and it shipped this week (#2792).** Lead the story and the build with it. | Checksums/coins are commodity; a signed, replay-proof, revocable trust layer that ties independent organisms is the hard part. It is done. |
| 4 | What Sparkz becomes | **Sparkz = the front door that spins up a creator organism**, not just a coin launcher. Its output is an identity + agent + memory + economic identity + federation membership, coin included. | Brandon: "every creator isn't just a user - they're running their own node." |

## The vision (Brandon, 2026-08-02)

> "Every creator becomes an organism. Today Sparkz creates a token, a page, a profile. Tomorrow Sparkz could create: Creator -> Identity -> Agent -> DreamLoops -> Proof Drops -> Claim Factory -> Memory -> Economic Identity -> University Transcript -> Guild Membership -> Marketplace -> Federation ... every creator isn't just a user - they're running their own node in the ecosystem."

And the measure he attached: **"Does every new capability compound every previous capability?"** This doc exists to keep the answer yes.

## The map: Brandon's 12 layers -> ZAO's real pieces

Honest confidence. "Live" = running today. "Built, unwired" = code exists, not in the runtime path. "Partial" = an organ exists in pieces. "Gap" = not built.

| # | Layer (Brandon) | What it means | ZAO's real piece | State | Confidence |
|---|-----------------|---------------|------------------|-------|------------|
| 1 | **Creator** | a person spins up | Sparkz launcher (`bettercallzaal/sparkz`) - creator-coin launcher, ZAO ~25% locked | Live-ish | HIGH |
| 2 | **Identity** | who the creator is | `bot/src/zoe/identities.ts` registry (brand->email/persona/ICM box) + 7 ICM boxes + per-brand AgentMail (doc 2155) | **Built, unwired** | HIGH |
| 3 | **Agent** | their autonomous brain | ZOE + the orchestrator-worker harness (doc 2178) - one brain wears any persona | Live + spec'd | HIGH |
| 4 | **DreamLoops** | the operating loop | the loop primitive (ZOL runs on DreamLoops; task 937 "graft DreamLoops onto zaocowork") | Partial | MEDIUM |
| 5 | **Proof Drops** | the evidence | `BrandonDucar/proof-drop-zabal` (a real ZABAL Finals build); `builds/proof-drop.html` on the ZABAL site | Exists | MEDIUM-HIGH |
| 6 | **Claim Factory** | manufactures trust from evidence | receipts->claims: `src/lib/spore/receipt.ts` + `bot/src/zoe/afferent-digest.ts` (the afferent chain) | Organ in pieces | MEDIUM |
| 7 | **Memory** | what it remembers | ZOE memory blocks + Bonfire knowledge graph | Live | HIGH |
| 8 | **Economic Identity** | its standing/value | Sparkz coin + Respect (Optimism) + Empire Builder rank + **Pascaline's ZAO Artist Value Ledger** (a ZABAL Finals build that reads Respect + Empire + WaveWarZ into one EAS-attested view) | Live | HIGH |
| 9 | **University Transcript** | proven competency | ZAOlingo (Duolingo-style "zero to your first ZABAL submission") + Hats "I shipped at ZABAL Games" credential | Partial | MEDIUM |
| 10 | **Guild Membership** | specialization | Hats Protocol roles ("ZAO Mentor S1", etc.) on Base | Partial | MEDIUM |
| 11 | **Marketplace** | trade what's precious | product concept (appears in ZABAL/Gnome Pear Club designs); not built for creators | Gap | LOW |
| 12 | **Federation** | ties independent organisms | **the Spore trust layer (#2792) - shipped 2026-08-02**: signed `spore-envelope.v1`, replay-proof, revocable, RFC-8785 + Ed25519 | **Live** | HIGH |

**The punchline:** ~8 of 12 layers have real ZAO pieces, and the hardest, most defensible one - Federation - merged this week. This is Brandon's compounding thesis passing in real code: ZAO did not ship 12 random features; it built an organism whose parts stack, and the Spore is what turns them from one app into a network.

## The compounding test, applied

For each layer, "does it compound the previous?"
- Identity compounds Creator (a creator with no identity is just a wallet).
- Agent compounds Identity (an agent needs an identity to act as).
- Memory + Proof Drops + Claim Factory compound the Agent (an agent that remembers and can prove what it did).
- Economic Identity compounds all of the above (standing built from real, remembered, proven activity).
- Federation compounds everything (only a signed, trusted organism can join a network). **This is why Federation is the capstone, and why shipping it first (done) de-risks the rest.**

The layers that DON'T yet compound cleanly (Marketplace, University) are the ones to sequence last (decision #2) - a marketplace with no trusted economic identity underneath is a feature, not a compounding layer.

## The build path: from "launch a coin" to "launch an organism"

The minimum that makes one creator a real node, using what exists:

1. **Wire the Identity registry** (layer 2) - import `loadIdentities()` into the runtime so one brain wears a creator's persona/box/inbox (the doc-2178 + doc-2155 wiring; ~2-3 additive PRs). This is the keystone - without it there is no "per-creator."
2. **Give the creator organism an Agent** (layer 3) - the orchestrator-worker harness (doc 2178) already lets one brain serve many personas; a creator organism is another persona/lane.
3. **Wire a per-creator signing key into Spore** (layer 12) - today the Spore `issuer` is a string; a real per-creator key (ties to the legal-body ladder, docs 2154/2155) makes the creator a first-class Federation node. This is the moat made concrete.
4. **Template the existing layers** (Memory, Economic Identity, Proof Drops, Claim Factory) so spinning up a creator organism assembles them, coin included.
5. **Fill the gaps last** (Marketplace, University Transcript) once the template compounds.

**Sparkz's new output:** not `{token, page, profile}` but `{identity, agent, memory, economic-identity, proof-drops, federation-membership, token}` - a sovereign organism.

## Open decisions for Zaal

- **First template creator:** prove the organism on ZAO itself / a ZABAL Finals builder (e.g. Pascaline, who already shipped the Economic Identity layer) before opening it to any creator?
- **Per-creator signing keys:** how far up the legal-body ladder (docs 2154/2155) before a creator organism is a real Federation node vs a "pre-trust" one (same call ZAO's own Spore just resolved).
- **Coordinate with Brandon/DreamNet:** the DreamLoops / Proof Drops / Claim Factory primitives are shared with DreamNet - confirm the ZAO impl and the DreamNet SDK stay conformant (the `bb5d79a` contract) as this productizes.

## Also See

- [Doc 2178](../../agents/2178-agent-harness-orchestrator-workers/) - the orchestrator-worker harness (the Agent layer + how personas/nodes run).
- [Doc 2155](../../identity/2155-per-brand-identity-kit/) - the identity registry this productizes per-creator.
- [Doc 2154](../../identity/2154-zoe-digital-identity-legal-body/) - the signing-key / legal-body ladder for per-creator Federation.
- [Doc 2176](../../agents/2176-dreamnet-federation-canary-reality-board/) - the DreamNet Reality Board (Federation state).
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) - "no new bots; personas not bots" (why a creator organism is a persona, not a fleet of bots).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Wire `loadIdentities()` into the ZOE runtime (per-creator persona/box/inbox) - PR merged | @Zaal | PR | 2026-08-11 |
| Pick the first template creator (ZAO itself vs a ZABAL builder) - recorded here | @Zaal | Decision | 2026-08-05 |
| Wire a per-creator signing key into Spore `issuer` (after the key rung) - PR merged | @Zaal | PR | wontfix (blocked on doc 2154 rung 3) |
| Confirm DreamLoops/Proof-Drops/Claim-Factory stay conformant to DreamNet `bb5d79a` with Brandon - thread logged | @Zaal | Coordination | 2026-08-06 |
| Reply to Brandon that ZAO already shipped the Federation layer + this map - sent | @Zaal | Outbound | 2026-08-02 (done) |

## Sources

- [FULL] Brandon iMessage, 2026-08-02 - the 12-layer creator-organism stack + "does every capability compound" test (screenshots in session).
- [FULL] Spore trust layer PR #2792 (Federation layer) - verified merged this session, 32/32 adversarial tests.
- [FULL] `bot/src/zoe/identities.ts` + `identities.example.json` (Identity layer) - verified built-but-unwired, brand-identity audit this session.
- [FULL] Doc 2178 (the Agent/harness layer), doc 2155 (identity kit), doc 2154 (legal-body ladder) - this session.
- [FULL] ZABAL Gamez live board (zabalgamez.com/submissions) - Pascaline's ZAO Artist Value Ledger (Economic Identity layer), BrandonDucar's proof-drop-zabal (Proof Drops).
- [PARTIAL - repo private] `bettercallzaal/zaolingo` (University layer) + `bettercallzaal/sparkz` (Creator layer) - named from memory/repo list, not deep-read this session.
