---
topic: business
type: guide
status: research-complete
last-validated: 2026-07-17
related-docs: 1286, 1307, 1325
original-query: "File Brandon Ducar's Culture Coins + Meme Engines white paper as a citable research doc and map it to Sparkz"
tier: STANDARD
---

# 1326 — Culture Coins + Meme Engines (Brandon Ducar / DreamNet): the protocol Sparkz implements

> **Goal:** A citable synthesis of Brandon Ducar's "Culture Coins and Meme Engines" white paper (DreamNet, 2026-07-17) and how [Sparkz](../1286-sparkz-improvement-roadmap-creator-coin-discourse/) maps onto it. This is a synthesis + attribution, NOT a reproduction - the full paper is Brandon's copyrighted work (see Source).

## Attribution

Author: **Brandon Ducar, DreamNet.** Title: "Culture Coins and Meme Engines - A Protocol for Living, Participatory, and Verifiable Digital Cultures." First public draft, 2026-07-17. Brandon's stated next step: publish it as a dated repository paper beside the DreamLoops + Capsules origin record, plus a shorter public manifesto and a technical spec. This ZAOOS doc is a working synthesis so the ZAO can build on it and cite it; the canonical text lives with Brandon/DreamNet.

## The architecture (Brandon's terms)

- **Creator Coin** = a persistent identity + reputation object (a person, agent, org, character).
- **Culture Coin** = a shared economic + expressive layer for a *culture* larger than any one person (a scene, movement, community, world). Structurally must be more than one person: multiple independent contributors, shared stewardship.
- **Culture Circle** = a focused community *inside* a culture (by location, skill, project, purpose). Usually credential/reputation-based, not its own coin until it has an independent economy.
- **Culture Capsule** = the culture's portable constitution: identity (name, symbols, vocabulary), values + origin story, participation rules, governance (steward roles, thresholds, treasury policy, succession, founder-authority decay), safety, and memory (canon, history, receipts). Versioned; fundamental changes need evidence + approval.
- **Meme Engine** = the autonomous cultural operating system. NOT a meme generator - a full stack of bounded modules: Cultural Radar, Canon Keeper, Creative Studio, Mutation Lab, Remix Network, Quest Engine, Distribution Router, Circle Coordinator, Lineage Tracker, Cultural Fitness Index, Reputation, Opportunity Scout, Treasury Advisor, Cultural Memory, Governance Shield. Runs a cycle: sense -> create/remix -> organize participation -> distribute -> measure fitness -> attribute -> reward -> preserve -> evolve.
- **Autonomy tiers** for the Meme Engine: (1) Advisory, (2) Creative (drafts, no publish/spend), (3) Guarded operations (pre-approved publishing, low-risk quests, preset rewards), (4) Mature culture operations (bounded campaigns + budgets within explicit limits). Major governance/treasury/identity/canon changes always need human/community approval.
- **Contribution Receipts** = verifiable proof of who contributed, what happened, approvals, evidence, lineage, rewards. Distinguishes holding vs participating vs contributing vs stewarding.
- **Culture lifecycle:** Proposed -> Emerging -> Verified -> Established -> Federated.

## How Sparkz maps (near 1:1)

| Brandon's protocol | Sparkz |
|---|---|
| Proposed / Emerging Culture (tokenless) | "Start with a spark, not a token" - collectables, backing, boost, leaderboard, pre-token |
| Verified Culture (token) | The token launch, opt-in, later, if ever |
| Meme Engine (bounded modules, autonomy tiers) | The Sparkz AI advisor / ZOL agent (same guardrail model as ZOL-as-Configurator, doc 1307) |
| Culture Capsule | The culture's config + values + governance the advisor sets up |
| Contribution Receipts | DreamNet receipts / proof-drop |
| "Culture coin launcher" | The accurate name - Sparkz launches Creator Coins AND Culture Coins |

## Why it resolves the extraction problem

Every "is Sparkz extractive?" concern is a first-class principle in Brandon's paper, which is why the ZAO adopts them as Sparkz's guardrails:

- **Culture before price** - the interface leads with the culture, not the chart.
- **Attribution before extraction** - originators/remixers get credit before distributors capture value.
- **Holding is not contribution** - a big balance does not grant authorship or governance.
- **Capability is not authority** - the engine may know how to publish/spend without permission to.
- **Founder-authority decay** - founders keep reputation credit; direct control declines as contributors/circles/governance mature.
- The hard rule: *no single person may remain the sole identity + controller + contributor + treasury beneficiary + governance authority of a verified Culture Coin.*

## ZAO additions

- **Boosters can be other Sparkz, even before a token exists** (Zaal, 2026-07-17): backing is composable + creator-to-creator - a spark boosts another spark pre-token, forming Brandon's Culture Circles as a mutual-backing graph. This is the agent-to-agent / human-to-agent network effect from Brandon's response-to-Jesse post, applied to sparks.
- **Fee/compute economics** (from the grill, 2026-07-17): creator-first 1/1/98 default (creator up to 98%, 1% agent-upkeep floor, 1% community-treasury floor); BYOK-or-treasury compute (the treasury funds non-technical creators' agents = the treasury-funds-onboarding loop); a 0xSplits distribution wallet for collaborator routing. These are the Culture Capsule's economic policy in Brandon's terms.
- **Scope discipline:** ship the thin slice (spark + collectables + boost + 1/1/98), keep the full protocol as the north star, not the v1 checklist.

## Also See

- [Doc 1286 - Sparkz Improvement Roadmap](../1286-sparkz-improvement-roadmap-creator-coin-discourse/)
- [Doc 1325 - Zaal x Chris Dolinski (Viniapp) meeting](../../events/1325-chris-dolinski-viniapp-sparkz-jul17/)
- [Doc 1307 - Hats Protocol as the ZAO org chart](../../governance/1307-hats-protocol-zao-org-chart/)
- Memory: project_culture_coins_meme_engine, project_dreamnet_trust_layer, project_zao_ai_decision_principle

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm with Brandon where the canonical white paper lives (DreamLoops/Capsules repo) and link it here | @Zaal | Outreach | 2026-07-24 |
| Adopt the Culture Capsule + Meme Engine autonomy tiers + receipts as the Sparkz architecture (spec in the sparkz repo) | @Zaal | PR | 2026-08-07 |
| Build "boosters = other sparkz, pre-token" as the first Culture Circle mechanic in the Zoostr build | @Zaal | PR | 2026-08-14 |

## Sources

- [FULL] Brandon Ducar, DreamNet - "Culture Coins and Meme Engines" white paper, first public draft 2026-07-17 (shared by Zaal). Synthesized here with attribution; full copyrighted text lives with Brandon/DreamNet. Notice in the paper: it is a theoretical protocol, not an offer/solicitation/advice.
- [FULL] Zaal's 2026-07-17 additions (grill + Chris call): the boosters-as-sparks idea, the 1/1/98 + BYOK-or-treasury economics.
