# 70 — Sub-agents vs Agent Teams + Claude Architect Patterns for ZAO OS

> **Status:** Research complete
> **Date:** March 18, 2026
> **Goal:** Document the two multi-agent paradigms (sub-agents vs agent teams), map to ZAO OS's Paperclip setup, and capture Claude Architect certification patterns for production-grade development

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Paperclip agents = Agent Teams** | Paperclip's CEO + Founding Engineer is the Agent Teams pattern (persistent, communicating via tasks, shared state via issues) |
| **Claude Code sub-agents = Sub-agents** | The `Agent` tool in Claude Code dispatches fire-and-forget sub-agents (isolated context, results flow back to parent) |
| **Use BOTH** | Sub-agents for parallel research within a session. Agent Teams (Paperclip) for ongoing company operations. |
| **Context isolation rule** | Sub-agents do NOT share memory with parent. Pass all needed context explicitly in the prompt. |
| **When to add agents** | Only when a single agent breaks. Start simple, push until failure, then split at the failure point. |
| **Programmatic enforcement** | For security/financial actions (refunds, deployments, admin ops): USE hooks, not prompt instructions. ZAO's auth routes are financial/security-critical. |

---

## The Two Paradigms

### Sub-Agents: Fire-and-Forget Parallelism

```
Parent Agent
├── Sub-agent A (research) → returns summary
├── Sub-agent B (analysis) → returns findings
└── Sub-agent C (search) → returns results
    ↑ No communication between A, B, C
    ↑ Each has isolated context window
    ↑ Only compressed results return to parent
```

**Use when:** Tasks are embarrassingly parallel — independent research, codebase exploration, lookups where the parent only needs the summary.

**ZAO OS usage:** The `/zao-research` skill already dispatches parallel sub-agents (e.g., "Research MAGNETIQ" + "Research SongJam" + "Check codebase" simultaneously). This is correct.

**Rules:**
- Sub-agents can't spawn other sub-agents
- Sub-agents can't talk to each other
- Every result flows back to parent
- Parent is sole coordinator

### Agent Teams: Persistent Coordination

```
Team Lead (CEO Main)
├── Founding Engineer (persistent, communicates via tasks)
├── Security Auditor (persistent, shares findings on issues)
└── Content Publisher (persistent, reads other agents' outputs)
    ↑ Direct peer-to-peer via task comments
    ↑ Shared state via Paperclip issue system
    ↑ Dependencies: blockedBy field
```

**Use when:** Tasks require ongoing negotiation — agents need to reconcile outputs, discoveries in one thread change what another should do.

**ZAO OS usage:** Paperclip's CEO Main + Founding Engineer is exactly this. The CEO creates tasks, the Engineer picks them up, comments on progress, and the CEO adjusts strategy based on results.

**Key features:**
- Agents persist and accumulate context over time
- Mid-task discoveries surface to teammates immediately
- Dependencies managed via `blockedBy` field
- Shared task list tracks pending/in-progress/done

---

## How ZAO OS Uses Both

| Layer | Pattern | Tool | Example |
|-------|---------|------|---------|
| **Within a session** | Sub-agents | Claude Code `Agent` tool | Parallel research on 4 partner platforms (doc 65) |
| **Across sessions** | Agent Teams | Paperclip | CEO delegates /ecosystem page to Founding Engineer |
| **Autonomous loops** | Neither — single agent | `autoresearch` skill | Self-improving the /zao-research skill |

---

## Claude Architect Patterns Applied to ZAO OS

### Domain 1: Agentic Architecture (27% of exam)

**Agentic loop:** ZAO's Paperclip agents follow the heartbeat cycle (identity → task fetch → checkout → execute → status → delegate). This IS the agentic loop with `stop_reason` equivalent being heartbeat completion.

**Critical anti-patterns to avoid:**
- Parsing natural language to determine if an agent is done — USE status field transitions instead
- Arbitrary iteration caps — USE Paperclip's heartbeat model (wake, work, sleep)
- Sub-agents sharing memory — they DON'T. Pass context explicitly.

**Programmatic enforcement for ZAO:**
```
HIGH STAKES (use hooks/gates, not prompts):
- Auth routes (session, register, siwe, verify)
- Admin operations (users, allowlist, backfill)
- Proposals (Respect-weighted voting)
- Deployments to production

LOW STAKES (prompts are fine):
- Content formatting
- Research doc style
- Code comments
```

### Domain 2: Tool Design & MCP (18%)

**Tool description quality matters.** ZAO's skills (`/zao-research`, `/autoresearch`) have detailed descriptions — this is correct. If two tools have overlapping descriptions, agents misroute.

