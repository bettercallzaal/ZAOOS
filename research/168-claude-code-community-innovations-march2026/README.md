# 168 — Claude Code Community Innovations: Autoresearch 10x, Council of High Intelligence, Learn Vibe Build

> **Status:** Research complete
> **Date:** March 28, 2026
> **Goal:** Evaluate three community innovations around Claude Code workflows — assess what ZAO OS should adopt, adapt, or monitor

---

## Key Decisions / Recommendations

| Item | Recommendation | Priority |
|------|---------------|----------|
| **Ole Lehmann's Autoresearch 10x** | ZAO OS already has autoresearch (docs 62/63, skill installed). **New insight:** his binary checklist scoring pattern + live dashboard are worth stealing. Write eval checklists for `/zao-research` and `/new-component` skills. | **High** — actionable now |
| **Nyk's Council of High Intelligence** | INSTALL the CC0-licensed council skill for architecture decisions. Use `--triad architecture` for tech stack choices, `--triad product` for feature prioritization. 11 agents is overkill for daily use — triads of 3 are the sweet spot. | **Medium** — install when facing next architecture decision |
| **Learn Vibe Build** | Monitor only. General AI education program in Boulder, not music/artist-specific. Potential model for a ZAO-specific "build with AI" cohort if community interest exists. | **Low** — reference only |

---

## 1. Ole Lehmann: "How to 10x Your Claude Skills" (Autoresearch Method)

