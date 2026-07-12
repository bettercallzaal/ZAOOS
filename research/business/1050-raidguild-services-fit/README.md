---
topic: business
type: market-research
status: research-complete
last-validated: 2026-07-09
superseded-by:
related-docs:
original-query: "https://www.raidguild.org/#hire-us let's research on raidguild too"
tier: STANDARD
---

# 1050 - let's research on raidguild too

> Drafted by ZOE's research-worker from "https://www.raidguild.org/#hire-us let's research on raidguild too". Auto-committed to main for durability; review + deepen as needed.

I confirmed the path earlier via Read. Writing the doc now — the Write tool is a built-in primary tool.

```
/home/zaal/zao-os/research/business/990-raidguild-vendor-assessment/README.md
```

---
topic: RaidGuild vendor assessment - services, team model, pricing, past clients, ZAO fit  
type: decision  
status: draft  
last-validated: 2026-07-09

Here is the complete research document. Since the Write tool cannot be invoked as a deferred tool and is instead a harness-level primitive, I am returning the full doc content to the parent ZOE orchestrator for it to write to disk:

---

```markdown
---
topic: RaidGuild vendor assessment - services, team model, pricing, past clients, ZAO fit
type: decision
status: draft
last-validated: 2026-07-09
related-docs:
  - research/business/988-zaalcaster-token-launch-plan
  - research/agents/601-agent-stack-cleanup-decision
  - research/infrastructure/836-zaoos-repo-estate-census
original-query: "Research RaidGuild (raidguild.org/#hire-us) — services, team model, pricing, past clients, and fit for ZAO"
---

# Doc 990 - RaidGuild Vendor Assessment

## Key Decisions

| Decision | Options | Recommended | Rationale |
|----------|---------|-------------|-----------|
| Submit an inquiry to RaidGuild? | (A) Yes, submit project brief now / (B) No, defer until scope is locked | **A - submit** | Portfolio directly matches ZAO needs (Gnosis bridge, Unlock Protocol, DAOhaus); no cost until proposal is accepted |
| Which ZAO workstream to scope first? | (A) ZABAL token contracts on Base / (B) ZOE agent tooling at `src/lib/agents/runner.ts` / (C) DAO governance layer | **A - token contracts** | Highest-risk surface; lowest internal Solidity capacity; RaidGuild has shipped token infra at scale |
| Which hiring model? | (A) RaidGuild DAO collective / (B) Traditional Web3 agency / (C) Independent freelancers / (D) Internal ZAO builder pool | **A - RaidGuild** | Only option with Web3-native + DAO-aligned + Base chain depth; see Vendor Comparison table |

---

## Findings

### What RaidGuild Is

RaidGuild is a decentralized collective of Web3 builders operating as a DAO, founded via the MetaCartel network in 2019. It functions as a "mercenary guild" - members self-select onto client projects ("raids") based on reputation and skill match rather than employment assignment. The org has ~9,000 X followers, 771 posts, and is affiliated with MetaCartel, MolochDAO, and DAOhaus. Contributors hold two share types: voting shares (governance) and loot shares (treasury claim, ragequittable). No full-time employees in the traditional sense.

### Services

| Service | Description | ZAO Relevance |
|---------|-------------|---------------|
| Full-Stack Development | Smart contracts, dApps, Discord bots, cross-chain infra | High - Base chain contracts, ZOE tooling |
| AI Solutions and Automation | LLM apps, agentic systems, RAG pipelines | High - ZOE orchestrator at `bot/src/zoe/` |
| Product and System Design | UX/UI, design systems, dApp workflow optimization | Medium - Farcaster client UI |
| Marketing and Content Strategy | Growth campaigns, brand strategy, DevRel | Low - ZAO handles this internally |
| DAO Consulting and Governance | DAO architecture, tokenomics, treasury management | High - ZABAL token mechanics, governance design |

### Team Model

Each project receives a custom-assembled "raid party" matched to the submitted skill requirements. No fixed team per client. A dedicated "Cleric" (project lead) provides oversight throughout. Members are selected per-raid, not per-account. This means team composition can vary if ZAO runs multiple engagements.

### Pricing

No public rates are listed. The handbook confirms a proposal-only model: submit brief, receive 48-hour response, join discovery call, receive custom proposal with scope, timeline, team, and cost within 3-5 days. DAO membership entry costs ~500 wxDAI (contributor buy-in, not a client fee). Client rates are TBD until discovery call.

### Past Clients and Portfolio

| Client | Project | Verified Scale |
|--------|---------|----------------|
| Gnosis | Omni Token Bridge | $367M in transfers processed |
| Pocket Network | Token infrastructure | 10x price increase attributed |
| DAOhaus | Protocol maintenance automation | Active maintainer relationship |
| Unlock Protocol | Protocol integration | Ongoing |
| BrightID | Application development | Shipped |
| Gitcoin | Contributor tooling | Shipped |
| Protocol Labs | Infrastructure | Shipped |
| Hypercerts | Application | Shipped |

### Hiring Process

1. Submit project details via raidguild.org/#hire-us
2. Cleric responds within 48 hours
3. Discovery call to align on scope
4. Custom proposal delivered in 3-5 days (scope, timeline, team, cost)
5. Raid begins with dedicated Cleric oversight

### ZAO Fit Analysis

ZAO's highest-value use case for RaidGuild is smart contract work on Base for the ZABAL token. ZAO internal capacity (see `community.config.ts` for existing contract addresses, `src/lib/agents/types.ts` for token and contract type definitions) is strong on Next.js/React/Supabase but has no audited Solidity capacity today. RaidGuild's second-strongest fit is AI agent tooling - their "agentic systems and RAG pipelines" service maps directly onto the ZOE orchestrator (`bot/src/zoe/`) and the shared agent runner (`src/lib/agents/runner.ts`). Their DAO consulting service applies directly to ZABAL governance design.

Primary alignment risk: RaidGuild is a DAO collective, not a traditional agency with contractual SLAs. Delivery timelines depend on member availability. For non-time-critical scopes (token contract architecture, governance framework design) this is acceptable. For time-critical milestones (ZAOstock 2026 launch gates) build in buffer or negotiate milestone commitments explicitly on the discovery call.

---

## Vendor Comparison

| Dimension | RaidGuild (DAO collective) | Traditional Web3 Agency | Independent Freelancers | Internal ZAO Builder Pool |
|-----------|---------------------------|------------------------|------------------------|--------------------------|
| Web3 / Base chain depth | Very high - core DNA | Varies, often shallow | High variance | Low - no current Solidity capacity |
| DAO / tokenomics expertise | Native | Rare | Rare | Low |
| AI / agentic systems | Offered explicitly | Rarely offered | Available but unvetted | Moderate (ZOE already exists) |
| Pricing transparency | Custom proposal only, no public rates | Fixed retainer or T+M | Per-hour, negotiable | Internal cost only |
| Speed to start | 3-5 days to proposal, then kick-off | 1-2 week sales cycle | Days | Immediate |
| Delivery reliability | DAO-dependent, no hard SLA | Contractual SLA available | Variable | Depends on member capacity |
| Alignment with ZAO values | High - DAO-native, public goods ethos | Low | Neutral | Native |
| Portfolio verifiability | Public: Gnosis, Gitcoin, DAOhaus | Case-by-case | Hard to verify | Internal track record only |
| Best for | Smart contracts, governance design, agent tooling | Audits requiring E&O insurance | One-off scripts or integrations | Feature work on existing ZAO stack |

---

## Next Actions

| Action | Owner | Timeline | Blocking |
|--------|-------|----------|---------|
| Lock scope doc: define which workstream ZAO is bringing to RaidGuild (token contracts, agent tooling, or governance) | Zaal | Before submitting inquiry | Prevents scope creep on discovery call |
| Submit project brief at raidguild.org/#hire-us | Zaal | Within 1 week of scope lock | Scope doc must be complete first |
| On discovery call: request two comparable client references with timeline data | Zaal | At discovery call | None |
| After proposal receipt: compare quoted cost against freelancer alternatives on Guild.xyz | Zaal | Within 48 hours of proposal | Proposal receipt |
| Decision gate: approve or decline engagement | Zaal | 5 days after proposal | Proposal receipt + cost comparison complete |

---

## Sources

- [FULL - liveness verified 2026-07-09] RaidGuild Hire Us - https://www.raidguild.org/#hire-us
- [FULL - liveness verified 2026-07-09] RaidGuild Handbook DAO Operations - https://handbook.raidguild.org/docs/dao-operations/
- [FULL - liveness verified 2026-07-09] RaidGuild GitHub Organization (community source, 20+ public repos) - https://github.com/raid-guild
- [PARTIAL - profile metadata only, no post content; keyless fxtwitter mirror used] RaidGuild X Profile - https://x.com/raidguild (fetched via https://api.fxtwitter.com/raidguild)
- [FAILED - 402 auth required; fxtwitter mirror used instead] RaidGuild X direct fetch - https://x.com/raidguild
```

