---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-07-02
superseded-by:
related-docs: 584
original-query: "https://github.com/Gnericvibes/finance-os - research this repo, tell me what I think of it"
tier: STANDARD
---

# 941 - Finance OS (Gnericvibes) - Repo Evaluation

> **Goal:** Assess Gnericvibes' `finance-os` repo - what it is, how it's built, what's good, what's weak, and what ZAO can borrow.

## Key Decisions

| Verdict | Call |
|---------|------|
| Overall | STRONG concept, MID execution. A Nigeria-focused (NGN default) AI personal-finance app with a genuinely good architecture idea, shipped at an early/WIP stage. Worth watching, not yet worth adopting. |
| Best idea to STEAL | The deterministic-engine / LLM-narrator split - `PFOSEngine` computes all scores in TypeScript, the LLM only narrates. This is the correct pattern for any money/agent-trading feature in ZAO. |
| Builder signal | Gnericvibes is a ranked Farcaster creator ZAO already tracked - Doc 584's creator-playbook table lists them at 267M reach / $2.17. That was a distribution signal; this repo adds a *build-quality* signal: real product-thinking on financial staging, not a tutorial-follower. Together they read as a credible builder worth a ZABAL Games / collab look. |
| Do NOT copy | The raw `JSON.stringify(context)` dump of a full financial profile into the OpenAI system prompt - ships PII to a third party with zero redaction. ZAO's `pii-hygiene.md` would block this. |
| Adopt for ZAO? | SKIP as a dependency. BORROW the engine/narrator pattern + the FinancialStage concept for any ZAO treasury/wealth tooling. |

## What It Is

An AI-powered "personal finance operating system." Onboarding captures income, expenses, debt, dependents, goals -> a deterministic engine scores financial health and assigns a **stage** (SURVIVAL -> RECOVERY -> STABLE -> GROWTH -> WEALTH_BUILDING) -> generates a 4-bucket **blueprint** (operational / debt / investment / emergency allocation) -> a chat AI narrates and coaches against that state. Currency defaults to **NGN (Naira)** - built for the Nigerian market.

Repo facts (verified 2026-07-02):
- Created 2026-05-24, last push 2026-07-02 (actively worked, ~5 weeks old)
- 492 KB, 0 stars, 0 forks, MIT, TypeScript, 0 open issues
- ~120 source files, feature-sliced (`features/*/{actions,components,services,validators,schemas,store}`)

## Findings

| Area | Assessment |
|------|-----------|
| **Architecture** | Feature-sliced, scalable. Deterministic scoring (`PFOSEngine`) cleanly separated from LLM narration (`AIOrchestrator`). This is the right call for finance - the LLM never does the math. |
| **Domain model** | The strongest part. `FinancialBlueprint` (versioned, % + absolute allocations, health score), `FinancialStage` enum, `Snapshot` (point-in-time net worth), `EntryHistory` (audit trail). Genuine financial-coaching modeling, not a toy. |
| **Money handling** | Correct: `Decimal(18,2)` on every currency field in Prisma. No floats-for-money mistake. |
| **Graceful degradation** | `fallbackResponse()` returns deterministic advice when OpenAI errors - the app still answers "you're over budget in N categories" without the LLM. Good resilience. |
| **Stack** | Next.js 16.2.6, Prisma 6.19, better-auth 1.6, OpenAI (`gpt-4.1-mini`), shadcn + Tailwind v4, recharts, zustand, zod, react-hook-form, framer-motion. |

### Weaknesses / smells

1. **PII to third party, unredacted.** `ai-orchestrator.ts` does `JSON.stringify(context, null, 2)` of the full financial profile into the system prompt sent to OpenAI. Full income/debt/goals leave the system with no redaction. In ZAO this violates `pii-hygiene.md`.
2. **Half-refactored / WIP drift.** Two parallel context builders (`financial-context.ts` used by the orchestrator AND `financial-context-engine.ts`), a `SystemPrompt` class that the orchestrator ignores (it inlines its own prompt), and `financial-intelligence.ts` is an **empty file**. Duplicate `create-entry.ts` + `entry-validator.ts` in both `features/entries/` and `features/pfos/`. Two onboarding stores. Architecture not settled yet.
3. **Dependency drift.** `react: ^18.3.1` but `@types/react: ^19` and `react-is: 19.2.6` - Next 16 normally pairs React 19. Mismatch risk. `@anthropic-ai/sdk` is installed but unused (orchestrator only imports `openai`) - dead dep or WIP.
4. **No tests, no CI, no docs.** README is untouched `create-next-app` boilerplate. Zero test files in the tree.
5. **Thin DB indexing.** Only `FinancialBlueprint` has explicit indexes; high-read models (`Entry`, `Snapshot`) have none - will slow as entries grow (context builder pulls `take: 100` per request).
6. **Heavy AI-generation fingerprint.** Extreme vertical whitespace (one field per line, blank lines between every statement). Not a defect, but signals fast agent-built code that hasn't had a human cleanup pass.

