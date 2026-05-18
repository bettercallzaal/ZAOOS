---
topic: identity
type: decision
status: research-complete
last-validated: 2026-05-04
related-docs: 309, 478, 549, 568, 569, 570, 574, 581, 601, 604, 605
tier: STANDARD
---

# 606 - Zaal's second-brain operating system (May 2026)

> **Goal:** Stop treating "second brain" as a tool pick. Define the daily SYSTEM (capture / process / resurface / output) sitting on top of the stack already shipped (Bonfire + ZOE + research/ + MEMORY.md), and the 2-3 AI-PKM tools that genuinely fill the remaining gaps.

## Key Decisions

| Decision | Action | Reason |
|----------|--------|--------|
| Foundation | Bonfire is the long-term memory + KG. ZOE (`@zaoclaw_bot`) is the daily-driver concierge. `research/**/README.md` is institutional memory. `~/.claude/projects/.../memory/MEMORY.md` is per-conversation working memory. | Already shipped 2026-05-04. Doc 549 + 570 settled the long-term decision. No retool. |
| Capture (voice + ambient) | ADD Granola Free tier for meeting/podcast auto-transcript. ADD Limitless Pendant ($199 one-time + 20h/mo free, $20/mo for 100h) once budget clears. PUSH all output into Bonfire daily. | Closes the ambient-capture gap. Granola is privacy-first (no visible bot in calls). Limitless gives walking/lunch/drive notes without phone. |
| Capture (typed + screenshot) | KEEP Telegram DMs to ZOE + `/graphify` skill + research docs. SKIP Mem.ai, Reflect, Saner.AI as primary - they overlap with Bonfire. | Bonfire already does what these 3 promise; adopting one means dual-write. |
| Process | DAILY at 9pm (during evening reflection, already wired): triage Granola transcripts + Telegram captures, push the keepers into Bonfire, archive the rest. WEEKLY on Sunday: re-validate one stale memory file, decay-or-keep-or-promote. | Calendar-blocked, not "when I feel like it." Sunday review locks the loop. |
| Resurface | ZOE morning brief (5am EST) pulls 3-5 Bonfire facts tied to today's tasks + 1 random "stuck idea" from the decision log. ASK Bonfire DM proactively when stuck on a decision. | Already shipped via `bot/src/zoe/brief.ts`. Just needs the Bonfire-recall hook (Phase 2 once `BONFIRE_API_KEY` lands from Joshua.eth). |
| Output | Three output channels: research doc (PR), Farcaster cast, ZAO email/pitch. Each output ends with: "what fact in this output is worth re-ingesting into Bonfire?" | Closes the loop - output becomes future input. Avoids the "write once, never re-read" trap. |
| Rejected as primary tools | SKIP Obsidian, Logseq, Notion, Tana, Capacities. SKIP Saner.AI, Mem.ai, Reflect, Heyday for now. | Each is a reasonable PKM but ZAO already has Bonfire (KG-native + Telegram capture + agent integration). Adopting any of them = dual write + sync hell. |

## The system (Capture - Process - Resurface - Output)

This is not a tool list. It is a daily rhythm anchored to Zaal's existing 4:30am-7pm M-F schedule.

### Capture (always on, zero friction)

| Surface | Tool | Friction | Goes to |
|---------|------|----------|---------|
| Voice while walking / driving / lunch | OpenWhisp on Mac (doc 560 install pending), or Telegram voice DM to ZOE | 5 sec | ZOE recent.json + Bonfire (after Phase 2) |
| Meetings (Roddy 4/28, ZAOstock standups, BCZ calls) | Granola Free tier (system audio, no bot) | 10 sec to start, auto-stop | Auto-summary - Telegram to ZOE - Bonfire |
| Ambient (overheard ideas, hallway chats, gym observations) | Limitless Pendant ($199 hardware + 20h/mo free) | clip-on, 0 sec runtime | Limitless app - daily digest - Telegram to ZOE |
| Typed (random thought) | Telegram DM to `@zaoclaw_bot` | 5 sec | ZOE recent.json + concierge handles routing |
| Web (article, paper, repo, tweet) | `/graphify` skill in Claude Code OR send link to ZOE | 10 sec | Bonfire fact node |
| Decisions (small-moment-of-clarity) | Telegram DM "DECISION: X because Y" - tagged decision | 15 sec | Bonfire decision log |

**Rule:** if it takes longer than 30 seconds to capture, it is the wrong tool. The Bonfire decision log loses if Zaal has to open Notion.

### Process (daily 9pm, weekly Sunday)

ZOE evening reflection at 9pm EST (already wired via `bot/src/zoe/reflect.ts`) prompts three questions: what shipped, what stuck, tomorrow first. Adds one new gate: **"any captures from today that should land in Bonfire?"** ZOE replies with the day's Granola transcripts, voice notes, and tagged DMs as a checklist; Zaal taps Now / Later / Shelve.

