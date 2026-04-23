# 481 — kompreni / Quotient — Anti-"Cucktrading" AI Superforecaster

> **Status:** Research complete
> **Date:** 2026-04-23
> **Goal:** Evaluate kompreni's Quotient (AI superforecaster "Q") as a reference for ZAO's thesis-based trading / governance-signal tooling, and whether the "no copy-trade, no KOL alpha" framing applies to ZABAL / SANG markets.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| Build a Quotient clone for ZAO? | SKIP — they're 12+ months ahead on their founder's geopolitics niche and it's not our wedge. |
| Adopt Quotient's thesis-based framing inside our agent squad? | USE — our VAULT/BANKER/DEALER agents (`src/lib/agents/`) should hold **named theses** with explicit update triggers, not signal-chase. This prevents the "chart-noise trading" failure mode Walden-style review would also catch. |
| Q's "87% prediction accuracy" claim? | DO NOT cite publicly. Unaudited vendor number. Track it if we ever A/B it against a known market. |
| The anti-KOL argument for ZAO? | USE in community copy for ZABAL holders: "ZAO doesn't publish trade calls. ZAO publishes the reasoning." This matches `project_zao_master_context.md` positioning (music first, tech third; no pump-dump culture). |
| Adapt Q into WaveWarZ prediction markets? | INVESTIGATE — if Q-style reasoning snapshots attach to every WaveWarZ market, that's a real differentiator. Owner: WaveWarZ task force. |
| Partner/learn-from outreach? | Soft outreach to @kompreni on X — he explicitly said "talk to us" for encoded-perspective AIs. Low-stakes intro. |

## Comparison of Options

| Option | Premise | Marketed accuracy | Licensing | Fit for ZAO |
|---|---|---|---|---|
| **Quotient / Q** | Trained on founder's geopolitics analyst thinking | 87% (self-reported) | Closed | Reference only |
| Polymarket public traders (top 10) | Aggregate crowd + specialists | Market-set odds | Open | Good signal source for WaveWarZ |
| Kalshi research feed | Licensed analyst content | N/A | Paid | Probably not |
| Internal ZAO thesis log | Our agents state + update named theses | N/A | In-house | **Build this** |

## What's Actually Transferable

1. **Thesis > signal.** Quotient trades only when "new intelligence changes the thesis." Our agents in `src/lib/agents/runner.ts` should log: (a) thesis name, (b) current state, (c) triggers that would flip it. When no trigger, no trade. Cuts API burn and reduces impulsive loss vectors.
2. **Encoded perspective.** Q is "founder-in-a-box." For ZAO this is ZOE = Zaal-in-a-box. The pattern is already live (see `project_zoe_v2_redesign.md`); this doc reinforces the design choice.
3. **No trade recommendations, only reasoning.** Q tells you what it thinks, not what to do. Our public-facing agents should follow the same rule — never publish a buy/sell, always publish the reasoning. Legal and trust win.
4. **De-conditioning language.** kompreni's framing ("cucktrading") is inflammatory but the anti-KOL point is correct. The ZAO community copy angle: we reward provenance of reasoning, not hype.

## What to Reject

- REJECT the tone. "Cucktrader" language doesn't belong anywhere in ZAO copy.
- REJECT the 87% number. No audit = no cite.
- REJECT "AI is never emotional" as a universal — LLMs absolutely exhibit training-induced biases (recency, popularity, refusal patterns). Be honest about it.
- REJECT the implicit paywall play. Q monetizes subscriber alpha; our community model is different.

## Specific Numbers

- **87%** — Quotient's self-reported prediction accuracy (cite with caution).
- **0** — trades Q makes autonomously. It informs, user decides.
- **24/7** — runtime.
- **1 founder persona** — Q currently encodes. Future: any perspective.

## Concrete Integration Points

- `src/lib/agents/types.ts` — add `Thesis` type: `{ id, name, claim, triggers[], lastUpdated, currentState }`.
- `src/lib/agents/runner.ts` — gate agent actions on thesis-change events.
- `src/app/api/agents/` — expose a read-only `GET /api/agents/theses` so the community dashboard can see reasoning without seeing trades.
- `community.config.ts` — add a `publicReasoning: true` flag for agents that publish theses to Farcaster channels.
- WaveWarZ: `research/wavewarz/` — add a followup doc on attaching Q-style reasoning snapshots to every market.

## Risks

- Regulatory: if ZAO publishes "reasoning" that a reasonable reader would treat as investment advice, we risk SEC-style exposure. Mitigation: keep it informational, hold audience is ZABAL holders (not public), and attach disclaimers. Coordinate with `project_zao_music_entity.md` legal thread.
- Overfitting: an LLM trained on one analyst's style is brittle outside the training distribution. Don't bet on it for novel events.

## Sources

- [kompreni — "A letter to all Cucktraders"](https://x.com/kompreni/status/2045124261556228444)
- [Quotient homepage](https://quotient.to/)
- [Polymarket](https://polymarket.com/)
- [Our agent infra](../../../src/lib/agents/runner.ts)
