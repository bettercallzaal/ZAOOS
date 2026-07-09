---
title: "How I AI: What a Harness Is and How to Build One with Claude Agent SDK"
type: STANDALONE
tier: STANDARD
original-query: "/zao-research this Spotify episode (How I AI - what a harness is + Claude Agent SDK) to get the whole transcript + extract the harness-building lessons"
date: 2026-07-09
author: claude-code
source: "How I AI Podcast: Ep. 3t4Osk3xFYKBefEqjy5git (Spotify) - howiaipod.com; transcript [FULL]"
---

# How I AI: What a Harness Is and How to Build One with Claude Agent SDK

## Key Decisions & Takeaways

| Decision | Episode Learning | Apply to ZAO Harnesses | Priority |
|----------|------------------|------------------------|----------|
| **Model choice** | Sonnet 4.6 is the right fit for structured bug triage; dueling Claude/Codex shows both can build harnesses but Codex did best job building agent (using Claude SDK to implement) | Verify Sonnet 4.6 for ZOE/Hermes bug-fixing harness; consider cross-model build stage vs runtime stage | HIGH |
| **Tool integration pattern** | Custom adapters beat generic MCPs for specific jobs — host makes Sentry adapter very opinionated (pulls only bug-relevant data, not all traces) | ZAOOS adapters for Neynar/GitHub/Vercel should mirror Sentry pattern: opinionated data extraction, not general-purpose tool exposure | HIGH |
| **Constraint-driven design** | "Investigate only" mode (read-only, no file writes) is enforced by harness flags, not prompt babysitting | Bake permission gates into ZOE/ZOL harness config; flag defaults override agent tendency to "fix" when told "investigate" | HIGH |
| **Artifact store** | Save evidence from every run to filesystem; agent uses artifacts as source of truth for follow-ups | Implement artifact store for ZOE runs (bug investigations, fix PRs, research summaries) so context persists across sessions | MEDIUM |
| **Outcome structure** | Host specifies exact output shape (priority-ranked root causes, binary "should I fix", next step) inside harness, not in prompt | Design fixed JSON schemas for ZOE harness outputs (investigate result, fix-PR meta, research brief) | MEDIUM |
| **TUI/CLI as first-class** | Interface is *part of* the harness, not bolted on; TUI reflects harness structure (runs, errors, process stages) | ZOE Telegram should expose harness state (run history, current stage, artifacts); future: CLI harness mode for VPS runs | LOW |

---

## Core Definition

> "A harness is some code around an AI agent that makes it more effective." [FULL, line 24-25]

**Why it matters:** This is dramatically simpler than the mystified "harness" framing in industry chatter. A harness is *not* about:
- A new model architecture
- A special framework
- Necessarily anything AI-based in the wrapper itself

It **is** about:
1. **Specific context** - encoding domain knowledge upfront
2. **Specific actions** - constraining which tools the agent can call
3. **Specific outcomes** - defining exactly what the agent should return

---

## When to Build a Harness vs a General-Purpose Agent

The episode frames the decision clearly:

| Scenario | Harness | General Agent | Why |
|----------|---------|---------------|-----|
| Repeated, deterministic workflow + non-det logic | YES | NO | "Same workflow needs same setup and same outcomes" [line 41] |
| One-off exploration | NO | YES | Overhead not worth it |
| Coding, production ops, research, migration mgmt | YES | Both | "Usually those jobs are slightly more complex" [line 45] |
| Support escalation, doc consolidation | YES | Both | "Non-technical use cases in a specific way" [line 50] |

**Host's decision for Sentry debugging harness:**
> "If you can identify the right workflows, you can actually be more efficient, more consistent, and have better outcomes if you build a harness." [line 71-72]