Sunday review (10 minutes, calendar-blocked):
- Open `~/.claude/projects/.../memory/MEMORY.md`. Pick ONE file with `last-validated > 30 days`. Re-read. Either re-validate (update date), update (note what changed), or kill (`status: deprecated`).
- Open `research/` and pick ONE doc with `last-validated > 30 days`. Same loop.
- Bonfire: ask "@bonfires what facts have I added this week?" - synthesize into a 3-bullet weekly memo.

### Resurface (proactive, agent-driven)

ZOE morning brief at 5am EST already exists. Extend it with two hooks (Phase 2 PR):

1. **Daily**: pull 3-5 Bonfire facts tied to today's open tasks. Format: "Reminder for ZAOstock standup: Roddy mentioned Aug 28 city council vote (decision-log entry from 2026-04-28)."
2. **Weekly random**: surface one random "stuck idea" from Bonfire's decision log where status is `paused` and `paused_at > 30 days`. Forces a re-decide.

Bonfire-direct queries are still Telegram-DM-driven for now. When `BONFIRE_API_KEY` ships from Joshua.eth, ZOE will auto-recall during concierge turns (already wired via `bot/src/zoe/recall.ts` placeholder).

### Output (every output is also an input)

Three output channels Zaal already runs:

| Channel | Format | Bonfire-loop step |
|---------|--------|-------------------|
| Research doc | PR to `research/` | Doc auto-ingested into Bonfire via daily cron (doc 570 pipeline planned) |
| Farcaster cast | Public post | At end of post, Zaal sends to ZOE: "cast a snapshot of this thread to Bonfire" |
| Pitch / email / 1-pager | PDF or email body | Save to `~/Documents/zaal/pitches/` + Telegram to ZOE: "filed pitch X for Y, key fact: Z" |

**The closing of the loop matters more than the capture.** Today most output evaporates - it gets sent and forgotten. Adding one Telegram message at end of every output costs 10 seconds and turns every external output into a future input.

## AI-PKM tool landscape (May 2026) - what was and was not picked

| Tool | Pricing | Best at | Why ZAO skips (today) |
|------|---------|---------|----------------------|
| **Bonfire** | Genesis tier (wallet-gated) | KG-native recall, multi-corpus, agent-callable | KEEP as primary (already shipped) |
| **Granola** | Free / $14 user/mo / $35 user/mo | Meeting auto-transcript, no visible bot, system-audio capture | ADOPT free tier for ZAOstock standups + BCZ calls |
| **Limitless Pendant** | $199 hardware + 20h/mo free, $20/mo (100h), $29/mo (unlimited) | Ambient always-on voice capture, GPT-5 / Claude / Gemini configurable | ADOPT after $199 budget clears (post-ZAOstock spinout) |
| **Saner.AI** | Free / $8 mo | Note-taking + ADHD-friendly task management + Android-native | SKIP - overlaps Bonfire + ZOE task queue |
| **Mem.ai** | $8/mo (most AI behind paywall) | AI-native notes, auto-tagging, semantic search | SKIP - Bonfire already does semantic recall |
| **Reflect Notes** | $10/mo | GPT-4 + Whisper-powered networked notes, minimalist | SKIP - dual-write hell with Bonfire |
| **Heyday** | $5-15 mo (per app store) | Auto-resurface what you read, browser extension | SKIP for now - Bonfire ingest will absorb this once research/ pipeline lands |
| **Notion** | $10 user/mo | Doc + db + collab, weak AI | SKIP - already left Notion for `research/` markdown |
| **Obsidian** | Free / $50 yr sync | Local-first, plugin ecosystem | SKIP per doc 549 (Bonfire wins on capture friction + agent integration) |
| **Logseq** | Free OSS | Local-first outliner + journal | SKIP - same reason as Obsidian |
| **Tana** | $14/mo | Outliner + supertags + AI | SKIP - mid-tier between Bonfire and Notion, no clear edge |
| **Mymind** | $11/mo | Visual moodboard, image-first | SKIP - Bonfire handles links, Mymind aesthetic-first not memory-first |
| **NotebookLM** | Free (Google) | Source-grounded Q&A, podcast generation | KEEP as ad-hoc tool for "give me 5 angles on this PDF" - not a system |
| **Khoj** | OSS self-host or $20/mo cloud | Local-first chat over personal docs (matches doc 568 angle) | DEFER - covered in doc 568, revisit when local-LLM stack hardens |

## Codebase + skill touchpoints

- `bot/src/zoe/reflect.ts` - 9pm reflection. Add a "process captures from today" prompt block.
- `bot/src/zoe/brief.ts` - 5am brief. Add a Bonfire-recall hook (Phase 2 once API key arrives).
- `bot/src/zoe/recall.ts` - already scaffolded for Bonfire SDK. Wire when `BONFIRE_API_KEY` lands.
- `~/.claude/skills/graphify/SKILL.md` - already maps "any input - knowledge graph". Use this for web links + paste-in.
- `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/MEMORY.md` - the auto-memory index. Sunday review loop targets this.
- `research/identity/549-bonfire-personal-second-brain/` - the long-term system decision (Bonfire as primary).
- `research/identity/570-zaal-personal-kg-agentic-memory/` - the 16-corpus ingest plan.
- `research/agents/568-aware-brain-local-memory-knowledge-graph/` - the local-LLM backup brain (Phase 3+).

