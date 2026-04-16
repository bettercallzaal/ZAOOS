# 408 - Claude Code 1M Context Window Session Management

> **Status:** Research complete
> **Date:** April 16, 2026
> **Goal:** Best practices for managing Claude Code's 1M token context window - when to rewind, compact, clear, or use subagents
> **Source:** [@trq212 on X](https://x.com/trq212/status/2044548257058328723)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **New task** | START a new session. Don't pollute existing context with unrelated work. |
| **Made a mistake** | USE /rewind (Esc Esc) - jump back and re-prompt with learned constraints. Better than appending corrections. |
| **Context getting large** | USE /compact around 200-300K tokens. Don't wait for degradation at 300-400K. |
| **After debugging session** | USE /clear + manual brief. Compact after debugging produces bad summaries because model can't predict next direction. |
| **Heavy intermediate work** | USE subagents. They get clean context and return only synthesis. Intermediate output never enters main context. |

---

## Context Rot: The Core Problem

- 1M token context window enables long autonomous work
- BUT performance degrades noticeably around **300-400K tokens** (task-dependent)
- Context pollution = the model attends to irrelevant earlier work, degrading quality
- "The 1M token context window is a double-edged sword"

---

## 5 Session Management Strategies

### 1. Continue in Same Session

**When:** Task is directly related to current context. Building on what's already loaded.
**Risk:** Context grows, eventual degradation.

### 2. /rewind (Esc Esc)

**When:** You realize mid-conversation the approach is wrong.
**Why better than corrections:** Jumping back removes the bad path from context entirely. Appending "no, do it this way instead" leaves conflicting instructions in context.
**Best for:** Re-prompting with learned constraints after seeing what didn't work.

### 3. /clear

**When:** Starting genuinely new work. After messy debugging. When you want intentional, curated context.
**How:** Requires manual documentation of what matters. More work, but more intentional.
**Best for:** Clean slate with a distilled brief you write yourself.

### 4. /compact

**When:** Mid-task, context is growing but work is ongoing. Around 200-300K tokens.
**How:** Auto-summarizes conversation (lossy but thorough). Continues seamlessly.
**Risk:** "Bad compacts" - occurs when model can't predict next work direction. Especially after debugging sessions where subsequent requests reference unrelated items.
**Best for:** Ongoing work where you want to keep momentum but shed weight.

### 5. Subagents

**When:** Work that produces heavy intermediate output you won't need again. Research, file exploration, test runs.
**How:** Delegated work gets clean context. Only the synthesis/result returns to main context.
**Best for:** Keeping main context clean while doing thorough investigation.

---

## Decision Flowchart

```
New task? ──yes──> /clear + fresh brief
  │
  no (continuing)
  │
Context > 200K? ──yes──> Was it debugging? ──yes──> /clear (bad compact risk)
  │                                          │
  │                                          no──> /compact
  │
Wrong approach? ──yes──> /rewind (Esc Esc)
  │
  no
  │
Heavy intermediate work? ──yes──> Subagent
  │
  no──> Continue
```

---

## ZAO OS Application

| Scenario | Strategy |
|----------|----------|
| Starting /worksession | /clear if previous session was different feature |
| Debugging a bug then switching to new feature | /clear + brief (bad compact territory) |
| Building 5 API routes in sequence | /compact at route 3 |
| Researching codebase before implementation | Subagent for research, then implement in clean main context |
| Wrong architecture approach mid-build | /rewind to before the bad decision |
| Running /zao-research | Subagent - heavy intermediate output |

Already doing some of this per CLAUDE.md: "/compact every 15-20 messages" and "Use /model sonnet for simple tasks."

---

## Existing ZAO OS Context Budget Rules (CLAUDE.md)

- Use /compact every 15-20 messages
- Use /model sonnet for simple tasks
- Batch related questions into single messages
- Don't pre-read large directories unless needed
- Edit prompts instead of sending corrections as follow-ups

**New additions from this research:**
- Prefer /rewind over corrections
- /clear after debugging sessions (not /compact)
- Use subagents for research/exploration to protect main context
- Watch for context rot starting at 300K tokens

---

## Sources

- [@trq212 - Claude Code 1M Context Management](https://x.com/trq212/status/2044548257058328723)
- [Claude Code Documentation - /compact](https://docs.anthropic.com/en/docs/claude-code)
