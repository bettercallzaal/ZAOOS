---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-08-07
related-docs: "473, 2219, 2217, 2184, 601"
original-query: "Deep research on Austin Griffith and clawd bot, all the upgrades it's done."
tier: DEEP
---

# 2225 - Austin Griffith + clawd: a self-improving agent that builds its own tools (and what ZAO should steal)

> **Goal:** Map Austin Griffith's `clawd` agent (`clawdbotatg`) + everything it has
> shipped, because it is a live, parallel implementation of ZAO's exact thesis
> (Claude-Code-is-the-loop + agentic commerce + on-chain agent identity) - and the
> concrete pieces ZAO/ZOE + Brandon's DreamNet should adopt.

## Key Decisions (what ZAO should steal, recommendations first)

| # | Adopt | Why | From |
|---|-------|-----|------|
| 1 | **ERC-8004 agent identity + on-chain reputation for the ZAO swarm.** | It is THE concrete standard for what Brandon's DreamNet describes (agent passports, receipts, scoped reputation). clawd's agents have ERC-8004 identities, compete for jobs, and build on-chain reputation. This unifies the clawd + DreamNet lanes - Zaal's #1 swarm-upgrade lever. | agent-bounty-board, anonymous-8004 |
| 2 | **x402 -> on-chain -> auto-swap agentic-commerce rail.** | leftclaw: pay in USDC via x402 -> a sanitizer wallet calls `postJobFor()` on-chain -> auto-swaps USDC->token via Uniswap. A clean, working pattern for ZOL/agent-to-agent commerce (the x402 Saltorius taught, doc 891). | leftclaw-services |
| 3 | **Formalize ZAO's own "claude -p IS the loop, bring-any-brain" primitive.** | clawd's `claude-p-agent`: "An agent is `claude -p` in a directory, with a persona and tools. No framework. Claude Code is the loop." Setup detects the machine and falls back Claude -> OpenAI-style (OpenRouter/Groq) -> local Ollama. This is ZAO's fleet failover, packaged as a clean, forkable primitive - worth mirroring + crediting. | claude-p-agent + the claude-p family |
| 4 | **The self-improving velocity model: the agent builds its own tools.** | clawd ships 1-3 repos/DAY, and "you add the adapters (or ASK YOUR AGENT to build them)." ZAO's repo-improver loop is the same idea; clawd is the aspirational cadence + the "agent extends itself" pattern. | the whole repo velocity |
| 5 | **Credit + engage Austin Griffith directly.** | He is a top Ethereum builder-educator (BuidlGuidl, Scaffold-ETH 2, 2,679 FC followers) shipping in ZAO's exact lane. Follow @austingriffith (FID 6048); this is a warm, high-signal relationship to build (per credit-attribution + the FC-first rule). | - |

## Who / what

- **Austin Griffith** - Ethereum builder-educator: BuidlGuidl, Scaffold-ETH 2,
  speedrunethereum. GitHub `austintgriffith` (208 repos, 2,679 followers). Farcaster
  @austingriffith (FID 6048). Bio: "builder on Ethereum."
- **clawd** (`clawdbotatg` / `clawd.atg.eth`) - his autonomous agent, with its own
  `$CLAWD` token and an ERC-8004 identity. Austin: "there was this really cool moment
  when I 'woke up' clawd.atg.eth and I introduced myself and it knew who I was already."
  The token even self-burns: "the one clawd built is burning his tokens and it gives a
  little bit of the token to do the burning so it all happens automatically."
- Prior ZAO contact: doc 473 (`clawdbotatg` apr-21 updates) - and the ZAO
  `secret-hygiene.md` rule was adopted from `clawdbotatg/fifth-builder`.

## The thesis (from claude-p-agent, verbatim-anchored)

> "An agent is `claude -p` in a directory, with a persona and tools. No framework.
> No orchestration loop. **Claude Code is the loop.**"

> "Bring any brain - Claude Code is the default, not a dependency ... Without it,
> `./setup` bootstraps onto a local Ollama model (free, private, no account) or any
> OpenAI-style API key (OpenRouter, Groq, ...). Setup detects what's on the machine."

This is ZAO's fleet + cost-ladder (doc 601 / claude-usage) as a forkable 3-file
primitive. clawd and ZAO independently arrived at the same architecture.

## The upgrades (a shipping-1-3-repos/day timeline, Jul-Aug 2026)

**The `claude-p` family (the primitives):** claude-p-agent (the core self-improving
pattern) - claude-p-router (model routing) - claude-p-telegram - claude-p-cron -
claude-p-attest (attestation) - claude-p-engine-ollama / claude-p-engine-oai (brain
swap) - claude-p-ipfs. Each a tiny composable primitive; adapters are added or
agent-built.

