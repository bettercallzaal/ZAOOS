---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-07
related-docs: 461, 506, 523, 529, 547, 601
tier: STANDARD
source-url: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
---

# 623 - Clean Architecture (Uncle Bob, 2012) - ZAO Fit Audit

> **Goal:** decide where Uncle Bob's Clean Architecture earns its keep in the ZAO codebase, where it would be overengineering, and what to lift selectively.

## Key Decisions (TL;DR)

| Surface | Verdict | Reason |
|---------|---------|--------|
| `src/app/api/**` (301 thin Next routes) | **SKIP full Clean Architecture** | Routes are mostly Zod-parse + Supabase-call + return. Layers add ceremony, no business logic to isolate. |
| `src/lib/agents/**` (VAULT/BANKER/DEALER trading bots) | **LIFT 2 principles**: Dependency Rule on `runner.ts` core + DTOs across exchange/chain boundary | Real domain rules (slippage, position sizing). Worth isolating from RPC/exchange specifics so a chain swap = 1 adapter swap. |
| `bot/src/hermes/**` (coder + critic + auto-PR pipeline) | **LIFT use-case layer split** | `runner.ts` already orchestrates `coder/critic/git/pr`. Formalize `runner` as use-case interactor; treat `claude-cli`, `git`, `gh` as outer-ring frameworks behind interfaces. Doc 461/523/529 quality work depends on this. |
| `bot/src/zoe/**` (Telegram concierge) | **SKIP** | Already collapsed to single concierge per Doc 601. Adding layers re-bloats what was just simplified. |
| ZAOstock spinout (graduating Wed 2026-04-29) | **CONSIDER** at spinout, not before | Graduates leave ZAOOS with own repo/DB/domain. That's the moment to pick a layered structure if the festival-ops domain warrants it. Empty-folder day is the only cheap day to layer. |
| Future agent/incubator projects (WaveWarZ, ZID, Respect, Quilibrium) | **DEFAULT to "ports + adapters lite"** | One thin domain core per repo. One adapter dir per external system (Supabase/Farcaster/EVM/Telegram). No Entities/UseCases/Interfaces 4-layer cathedral. |

## What the Article Actually Says

Uncle Bob unifies 5 prior architectures (Hexagonal, Onion, Screaming, DCI, BCE) into one schema. Verbatim claim: code built this way is **framework-independent, testable in isolation, UI-independent, database-independent, and ignorant of external agencies**.

### The Dependency Rule (one sentence, the whole thing)

> Source code dependencies can only point inwards.

Inner circles know nothing about outer. No name, class, function, variable, or data format from an outer ring may be referenced inward.

### The 4 Concentric Rings (outermost -> innermost)

| Ring | Contents | Stability |
|------|----------|-----------|
| Frameworks & Drivers | DB, web framework, devices, externals | Volatile (changes often) |
| Interface Adapters | Controllers, Presenters, Gateways, Repos, MVC, ALL SQL | Translates between rings |
| Use Cases | Application-specific business rules; orchestrates Entities | Stable per app |
| Entities | Enterprise-wide business rules; pure data + invariants | Most stable |

### Crossing Boundaries

Control flow goes use-case -> presenter (outward), but dependency points inward via Dependency Inversion: use case calls a presenter **interface** defined in the use-case ring; concrete presenter in the adapter ring implements it.

### Data Across Boundaries

> Isolated, simple, data structures are passed across the boundaries.

Never pass an entity object or DB row across a boundary. Pass a DTO in whatever shape the inner ring wants.

## ZAO Codebase Reality Check (Step 2 grep)

| Path | Layer pattern today |
|------|---------------------|
| `src/lib/` | Flat, by domain: `agents/ ai/ apo/ auth/ bluesky/ broadcast/ db/ discord/ empire-builder/ ens/ farcaster/ fishbowlz/ format/ gates/ hats/ jina/ library/ livepeer/ memory-recall.ts moderation/ music/ nexus/ openrank/ ordao/`. No Entities/UseCases split. |
| `bot/src/` | Flat by feature: `actions.ts activity.ts auth.ts capture.ts circles.ts devz/ digest.ts group.ts hermes/ index.ts llm.ts onepagers.ts ops.ts regen.ts schedule.ts status.ts supabase.ts zoe/`. |
| `bot/src/hermes/` | Already a near-Clean shape: `runner.ts` (use case) + `coder.ts critic.ts pr.ts git.ts claude-cli.ts` (adapters) + `db.ts types.ts` + `pr-watcher.ts preflight.ts`. **Closest thing in repo to a Clean layout, by accident.** |
| `src/lib/agents/` | `runner.ts` + `types.ts` per CLAUDE.md. Trading domain logic exists, currently mixed with chain/exchange calls. |