## How This Was Audited (method)

- Repo metadata via `gh api repos/Gnericvibes/finance-os` (stars, license, dates, size).
- Full file tree via `gh api .../git/trees/HEAD?recursive=1` -> ~120 blobs enumerated.
- Direct file reads via `gh api .../contents/<path>` (base64-decoded): README, AGENTS.md, package.json, prisma/schema.prisma, and the AI layer (`ai-orchestrator.ts`, `financial-context-engine.ts`, `system-prompt.ts`, `pfos-engine.ts`).
- Cross-ref: grep of ZAO `research/` for `gnericvibes` / `finance-os` (1 hit -> Doc 584); grep of ZAO memory (0 hits). No prior ZAO doc covers this repo -> net-new.
- No grep.app cross-repo search run: the target is a single named external repo, not a pattern-across-ZAO question, so Step 2.5 does not apply.

## Map to ZAO's Stack

ZAO OS runs **Next.js 16 + Supabase (RLS) + Neynar + iron-session**; finance-os runs **Next.js 16 + Prisma/Postgres + better-auth + OpenAI**. Same framework, different data + auth layer. Translation for anything ZAO borrows:

| finance-os | ZAO equivalent |
|-----------|----------------|
| Prisma models + `db.model.findUnique` | Supabase tables + RLS + `src/lib/db/supabase.ts` (server-role only) |
| better-auth `Session`/`Account` | iron-session (`src/lib/auth/session.ts`) |
| `PFOSEngine` (deterministic scoring) | belongs beside `src/lib/agents/runner.ts` (shared deterministic agent logic) |
| `AIOrchestrator` -> OpenAI | ZAO defaults to Claude (Opus/Sonnet) for agent surfaces; swap the SDK, keep the boundary |
| `JSON.stringify(profile)` into prompt | BLOCKED by `.claude/rules/pii-hygiene.md` - redact before any LLM call |

## Implementation Pattern (reusable)

**Pattern: deterministic-engine + LLM-narrator + deterministic fallback**
Source repo: `Gnericvibes/finance-os` (MIT - copyable). The LLM never computes a number; it only explains numbers the engine already produced, and if the LLM call fails the engine still answers.

```ts
// 1. Engine computes everything (pure TS, testable, no LLM)
const health = PFOSEngine.calculateFinancialHealthScore(profile) // number
const context = await FinancialContext.build(userId)             // {income, expenses, warnings...}

// 2. LLM only narrates the already-computed context
const res = await llm.chat({ system: promptFrom(context), user: message })

// 3. Deterministic fallback when the LLM errors - app still answers
catch { return fallbackResponse(context) } // "over budget in N categories" - no LLM
```

Apply in ZAO to `src/lib/agents/` (VAULT/BANKER/DEALER) and any ZOE money/coaching surface: runner computes, Claude explains, deterministic fallback on API failure. This is the single most transferable idea in the repo.

Secondary borrowables:
- **FinancialStage ladder** (SURVIVAL -> WEALTH_BUILDING) -> maps onto a member "contribution stage" concept for ZOLs / contribution circles.
- **`Snapshot` + `EntryHistory`** point-in-time + audit-trail modeling -> reusable for any ZAO ledger (ZOLs, treasury).

## Also See

- [Doc 584](../../business/584-empire-builder-farcaster-creator-playbooks/) - lists gnericvibes as a Farcaster creator (ZAO orbit context).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide if gnericvibes is a ZABAL Games / collab candidate given this build quality | @Zaal | Decision | Next review |
| If any ZAO finance/treasury AI ships, mirror the engine/narrator split + deterministic fallback | @Zaal | Pattern | When built |
| Note the PII-to-LLM anti-pattern as a review checklist item for agent prompts | @Zaal | Todo | Next agent PR |

## Sources

- [Gnericvibes/finance-os repo](https://github.com/Gnericvibes/finance-os) `[FULL]` - metadata via `gh api`; read README.md, AGENTS.md, package.json, prisma/schema.prisma, ai-orchestrator.ts, financial-context-engine.ts, financial-context.ts (referenced), system-prompt.ts, pfos-engine.ts, full file tree (~120 files).
- Internal: `research/business/584-empire-builder-farcaster-creator-playbooks/README.md` `[FULL]` - gnericvibes creator listing.
- Internal: `.claude/rules/pii-hygiene.md` `[FULL]` - basis for the PII-to-third-party flag.
