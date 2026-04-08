# 303 - Daily AI Skill Building Curriculum

> **Status:** Research complete
> **Date:** April 8, 2026
> **Goal:** Design a daily learning system where ZOE teaches Zaal to master the AI tools in front of him

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Daily micro-lessons** | ZOE sends 1 daily "tool tip" via Telegram - a specific technique to try that day, takes 5 min max |
| **Weekly deep dives** | 1 per week, 30 min, hands-on exercise with a specific tool |
| **Progress tracking** | ZOE maintains a `skills-journal.md` logging what Zaal tried, what worked, what clicked |
| **Curriculum source** | Pull from research docs 297-302, Claude Code docs, tool READMEs |
| **Format** | "Today try this: [technique]. Here's how: [3 steps]. Why it matters: [1 sentence]." |
| **Rotation** | Cycle through 6 domains: Claude Code tricks, Graphify/wiki, content workflow, codebase patterns, agent tools, research skills |

---

## Comparison of Learning Approaches

| Approach | Time/Day | Retention | ZAO OS Fit | Recommendation |
|----------|----------|-----------|------------|----------------|
| **Daily micro-tip via Telegram** | 5 min | HIGH - spaced repetition, one thing at a time | HIGH - ZOE already on Telegram | USE this |
| **Weekly deep dive session** | 30 min | HIGH - hands-on practice | MEDIUM - requires dedicated time | USE 1x/week |
| **Read docs/articles** | 30-60 min | LOW - passive consumption | LOW - already doing too much reading | SKIP |
| **Watch tutorials** | 15-30 min | MEDIUM - visual but passive | LOW - time sink | SKIP |
| **Pair programming with Claude** | Varies | HIGH - learning by doing | HIGH - already happening | FORMALIZE it |

---

## The Curriculum: 30 Days of AI Tool Mastery

### Week 1: Claude Code Power User

| Day | Tip | Try This |
|-----|-----|----------|
| 1 | `/compact` saves tokens | After 15 messages, type `/compact`. Notice how the conversation compresses but Claude still remembers context. |
| 2 | `/model sonnet` for simple tasks | Switch to Sonnet for file reads and grep. Switch back to Opus for architecture decisions. Compare the quality. |
| 3 | Edit prompts, don't follow up | When Claude gets something wrong, click Edit on your message instead of sending a correction. Watch your token count. |
| 4 | Batch questions | Instead of 3 separate messages, combine into 1. "Do X, then Y, then Z." Compare the results. |
| 5 | Background agents | Ask Claude to do 2+ independent things. Notice when it dispatches parallel agents vs doing them sequentially. |
| 6 | `/z` for quick status | Start every session with `/z`. See branch state, recent commits, what needs attention. 10 seconds. |
| 7 | Peak hours awareness | Note the time when you start heavy Opus work. Is it 5-11 AM PT? If yes, schedule it for afternoon. |

### Week 2: Knowledge Infrastructure

| Day | Tip | Try This |
|-----|-----|----------|
| 8 | Install Graphify | `pip install graphifyy && graphify install`. Run `/graphify ./research`. Browse the HTML graph. |
| 9 | Query the graph | `/graphify query "What research covers XMTP?"` - compare speed vs manually grepping research/. |
| 10 | Install wiki-skills | `/plugin marketplace add kfchou/wiki-skills`. Run `/wiki-init` on a test folder. |
| 11 | Wiki ingest | Take 1 research doc, run `/wiki-ingest`. Watch how it creates summary + concept pages + cross-links. |
| 12 | Install last30days | `/plugin marketplace add mvanhorn/last30days-skill`. Research "Farcaster music 2026". |
| 13 | Nia Docs for API lookups | `npx nia-docs https://docs.neynar.com -c "tree"`. Browse Neynar docs as a filesystem. |
| 14 | Oh-My-Mermaid | `npm i -g oh-my-mermaid && omm setup`. Run `/omm-scan` on ZAO OS. View the architecture diagrams. |

### Week 3: Content & Communication

| Day | Tip | Try This |
|-----|-----|----------|
| 15 | Brand voice test | Write a newsletter intro yourself. Then ask Claude with the brand-voice skill. Compare. |
| 16 | Quote-cast pattern | Find a trending Farcaster cast. Draft a quote response that adds tactical value. |
| 17 | Research-first content | Use last30days before writing any content. "What's trending in web3 music?" then write from data. |
| 18 | `/socials` with research | Run `/socials` but first feed it last30days results. Notice how grounded the output is. |
| 19 | Build-in-public post | Document today's coding session as a build-in-public thread. Use real screenshots and numbers. |
| 20 | ZOE content brief | Ask ZOE to generate a weekly content brief from Farcaster activity + trending topics. |
| 21 | Review & iterate | Look at your best-performing Farcaster cast from the past month. What made it work? |