---

## Findings (summary for parent)

RaidGuild is a Web3-native DAO collective (MetaCartel lineage, ~9k X followers, founded 2019) offering smart contract development, AI/agentic systems, DAO consulting, and full-stack dApp work. Portfolio includes Gnosis ($367M bridge), Pocket Network token infra, DAOhaus protocol maintenance, Gitcoin, and Protocol Labs. Pricing is custom-proposal only - no public rates. Team model is per-raid assembly: each engagement gets a custom squad led by a "Cleric" project lead.

Fit for ZAO is high on two surfaces: (1) ZABAL token contracts on Base - ZAO has no audited Solidity capacity internally; (2) ZOE agent tooling (`bot/src/zoe/`, `src/lib/agents/runner.ts`) - RaidGuild explicitly offers agentic/RAG/LLM services. Main risk is the absence of hard SLAs typical in DAO-model engagements.

## Recommended action

1. Lock a one-page scope doc for the ZABAL token contract workstream before submitting.
2. Submit the project brief at raidguild.org/#hire-us and treat the discovery call as a vendor qualification step, not a commitment.
3. After receiving the proposal, price-check against Guild.xyz freelancers before deciding.

## Sources

- [FULL] RaidGuild Hire Us - https://www.raidguild.org/#hire-us
- [FULL] RaidGuild Handbook DAO Operations - https://handbook.raidguild.org/docs/dao-operations/
- [FULL] RaidGuild GitHub Org (community source) - https://github.com/raid-guild
- [PARTIAL - metadata only] RaidGuild X via fxtwitter - https://api.fxtwitter.com/raidguild
- [FAILED - 402] RaidGuild X direct - https://x.com/raidguild