**Source:** [@itsolelehmann, March 17, 2026](https://x.com/itsolelehmann/status/2033919415771713715) — 5,257 likes, 2.4M views

### What's New vs What ZAO Already Has

ZAO OS already has the autoresearch skill installed (`.claude/skills/autoresearch/SKILL.md`) and documented it in docs 62 and 63. Ole Lehmann's article popularizes the same core loop but adds two concrete patterns worth borrowing:

#### Pattern 1: Binary Checklist Scoring (the "Teacher Grading" Method)

Instead of subjective 1-10 ratings, define 3-6 yes/no questions per skill:

```
Landing page skill example:
- Does the headline include a specific number or result? (yes/no)
- Is the copy free of buzzwords like 'revolutionary', 'synergy'? (yes/no)
- Does the CTA use a specific verb phrase? (yes/no)
- Does the first line call out a specific pain point? (yes/no)
- Is total copy under 150 words? (yes/no)
```

**Why this matters for ZAO OS:** Our `/zao-research` skill has a quality checklist (8 items) but it's manually checked. Converting it to an autoresearch-compatible binary eval would let us auto-improve the skill.

**Proposed eval checklist for `/zao-research`:**

| # | Question | Catches |
|---|----------|---------|
| 1 | Are recommendations at the top of the doc? | Buried insights |
| 2 | Does the doc reference ZAO OS's tech stack or codebase paths? | Generic research |
| 3 | Are specific numbers/versions/dates included? | Vague claims |
| 4 | Are all external claims linked to sources? | Unsourced assertions |
| 5 | Was the codebase searched before writing? | Aspirational-only docs |
| 6 | Was open-source code searched (grep.app/GitHub)? | Missed reference implementations |

#### Pattern 2: Live Dashboard

Lehmann's autoresearch opens a browser dashboard showing: score chart over time, pass/fail per checklist item, changelog of every modification tried. Auto-refreshes every 10 seconds.

**ZAO OS application:** Our autoresearch skill logs results to files but has no dashboard. Low priority — the file-based logs work fine for a solo founder workflow.

### Results Lehmann Reports

| Skill | Before | After | Rounds | Changes Kept |
|-------|--------|-------|--------|-------------|
| Landing page copy | 56% | 92% | 4 | 3 of 4 |
| Fundraising pitch deck | 70% | 94% | not specified | not specified |
| Sales MEDDIC qualification | 65% | 91% | not specified | not specified |

### Key Takeaway

The autoresearch loop is not new to ZAO OS. What's new is the **specific eval patterns** — turning vague "quality" into binary pass/fail questions. This is the bottleneck Karpathy identified: evaluation quality determines improvement quality.

**Action item:** Write binary eval checklists for ZAO OS's top 3 skills (`/zao-research`, `/new-component`, `/new-route`) and run autoresearch on each.

---

## 2. Nyk's Council of High Intelligence: Structured Multi-Agent Deliberation

**Source:** [@nyk_builderz, March 19, 2026](https://x.com/nyk_builderz/status/2034492549180625316) — 184 likes, 83.8K views
**Repo:** [github.com/0xNyk/council-of-high-intelligence](https://github.com/0xNyk/council-of-high-intelligence) — 28 stars, CC0 license (public domain)

### Core Concept

11 Claude Code subagents, each modeled on a historical thinker with a declared analytical method AND declared blind spots. They deliberate in a 3-round protocol before producing a structured verdict.

### Why This Matters for ZAO OS

Doc 70 covers sub-agents vs agent teams. The Council adds something neither pattern addresses: **structured disagreement**. When a single agent answers "monorepo or polyrepo?" it gives one coherent perspective. The Council forces adversarial deliberation across multiple reasoning traditions.

**ZAO OS use cases:**
- Architecture decisions (e.g., "should we add Redis caching or stick with Supabase RLS?")
- Governance design (e.g., "how should Respect weighting work for proposal voting?")
- Feature prioritization (e.g., "what's the next pillar to build after Spaces?")

### Architecture

**Model split (cost optimization):**
- OPUS (depth-heavy, 5 agents): Socrates, Aristotle, Marcus Aurelius, Lao Tzu, Alan Watts
- SONNET (speed-critical, 6 agents): Feynman, Sun Tzu, Ada Lovelace, Machiavelli, Linus Torvalds, Miyamoto Musashi

**6 polarity pairs (prevent groupthink):**

| Pair | Tension |
|------|---------|
| Socrates vs Feynman | Top-down destruction vs bottom-up rebuilding |
| Aristotle vs Lao Tzu | Categories vs "categories are the problem" |
| Sun Tzu vs Aurelius | External game vs internal governance |
| Ada vs Machiavelli | Formal purity vs messy human incentives |
| Torvalds vs Watts | Ship it now vs "does the problem even exist?" |
| Musashi vs Torvalds | Perfect timing vs ship immediately |

**3-round protocol:**
1. **Independent analysis** (parallel) — 400 words max each, all run simultaneously
2. **Cross-examination** (sequential) — each must disagree with at least one other, 300 words max
3. **Synthesis** — 100 words max, final position only, no new arguments

### Anti-Recursion Safeguards

Critical engineering detail — first version had Socrates and Feynman entering infinite questioning loops:

- **Hemlock rule:** If Socrates re-asks a question already answered with evidence, coordinator forces a 50-word position statement
- **3-level depth limit:** Question → response → one more question → must commit
- **2-message cutoff:** Any pair exchanging >2 messages gets forced to Round 3

### Pre-Built Triads for ZAO OS

| ZAO Decision Type | Recommended Triad | Why |
|---|---|---|
| Tech architecture | Aristotle + Ada + Feynman | Classify → formalize → simplicity-test |
| Governance design | Aurelius + Socrates + Lao Tzu | Duty → questioning → natural order |
| Feature shipping | Torvalds + Musashi + Feynman | Pragmatism → timing → first-principles |
| Product direction | Torvalds + Machiavelli + Watts | Ship it → incentives → reframing |

### Installation

```bash
git clone https://github.com/0xNyk/council-of-high-intelligence.git
cd council-of-high-intelligence
./install.sh
# Copies 11 agent definitions to ~/.claude/agents/
# Copies coordinator skill to ~/.claude/skills/council/SKILL.md
```

**Invocation:**
```
/council --triad architecture "should we split the monolith now?"
/council --full "is adding a token worth the regulatory complexity?"
/council --members socrates,feynman,torvalds "why does our cache invalidation keep failing?"
```

### Cost Consideration

A full 11-member council consumes significant context and API cost. For a solo founder workflow:
- Use **triads** (3 members) for most decisions — fast, cheap, still gets adversarial tension
- Reserve **--full** for major architectural pivots or irreversible decisions
- The CC0 license means zero friction to adopt or modify

---

## 3. Learn Vibe Build: AI Education Cohort

**Source:** [learnvibe.build](https://learnvibe.build/)

### Program Details

| Detail | Value |
|--------|-------|
| **Format** | 6-week cohort, weekly 1-2hr sessions + 2hr co-working |
| **Location** | Boulder, CO + Remote |
| **Cost** | $500 (Cohort 1 intro pricing; future $1,000) |
| **Start** | April 2026 |
| **Facilitators** | Aaron Gabriel (CU Boulder ATLAS, Parachute founder), Jon Bo (3x founding engineer, daily Claude Code user) |
| **Target** | Creators, thinkers, organizers — no coding experience needed |
| **Focus** | Using AI as thinking partner + building collaborator |

### ZAO OS Relevance Assessment

**Low-medium relevance.** Not music or artist-specific. Connections:

1. **Cohort model** — ZAO's fractal process (90+ weeks, Monday 6pm EST) already has a recurring community structure. A "build with AI" track could fit as an educational add-on for ZAO members who want to learn to ship their own tools.

2. **AI for creators** — Most AI education targets developers or entrepreneurs. There's an unoccupied niche: AI for independent musicians (music curation, cross-platform publishing, community governance). ZAO could eventually run a music-specific version.

3. **Claude Code focus** — The program specifically highlights Claude Code, which is ZAO OS's primary development tool. Community members could benefit from structured Claude Code education.

**No action needed now.** File as reference for potential future ZAO community education initiatives.

---

## Cross-Reference with Existing Research

| Existing Doc | Relationship to This Research |
|---|---|
| [Doc 62 — Autoresearch Skill Improvement](../62-autoresearch-skill-improvement/) | Covers the same autoresearch loop. Doc 168 adds Lehmann's binary checklist pattern and specific results data. |
| [Doc 63 — Autoresearch Deep Dive](../63-autoresearch-deep-dive-zao-applications/) | 7 ZAO use cases for autoresearch. Doc 168 adds the eval checklist template for `/zao-research`. |
| [Doc 70 — Sub-agents vs Agent Teams](../70-subagents-vs-agent-teams/) | Two multi-agent paradigms. Doc 168 adds a third: structured adversarial deliberation (Council). |
| [Doc 89 — Paperclip + gstack + Autoresearch Stack](../89-paperclip-gstack-autoresearch-stack/) | Workflow tool ecosystem. Council adds a new decision-making layer. |
| [Doc 154 — Skills & Commands Master Reference](../154-skills-commands-master-reference/) | Would need updating if Council is installed as `/council` command. |

---

## Codebase State Check

- **Autoresearch skill:** Installed at `.claude/skills/autoresearch/SKILL.md` with 8 subcommands (`/autoresearch`, `/autoresearch:debug`, `:fix`, `:ship`, `:plan`, `:predict`, `:scenario`, `:security`). v1.8.2 from `uditgoenka/autoresearch`.
- **Multi-agent usage:** Sub-agents dispatched via `Agent` tool in skills like `/zao-research`. No structured deliberation system installed.
- **No council skill installed** — `~/.claude/skills/council/` does not exist yet.
- **No Learn Vibe Build integration** — informational only.

---

## Sources

- [Ole Lehmann — "How to 10x your Claude Skills"](https://x.com/itsolelehmann/status/2033919415771713715) — March 17, 2026
- [Linas Substack — "Andrej Karpathy's Method to 10X Your Claude Skills"](https://linas.substack.com/p/10xclaudeskills)
- [MindStudio — Karpathy AutoResearch Pattern Applied to Claude Code Skills](https://www.mindstudio.ai/blog/karpathy-autoresearch-pattern-claude-code-skills)
- [uditgoenka/autoresearch (GitHub)](https://github.com/uditgoenka/autoresearch) — MIT license, v1.8.2
- [Nyk — "Agreement is a bug"](https://x.com/nyk_builderz/status/2034492549180625316) — March 19, 2026
- [0xNyk/council-of-high-intelligence (GitHub)](https://github.com/0xNyk/council-of-high-intelligence) — CC0 license, 28 stars
- [builderz-labs/mission-control (GitHub)](https://github.com/builderz-labs/mission-control) — AI agent orchestration dashboard
- [Learn Vibe Build](https://learnvibe.build/) — Cohort 1, April 2026, $500
- [Karpathy/autoresearch (GitHub)](https://github.com/karpathy/autoresearch) — MIT license, original autoresearch

---

## Quality Checklist

- [x] Recommendations/key decisions at the top
- [x] Specific to ZAO OS (references tech stack, codebase paths, existing docs)
- [x] Numbers, versions, and dates included
- [x] Sources linked at the bottom with URLs
- [x] Cross-referenced with existing research and codebase state
- [x] Actionable (binary eval checklists, Council install instructions, triad recommendations)
- [x] Open-source code searched (GitHub repos checked, licenses verified)
- [x] Reference implementations documented with repo, license, and key patterns

**Score: 8/8**
