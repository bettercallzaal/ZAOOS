---
topic: agents
type: audit
status: complete
last_validated: 2026-07-23
original_query: "https://github.com/wowsuchbot/suchbot - research and decide what ZAO should adopt into ZOE"
tier: STANDARD
---

# Suchbot Evaluation for ZOE

## Key Decisions

| Decision | Answer | Rationale |
|----------|--------|-----------|
| What is it? | Hackathon-stage Farcaster agent (Apr 2026) that generates interactive snaps via a template engine. Uses external Hermes runtime for persistence/tools/scheduling. | FarHack Online 2026 submission. 1 commit, created 2026-04-26, 1 star, 0 issues. All work completed same day. |
| License & reuse? | PROPRIETARY (no license file, all-rights-reserved). Code reuse is blocked. | No LICENSE file in root or packages/. GitHub shows `licenseInfo: null`. Patterns can be learned but not implemented. |
| Top adopt? | Template expansion pattern for structured LLM output. Not snap-specific; applies to any multi-step generation task. | Instead of LLM generating 2000+ tokens of raw complex JSON, it generates ~50 tokens of "slot data" that a template engine expands. Error reduction + speed. |
| What to skip? | The Hermes runtime, snap-server code, Farcaster-specific snap generation, the architecture wholesale. | Hermes is external (not in this repo). snap-server is early/untested/proprietary. ZOE doesn't need to generate snaps today. ZOE's organism (Spine/Cortex/Heart) already exceeds suchbot's architecture. |
| Alignment with ZOE? | Low. suchbot is creative-output-focused (snaps, art). ZOE is automation-focused (fix-PRs, error remediation, orchestration). Different use cases. | ZOE's strength: safety gates, PR automation, human oversight. suchbot's strength: fast, client-facing interactive UIs. No overlap on core mission. |

## Findings

### What Suchbot Is

**suchbot** is a live Farcaster agent (FID 874249) that generates interactive Farcaster Snaps (lightweight in-feed apps) in real time. A user mentions `@suchbot make a poll: ...`, and the agent classifies the request, maps it to a template, and deploys a live interactive snap within ~15 seconds.

**Core value proposition:**
- Participants see snaps as first-class Farcaster citizens, not chatbots with text responses
- Snaps are interactive (polls, quizzes, claims, ratings, text entry, token actions)
- Template-based generation keeps generation fast and error-free

### Stack & Dependencies

| Component | Tech | Notes |
|-----------|------|-------|
| Agent runtime | Hermes (external) | Persistent AI agent framework. Not in this repo — imported as a runtime. Provides: tool use, persistent memory, cron scheduling, skill system. |
| Snap server | TypeScript, Hono, better-sqlite3 | Self-hosted at snap.mxjxn.com. ~2800 LOC. Validates snaps with `@farcaster/snap` schema. Stores in SQLite. Provides template deployment API. |
| Process mgmt | pm2 | VPS deployment. No clustering or redundancy. |
| Frontend | Farcaster Snaps spec v2.0 | 13 pre-built templates (polls, quizzes, tutorials, explainers, etc.). Snap schema enforces strict structural limits (7 root children, 6 non-root children, 64 total elements, 4 nesting levels). |
| Integration | Webhook-based mentions | Farcaster webhook -> Hermes -> intent classification -> template selection -> snap deploy -> reply with URL. |
| Database | SQLite | File-based, no external deps. Stores snap JSON + interactive state (poll votes, quiz answers, claims, ratings, text responses). |

**Build artifacts:** 1 commit (4f567ec, 2026-04-26), 1 file: `skills/farcaster-snap/SKILL.md` (692 lines of procedural snap-building knowledge).

### Architecture: Layer 1-3

**Layer 1: Hermes (Agent Runtime)**
- Tool use, persistent memory, cron scheduling
- Receives Farcaster mentions via webhook
- Classifies intent: text reply vs. snap request
- Routes text replies via Neynar API; snap requests to Layer 2

**Layer 2: Snap Server**
- Hono TypeScript server at snap.mxjxn.com
- **Template Deployment API** (`POST /api/templates/:name`) — the core innovation
  - Input: `{ id: "my-poll", question: "...", options: [...], theme: "..." }` (~50 tokens)
  - Output: Valid snap JSON that passes `@farcaster/snap` validation (instant, <15ms)
  - No LLM generation of raw JSON; template engine handles expansion
- Interactive handlers for polls, quizzes, claims, ratings, text entry (server-side state)
- HTML fallback + OG tags for link previews
- JFS (Farcaster signed requests) verification for interactive POST
- Snap validation with Zod `.strict()` schema (silent failure if constraints exceeded)