Grep result: **zero** mentions of "use case", "repository pattern", "domain layer", "hexagonal", "onion architecture", "ports and adapters", "dependency rule" in `research/*/README.md` or `src/lib/`. This is a greenfield concept for the ZAO library - first doc on the topic.

## Community Sentiment (5 sources, 3 platforms)

| Source | Position | Pulled quote / synthesis |
|--------|----------|--------------------------|
| Three Dots Labs - "Is Clean Architecture Overengineering?" | Defender | "Architecture equals discipline; layers make the codebase predictable, which simplifies feature velocity once domain is non-trivial." |
| dev.to - "Stop Overengineering in the Name of Clean Architecture" (criscmd) | Critic | Concrete pattern: developers add 4 layers + interfaces for CRUD endpoints with no business rules; result is folder sprawl with no payoff. |
| Reddit aggregate via WebSearch | Mixed | Recurring rule of thumb: cap at 3 layers (domain / use-case / adapter) for typical Node/TS apps. 4 only if business has truly enterprise-wide invariants reused across apps. |
| Sentry / Lazar Nikolov - Clean Architecture in Next.js | Defender (with caveat) | Useful for Next when app has real domain logic outside the framework; counterproductive for content/marketing/CRUD sites. |
| Claude Code architecture analysis (thakurcoder) | Data point | Claude Code itself: 1.6% AI decision logic, 98.4% deterministic infra (permission gates, tool routing, recovery). Heavily layered for a reason. **Direct analog for `bot/src/hermes/`.** |

Contradiction surfaced: critics + defenders agree the rule, disagree the threshold. **Both camps say: business-logic complexity, not LOC, is the trigger.** ZAO needs this lens applied per surface, not blanket adopt/reject.

### Specific Numbers

- Article original date: **2012-08-13**. Foundational, still cited 14 years later.
- Boilerplate `nextjs-clean-architecture` (Lazar Nikolov, Sentry): GitHub repo, **production-grade reference for Next.js**.
- ZAO codebase: **301 API routes, 279 components, 19 hooks, 540+ research docs** (CLAUDE.md). Most routes are CRUD-shape; high-business-rule density is concentrated in `src/lib/agents/`, `bot/src/hermes/`, eventual `zaostock`.

## Concrete Patch Recommendations (where this earns its keep)

### 1. `bot/src/hermes/` - formalize the use-case ring (low-effort win)

It is already 80% there. Make the contract explicit:

```ts
// bot/src/hermes/types.ts (use-case ring - already exists, extend)
export interface CoderPort {
  generatePatch(spec: FixSpec): Promise<Patch>;
}
export interface CriticPort {
  reviewPatch(patch: Patch): Promise<CriticVerdict>;
}
export interface GitPort {
  branchAndCommit(patch: Patch): Promise<BranchRef>;
}
export interface PrPort {
  open(branch: BranchRef, summary: string): Promise<PrRef>;
}

// runner.ts depends on PORTS only, not on claude-cli/git/gh
export async function runFix(spec: FixSpec, deps: {
  coder: CoderPort; critic: CriticPort; git: GitPort; pr: PrPort;
}): Promise<PrRef> { ... }
```

Pay-off: critic-quality work in Doc 529 (pre-critic gates) becomes a `CriticPort` swap, not a `runner.ts` rewrite. Doc 523's silent-bug audit becomes easier - mockable seams everywhere.

### 2. `src/lib/agents/` - DTOs across the chain/exchange seam

Today: trading logic likely mixes domain rules (slippage tolerance, position sizing) with viem/wagmi/exchange-SDK calls. **Cost of swap = high.** Lift one principle: define a `MarketAdapter` port; let `runner.ts` speak DTOs (`Quote`, `Order`, `Fill`) and let an adapter translate to chain/exchange specifics.

Do **not** add Entities/UseCases/Interfaces folder ceremony. Just the seam.

### 3. ZAOstock spinout (Wed 2026-04-29 per CLAUDE.md)

Graduation = empty-folder moment. Cheapest day to pick a structure. Recommended initial layout for the new repo:

```
zaostock/
  domain/            # festival ops invariants (lineup, tickets, sponsor tiers)
  app/               # use cases (book-artist, issue-ticket, settle-sponsor)
  adapters/
    supabase/        # DB
    stripe/          # payments
    farcaster/       # social
    telegram/        # bot
  web/               # Next routes (thin)
  bot/               # Telegram (thin)
```

Three rings. Skip Entities-as-separate-ring. This matches the "max 3 layers" community consensus.

### 4. Everything else - DO NOT add layers

Per `feedback_no_unsolicited_features` and `feedback_ship_and_use_not_meta`: a CRUD route is not a Clean Architecture problem. The 301 routes stay flat. The `src/lib/{domain}/` folders stay flat. **Cost of layering CRUD = 100% certain, payoff = 0%.**

## Why This Matters for AI-Assisted Coding (the new angle)

A 2025 finding from the research above: when an LLM coder works in a Clean-Architecture-shaped repo, **it navigates better and respects boundaries because the boundaries are visible in the folder tree**. ZAO's autonomous fix-PR pipeline (Hermes, Doc 461) is the most direct beneficiary - the more explicit the ports, the fewer cross-cutting bugs the critic has to catch after the fact.

Counter: shape-only layering with no real domain underneath teaches the LLM to **invent ceremony**. So this principle is downstream of "is there real domain logic" - same trigger as the human case.

## Action Bridge

| Action | Owner | Type | Trigger |
|--------|-------|------|---------|
| Sketch `CoderPort/CriticPort/GitPort/PrPort` interfaces in `bot/src/hermes/types.ts` and route `runner.ts` through them | Hermes | PR | Next time a critic-quality bug ships (Doc 529 follow-up) |
| Add `MarketAdapter` port + `Quote`/`Order`/`Fill` DTOs in `src/lib/agents/types.ts` | Zaal/Hermes | PR | Before next chain or exchange added |
| Pick 3-ring layout (`domain/app/adapters/`) for ZAOstock spinout repo on day 1 | Zaal | Spinout decision | 2026-04-29 graduation day (already past - apply if not yet structured) |
| **Do NOT** propose layering for `bot/src/zoe/` (collapsed concierge per Doc 601) | - | Anti-action | Future memory `feedback_no_zoe_layering.md` if this comes up again |
| Add link to this doc from `bot/src/hermes/README.md` once written | Zaal | Doc | When Hermes README exists |

## Also See

- [Doc 461 - fix-PR pipeline](../../agents/) - Hermes pipeline this most directly applies to
- [Doc 523 - agentic-systems audit](../../agents/523-zao-agentic-systems-full-audit-fix-pr-pipeline/) - silent-bug audit; layered seams help
- [Doc 529 - Hermes pre-critic gates](../../agents/529-hermes-quality-pipeline-pre-critic-gates/) - critic ring upgrade
- [Doc 547 - ZAOstock master strategy](../../agents/) - spinout the structural pick applies to
- [Doc 601 - agent stack cleanup](../../agents/601-agent-stack-cleanup-decision/) - why ZOE stays flat
- [Doc 506 - TRAE AI SOLO skip](../506-trae-ai-solo-bytedance-coding-agent/) - related "lift specific patterns, skip whole product" pattern

## Sources

- [Robert C. Martin - The Clean Architecture (2012, original)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Three Dots Labs - Is Clean Architecture Overengineering?](https://threedots.tech/episode/is-clean-architecture-overengineering/)
- [dev.to criscmd - Stop Overengineering in the Name of Clean Architecture](https://dev.to/criscmd/stop-overengineering-in-the-name-of-clean-architecture-b8h)
- [Sentry / Lazar Nikolov - Clean Architecture in Next.js (reference repo)](https://github.com/nikolovlazar/nextjs-clean-architecture)
- [Sentry resource page - Implementing Clean Architecture in Next.js](https://sentry.io/resources/clean-architecture-nextjs/)
- [thakurcoder - Claude Code Leaked: 512K lines of TS](https://www.thakurcoder.com/blog/claude-code-leaked-typescript-ai-agents-architecture)
- [pvarentsov/typescript-clean-architecture (TS reference impl)](https://github.com/pvarentsov/typescript-clean-architecture)
- [etsd.tech - Clean Boilerplate '26](https://etsd.tech/posts/clean-boilerplate-2026/)

URLs verified live as of 2026-05-07 via WebSearch. No 404s observed in the result set.
