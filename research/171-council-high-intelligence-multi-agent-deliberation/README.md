# 171 — Council of High Intelligence: Multi-Agent Deliberation for ZAO OS

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Deep dive into Nyk's 11-agent deliberation system — compare with ZAO's existing multi-agent tools, design ZAO-specific triads, and determine install/adapt/skip

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Install the Council** | YES — CC0 license (public domain), zero risk. Install to `~/.claude/agents/` + `~/.claude/skills/council/`. |
| **Don't replace autoresearch:predict** | Council is for *strategic decisions*. `/autoresearch:predict` is for *code analysis*. Different tools, different jobs. Keep both. |
| **Use triads, not full council** | 3-member triads for daily decisions ($0.50-1.00). Reserve `--full` (11 members) for irreversible architecture decisions ($3-5). |
| **Add ZAO-specific triads** | Create 3 custom triads for ZAO's unique decision types: governance design, music platform, community growth. |
| **Profile for solo founder** | Use `execution-lean` profile (5 members) as default. Full council is overkill for a solo founder + AI team. |

---

## What Is the Council?

**Source:** [@nyk_builderz, March 19, 2026](https://x.com/nyk_builderz/status/2034492549180625316) — 184 likes, 83.8K views
**Repo:** [github.com/0xNyk/council-of-high-intelligence](https://github.com/0xNyk/council-of-high-intelligence) — 28 stars, CC0 (public domain), 9 commits, 100% Shell

A Claude Code skill that convenes 11 subagents — each modeled on a historical thinker with declared analytical methods AND declared blind spots — into a structured 3-round deliberation protocol. The key insight: **LLMs simulate one coherent viewpoint per generation.** The Council externalizes the disagreement layer by running multiple independent agents with opposing intellectual traditions.

---

## How It Differs from What ZAO Already Has

### Comparison: 4 Multi-Agent Approaches

| Tool | Type | Agents | Communication | Best For |
|------|------|--------|---------------|----------|
| **Claude Code `Agent` tool** | Sub-agents (fire-and-forget) | 1-5 parallel | No inter-agent communication | Parallel research, codebase search |
| **`/autoresearch:predict`** | Multi-persona swarm | 3-8 personas | Sequential debate within single context | Pre-flight code analysis, security review |
| **Council of High Intelligence** | Structured deliberation | 3-11 subagents | 3-round protocol with cross-examination | Strategic decisions, architecture choices |
| **Paperclip Agent Teams** | Persistent teams | 2-5 agents | Task-based, shared state | Ongoing operations across sessions |

### Council vs `/autoresearch:predict` (Key Distinction)

| Dimension | `/autoresearch:predict` | Council |
|-----------|------------------------|---------|
| **Agents** | Virtual personas in ONE context | Real subagents (separate processes) |
| **Independence** | Simulated — all share same context window | True — each has isolated context |
| **Focus** | Code analysis (file:line evidence) | Strategic decisions (trade-offs, blind spots) |
| **Output** | Ranked findings with confidence scores | Structured verdict with minority report |
| **Cost** | Lower (single context) | Higher (multiple subagent invocations) |
| **Anti-recursion** | N/A — single context | Hemlock rule, 3-level depth limit, 2-message cutoff |
| **Anti-convergence** | N/A | Dissent quota, novelty gate, counterfactual pass |

**Bottom line:** `/autoresearch:predict` asks "what could go wrong with this code?" The Council asks "what's the right strategic choice?" They complement, don't compete.

---

## Architecture Deep Dive

### The 11 Members

**OPUS (depth-heavy, $):**

| Member | Method | Sees What Others Miss | Declared Blind Spot |
|--------|--------|----------------------|---------------------|
| **Socrates** | Assumption destruction | Hidden premises everyone accepts | Spirals into infinite questioning |
| **Aristotle** | Categorization | What category something belongs to | Over-classifies fluid situations |
| **Marcus Aurelius** | Resilience + moral clarity | What you control vs what you don't | Dismisses external action |
| **Lao Tzu** | Non-action + emergence | When the solution is to stop trying | Paralysis disguised as wisdom |
| **Alan Watts** | Perspective dissolution | When the problem IS the framing | Dissolves problems that need solving |

**SONNET (speed-critical, $$):**

| Member | Method | Sees What Others Miss | Declared Blind Spot |
|--------|--------|----------------------|---------------------|
| **Feynman** | First-principles debugging | Unexplained complexity | Dismisses non-quantifiable factors |
| **Sun Tzu** | Adversarial strategy | Terrain and competitive dynamics | Sees enemies where there are none |
| **Ada Lovelace** | Formal systems | What can vs cannot be mechanized | Over-abstracts practical problems |
| **Machiavelli** | Power dynamics | How actors actually behave | Cynicism misses genuine cooperation |
| **Linus Torvalds** | Pragmatic engineering | What ships vs what sounds good | Dismisses theoretical elegance |
| **Miyamoto Musashi** | Strategic timing | The decisive moment | Waiting too long becomes inaction |

### The 6 Polarity Pairs (Structural Opponents)

| Pair | Tension | Why It Matters |
|------|---------|---------------|
| Socrates vs Feynman | Top-down destruction vs bottom-up rebuilding | Ensures problems get both questioned AND solved |
| Aristotle vs Lao Tzu | Categories vs "categories are the problem" | Prevents over-structure AND under-structure |
| Sun Tzu vs Aurelius | External game vs internal governance | Balances competitive strategy with principled restraint |
| Ada vs Machiavelli | Formal purity vs messy human incentives | Prevents both ivory-tower AND cynical thinking |
| Torvalds vs Watts | Ship it now vs "does the problem even exist?" | Prevents both premature action AND analysis paralysis |
| Musashi vs Torvalds | Perfect timing vs ship immediately | Balances patience with urgency |

### 3-Round Deliberation Protocol

```
Round 1: INDEPENDENT ANALYSIS (parallel)
├── All members receive problem, produce 400-word analysis
├── Each follows their agent-specific output template
├── Run as parallel subagents → completes in one batch
└── Key: blind-first — no member sees another's output

Round 2: CROSS-EXAMINATION (sequential)
├── Each member receives ALL Round 1 outputs
├── Must answer 4 prompts:
│   1. Which position do you most disagree with, and why?
│   2. Which insight from another member strengthens your position?
│   3. What changed your view?
│   4. Restate your position
├── 300-word max, must engage ≥2 members by name
└── Sequential so later members can reference earlier cross-examinations

Round 3: SYNTHESIS (parallel)
├── Final position in ≤100 words
├── No new arguments — crystallization only
├── Socrates gets exactly ONE question, then must state position
└── This is the convergence gate
```

### Anti-Recursion Safeguards

| Rule | Trigger | Action |
|------|---------|--------|
| **Hemlock rule** | Socrates re-asks a question already answered with evidence | Coordinator forces 50-word position statement |
| **3-level depth limit** | Any chain: question → response → question → STOP | Must state own position after 3 levels |
| **2-message cutoff** | Any pair exchanges >2 messages | Coordinator cuts off, forces Round 3 |

### Anti-Convergence Safeguards (from SKILL.md)

| Rule | Trigger | Action |
|------|---------|--------|
| **Dissent quota** | Before declaring consensus | ≥2 non-overlapping objections required |
| **Novelty gate** | Every Round 2 response | Must contain ≥1 claim/test/risk not in Round 1 |
| **Counterfactual pass** | >70% agreement by Round 2 end | Force: "Assume consensus is wrong. Strongest alternative?" |
| **Evidence tags** | All claims | Label as empirical/mechanistic/strategic/ethical/heuristic |

---

## ZAO-Specific Application

### When to Use Which Tool

| Decision Type | Tool | Example |
|--------------|------|---------|
| "Should I add caching?" | `/council --triad architecture` | Aristotle classifies, Ada formalizes, Feynman simplicity-tests |
| "Is this code secure?" | `/autoresearch:security` | STRIDE + OWASP automated audit |
| "What could break in this PR?" | `/autoresearch:predict` | Multi-persona code analysis |
| "Should ZAO add a token?" | `/council --full` | All 11 members — irreversible decision |
| "Research WebRTC options" | Sub-agents (parallel) | 3 agents research 3 options simultaneously |
| "What feature should we build next?" | `/council --triad product` | Torvalds + Machiavelli + Watts |

### Pre-Built Triads for ZAO Decisions

**Standard triads that already fit ZAO:**

| ZAO Decision | Triad | Members | Example Question |
|---|---|---|---|
| Tech architecture | `architecture` | Aristotle + Ada + Feynman | "Should we add Redis or stick with Supabase RLS?" |
| Feature shipping | `shipping` | Torvalds + Musashi + Feynman | "Should we ship Spaces without screen share?" |
| Product direction | `product` | Torvalds + Machiavelli + Watts | "What's the next pillar after Music?" |
| Risk assessment | `risk` | Sun Tzu + Aurelius + Feynman | "What happens if Neynar changes their API pricing?" |
| Debugging | `debugging` | Feynman + Socrates + Ada | "Why does our cache invalidation keep failing?" |

### Custom ZAO Triads (to add after install)

| Domain | Members | Why These Three |
|--------|---------|----------------|
| **Governance design** | Aurelius + Socrates + Machiavelli | Duty (what's right) + questioning (hidden assumptions) + incentives (how people actually behave). ZAO's Respect system needs all three tensions. |
| **Music platform** | Torvalds + Lao Tzu + Ada | Ship it (pragmatic features) + emergence (let community use organically) + formal systems (what can be automated vs curated). Music curation is the tension between control and emergence. |
| **Community growth** | Sun Tzu + Aurelius + Watts | Terrain (competitive positioning vs Sonata/SongJam) + resilience (sustainable 100→1000 growth) + reframing (is growth even the right goal for a 100-person community?). |

---

## Installation Guide

### Quick Install

```bash
git clone https://github.com/0xNyk/council-of-high-intelligence.git /tmp/council
cd /tmp/council
./install.sh
# Creates ~/.claude/agents/council-*.md (11 files)
# Creates ~/.claude/skills/council/SKILL.md

# Verify
ls ~/.claude/agents/council-*
ls ~/.claude/skills/council/SKILL.md
```

### With Model Routing Templates

```bash
./install.sh --copy-configs
# Also copies configs/ directory with model routing YAML templates
```

### Dry Run First

```bash
./install.sh --dry-run
# Shows what would be installed without modifying anything
```

### Post-Install: Add ZAO Custom Triads

After installing, edit `~/.claude/skills/council/SKILL.md` to add the 3 ZAO-specific triads defined above.

---

## Cost Analysis

| Usage | Members | Est. Cost | Time |
|-------|---------|-----------|------|
| Triad (3 members, 3 rounds) | 3 | $0.50-1.00 | 2-3 min |
| Execution-lean (5 members) | 5 | $1.00-2.00 | 3-5 min |
| Full council (11 members) | 11 | $3.00-5.00 | 5-10 min |

**Budget guidance for solo founder:** Use triads for 90% of decisions. Budget ~$10-20/month for council usage. That's 10-20 triad sessions or 2-4 full council sessions.

---

## Comparison: Multi-Agent Deliberation Ecosystem (March 2026)

| Project | Stars | License | Approach | Members | Cross-Provider |
|---------|-------|---------|----------|---------|---------------|
| [council-of-high-intelligence](https://github.com/0xNyk/council-of-high-intelligence) | 28 | CC0 | Historical thinkers, polarity pairs | 11 | Yes (optional) |
| [adversarial-review](https://github.com/alecnielsen/adversarial-review) | 4 | MIT | Claude + Codex adversarial debate | 2 | Yes (Claude + Codex) |
| [claude-octopus](https://deepwiki.com/nyldn/claude-octopus/10.1-ai-debate-system) | ~50 | MIT | Claude + Codex + Gemini debate | 3 | Yes (3 providers) |
| MCP Deliberation Protocol | N/A | N/A | Specialist agents (MCP market) | 3-5 | No |
| MCP Debate Workflow | N/A | N/A | Researcher + Critic + Synthesizer | 3 | No |
| `/autoresearch:predict` (our installed) | N/A | MIT | Virtual personas, same context | 3-8 | No |

**Winner for ZAO: Council** — most structured, most diverse perspectives (11 vs 2-3), anti-recursion safeguards, CC0 license, and pre-built triads that map to our decision types. The others are good for code review (adversarial-review) or quick analysis (predict) but not for strategic deliberation.

---

## Cross-Reference with Existing Research

| Doc | Relationship |
|-----|-------------|
| [Doc 70 — Sub-agents vs Agent Teams](../070-subagents-vs-agent-teams/) | Two multi-agent paradigms. Doc 171 adds a third: structured adversarial deliberation. |
| [Doc 168 — Community Innovations](../168-claude-code-community-innovations-march2026/) | Brief Council summary. Doc 171 is the deep dive with ZAO-specific triads and installation. |
| [Doc 67 — Paperclip AI](../067-paperclip-ai-agent-company/) | Agent company orchestrator. Council complements Paperclip for strategic decisions that inform what Paperclip agents build. |
| [Doc 89 — Paperclip + gstack + Autoresearch](../089-paperclip-gstack-autoresearch-stack/) | Full agent tool stack. Council adds the deliberation layer. |
| [Doc 154 — Skills & Commands](../154-skills-commands-master-reference/) | Would need updating to add `/council` as a new command after install. |

---

## Codebase State

| Item | Status |
|------|--------|
| `~/.claude/agents/` directory | **Does not exist** — needs creation during install |
| `~/.claude/skills/council/` | **Does not exist** — needs creation during install |
| Multi-agent sub-agents | Used in `/zao-research` for parallel research dispatching |
| `/autoresearch:predict` | Installed — multi-persona swarm for code analysis (different use case) |
| Superpowers dispatching-parallel-agents | Installed — for independent parallel tasks (no deliberation) |
| No code in `src/` related to Council | Correct — this is a developer workflow tool, not a product feature |

---

## Sources

- [Nyk — "Agreement is a bug"](https://x.com/nyk_builderz/status/2034492549180625316) — March 19, 2026
- [0xNyk/council-of-high-intelligence](https://github.com/0xNyk/council-of-high-intelligence) — CC0, 28 stars, 9 commits
- [alecnielsen/adversarial-review](https://github.com/alecnielsen/adversarial-review) — MIT, 4 stars
- [nyldn/claude-octopus — AI Debate System](https://deepwiki.com/nyldn/claude-octopus/10.1-ai-debate-system)
- [MindStudio — Agent Chat Rooms](https://www.mindstudio.ai/blog/agent-chat-rooms-multi-agent-debate-claude-code)
- [Claude Code Docs — Agent Teams](https://code.claude.com/docs/en/agent-teams)
- [Shipyard — Multi-agent Orchestration 2026](https://shipyard.build/blog/claude-code-multi-agent/)
- [Builderz-labs/mission-control](https://github.com/builderz-labs/mission-control) — Nyk's agent orchestration dashboard

---

## Quality Checklist

- [x] Recommendations/key decisions at the top
- [x] Specific to ZAO OS (3 custom triads, decision routing table, cost budget for solo founder)
- [x] Numbers, versions, and dates included ($0.50-5.00 per session, 28 stars, CC0)
- [x] Sources linked at the bottom with URLs
- [x] Cross-referenced with existing research (docs 67, 70, 89, 154, 168)
- [x] Actionable (install commands, custom triads, decision routing table)
- [x] Open-source code searched (6 multi-agent deliberation tools compared)
- [x] Reference implementations documented with repo, license, and key patterns

**Score: 8/8**