He chose Sentry debugging because:
- Happens repeatedly, consistently
- Has a standard workflow (triage → root-cause → linear ticket → follow-up docs)
- Needs custom context (Sentry API, his internal tools, his team's conventions)
- Needs specific outcomes (priority ranking, binary fix-readiness, next-step guidance)

---

## The 8-Step Harness Build Process

Synthesized from the episode's walkthrough (lines 232-248):

1. **Identify a workflow** - document it in prose/markdown
2. **Determine the run shape** - what's the input, what are the flags/modes?
3. **Make opinionated tool adapters** - custom API clients, not generic MCPs
   - For Sentry: only pulls bug-relevant fields (event ID, affected users, errors), not full traces
   - This is the opposite of "give the agent access to all MCP tools"
4. **Structure the outputs** - specify artifacts you want to see after each run
5. **Set permissions & rules** - which flags override which agent behaviors?
   - "Investigate only" → no file writes, no customer contact
   - "Fix mode" → can write code, can open PRs
6. **Choose your model** - single-model routing or multi-model?
   - Host uses Sonnet 4.6 throughout; considers it "the right model for this job" [line 148]
7. **Prompt the harness specifically** - not "you are a genius coder"; instead:
   > "You're working inside the ChatPierdy engineering harness. Here's the plan to attack a very specific problem. What I want you to return is x, y, z." [line 138-142]
8. **Build a surface to interact with it** - TUI, CLI, web app, or Telegram UI

---

## Practical Implementation Patterns

### Custom Adapters Over Generic Tools

**Episode pattern:**
- Built a Sentry adapter (opinionated extraction)
- Built a Linear adapter (creates issues in a specific way)
- Built a Vercel adapter (for env info)
- Built a GitHub adapter (for context)

**Why not just expose the MCP?**
> "Instead of using the MCP generally, instead of like having your coding agent wander through all these traces, I'm just very precise about exactly what I think you need to pull from a bug report perspective." [line 165-167]

**For ZAO:** The adapter pattern is KEY. Instead of `tools: [neynar_full_api, github_full_api]`, build:
- `SharifierAdapter` - pulls only what's needed to auto-farcaster-cast
- `LinearAdapter` - opens issues in ZAO's specific format
- `VercelAdapter` - grabs deployment info for the run

### Permissions as First-Class Constraints

The host's harness has flags that gate tool access:
```
- edit_source: boolean (default: false)
- modify_inputs: boolean (default: false)
- message_customers: boolean (default: false, requires explicit approval)
```

Each run can be invoked with different flags:
```
harness investigate --no-fix --no-contact  # Read-only
harness fix --allow-edit --notify-linear    # Full access
```

**For ZAO:** ZOL/ZOE harness should encode:
```
permissions:
  read_linear: true
  create_linear_issue: boolean (default: false)
  write_source: boolean (default: false)
  post_farcaster: boolean (default: false)
  send_telegram: boolean (default: true, to Zaal only)
```

### Artifact Store for Persistence

The host saves every run's evidence to a file store:
- `artifacts/bug_hunter_c7/investigation_brief.md`
- `artifacts/bug_hunter_c7/root_causes.json`
- `artifacts/bug_hunter_c7/run.html` (beautiful HTML report)

The agent reads from this store on follow-up runs, establishing a single source of truth.

**For ZAO:** Create `~/.zao/harness-artifacts/` with subdirs:
```
~/.zao/harness-artifacts/
  zoe-investigate-sentry-bugs-20260709/
    run.json           # all messages
    investigation.md   # brief findings
    root_causes.json   # structured output
    artifacts.html     # beautiful report
```

### Outcome Specification in the Harness

**Host's hardcoded outcome shape for Sentry investigations:**
```markdown
# Investigation Brief
- Evidence (confirmed incidents, affected users, frequency)
- Blind spots in the code
- Likely root causes (prioritized)
- How to verify
- Should issue a Linear issue? (yes/no)
- Can I fix it now? (yes/no + reasons)
```

This is *baked into the harness*, not the prompt. The agent always returns this shape.

**For ZAO:** Define JSON schemas for each harness output:
```typescript
interface ZOEInvestigationOutput {
  evidence: { count: number; severity: string; trend: string }
  rootCauses: Array<{ cause: string; confidence: 0-1; fix_difficulty: "easy"|"medium"|"hard" }>
  shouldCreateTicket: boolean
  shouldAutoFix: boolean
  nextSteps: string[]
}
```

---

## How the Host Built It

### The Build Process

The host ran **dueling Claude Code and Codex sessions**, asking each: "Build me a harness for Sentry debugging using Claude Agent SDK."

**Results:**
- Both initially wanted purely deterministic workflows (no AI inside the harness)
- He had to prompt **very specifically** about wanting agentic logic
- **Codex did the best job of building the agent**, but used Claude SDK to implement it (spanning both models)
- Final harness: ~8 files, very simple
  - High-level CLI entrypoint
  - Sentry, Linear, Vercel, GitHub adapters
  - Bug hunter workflow
  - Artifact generator
  - TUI runner
  - CLI runner

**Lesson:**
> "I would be very specific about the workflow, very specific about the tools, very specific about where custom prompts make sense, and then use an agent SDK." [line 159-162]

And:
> "Without that prompting, I just did not get what I wanted out of these models." [line 162]

### Model Routing

The host uses **Sonnet 4.6 throughout** for this harness because:
1. It's fast enough for interactive use
2. It's capable enough for code understanding + root-cause reasoning
3. Cost is reasonable for per-run usage

He mentions multi-model routing as a *future* pattern:
> "From a model perspective, you can do multi-model routing and all sorts of interesting things in ways that you couldn't with a general purpose AI model." [line 85-86]

---

## Why Harnesses Beat General-Purpose Agents on Specific Jobs

The host contrasts his harness with using Claude Code or Codex directly:

| Step | Claude Code / Codex (Ad-hoc) | Sentry Debugging Harness | Gain |
|------|------------------------------|-------------------------|------|
| Input | "Please fix this bug. Here's a link." | Paste link only | Intent is implicit; no re-prompting needed |
| Tool access | "Use all coding tools" | Specific adapters for bug data | Agent doesn't waste tokens exploring irrelevant APIs |
| Workflow | "Make a fix if you can" | Flags enforce "investigate only" or "fix mode" | Consistent, predictable behavior |
| Outcomes | Varies by run | Structured JSON + HTML report | Runnable by other agents; no parsing needed |
| Repeatability | Re-explain each time | Encoded in harness logic | Scale to 100 bugs without prompt drift |

**Quote:**
> "With a direct AI tool like CloudCode, I would have to explain what I want the agent to do. Instead of this harness, I can literally just paste in the link and the agent already knows my intent, already knows what the job to be done." [line 74-76]

---

## The Interface is Part of the Harness

The host built a TUI (terminal UI) using the Ink library.

**Why the interface matters:**
> "Your harness does not have to be a TUI. It doesn't have to be a CLI. It doesn't even have to have letters. It could be a web app." [line 89-90]

**But:** The interface he built reflects the harness structure:
- Shows all previous runs
- Shows errors and how they were fixed
- Shows the three-stage process: "gathers evidence → streams activities → builds artifacts"

**For ZAO:** The Telegram bot UI should surface harness state:
- `/zoe status` → current run, stage, time elapsed
- `/zoe logs RUNID` → investigate findings
- `/zoe artifacts RUNID` → download the artifact bundle

---

## What the Episode Adds Beyond Existing Docs

### vs. Doc 307 (Great Convergence: Agent Harness Architecture)
- Doc 307 maps industry convergence on *patterns*
- This episode shows a **live, working implementation** using Claude SDK
- Adds the concrete TUI interface + artifact store patterns
- Confirms Sonnet 4.6 as harness-runtime model of choice

### vs. Doc 234 (OpenClaw Comprehensive Guide)
- Doc 234 covers memory + knowledge graphs for long-running agents
- This episode adds **permission gating** + **opinionated adapters** for single-task harnesses
- The artifact store pattern here is simpler than Hindsight memory (file-based, not vectorized)

### vs. Doc 460 (ZAO Agentic Stack End-to-End Design)
- Doc 460 is a 4-layer stack (Edge / Concierge / Specialists / Cloud)
- This episode details **how to build one Specialist harness** (Sentry debugging)
- Adds: the build process, adapter patterns, permission gates, outcome schemas

### vs. Existing Agent SDK Docs
- No prior ZAOOS doc walked through "Claude SDK + custom harness = better than general agent"
- This adds practical CLI patterns (TUI, artifact store, dueling-model build process)
- Emphasizes: **Constraints drive better outcomes than open-ended prompting**

---

## How This Maps to ZAO Harnesses (Doc 997, ZOL, ZOE)

### Doc 997 Context
Doc 997 was reserved to document zaalcaster harness design (ZAO's Farcaster client). This episode complements it by:

1. **Confirming the harness approach is right** - don't build a general Farcaster agent; build a specific harness for ZAO's workflow
2. **Providing build methodology** - the 8-step process scales to zaalcaster
3. **Adding permission patterns** - zaalcaster should have flags for:
   - `auto_post` (default: false, requires approval)
   - `read_only` (inspect trends, don't post)
   - `premium_features` (e.g., auto-scheduling)

### ZOL Harness
ZOL (ZAO contribution credit agent) is a good harness candidate:
- **Repeatable workflow:** score contributions, update ledger, post summaries
- **Specific context:** ZAO member list, contribution types, scoring rules
- **Permission gates:** `update_ledger` (false by default), `post_summary` (boolean)
- **Artifact store:** keep contribution scores + audit trail

### ZOE Orchestrator
ZOE currently runs multiple tasks (brief, reflect, capture, dispatch). This episode suggests:
- **Split ZOE into multiple focused harnesses** (Brief Harness, Reflect Harness, Fix-PR Harness)
- Each has its own outcome schema, permission gates, artifact store
- ZOE orchestrates *which harness* to invoke (rather than trying to be omni-capable)

---

## Next Actions

| Action | Owner | Date | Shipped Criteria |
|--------|-------|------|------------------|
| **Read episode transcript + watch demo** | Zaal | 2026-07-10 | Confirm patterns apply to zaalcaster |
| **Spec ZAO Sentry harness** | Zaal + Claude | 2026-07-11 | Doc on GH with workflow, adapters, outcomes, permissions |
| **Port Sentry adapter pattern to ZAO (Neynar + Linear + GitHub)** | Claude | 2026-07-15 | Proof-of-concept adapter suite in ZAOOS |
| **Refactor ZOE to harness-based dispatch** | Claude | TBD | Design doc showing 3-4 focused harnesses + orchestration |
| **Artifact store for ZOE runs** | Claude | TBD | Runs save to `~/.zao/harness-artifacts/`; ZOE reads on follow-ups |

---

## Sources

### Primary
- **How I AI Podcast, Ep. 3t4Osk3xFYKBefEqjy5git** (Spotify)
  - Title: "What a Harness Is and How to Build One with Claude Agent SDK"
  - Host: [speaker name not given in transcript]
  - URL: https://howiaipod.com
  - Transcript: Full transcript provided [FULL], lines 1-278

### Secondary (Cross-References)
- Doc 307: [The Great Convergence: Agent Harness Architecture](../307-great-convergence-agent-harness-architecture/)
- Doc 234: [OpenClaw Comprehensive Guide](../234-openclaw-comprehensive-guide/)
- Doc 460: [ZAO Agentic Stack End-to-End Design](../460-zao-agentic-stack-end-to-end-design/)
- Doc 997: [Agent Harness Design: Zaalcaster](../997-agent-harness-design-zaalcaster/) (reserved, not yet written)

---

## Footnotes

### The "Sonnet 4.6" Decision
The host specifies "Sonnet 4.6" (sometimes "4.5" in the transcript context for Claude models), positioning it as the right balance for:
- **Speed** - harness invocations are interactive (TUI waits for results)
- **Cost** - repeated runs need sub-$1/run economics
- **Capability** - code understanding + reasoning without overspecifying
- **Reliability** - consistent tool use for structured adapters

This aligns with ZAO's experience: Sonnet for operational loops, Opus for frontier reasoning.

### Opinionated Adapters as Anti-Pattern to RAG Explosion
The adapter pattern here ("pull only what's relevant") is a reaction against:
- MCPs that expose entire APIs
- RAG systems that return top-k results regardless of relevance
- Agents that waste tokens exploring irrelevant tool options

By building a Sentry adapter that *only* pulls bug-relevant fields, the host reduces:
- LLM tokens spent exploring traces
- Hallucinations (agent can't wander into irrelevant data)
- Latency (fewer API calls)

---

*Doc compiled 2026-07-09 by Claude Code from How I AI Podcast transcript.*
