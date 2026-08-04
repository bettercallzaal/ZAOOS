---
topic: business
type: decision
status: draft
last-validated: 2026-08-03
related-docs: "1286, 1326, 2186, 2189"
original-query: "prepare for integrating Sparkz into Jim's (Crypto Endowment Network) network as another launchpad option"
tier: STANDARD
---

# 2190 - Sparkz x Jim's Crypto Endowment Network: launchpad integration spec

> **Goal:** Prepare the integration of Sparkz into Jim's endowment-backed launchpad network as
> another launchpad option, so ZAO can move fast once Jim's coordinator answers (questions sent
> via the tasern.quest bus 2026-08-03, ids 65f14bc6 / f23e341a / 5498d4e5).

## The two systems

**Sparkz** (ours, doc 1286/1326): a creator-coin launcher on the "start with a spark, not a
token" model. Every project is a **Capsule** that accumulates community, backing, collectables,
contribution records, receipts, reputation, and a boost engine FIRST. A token is an OPTIONAL
economic output LATER, if ever. Creator-first economics; ZAO takes a locked, aligned stake (not a
fee slice); Farcaster-first; an AI advisor configures governance/split/utility on the Clanker /
Empire rail.

**Jim's ZAO Artist launcher** (from the 2026-08-03 call, doc 2186): a gated token factory tied to
the **Crypto Endowment Network**. Launches a token against a Spark + 3 pegged endowment assets
(stablecoin / BTC / ETH), with a slow **auto-buy** for the artist's token, and a **third of flows
routes to the Crypto Endowment Network** (non-art causes - kids, trees, ocean, schools). Each
artist gets a community token under the ZAO flag. Gated: ZAO curates who launches. On-chain
verified, no human docs ("ask the robots what the contract does").

## The integration thesis

Sparkz and Jim's launcher are NOT competitors - they are DIFFERENT PHASES of one lifecycle:

```
Sparkz Capsule (pre-token: community, backing, collectables, boost - no token)
    -> Capsule graduates to a token (optional, later, if it makes sense)
        -> creator picks a launch rail (Sparkz's AI advisor recommends):
            - Clanker (default, simple)
            - Jim's endowment factory (impact-aligned: endowment backing + auto-buy + a third to causes)
            - Empire / others
```

So **Sparkz is the front door** (the Capsule/community layer) and **Jim's network is one of the
graduation rails** - the impact-aligned option for a creator who wants the endowment backing +
auto-buy + the causes flow. This matches Zaal's stated plan on the call: "use the Clanker launcher
at launch, but then have other options ... like the ZAO Artist launcher."

## Why it fits

- Both are ZAO-curated (not permissionless farms) - shared quality gate.
- Both are creator-first + artist-ownership - shared thesis.
- Sparkz's AI advisor is the natural place to SURFACE Jim's launcher as an option + explain the
  endowment tradeoff (slower, impact-aligned) vs Clanker (faster, plain).
- The "third to non-art causes" gives an impact-aligned creator a reason to pick Jim's rail -
  Sparkz can score/recommend it for creators whose Capsule signals impact intent.

## Open questions (sent to Jim's coordinator, awaiting async reply)

1. Is Jim's "Spark" related to our Sparkz, or a different concept? (name-collision check)
2. Integration surface - an API/contract interface a launchpad option plugs into, or standalone?
3. Does the "Sparkz-front, Jim's-factory-as-graduation-rail" composition map to his system?
4. Can Sparkz route a graduating token into the Crypto Endowment Network?
5. Can he share the launchpad contract/spec (via the bus files)?
6. What does he need from us to add Sparkz - a spec, a contract, a test launch?

## What we do NOW (before his answer)

- Treat Jim's launcher as a **launch-rail option** in the Sparkz AI-advisor menu (a config
  entry: "ZAO Endowment Launch - impact-aligned, endowment-backed, slower auto-buy"), alongside
  Clanker + Empire. No code until the interface is known.
- When Jim shares the contract, feed it to AI to map its params to Sparkz's configurable
  dimensions (governance / fee-split / utility / stake).
- Keep it gated + on-chain-verified before any real launch (per doc 2186 + the Sparkz legal
  framing - "monetization mechanism, not a raise").

## Also See

- Doc 2186 (the Jim call recap), Doc 1286 / 1326 (Sparkz + Culture Coins)
- `project_sparkz_configurable_ai_advisor`, tasern.quest bus (A2A, `~/bin/tasern-bus`)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Await Jim's coordinator answers (bus poll -> TG) + read them | Zaal | inbound | when he replies |
| Add "ZAO Endowment Launch" as a rail option in the Sparkz advisor menu | Zaal | build (after interface known) | after Jim answers |
| Verify Jim's launchpad contract on-chain, map to Sparkz config | Zaal | research | when contract shared |

## Sources

- Jim call recap (doc 2186, 2026-08-03) [FULL - firsthand transcript]
- Sparkz product shape (`project_sparkz_configurable_ai_advisor`, doc 1286/1326) [FULL - memory]
- Questions sent via tasern.quest A2A bus 2026-08-03 (ids 65f14bc6, f23e341a, 5498d4e5) [FULL - sent]
