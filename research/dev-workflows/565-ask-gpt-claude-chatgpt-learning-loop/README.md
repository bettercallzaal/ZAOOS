---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-04-29
related-docs: 506, 507, 548, 549, 555, 562, 564
tier: STANDARD
---

# 565 - `/ask-gpt` Skill: Claude ↔ ChatGPT Learning Loop

> **Goal:** Document the Claude-prompts-ChatGPT loop infrastructure shipped 2026-04-29. Wraps OpenAI Codex CLI (authenticated via Zaal's ChatGPT Plus/Pro account, no API billing) so Claude can pose questions to GPT-5, capture answers, run multi-turn research loops, and persist context across sessions.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Use codex CLI as the GPT-side of the loop | **YES** | Already installed (`codex-cli 0.124.0`). Auth state: "Logged in using ChatGPT" via OAuth - uses Zaal's existing Plus/Pro auth, **no API key billing**. Aligns with `feedback_prefer_claude_max_subscription`. |
| Ship `~/bin/zao-ask-gpt.sh` wrapper | **YES, BUILT + TESTED** | Adds: per-topic logging, --resume mode that auto-injects last 200 log lines as context, session ID capture for native codex resume. |
| Ship `/ask-gpt` skill at `~/.claude/skills/ask-gpt/` | **YES, LIVE** | Visible in skill list. Any session can invoke. |
| Use OpenAI API key path instead | **NO** | API path costs per token. ChatGPT-account auth is free up to plan limits. |
| Pursue ChatGPT-website scraping (Cloudflare-fight) for "MY ChatGPT" | **NO** | Tried, blocked by anti-bot fingerprint mismatch. codex CLI is the canonical answer for "use Zaal's ChatGPT." |
| Build a multi-turn loop pattern documented for skills | **YES** | 3-pass minimum (kick off, challenge, synthesize) - documented in skill. |

## What Got Shipped (Live 2026-04-29)

### 1. Wrapper: `~/bin/zao-ask-gpt.sh`

Three modes:

```bash
# One-shot: fresh log per topic
~/bin/zao-ask-gpt.sh <topic-slug> "<prompt>"

# Multi-turn: reads last 200 log lines, prepends as context, sends new question
~/bin/zao-ask-gpt.sh <topic-slug> --resume "<follow-up>"

# Show: print full Q+A log for the topic
~/bin/zao-ask-gpt.sh <topic-slug> --show
```

Internals:
- Calls `codex exec --skip-git-repo-check -` with prompt via stdin
- Strips codex metadata (model, session id, tokens used) and returns just the model answer
- Logs Q+A to `~/.zao/gpt-loop/<topic>.log` with UTC timestamps
- Captures codex session id to `~/.zao/gpt-loop/<topic>.sid` (future hook for native codex resume)
- Permissions: `~/.zao/` is `chmod 700`, log files fall back to umask defaults

### 2. Skill: `~/.claude/skills/ask-gpt/SKILL.md`

Frontmatter triggers Claude to use it for:
- "Ask GPT what they think of X"
- "Get a second opinion from ChatGPT"
- "Loop with GPT on X"
- During `/zao-research`: cross-validate findings
- During `/plan-eng-review` or `/plan-ceo-review`: third voice

Per-platform routing: skill explicitly NOT for ZAO-specific context (Claude has ZAO memory; GPT does not unless we feed it inline).

### 3. Live Tests Passed (2026-04-29)

| Test | Input | GPT Output |
|---|---|---|
| Identity | "What's your model name?" | "I'm Codex, based on GPT-5..." |
| Math | "What is 2+2?" | "4" |
| Memory via `--resume` | "What was my previous question?" | "Your previous question was: 'What is 2+2?'" |

Session ID `019dd99f-d299-7363-819b-3d6c642f5f14` captured in test run.

## The Learning Loop Pattern (3-Pass Minimum)

Codified in the skill body:

```
Pass 1 - Kick off:
  /ask-gpt <slug> "Question: <X>. Context: <ZAO context inline since GPT
  has no ZAO memory>. What's your initial take?"

Pass 2 - Challenge:
  Read GPT's answer. Find weakest claim. Push back via --resume.
  /ask-gpt <slug> --resume "On point Y you assumed Z. Is that true given <data>?"

Pass 3 - Synthesize:
  /ask-gpt <slug> --resume "Given the above, what would you do if you were
  building this for ZAO (188-member Farcaster music community on Base)?"
```

After each pass Claude (me) reads the answer + ZAO research/memory and decides:
- Accept (record in research doc) → Stop
- Challenge again → Pass N+1
- Switch direction → New Pass 1 with restated question

The log file is the **shared persistent context**. Future Claude sessions read via `--show`.

## Topic Slug Discipline

| Slug | Use for |
|---|---|
| `zaostock-pitch` | Sponsor outreach copy, 1-pager critique, ticket-tier pricing |
| `zao-music-strategy` | Cipher release plan, distribution choices |
| `wavewarz-design` | Prediction market mechanics, artist signal scoring |
| `zoe-architecture` | Brand-bot fleet, knowledge-layer structure (Doc 563 Ronin pattern) |
| `agent-stack` | QuadWork vs 1code vs DevFleet (Doc 555) |
| `dev-research-<topic>` | One-off |

Rules:
- Kebab-case
- One slug per ongoing thread
- Don't reuse slugs for unrelated topics — context will mix
- After productive loop, save memory `project_gpt_loop_<slug>.md` so future sessions know it happened

## Why This Pattern Works (Non-Obvious Wins)

1. **Free at usage levels Zaal hits.** ChatGPT Plus/Pro is one fixed monthly cost; the loop costs $0 incremental. API path would burn $1-10 per long research thread.
2. **GPT brings different priors.** Different training data, different model family, different default biases. Catches Claude's blind spots.
3. **Persistent log = audit trail.** Useful for ZAO research docs that cite "GPT cross-validation per ~/.zao/gpt-loop/<slug>.log".
4. **No new infrastructure.** codex CLI was already installed for QuadWork (memory `project_vps_skill`).
5. **Aligns with `feedback_prefer_claude_max_subscription`.** Same philosophy applied to ChatGPT side.

## Risks + Mitigations

| Risk | Mitigation |
|---|---|
| ChatGPT Plus/Pro plan rate limit hit | Watch `chatgpt.com` usage; back off if hit |
| codex CLI updates break wrapper | Pin codex version in `~/.codex/config.toml`; re-test on update |
| Log files leak sensitive context | `~/.zao/` is `chmod 700`; never commit to git |
| GPT and Claude converge on wrong answer | Cross-reference both against ZAO memory + grounding research before acting |
| Topic slug collision | Skill enforces "one thread per slug"; rename if needed |

## Cross-Refs

- Memory `project_ask_gpt_loop_live.md` - install state + test verification
- `~/bin/zao-ask-gpt.sh` - implementation source
- `~/.claude/skills/ask-gpt/SKILL.md` - skill definition
- `~/.codex/auth.json` - codex auth state (DO NOT commit)
- Doc 555 - agent harness shootout (1code, QuadWork, etc.)
- Doc 562 - Reddit/X scraping meta-eval (sister "fix the gap" doc)
- Doc 564 - Reddit/X scraping FIXED implementation
- `everything-claude-code:agent-eval` - related "head-to-head agent comparison" pattern
- `feedback_prefer_claude_max_subscription` - same philosophy applied here

## Action Bridge

| Action | Owner | Type | Status |
|---|---|---|---|
| Build `~/bin/zao-ask-gpt.sh` | This session | Script | **DONE** |
| Build `/ask-gpt` skill | This session | Skill | **DONE + visible in skill list** |
| Test end-to-end (one-shot + resume) | This session | Verify | **DONE** |
| Save memory `project_ask_gpt_loop_live.md` | This session | Memory | **DONE** |
| Add this doc to research lib | This session (Doc 565) | Doc | **DONE (this doc)** |
| Add `~/.zao/` to `.gitignore` defensively in any ZAO repo that might pick it up | Zaal | One-shot | This week |
| Run first real ZAO loop (e.g. ZAOstock pitch sanity-check via GPT) | Zaal or this session | Spike | When ready |

## Sources

- codex CLI v0.124.0, login state "Logged in using ChatGPT"
- Live test transcripts captured in this session
- Memory `feedback_prefer_claude_max_subscription` (canonical philosophy)

## Staleness

Re-validate after any codex CLI major version bump. Pricing/quotas at ChatGPT plan level can change quarterly; verify monthly if usage grows.