## What this doc is NOT (and why)

- Not a Bonfire vs Obsidian decision (doc 549 settled it)
- Not a 16-corpus ingest plan (doc 570 has it)
- Not a generic Tiago Forte BASB summary - the methodology is fine but it does not specify Zaal's stack
- Not a tool migration project - the system runs on what is already shipped

## Failure modes to watch

| Mode | Symptom | Mitigation |
|------|---------|-----------|
| Capture without process | Bonfire fills with noise, recall degrades | 9pm triage gate - Now/Later/Shelve - Shelve = drop, do not store |
| Process without resurface | Memory becomes archive, not tool | 5am brief + weekly random stuck-idea pull |
| Resurface without re-decide | Same idea surfaces forever, no decision log update | Sunday review forces "killed / kept / promoted" tag |
| Tool sprawl | Bonfire + Granola + Limitless + Saner + Mem + Reflect = 6 places to look | This doc closes the door on Saner / Mem / Reflect / Heyday. Granola + Limitless feed Bonfire. One source of truth. |
| Output evaporation | PR ships - cast goes out - pitch sent - none re-ingested | One-line Telegram DM after every output. 10 sec habit. |

## Also see

- [Doc 309 - Karpathy LLM wiki codebase compiler](../../309-karpathy-llm-wiki-codebase-compiler/) (the philosophy of "your repo is your wiki")
- [Doc 478 - Obsidian + Claude Jarvis AI Brain](../../dev-workflows/478-obsidian-claude-jarvis-ai-brain/) (the alt path that lost to Bonfire)
- [Doc 549 - Bonfire as personal second brain](../549-bonfire-personal-second-brain/) (the foundation decision)
- [Doc 568 - Aware brain local memory + KG](../../agents/568-aware-brain-local-memory-knowledge-graph/) (Phase 3 local backup)
- [Doc 569 - YapZ Bonfire ingestion strategy](../569-yapz-bonfire-ingestion-strategy/)
- [Doc 570 - Zaal personal KG agentic memory](../570-zaal-personal-kg-agentic-memory/) (the 16-corpus plan)
- [Doc 581 - Bonfire graph wipe + bot hygiene](../581-bonfire-graph-wipe-bot-hygiene/) (state-truthfulness anti-pattern lesson)
- [Doc 604 - Best concierge agents 2026](../../agents/604-best-personal-concierge-agents-2026/)
- [Doc 605 - Agentic tooling May 2026](../../agents/605-agentic-tooling-may-2026/)

## Next Actions

| # | Action | Owner | Type | By When |
|---|--------|-------|------|---------|
| 1 | Sign up for Granola Free tier, install Mac client, run on next standup | @Zaal | Tool install | This week |
| 2 | Patch `bot/src/zoe/reflect.ts` to add "captures from today" gate at end of 9pm prompt | Claude | PR | Same week as ZOE Phase 1 unlocks (doc 605 Phase 1) |
| 3 | Calendar-block Sunday 10am for 10-min memory + research review | @Zaal | Calendar | Recurring weekly |
| 4 | Once `BONFIRE_API_KEY` arrives from Joshua.eth: wire `bot/src/zoe/recall.ts` SDK path | Claude | PR | After Joshua.eth ship |
| 5 | When Limitless budget clears ($199 hw + $0-29/mo): order Pendant, wire daily-digest webhook to ZOE | @Zaal | Procurement | Post-ZAOstock spinout |
| 6 | Add output-loop habit: one Telegram DM after every PR/cast/pitch saying "key fact for Bonfire: X" | @Zaal | Habit | Continuous |
| 7 | Update ZOE persona.md to reference this doc + the capture/process/resurface/output rhythm | Claude | Doc | Same PR as #2 |
| 8 | Re-validate this doc 30 days from now (2026-06-03) | Claude | Doc update | 2026-06-03 |

## Sources

- [Saner.AI second-brain comparison Apr 2026](https://blog.saner.ai/10-best-second-brain-ai-apps/)
- [Saner.AI pricing](https://www.saner.ai/pricing)
- [Mem.ai review 2026](https://blog.saner.ai/mem-ai-reviews/)
- [Limitless Pendant review + pricing](https://moelueker.com/blog/limitless-ai-pendant-review-5-use-cases-worth-199)
- [Limitless AI guide 2026](https://merlio.app/blog/limitless-ai-guide)
- [Granola AI pricing 2026](https://get-alfred.ai/blog/granola-pricing)
- [Granola review 2026 efficient.app](https://efficient.app/apps/granola)
- [Granola review tldv](https://tldv.io/blog/granola-review/)
- [12 best AI personal assistants 2026](https://get-alfred.ai/blog/best-ai-personal-assistants)
- [The Second Brain 2026 Guide - Saner.AI](https://www.saner.ai/blogs/the-second-brain)

URLs verified live as of 2026-05-04 via WebSearch results.
