---
topic: business
type: market-research
status: research-complete
last-validated: 2026-08-06
related-docs: "2217, 2216, 2188, 601"
original-query: "Research 'surplus intelligence' - what it means and what ZAO should do about it."
tier: DEEP
---

# 2219 - Surplus Intelligence + the Substrate Inversion (what it means for ZAO)

> **Goal:** Define "surplus intelligence" from the real sources and turn it into a
> ZAO thesis + concrete infra directions - because it lands exactly on what we've
> been building (loops, routing, evals, the fleet).

## The one-paragraph thesis

**Intelligence is becoming abundant and cheap ("too cheap to meter") - the cost of a
fixed capability has fallen ~10x/year (Stanford: ~280x over 18 months). When the raw
model is a commodity, the scarce, compounding asset moves UP the stack: the SUBSTRATE
that turns cheap capability into trusted, operational value - the loops, routing,
evals, memory, permissions, and feedback that make intelligence actually do work in a
specific context. "Capability creates the option; the substrate captures the
economics." ZAO's edge is not a model - it is exactly this substrate, pointed at
music/creators/fans.**

## What "surplus intelligence" means (the sources)

- **Origin term:** Wayne Hope, "Surplus Intelligence?" (Political Economy of
  Communication, 2022) - the political-economy question of who owns the surplus when
  intelligence is mass-produced.
- **The cost collapse (a16z, "AI Will Supercharge Modelbusters," 2025):** cost of
  intelligence down >10x/year, capability doubling ~every 7 months; AI delivers "10x
  product for 1/10th cost," handing a large SURPLUS to the customer. Outcome-based
  pricing captures the gap between the cost of a human and the cost of the task.
- **What gets scarce (Dwarkesh x Imas/Trammell, Jun 2026):** when intelligence is
  abundant, the scarce things are (a) human-relational goods (the "ballerina"/the
  specific-maker premium - an art print's premium collapses at 500 copies but holds at
  1 human-made copy), and (b) whatever the machine sector can't satiate. Honest caveat:
  "we don't have the data" - labor-demand elasticities are unknown; as of Jun 2026
  there's "almost no macro signal" of AI unemployment yet.
- **Who owns the surplus (Keith Teare, "Intelligence: Who Owns It?", Jul 2026):**
  intelligence is the new water - companies should build+meter it, but the surplus is
  an economic-justice question. Names **"Loop Engineering"** as the contested terrain:
  "whoever owns the loop owns the learning; whoever owns the learning owns the
  compounding asset."
- **The Substrate Inversion (Joon Hee Kim, May 2026) - the sharpest:** for 3 years the
  question was "which model wins." Now sufficient capability is cheap+abundant, so the
  scarce asset inverts to the **substrate** - forward-deployed engineering, eval rubrics
  that capture "what good looks like here," **routing logic that picks which model
  handles which task**, permissions, retrieval, feedback loops. "Models change every
  few months; the substrate persists." OpenAI/Anthropic's 2026 deployment vehicles are
  them racing INTO the substrate position.

## Why this is ZAO's thesis (not a detour)

Everything ZAO/ZOE has built this year IS the substrate the inversion describes:
- **Routing** ("which model handles which task"): the cost ladder + `OPENROUTER_HIGH_MODEL`
  frontier escalation (doc 2217). Exactly the substrate primitive Kim names.
- **Evals** ("what good looks like here"): the multi-family critic panel + verify pass +
  the shadow eval harness (docs 2214/2215). Eval rubrics are a core substrate asset.
- **Loops** ("own the loop, own the learning"): the ZOE fleet, the fix-PR pipeline,
  reflexion/memory - Karpathy's "loops + harnesses > agents" (doc 2127) is the same claim.
- **Memory/feedback:** the memory kernel, Bonfire recall, the capture->triage->crush loop.
- **The organism** (Brandon): Spine/Heart/Cortex is a substrate architecture - governance,
  leases, receipts, trust - the durable layer under any model.

**So the strategic read for ZAO:** don't chase models; chase the SUBSTRATE, and point it
at the human-relational goods that STAY scarce - live music, real artists, fans, a specific
maker's work. The surplus-intelligence economy makes generic content free; it makes the
ballerina (the specific artist + the fan relationship) MORE valuable. That is literally
The ZAO's creator-first/fans-first bet, now with an economic mechanism behind it.

## Concrete ZAO directions (the upgrade lens)

| Direction | What | Grounded in |
|-----------|------|-------------|
| **Own the loops + evals as the durable asset** | Keep investing in the routing/eval/loop substrate (panel, shadow, cost ladder) - it compounds while models churn. | doc 2214/2215/2217; Substrate Inversion |
| **Point the substrate at human-relational value** | The scarce, premium good is the specific artist + fan relationship (ballerina logic). ZAO's substrate should amplify a NAMED creator's work + fan connection, not generic content. | Dwarkesh/Imas (maker-premium) |
| **Outcome/ROI pricing where ZAO automates a task** | As ZOE automates real tasks (research, review, coordination), price the OUTCOME, not the seat - capture the human-vs-AI cost gap. | a16z modelbusters |
| **Surplus-sharing is on-brand** | "Who owns the surplus" = economic justice. ZAO's Respect/ZOL/creator-coin mechanisms are a surplus-sharing substrate - a real differentiator + a moat of trust. | Teare (sovereign human wealth fund) |
| **Frontier only where it changes the outcome** | Surplus intelligence = cheap by default; reserve frontier spend for the tasks where quality flips the result (the routing discipline already shipped). | Substrate Inversion; doc 2217 |

## Also See
- [Doc 2217](../../agents/2217-frontier-model-routing-decision/) - the routing substrate.
- [Doc 2214](../../agents/2214-multimodel-code-review-panel/) - the eval substrate.
- [Doc 2127](../../agents/2127-*/) - loops+harnesses (Karpathy); the loop-engineering claim.

## Next Actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Fold "substrate over models" + "point it at human-relational value" into the ZAO canonical pitch / 12mo vision | Zaal | decision | 2026-08-20 |
| Frame ZOL/Respect/creator-coins as ZAO's SURPLUS-SHARING substrate in outward copy (a differentiator) | Zaal | decision | 2026-08-20 |
| Keep the routing/eval/loop investment (it's the compounding asset, not a side-quest) | Claude/ZOE | ongoing | rolling |

## Sources
- [Surplus Intelligence? - Wayne Hope, Political Economy of Communication (2022)](https://www.polecom.org/index.php/polecom/article/view/150) [PARTIAL - abstract] - origin of the term.
- [AI Will Supercharge Modelbusters - a16z (2025)](https://a16z.com/ai-will-supercharge-modelbusters/) [FULL, 200] - cost collapse, surplus to customer, outcome pricing.
- [What Gets Scarce When Intelligence Is Cheap - Neodrop on Dwarkesh x Imas/Trammell (Jun 2026)](https://neodrop.ai/post/rj-hyw4Osgw) [FULL] - post-AGI scarcity, ballerina/maker-premium, no-data honesty.
- [Intelligence: Who Owns It? - Keith Teare (Jul 2026)](https://www.thatwastheweek.com/p/intelligence-who-owns-it) [FULL, 200] - surplus as justice; Loop Engineering.
- [The Substrate Inversion - Joon Hee Kim (May 2026)](https://joonhee.kim/essays/2026/05/the-substrate-inversion/) [FULL, 200] - the model->substrate inversion (the sharpest source).
- [The Coasean Singularity - NBER (agents + transaction costs)](https://www.nber.org/system/files/chapters/c15309/revisions/c15309.rev0.pdf) [FULL] - agents collapse transaction costs; market-design frontier.