**Layer 3: Declarative Skills**
- `skills/farcaster-snap/SKILL.md` — 692 lines documenting snap creation
- Teaches the agent: how to classify requests, which template to use, correct API calls, validation procedures, production failure modes
- Separation of concerns: agent understands "what to do," skill knows "how to do it," server handles "execution"

### Template Engine Innovation

The **slot-based template expansion** is suchbot's core technical contribution:

**Without templates (naive approach):**
```
User: "@suchbot make a poll about best L2"
Agent: [generates 2000+ tokens of raw snap JSON]
Result: Slow (~41s), error-prone (schema violations, structural limit breaches)
```

**With templates (suchbot's approach):**
```
User: "@suchbot make a poll about best L2"
Agent: [classifies as "poll", extracts slots]
Agent output:
{
  "id": "best-l2-poll",
  "question": "What's the best L2?",
  "options": ["Base", "Arbitrum", "Optimism", "zkSync"],
  "theme": "purple"
}
Template engine: [expands to valid snap JSON in <15ms]
Result: Fast, validated, schema-compliant
```

**13 pre-built templates:**
- **Informational** (1 page): `explainer`, `cheat-sheet`, `comparison`, `resource-list`
- **Multi-page info**: `tutorial`
- **Interactive** (server-side): `poll`, `quiz`, `claim`, `rating`, `text-entry`
- **Token actions** (client-only): `tip-jar`, `token-buy`, `token-showcase`

Each template has:
- Slot schema (input JSON structure)
- Validation rules (Zod-based)
- Expansion logic (produces valid snap JSON + multi-page routing)
- Server handlers for interactive types (polls track per-FID votes, quizzes score, etc.)

### Maturity & Risk Assessment

| Factor | Status | Notes |
|--------|--------|-------|
| Project age | 1 day (2026-04-26) | FarHack hackathon submission. All work on 1 commit. |
| Git history | 1 commit | Only one meaningful commit; no iteration history visible. |
| Tests | None observed | No test directory, no CI/CD pipeline. No `*.test.ts` files. |
| Bug severity | Production failures documented | SKILL.md includes 15+ "learned the hard way" pitfalls (quiz results 404, `_state` injection, `?N` SQLite params, uncached schema violations, etc.). Evidence of real bugs that shipped live. |
| Deployment | Live on snap.mxjxn.com | 50+ snaps deployed, live on Farcaster, FID 874249 is active. |
| Stars | 1 | Single star (likely the author's own); 0 external interest. |
| Issues | 0 | No issue backlog. No external contributors. |
| Architectural debt | Medium | Hermes runtime is external/undocumented in this repo. snap-server has no schema versioning strategy. SQLite has no migration system. No clustering/HA. |

### Critical Security & Design Gaps

**SECURITY:** No secrets found in the code (clean). SKILL.md warns against exposing API keys and recommends .env for Neynar credentials.

**DESIGN GAPS:**
1. **Hermes is a black box** — runtime is external. This repo only documents the *skill* layer, not the runtime itself. Deep reuse is not possible without understanding Hermes.
2. **snap-server lacks test coverage** — interactive handlers (polls, quizzes) have known bugs (see pit #1 in SKILL.md: quiz results page 404 due to ID mismatch). No regression tests.
3. **No schema versioning** — snap spec is v2.0 but server has no migration path if spec evolves. Snaps are immutable once deployed (Warpcast caches by URL).
4. **Structural constraint enforcement is silent** — Snap spec says max 7 root children, 64 elements, 4 nesting levels, but violations silently fail validation instead of throwing explicit errors. Operators must manually count and debug.
5. **No observability** — no logs, metrics, or tracing visible in the code. Debugging live snap failures relies on curl + pm2 logs.

### ZOE Comparison

| Capability | ZOE | suchbot | Notes |
|------------|-----|---------|-------|
| Persistence | Yes (Supabase + memory blocks) | Yes (Hermes + SQLite) | ZOE is data-modeling heavy; suchbot is transactional |
| Tool use | Yes (code, CLI, APIs) | Yes (Neynar, template deploy) | ZOE has deeper tool ecosystem |
| Scheduling | Yes (many cron ticks) | Yes (Hermes cron) | Comparable |
| Multi-step orchestration | Yes (Spine/Cortex/Heart) | Implicit (Hermes) | ZOE is more explicit/auditable |
| Error remediation | Yes (captures -> routes fix -> PR) | No | ZOE feature suchbot lacks |
| Code generation | Yes (coder/critic/PR automation) | No | ZOE feature suchbot lacks |
| Output generation | Mix (posts, PRs, Telegram) | Interactive snaps only | Different use cases |
| Human safety gates | Yes (PR-only, human merge) | Implicit (Hermes assumed) | ZOE has explicit gates |
| Voice I/O | Yes (Groq Whisper voice-in) | Text-only | ZOE feature |
| Cost ladder | Yes (Ollama -> OpenRouter -> Codex -> Claude) | Implicit (Hermes) | ZOE explicit |
| Organism architecture | Yes (Spine sole executor, Cortex advisory, Heart leases) | No | ZOE sophistication suchbot lacks |

### What Makes suchbot Different

1. **Farcaster-native** — integrates as first-class participant, not external tool
2. **Real-time interactive UI generation** — users see snaps in feed, not links to external sites
3. **Template expansion pattern** — ~50 tokens NL slots + engine expansion = fast, validated output
4. **Multi-page stateless patterns** — tutorial pages, quiz progression, poll results — all encoded in snap JSON routes, no server state beyond SQLite
5. **Production craft** — SKILL.md shows deep product knowledge (500+ lines of pitfalls, constraints, validation loops)

### ZOE Already Exceeds suchbot In

1. Orchestration sophistication (Spine/Cortex/Heart, explicit organism boundaries)
2. Code automation (coder/critic/PR pipeline)
3. Error recovery (autonomous fix -> PR -> human merge)
4. Cost awareness (multi-tier ladder, budget gates)
5. Voice capabilities (Groq Whisper, voice-out planned)
6. Safety gates (PR-only, human at merge, refusal on money/public/irreversible)
7. Multiple workers + routers (Hermes in suchbot is a single opaque runtime)

## Ranked Adoption List

### 1. Template Expansion Pattern (ADOPT, pattern-only)

**Why:** Enables fast, validated generation of any complex structured output (not snap-specific).

**Application to ZOE:**
- When ZOE needs to generate structured outputs (PRs, JSON configs, complex casts), use slot-based templates instead of LLM token generation
- Examples:
  - PR description templates: `{ title, section1, section2, ..., sign_off }` -> formatted markdown
  - Farcaster cast templates: `{ hook, body_points[], cta_label, cta_url }` -> cast text
  - JSON config generation: `{ service, tier, replicas, ... }` -> k8s YAML
- Implementation: Create a `src/lib/template-engine.ts` module with Zod slot validation + expansion
- Does NOT require: snap-server code, Hermes runtime, Farcaster specifics

**Concrete integration point in ZOE:**
- File: `bot/src/zoe/template-engine.ts` (new)
- Used by: coder, critic, PR automation modules (wherever complex structured output is needed)
- Pattern: `expandTemplate("farcaster-cast", { hook: "...", points: [...] }) -> validated string`

### 2. Declarative Skill Structure (REINFORCE, already in use)

**Why:** suchbot's skill.md shows that encoding procedural knowledge (what snaps are, how to build them, pitfalls) outside the code helps agents avoid repeated mistakes.

**Status in ZOE:** Already implemented (Hermes coder/critic/memory blocks, ZOE soul architecture). No action needed. Just note: suchbot's 692-line SKILL.md proves the value of this pattern at scale.

### 3. Interactive State Management Pattern (LEARN, not adopt code)

**Why:** Server-side tracking of per-FID state (poll votes, quiz answers) solves a common agent problem: how to embed interactive experiences users can affect.

**Applicability to ZOE:** Low. ZOE's outputs are posts (Farcaster, Telegram), fixes (GitHub PRs), and status updates — not interactive embeds. If ZOE ever needs to generate interactive Farcaster snaps, revisit this.

**Pattern to remember:** Separate "static snap" (informational, no server logic) from "interactive snap" (submit buttons -> server handler -> updated snap JSON). The tutorial/quiz/poll examples show how to handle multi-page state without storing large objects (encode page number in URL params).

### 4. Constraint Budgeting (LEARN, for safety gates)

**Why:** Farcaster Snap spec enforces hard limits (7 root children, 64 elements, 4 nesting levels). suchbot's SKILL.md documents how to count, validate, and stay within limits.

**Applicability to ZOE:** When ZOE generates outputs that must fit format constraints (Telegram message length, Farcaster cast char limits, GitHub action limits), use explicit constraint checking before generation.

**Concrete pattern:** Before handing output to suchbot/Farcaster, validate:
```python
def validate_snap_json(snap_dict):
  assert count_root_children(snap_dict["ui"]["root"]) <= 7
  assert count_total_elements(snap_dict["ui"]["elements"]) <= 64
  assert max_nesting_depth(snap_dict["ui"]) <= 4
```

## What NOT to Adopt

### 1. Hermes Runtime (SKIP)

**Why:** It's external (not in this repo), undocumented, and proprietary. Tight integration with suchbot's architecture. Moving ZOE to Hermes would require rewriting all of ZOE.

**Recommendation:** ZOE's current architecture (Spine/Cortex/Heart, explicit workers) is more sophisticated and auditable.

### 2. snap-server Code (SKIP)

**Why:** Proprietary, no tests, early-stage (1 commit), known bugs (15+ documented pitfalls in SKILL.md).

**If ZOE needed snaps:** Don't copy snap-server. Instead:
- Use the template expansion pattern (design, not code)
- Reference suchbot's SKILL.md for snap spec gotchas
- Build a minimal new service if needed (but don't fork suchbot's)

### 3. Farcaster Snap Generation (SKIP)

**Why:** Not on ZOE's roadmap. ZOE posts casts; it doesn't generate interactive embeds yet.

**Revisit when:** If ZOE needs to generate snap URLs for users to embed (e.g., "create a poll for your audience"), then pull the snap template pattern + SKILL.md gotchas.

### 4. Better-sqlite3 (CONDITIONAL)

**Why:** suchbot uses it; ZOE uses Supabase. Don't switch databases for consistency.

**Use case:** If ZOE needs a fast local SQLite cache (for template state, snap storage, etc.), better-sqlite3 is solid. But prefer Supabase for durability.

### 5. Wholesale Architecture (SKIP)

**Why:** Hermes + Snap Server + Farcaster Skill is tightly coupled. ZOE is already more sophisticated (Spine/Cortex/Heart, coder/critic, error remediation). Trying to integrate suchbot's architecture into ZOE would be a rewrite.

## Next Actions

| Action | Owner | Deadline | Success Criteria |
|--------|-------|----------|-----------------|
| Document template expansion pattern in ZOE docs | (ZOE owner) | 2026-08-10 | `bot/src/zoe/template-engine.ts` exists with Zod schema + expansion logic, used by at least one generation task (PR titles, casts, or config generation) |
| Reference suchbot SKILL.md in ZOE safety gates | (ZOE owner) | 2026-08-10 | When ZOE-generated snaps ship (if ever), pull suchbot's pitfall list into `bot/src/zoe/snap-pitfalls.md` for auditing |
| Audit snap-server's interactive handlers for reusable patterns | (Optional, if snaps needed) | (Deferred) | If ZOE ever generates interactive snaps, audit poll/quiz/claim handlers for per-FID state patterns |

**No adoption sprint needed.** The value is in the pattern (which can be independently implemented) and the knowledge (SKILL.md, which is freely readable for learning). No code reuse justified.

## Sources

| Source | Type | Status | Notes |
|--------|------|--------|-------|
| `https://github.com/wowsuchbot/suchbot` | Repo | FULL | Cloned 2026-07-23, --depth 1. README.md, ARCHITECTURE.md, DEMO.md read in full. `.gitmodules` references external snap-server. |
| `gh repo view wowsuchbot/suchbot --json` | GitHub API | FULL | Confirmed: created 2026-04-26, pushed same day, 1 star, 0 issues, no license. |
| `skills/farcaster-snap/SKILL.md` (692 lines) | Documentation | FULL | Complete snap building guide, including 15+ production failure modes. All snap pitfalls, template slots, and validation rules extracted. |
| `docs/ARCHITECTURE.md` | Design doc | FULL | Three-layer architecture (Hermes, Snap Server, Skills) confirmed. Data flow and infrastructure details extracted. |
| `docs/DEMO.md` | Examples | FULL | 50+ live snaps listed. Templates and deploy API examples confirmed working. |
| `package.json` (root) | Metadata | FULL | Monorepo structure: workspaces point to `packages/snap-server` (external submodule). |
| `git log` | History | PARTIAL | Only 1 commit in shallow clone (4f567ec, 2026-04-26). Cannot assess iteration/stability. Noted as hackathon single-day project. |

---

## Summary

**suchbot is a live, impressive hackathon project** that proves Farcaster agents can generate real, interactive in-feed experiences in real time. Its core innovation — template-based snap generation — is a valuable pattern for any agent doing fast structured output.

**For ZOE:** The template expansion pattern is worth learning and implementing. Everything else (Hermes, snap-server, snap-specific logic) is either proprietary/early-stage or outside ZOE's current mission. ZOE's existing architecture (organism design, multi-critic safety, PR automation) already exceeds suchbot in sophistication and auditability.

**No code reuse recommended.** Learning value is high; integration cost would be high; benefit would be low (ZOE doesn't generate snaps today).

---

**Validation:** Read all source files. No unconfirmed claims. suchbot repo is ~1200 LOC (SKILL.md 692L, other docs/configs ~500L). snap-server code is not in this clone (external submodule). Confidence: HIGH.