### Week 4: Codebase & Agent Mastery

| Day | Tip | Try This |
|-----|-----|----------|
| 22 | Auto-memory review | Read `~/.claude/projects/.../memory/MEMORY.md`. Is it accurate? Update stale entries. |
| 23 | MemPalace search | Ask MemPalace "What did I decide about XMTP?" - test cross-session memory. |
| 24 | `/investigate` vs guessing | Next bug you hit, use `/investigate` instead of guessing. Follow the 4-phase process. |
| 25 | `/review` before shipping | Before your next PR, run `/review`. Compare what it catches vs what you'd have missed. |
| 26 | `/autoresearch` on a goal | Pick a measurable goal. Run `/autoresearch` and watch it iterate autonomously. |
| 27 | VPS agent check | Run `/vps status`. Understand what ZOE is doing. Send ZOE a task via Telegram. |
| 28 | Custom skill creation | Identify one repetitive task you do. Write a 20-line skill for it. Test it. |
| 29 | Architecture diagrams | Open the oh-my-mermaid output. Trace a data flow (e.g., auth -> session -> API route). |
| 30 | Reflection | Run `/reflect`. What tools stuck? What changed your workflow? What do you want to learn next? |

---

## ZOE Daily Tip Format

ZOE sends via Telegram at 9 AM ET daily:

```
Today's tool tip (Day 8):

INSTALL GRAPHIFY
`pip install graphifyy && graphify install`
Then run: `/graphify ./research`

Why: Your 338 research docs take thousands of tokens to search.
Graphify builds a knowledge graph - 71.5x fewer tokens per query.

Try it now. Takes 5 minutes. Report back what you find.
```

---

## ZAO OS Integration

### Implementation

1. Create `docs/ai-curriculum/` directory with 30-day curriculum as markdown
2. Add to ZOE's scheduled tasks: daily tip delivery at 9 AM ET via Telegram
3. Create `docs/ai-curriculum/skills-journal.md` - ZOE appends what Zaal reports trying
4. After 30 days, ZOE generates a "what stuck" report and suggests next 30 days

### Files to Create

- `docs/ai-curriculum/curriculum.md` - the 30-day plan above
- `docs/ai-curriculum/skills-journal.md` - append-only learning log
- `.claude/skills/zao-os/brand-voice.md` - brand voice profile (from Doc 302)

### ZOE Scheduled Task

```
Schedule: Daily at 9:00 AM ET
Task: Read docs/ai-curriculum/curriculum.md, determine today's day number,
      send the tip via Telegram. If Zaal reported trying yesterday's tip,
      log it in skills-journal.md with date and outcome.
```

---

## Improving the ZAO OS Codebase (Based on All Research)

All this research points to concrete codebase improvements:

### Token Efficiency (Doc 298)
- Add context budget to CLAUDE.md (DONE)
- Use `/compact` every 15-20 messages (behavioral)
- Model switching for simple tasks (behavioral)

### Knowledge Infrastructure (Docs 297, 299)
- Graphify on `research/` and `src/` = navigable knowledge graph
- wiki-skills = queryable wiki from research library
- `research/changelog.md` = chronological research tracking

### Documentation (Doc 300)
- Oh-My-Mermaid architecture diagrams = visual codebase map
- MemPalace MCP = cross-session memory for all projects

### External Docs (Doc 301)
- Nia Docs = filesystem access to Neynar, Supabase, XMTP, Stream.io docs
- last30days = real-time research for content and decisions

### Content Pipeline (Doc 302)
- Brand voice skill = consistent voice across all outputs
- Research-first content = grounded in what community cares about
- ZOE weekly content brief = automated content suggestions

### Agent Autonomy (Docs 301, 302)
- AI Employee workspace pattern for ZOE tasks
- Self-check loop in every ZOE skill
- Trajectory learning (Archivist, future) for agent self-improvement

---

## Sources

- [Docs 297-302](../297-graphify-knowledge-graph-codebase/) - this research batch
- [Corey Ganim's content system](https://x.com/coreyganim/status/2039699858760638747) - skills-based content production
- [Khairallah's AI Employee](https://x.com/eng_khairallah1/status/2041442796423590115) - autonomous agent workspace
- [Sarvesh's SEO system](https://x.com/bloggersarvesh/status/2041540505289527489) - systematic prompt stack approach
- [Karpathy's LLM Knowledge Bases](https://x.com/karpathy) - the pattern that started the wave
