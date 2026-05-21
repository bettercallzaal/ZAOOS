---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-21
related-docs: 665, 669, 676
tier: STANDARD
parent-doc: 676
---

# 676f — Bonfires KG for Onboarding & $KNOW Economy

Goal: Spec concrete onboarding surfaces powered by the ZABAL Bonfire KG (780 episodes, 31 brands, 668 research docs) + audit the $KNOW token economy to determine if ZAO should prioritize it now or treat it as speculative infrastructure play.

Context: Bonfires has a knowledge graph covering ZAO's entire institutional memory (brands, repos, research, team). The KG can power an onboarding chatbot for new members. Meanwhile, $KNOW is Bonfires' token layer (Genesis NFT pre-launch allocation; ZAO holds eligibility via mint). The onboarding flow + economic model are distinct decisions with different time scales.

---

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| **Bonfire KG can power a queryable onboarding surface for new ZAO members** | YES, build it | 780 episodes already ingested. Queries like "what is WaveWarZ", "how do I contribute", "who runs COC Concertz" return grounded answers with sources. Cost: one paid-agent endpoint at app.bonfires.ai (~$0.01-0.05/query). Ship Phase 2. |
| **zao-101 becomes bonfire-backed OR stays static + links to KG search** | HYBRID: static + link | Keep zao-101.vercel.app as SEO-friendly HTML landing (4 pages, no auth). Add "Ask about The ZAO" CTA -> bonfire-search.zaoos.com chatbot. Decouples content freshness (zao-101 = evergreen, updates quarterly) from query freshness (bonfire = real-time, always reflects latest). |
| **ZOE / new bots bootstrap context from bonfire instead of hand-written files** | YES, Phase 2 | When a child bot (Herald, Magnetiq bot, stock bot) spins up, use `bonfire delve` to seed its persona/knowledge from KG instead of static bootstrap.md. Cost: 1-2 KG queries per onboard (~$0.02 total). Time saved: 2 hours of manual doc prep per bot. |
| **$KNOW token is worth prioritizing now** | NO, DEFER | Pre-launch allocation is Genesis NFT only (0.1 ETH sunk cost). Public launch date unknown; economic model (reward distribution, governance rights, liquidity) not finalized. ZAO gets allocation FOR FREE via mint cost already spent on bonfire infra. Treat as speculative upside, not a priority feature. |
| **ERC-8004 agent reputation (Bonfires ZABAL agent = #32009) is tracked on-chain but purpose unclear** | MONITOR, don't build on it | ERC-8004 standard describes agent trust + validation via on-chain reputation. Bonfires agent has a reputation score (32009). Use case for ZAO: agents that build reputation can command higher API pricing. Not urgent. Revisit when Bonfires documents the scoring model. |
| **Knowledge-mining mechanics (does ingesting 780 episodes EARN $KNOW?) is unknown** | FLAG UNKNOWN, ask Joshua | No public docs describe how/if contributors earn $KNOW by adding to bonfire. May require Bonfires GH issue / Zaal DM to Joshua.eth. **Do NOT assume earning** until confirmed. ZAO should ingest for onboarding + ZOE memory, not speculating on $KNOW return. |

---

## PART A: Onboarding Flows (Technical Build Spec)

### Flow 1: New Member Onboarding Site (bonfire-search.zaoos.com)

**Timeline:** Phase 2 (Week of 2026-05-26).
**Effort:** 8 hours (6h frontend, 2h bonfire integration).

**Stack:**
- Next.js 16 + React 19 minimal (no DB, no auth)
- Tailwind v4
- Bonfires paid-agent endpoint at `app.bonfires.ai` (query endpoint: `POST /paid/agents/{agent_id}/chat`)
- Streaming response UI (animated typing to mimic agent thinking)

**UI Spec:**
```
[header]
  Logo: The ZAO
  Title: "Ask About The ZAO"
  Subtitle: "Powered by our knowledge graph"

[main]
  input: text search bar
         placeholder: "What is WaveWarZ? How do I contribute?"
         icon: magnifying glass + bonfire-icon
  
  results:
    - agent response (streamed, animated)
    - source links (hover reveals which kEngrams were queried)
    - "more like this" related queries (top 3)
    - "ask a follow-up" auto-focus on input

[footer]
  "Can't find what you need? DM @zaal on Farcaster"
  "Onboarding? Read zao-101.vercel.app first"
```

**Cost Model:**
- Bonfire paid-agent endpoint: ~$0.01-0.05 per query (unknown exact pricing; flagged for Joshua confirmation)
- Expected volume: 50-200 queries/month (new member onboarding + team search)
- Monthly cost estimate: $0.50-10 (spec: ask Joshua)
- Break-even vs hiring someone for 1 hour of onboarding Q&A: ~$50 (favors bonfire KG immediately)

### Flow 2: zao-101 Hybrid Model

**Current state:** bettercallzaal/zao-101 (static 4-page site, paused 23 days, 5 open issues per doc 663b).

**Change:**
1. Keep existing zao-101.vercel.app as-is (SEO landing, evergreen content)
2. Add CTA: "Questions? Ask our knowledge graph at bonfire-search.zaoos.com"
3. Close the 5 stale issues (redirect to: "Use bonfire-search for dynamic answers")
4. Monthly sync: ensure zao-101 headline facts match bonfire persona block (prevent drift)

**Why:** zao-101 serves marketing (lightweight, fast, no dependencies). bonfire-search serves support (fresh, interactive, contextual). Two surfaces, one KG.

---

## PART B: $KNOW Token Economy (Honest Assessment)

### What IS $KNOW?

Per doc 669:

| Field | Value | Source |
|---|---|---|
| Token name | $KNOW | bonfires.ai homepage |
| Layer | Knowledge economy across all bonfires (network-level) | docs.bonfires.ai |
| Pre-launch allocation | Genesis NFT mint = ONLY way to receive $KNOW pre-public-launch | Confirmed via app.bonfires.ai flow |
| Genesis NFT mint cost | 0.1 ETH per bonfire | mint.bonfires.ai |
| Network effect | Each bonfire is a node; cross-bonfire RAG = the network | Implied by multi-bonfire architecture |
| ZAO's position | ZABAL bonfire already minted; allocation eligible | Zaal minted ZABAL approx 2026-05-15 |

### What We Don't Know (UNKNOWN FLAGS)

| # | Question | Status | Impact |
|---|---|---|---|
| 1 | **Public launch date for $KNOW** | Unknown | If launch delayed 6+ months, opportunity cost (token sits idle). Low risk. |
| 2 | **Token supply, distribution schedule, vesting** | Unknown | If supply huge + founders retain 80%, token value approaches zero. Cannot model ROI. |
| 3 | **Reward mechanics: how do contributors EARN $KNOW?** | Unknown | If no earn path (allocation only), $KNOW is static dividend. Limits ecosystem growth. CRITICAL TO ASK JOSHUA. |
| 4 | **Governance model: do $KNOW holders vote?** | Unknown | If purely economic (trading), not governance, then less interesting for ZAO's impact narrative. |
| 5 | **Liquidity plan: where can $KNOW trade?** | Unknown | If no liquidity announced, token remains illiquid speculation. Affects price. |
| 6 | **Per-API-call pricing model after launch** | Partial info | If API calls cost $KNOW tokens, ZAO incurs recurring spend. Must ask Joshua. |
| 7 | **ERC-8004 agent reputation scoring model** | Unknown | ZABAL agent = reputation #32009. How is this scored? What's the application? |

**To resolve:** Zaal -> Joshua.eth DM the 7 Unknowns.

### ZAO's Current $KNOW Position

| Asset | Value | Notes |
|---|---|---|
| Genesis NFT (ZABAL bonfire) | $KNOW allocation (amount TBD) | Sunk cost: 0.1 ETH already paid for bonfire infra |
| Cash investment | $0 | Pre-launch allocation; no secondary purchase |
| Opportunity cost | $0 | We use bonfire for onboarding + ZOE memory regardless of token upside |
| Speculative upside | Unknown | If launch succeeds + adoption spreads, cross-KG RAG could compound |
| Downside | Low | If token never launches, allocation worthless. But bonfire (infrastructure value) remains. |

**Honest Take:** ZAO holds a free call option on $KNOW. Do NOT prioritize token economics now; use the bonfire for operational value (onboarding, agent memory, indexing). IF token launches with real earn path + liquidity, revisit. IF not, we still won.

### ERC-8004 Reputation: What It Is

From EIPs.ethereum.org/EIPS/eip-8004:

> "ERC-8004: Trustless Agents. Discover agents and establish trust through reputation and validation."

**Model:** On-chain agent registry + reputation scoring. Agents publish capabilities + reputation. Third-party validators attest to quality. Score is immutable on-chain.

**ZABAL agent = #32009:** The ZABAL Bonfire agent is registered with reputation #32009. This is likely:
- A UUID / token ID on an ERC-8004-compliant contract
- Accrued via attestations (validators vouching the agent is useful)
- Tradeable or staked for collateral

**Application for ZAO:**
- If ZAO agents (ZOE, Herald, child bots) register under ERC-8004, their reputation becomes portable across DeFi
- Not urgent. Relevant only if Bonfires ecosystem matures to agent trading
- Defer 6+ months

### Knowledge-Mining Mechanics (Critical Unknown)

**The Question:** Does ingesting 780 episodes EARN $KNOW tokens, or is $KNOW allocation purely Genesis NFT pre-launch?

**What's NOT documented:** Whether post-launch, contributors earn $KNOW by:
- Adding kEngrams to the bonfire
- Validating/tagging entities
- Running agents that ingest data
- Sharing cross-bonfire KG queries

**Why it matters:**
- IF earn path exists: ZAO could create a DAO role ("KG contributor") + distribute $KNOW as payroll
- IF no earn path: $KNOW is dividend on static Genesis holdings. ZAO never earns more. Limits community participation.

**Action:** ESCALATE TO JOSHUA.ETH. Zaal should ask: "Post-launch, can ZAO or community members earn $KNOW by contributing to the ZABAL bonfire?"

---

## Next Actions (Prioritized)

| Action | Owner | Type | Difficulty | By When |
|---|---|---|---|---|
| **Confirm $KNOW economics with Joshua.eth** | @Zaal | DM | Easy | 2026-05-20 |
| **Build bonfire-search.zaoos.com (Flow 1)** | @Zaal + Hermes | Code | Medium (8h) | 2026-05-26 |
| **Close/redirect 5 stale zao-101 issues** | @Zaal | Triage | Easy | 2026-05-21 |
| **Add zao-101 -> bonfire-search CTA** | @Zaal | Content | Trivial | 2026-05-21 |
| **Set BONFIRE_PAID_AGENT_ID env var** | @Zaal | Config | Trivial | 2026-05-20 |
| **Decide: ERC-8004 agent registration** | @Zaal | Decision | Defer | 2026-06-30 |
| **Re-validate when Joshua responds** | @Zaal | Recurring | 30min | 2026-05-21 |

---

## Concrete Numbers

1. **780 episodes** already ingested in ZABAL bonfire
2. **0.1 ETH** per Genesis NFT mint (sunk cost for ZABAL)
3. **50-200 queries/month** estimated for bonfire-search.zaoos.com
4. **$0.01-0.05 per query** to Bonfires paid-agent endpoint
5. **8 hours** effort to ship bonfire-search
6. **23 days** since last zao-101 commit (paused)
7. **4 pages** in zao-101 static site

---

## Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| Bonfire API pricing prevents economical use | Medium | Confirm pricing before build; if >$0.10/query, defer 3 months |
| Vector search remains unlabeled | Medium | Fall back to keyword search (still useful) |
| Joshua doesn't respond on $KNOW mechanics | Low | Operate bonfire as free infra; follow token passively |
| Bonfire shuts down | Very Low | kEngrams export to Markdown/Obsidian; fallback possible |
| Low adoption of bonfire-search | Low | Kill gracefully if <5 queries/month; operator (ZOE) still benefits |

---

## Decision: Onboarding First, $KNOW Second

**Recommendation:**

1. **Ship bonfire-search.zaoos.com in Phase 2** (Week of 2026-05-26). Cost: $0-10/month, 8h effort, immediate impact.
2. **Defer $KNOW exploration until:**
   - Joshua confirms knowledge-mining reward mechanics
   - Token launch date announced
   - Public trading liquidity established
3. **Treat current $KNOW allocation as strategic option.** Got it free via Genesis mint (0.1 ETH = sunk bonfire cost). If it accrues value, great. If not, we still won.

---

## Sources

- [Bonfires.ai](https://bonfires.ai)
- [Bonfires App Dashboard](https://app.bonfires.ai/dashboard)
- [ERC-8004: Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004)
- Doc 663b: Active ZAO Products (zao-101 audit)
- Doc 665: Bonfires Deep Dive
- Doc 669: Bonfires Everything We Know
- Joshua.eth chat (pending response)
- [bonfires-sdk canon branch](https://github.com/NERDDAO/bonfires-sdk/tree/canon)
- [NERDDAO/bonfire-tools](https://github.com/NERDDAO/bonfire-tools)