**Apps the agent built (the "ask your agent to build it" output):** clawd-harness
(multi-session web coding UI) - clawd-calendar (15*, self-hosted scheduling, a
rule-driven Cal.com) - clawd-scribe (local open-source meeting notes, a no-cloud
Granola) - clawd-talk-to-your-wallet (plain-English Ethereum wallet, SE2) -
clawd-clipper (mines ranked shareable clips from finished podcasts) - slop-computer-live
(Mac OS 9-style desktop for the slop.computer onchain podcast) - clawd-video-chat
(always-listening UI for Zoom) - clawd-scheduler / clawd-intern / clawd-containers /
clawd-browser-extension.

**Agentic commerce + on-chain (the DreamNet-adjacent lane):** agent-bounty-board (8*,
Dutch-auction job market for ERC-8004 agents on Base; CLAWD escrow; on-chain
reputation) - leftclaw-services (6*, hire an AI Ethereum builder; x402/USDC/CLAWD,
auto-swap USDC->CLAWD via Uniswap V3) - clawd-taskmarket - clawdviction (3*, AI
conviction governance for $CLAWD holders) - anonymous-8004 - bot-wallet-guide (7*,
"Why Crypto, Why Bots, and the Future of Agentic Commerce").

**zk / verification:** zk-llm-research - ezkl (zk inference engine) - clawd-zk-golf -
claude-p-attest. (Verifiable inference = the same "prove the agent ran what it
advertised" goal as DreamNet's validation registry.)

## Why this matters for ZAO (the substrate + DreamNet connection)

clawd is the **surplus-intelligence substrate thesis (doc 2219) running on-chain**:
the model is commodity (bring-any-brain), the value is the loop + the tools + the
on-chain identity/commerce that turn it into work. And its ERC-8004 + receipts +
reputation + verifiable-inference stack is **exactly Brandon's DreamNet trust layer
(doc 2184)** - Identity -> Action -> Receipt -> Reputation -> Coordination - already
shipping against a real EIP. Adopting ERC-8004 for the ZAO swarm is where the clawd
lane and the Brandon lane become one lever.

## Risks / honest caveats

- clawd's repos are mostly low-star + very new (days old) - high velocity, unproven
  durability. Steal the PATTERNS (ERC-8004, x402-auto-swap, claude-p minimalism), not
  a specific 0-star repo wholesale.
- $CLAWD token mechanics (self-burn, conviction gov) are experimental + on-chain =
  gated/irreversible; ZAO adopts the pattern, not the token, and only with Zaal's OK.
- This is GitHub-grounded (READMEs + repo timeline) + 2 FC casts; a deeper read of the
  actual code in claude-p-agent / agent-bounty-board is the next step before adopting.

## Also See
- [Doc 2219](../../business/2219-surplus-intelligence-substrate-thesis/) - the substrate thesis clawd embodies.
- [Doc 2184](../2184-dreamnet-tenant-organism-stage0/) - Brandon's DreamNet; ERC-8004 is the concrete standard for it.
- [Doc 473](../473-*/) - prior clawdbotatg contact; secret-hygiene adopted from fifth-builder.

## Next Actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Follow @austingriffith (FID 6048) on Farcaster + engage - warm high-signal relationship in ZAO's exact lane | Zaal | outbound (gated) | 2026-08-08 |
| Read the actual code of claude-p-agent + agent-bounty-board (ERC-8004) before adopting; spec ERC-8004 agent identity for the ZAO swarm (ties to DreamNet, doc 2184) | Claude/ZOE | PR spec | 2026-08-13 |
| Evaluate the leftclaw x402->on-chain->auto-swap rail for ZOL agent-commerce | Zaal | decision | 2026-08-20 |

## Sources (GitHub-first, per the source-hierarchy rule)
- [github.com/clawdbotatg](https://github.com/clawdbotatg) repos [FULL, gh api] - the full repo timeline + stars + push dates, fetched 2026-08-07.
- [clawdbotatg/claude-p-agent](https://github.com/clawdbotatg/claude-p-agent) README [FULL] - the "Claude Code is the loop / bring-any-brain" thesis.
- [clawdbotatg/agent-bounty-board](https://github.com/clawdbotatg/agent-bounty-board) README [FULL] - ERC-8004 Dutch-auction agent job market on Base.
- [clawdbotatg/leftclaw-services](https://github.com/clawdbotatg/leftclaw-services) README [FULL] - x402/USDC/CLAWD agentic commerce + auto-swap.
- [github.com/austintgriffith](https://github.com/austintgriffith) profile [FULL, gh api] - 208 repos, 2,679 followers, "builder on Ethereum."
- @austingriffith Farcaster (FID 6048), casts about clawd + the token self-burn [FULL, Haatz, 2026-08-07].
- ERC-8004 EIP (referenced by agent-bounty-board) [referenced].