**Tool distribution:** Optimal 4-5 tools per agent. ZAO's Paperclip agents should have scoped tool access:
- CEO: Paperclip API + Read + WebSearch (strategy, not code)
- Engineer: Full Claude Code tools (Read, Write, Edit, Bash, Grep, Glob)
- Security Auditor: Read + Grep + Glob only (no Write — read-only audit)

### Domain 3: Claude Code Configuration (20%)

**CLAUDE.md hierarchy:** ZAO uses project-level CLAUDE.md (shared via git). No user-level or directory-level. This is fine for a single developer but should add `.claude/rules/` for path-specific conventions:

```yaml
# .claude/rules/api-routes.md
---
paths: ["src/app/api/**/*.ts"]
---
- Always validate input with Zod safeParse
- Always check session via getSessionData()
- Always return NextResponse.json()
- Never expose server-only env vars
```

```yaml
# .claude/rules/tests.md
---
paths: ["**/*.test.ts", "**/*.test.tsx"]
---
- Use Vitest with describe/it/expect
- Test both success and error paths
- Mock external APIs (Neynar, Supabase)
```

**Plan mode vs direct execution for ZAO:**
- Plan mode: /ecosystem page (multi-file), governance redesign, Incented integration
- Direct execution: single API route fix, Zod schema addition, lint error fix

### Domain 4: Prompt Engineering (20%)

**Few-shot examples > prose.** ZAO's `/zao-research` skill already has a worked good/bad example — this is the highest-leverage technique per the certification.

**Structured output:** ZAO's API routes use Zod schemas for input validation. The same pattern should be used for agent outputs — define JSON schemas for research doc structure, governance proposals, audit reports.

### Domain 5: Context Management (15%)

**Progressive summarization kills transactional data.** For ZAO, this means: never summarize Respect scores, wallet addresses, FIDs, or proposal vote counts. Keep these as persistent "case facts."

**"Lost in the middle" effect:** When feeding 70 research docs to an agent, put the key findings summary at the TOP. The topics.md and research-index.md files serve this exact purpose — they're the "beginning" that agents read first.

---

## Cowork Starter Pack Patterns for ZAO OS

From Corey Ganim's viral starter pack (3.3M views):

### Context Files ZAO Should Create

| File | Purpose | ZAO Equivalent |
|------|---------|---------------|
| `about-me.md` | Professional identity | `memory/user_zaal.md` (already exists) |
| `brand-voice.md` | Content tone/style | Not yet — CREATE for Farcaster posts |
| `current-projects.md` | Active work + blockers | Paperclip dashboard replaces this |

### Workflows to Adopt

| Workflow | How It Maps to ZAO |
|----------|-------------------|
| Morning Dashboard | Check Paperclip dashboard + /zao channel activity |
| Content Repurposing | Take build-in-public moments → Farcaster cast + Paragraph newsletter + X post |
| End-of-Day Shutdown | CEO agent's heartbeat cycle already does this (check tasks, flag blockers, plan tomorrow) |

### Meta-Prompt for ZAO Agents

```
"You are a ZAO team member. You have access to the ZAO OS codebase
and 70 research documents. When given tasks: read CLAUDE.md first,
check community.config.ts for branding/channels, search research/
for prior work, pause before any destructive actions, save outputs
to the appropriate research/ or src/ location."
```

---

## The One Design Principle

> **Design around context boundaries, not around roles or org charts.**

Start with a single agent. Push it until it breaks. That failure point tells you exactly what to add next. Add complexity only where it solves a real, measured problem.

ZAO proved this: started with 1 CEO agent, it naturally identified the need for a Founding Engineer, proposed the hire, and delegated work. Organic growth beats pre-planned 5-agent architectures.

---

## Sources

- [Claude Sub-agents vs Agent Teams — Article](https://claude.ai/docs/agents) — paradigm comparison
- [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk) — fork_session, Task tool, hooks
- [Claude Certified Architect Exam Guide](https://docs.anthropic.com/en/docs/claude-architect) — 5 domains, sample questions
- [Building Agents with Claude Agent SDK](https://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk) — best practices
- [Corey Ganim Cowork Starter Pack](https://x.com/coreyganim) — 3.3M views, context file patterns
- [Doc 44 — Agentic Development Workflows](../044-agentic-development-workflows/)
- [Doc 67 — Paperclip AI Agent Company](../067-paperclip-ai-agent-company/)
- [Doc 69 — Claude Code Tips](../069-claude-code-tips-best-practices/)
