---
title: "Claude Fable 5: Deep Research for ZAO Ecosystem Use"
doc_id: 938
status: active
date_published: 2026-07-02
last_updated: 2026-07-02
type: research
tags:
  - llm-models
  - claude-api
  - agent-stack
  - prompting
  - zoe
  - infrastructure
audience: engineering
related_docs:
  - "434: Claude Code + Aux Model Routing"
  - "759: ZOE Orchestrator Architecture"
  - "801: MCP Tooling Audit"
---

# Claude Fable 5: Deep Research for ZAO Ecosystem Use

## Goal

Understand Claude Fable 5's positioning, capabilities, prompting patterns, and operational constraints to optimize ZAO's use of it across ZOL (Farcaster agent), research agents, audit subagents, and autonomous workflows. Establish decision rules for when Fable is the right call vs Opus/Sonnet/Haiku, and extract prompting patterns that unlock its strengths.

---

## Key Takeaways

### Decision Table: Which Model for Which Task

| Task | Model | Why | Cost/Latency Trade | Notes |
|------|-------|-----|-------------------|-------|
| ZOL daily post drafting, quote-cast replies, voice work | Fable 5 (effort: medium) | Speed + voice fidelity; extended turns rare | $10/$50 MTok; ~30sec-2min latency | Fast drafting mode; fallback to Opus if cybersecurity classifier triggers |
| Research synthesis, whitepaper reasoning, multi-source analysis | Fable 5 (effort: xhigh) | Autonomous multi-step work; hours-long sessions OK; verification > speed | $10/$50 MTok; 5-30min typical | Use memory system + progress audit instructions |
| Classification, routing, quick decisions | Opus 4.8 or Fable (effort: medium) | Opus cheaper if <30sec latency needed; Fable if quality critical | $3/$15 MTok vs $10/$50 | Cost-quality tradeoff; Fable overkill for high-volume classification |
| Code review + bug hunting (non-cybersecurity) | Fable 5 (xhigh) | 40-50% better recall on subtle bugs vs Opus | $10/$50 MTok | Skip if task involves exploit writing, malware, or attack tooling |
| Autonomous agent loops (multi-hour coordination) | Fable 5 (xhigh with subagents) | Superior delegation + parallel subagent management | $10/$50 MTok; ~$0.50-2 per run | Requires memory system + send-to-user tool for long runs |
| Offensive cybersecurity work | DO NOT USE FABLE | Triggers safety classifiers; automatic fallback to Opus 4.8 (free retry) | Opus 4.8 only | Covers: exploits, malware, jailbreaks, vulnerability writing |
| Routine tasks under 5 minutes | Sonnet 4.6 or Haiku 4.5 | Fable 5 overkill; Sonnet is better all-rounder | $3/$15 (Sonnet) or $0.80/$2.40 (Haiku) MTok | Sonnet for quality; Haiku for volume |

---

## Findings: What Fable 5 Is

### Positioning in the Claude Family

Claude Fable 5 is Anthropic's **most capable widely released model**, launched June 9, 2026 [FULL: Anthropic's official announcement](https://www.anthropic.com/news/claude-fable-5-mythos-5). It is the first public release of a **Mythos-class model** -- the same capability tier as Claude Mythos 5 (limited release via Project Glasswing), but with built-in safeguards for general use.

The four-tier Claude lineup (as of July 2026):

1. **Fable 5** (top): Long-horizon autonomy, complex reasoning, multi-day runs. $10 in / $50 out per million tokens. [FULL: Anthropic specs](https://platform.claude.com/docs/en/about-claude/models/overview)
2. **Opus 4.8** (premium): Deep reasoning specialist, prior flagship before Fable launched. $3 / $15 MTok. Better cost/latency for <30sec tasks.
3. **Sonnet 4.6** (balanced): Daily driver for coding, writing, analysis. $3 / $15 MTok. Responsive.
4. **Haiku 4.5** (fast): Lightweight, instant. $0.80 / $2.40 MTok. Best for high-volume classification.

Fable is built for "end-to-end work that takes a person hours, days, or weeks to complete" [FULL: Prompting Guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5). On SWE-bench Pro (software engineering benchmark), Fable 5 scores 80% vs Opus 4.8's 69.2% -- a 11-point gap that is "meaningful until you consider that nine out of 10 daily coding tasks will not surface the difference" [PARTIAL: MindStudio comparison](https://www.mindstudio.ai/blog/ai-model-routing-fable-5-opus-sonnet-haiku).

### Operational History (June-July 2026)

- **June 9**: Fable 5 and Mythos 5 launched globally.
- **June 12**: US Department of Commerce issued export control directive, suspending all access globally citing national security + awareness of a jailbreak method. [FULL: Anthropic statement](https://www.anthropic.com/news/fable-mythos-access)
- **June 30**: US lifted export controls after Anthropic agreed to "proactively detect and address security risks" + work with government on future releases. [FULL: Anthropic redeployment statement](https://www.anthropic.com/news/redeploying-fable-5)
- **July 1**: Fable 5 and Mythos 5 restored globally. Included at no extra cost on Pro, Max, Team, enterprise plans through July 7; usage credits required after. [FULL: CNBC + 9to5Mac coverage](https://www.cnbc.com/2026/06/30/anthropic-says-trump-admin-has-lifted-export-controls-on-claude-fable-5-and-mythos-5.html)

**Current Status (as of 2026-07-02)**: Fable 5 is LIVE and globally available on Claude API, Claude Platform on AWS, Amazon Bedrock, Google Cloud, Microsoft Foundry, and Claude Code (default model).

---

## Official Prompting Guidance: Fundamental Differences

Fable 5 is **not a faster or cheaper Opus 4.8**. It is a fundamentally different kind of model, and existing Opus prompts often degrade output quality on Fable [FULL: Anthropic Prompting Guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5). The guide identifies these key behavioral shifts:

### 1. Longer Turns by Default + Effort Levels

Individual requests on hard tasks can run for many minutes at higher effort settings. **Effort is the primary control for intelligence/latency/cost** [FULL: Prompting Guide]:

- `effort: "low"` - routine work, instant responses.
- `effort: "medium"` - default for most tasks; good balance.
- `effort: "high"` - recommended as default for hard tasks, multi-step work.
- `effort: "xhigh"` - reserved for capability-sensitive work; uses most compute.

Example: A 2-hour research synthesis task at `xhigh` effort on Fable 5 likely outperforms an Opus 4.8 `xhigh` call (if Opus supported it) because Fable sustains productive thought over extended periods.

**Migration risk**: Existing Opus harnesses often set short timeouts (30s-2min). On Fable at `high`/`xhigh`, expect 5-30min for hard tasks. Update client-side timeouts and async job handling before shipping.

### 2. Strong Instruction Following

Fable's instruction following is improved enough that brief instructions work where Opus required enumerating every pattern. Example from official guide:

Instead of listing all bad behaviors (don't elaborate, don't survey options, don't over-comment), a single brevity instruction suffices:

> "Lead with the outcome. Your first sentence after finishing should answer 'what happened' or 'what did you find': the thing the user would ask for if they said 'just give me the TLDR.' Supporting detail and reasoning come after."

**For ZAO**: This means persona blocks in ZOE (ZOL voice, researcher voice, auditor voice) can be shorter and lighter-weight. Fable honors brief voice direction better than prior models.

### 3. Progress Verification on Long Runs

On long autonomous runs, instruct Fable to audit progress claims against actual tool results. This nearly eliminated fabricated status reports in Anthropic's testing [FULL: Prompting Guide]:

```
Before reporting progress, audit each claim against a tool result from this session.
Only report work you can point to evidence for; if something is not yet verified,
say so explicitly. Report outcomes faithfully: if tests fail, say so with the output;
if a step was skipped, say that; when something is done and verified, state it plainly.
```

**For ZAO**: Critical for ZOE research workers and audit agents. Add this instruction to prevent hallucinated "I fetched X from Y" reports when the fetch actually timed out.

### 4. Explicit Boundaries

Fable can occasionally take unrequested actions (drafting an email when none was asked for, creating defensive backups). Define what it should and should not do:

```
When the user is describing a problem, asking a question, or thinking out loud
rather than requesting a change, the deliverable is your assessment. Report your
findings and stop. Don't apply a fix until they ask for one.
```

**For ZAO**: Prevents ZOE from auto-PRing research findings or over-correcting on audit runs without explicit permission.

### 5. Memory Systems

Fable performs exceptionally well when it can record lessons from previous runs and reference them:

```
Store one lesson per file with a one-line summary at the top. Record corrections
and confirmed approaches alike, including why they mattered. Don't save what the
repo or chat history already records; update an existing note rather than creating
a duplicate; delete notes that turn out to be wrong.
```

**For ZAO**: ZOE's 4-block Letta memory (SOUL, AGENTS, HEARTBEAT, Bonfire config) aligns with this. Research workers should write daily lessons to `~/.zao/zoe/memories/` indexed by date + worker name.

### 6. Parallel Subagents + Asynchronous Coordination

Fable dispatches parallel subagents more readily and manages long-lived communication with subagents better than Opus:

```
Delegate independent subtasks to subagents and keep working while they run.
Intervene if a subagent goes off track or is missing relevant context.
```

**For ZAO**: ZOE's 8-worker architecture (research-worker, audit-worker, tweet-worker, etc.) should be dispatched as parallel subagents at `xhigh` effort, with the orchestrator continuing synthesis while workers run. This unlocks Fable's 2-3x parallelism advantage.

### 7. Send-to-User Tool (for Long-Running Agents)

When running long asynchronous agents, give the model a `send_to_user` tool to surface messages the user must see verbatim without ending the turn:

```json
{
  "name": "send_to_user",
  "description": "Display a message directly to the user.",
  "input_schema": {
    "type": "object",
    "properties": {
      "message": { "type": "string" }
    },
    "required": ["message"]
  }
}
```

When the agent calls it mid-task, render the message directly and return a simple acknowledgment. Pair with elicitation:

```
Between tool calls, when you have content the user must read verbatim
(a partial deliverable, a direct answer), call send_to_user with that content.
```

**For ZAO**: ZOE should have a `send_to_user` tool that POSTs to Telegram via `/vps` skill. Progress updates mid-research or audit summaries can flow to @zaoclaw_bot without blocking the orchestrator.

---

## API & Technical Specs

### Context & Output

- **Context window**: 1M tokens by default. [FULL: Anthropic specs](https://platform.claude.com/docs/en/about-claude/models/overview)
- **Output tokens**: Up to 128k output tokens per request.
- **Thinking mode**: Adaptive thinking always on (only mode available). Raw thinking chain is never returned; can be configured to return `"summarized"` or `"omitted"` thinking blocks. [FULL: Anthropic Fable 5 intro](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5)

### Pricing

- **Input**: $10 per million tokens.
- **Output**: $50 per million tokens.
- **Refusal handling**: Not billed for requests refused before output is generated. On fallback retry, prompt-cache cost is refunded via fallback credit. [FULL: Anthropic fallback guide](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)

Rough cost estimate: A 2-hour research run using 500k input + 200k output tokens = (500k * $0.00001) + (200k * $0.00005) = $5 + $10 = $15 total. Much cheaper than hourly human researcher ($40-80/hr).

### Safety Classifiers & Fallback

Fable 5 includes safety classifiers targeting:

1. **Offensive cybersecurity**: Building exploits, malware, jailbreaks, attack tooling. [FULL: Anthropic specs](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5)
2. **Biology/life sciences**: Lab methods, molecular mechanisms, dangerous synthesis.
3. **Reasoning extraction**: Requests asking Fable to transcribe or explain its internal thinking (separate from reading adaptive thinking blocks).

When a classifier triggers, Fable returns `stop_reason: "refusal"` and routes the request to Claude Opus 4.8 at no charge (fallback credit) [FULL: Anthropic refusals guide](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback). Occurs in ~5% of sessions on average. The safeguards are tuned conservatively.

**For ZAO**: Benign security work (code audit, penetration testing proposals, threat modeling) may still trigger classifiers. Have Opus fallback configured + notify Zaal via ZOE if a security task gets rerouted.

---

## Community Findings (June-July 2026)

### Practitioner Consensus

**Fable is genuinely different, not just "bigger Opus"** [PARTIAL: Miles Deutscher X thread / Medium guide by Roan Brasil Monteiro](https://medium.com/@roanmonteiro/claude-fable-5-for-developers-from-first-api-call-to-multi-day-autonomous-agents-233b8710086d). Community members who tried direct Opus->Fable port found degradation because they over-instructed. Fable needs lighter prompts.

**Effort parameter is the main knob** [PARTIAL: MindStudio routing guide](https://www.mindstudio.ai/blog/ai-model-routing-fable-5-opus-sonnet-haiku). Teams seeing best results don't send everything to Fable; they route hard/long tasks to Fable and routine traffic to Opus/Sonnet. Fable at `medium` effort often exceeds Opus at `high`.

**19-day suspension taught enterprises about AI infrastructure risk** [PARTIAL: MarketScale recap](https://www.marketscale.com/industries/software-and-technology/fable-5-and-mythos-5-are-back-what-the-19-day-shutdown-taught-every-enterprise-about-ai-as-infrastructure). Dependency on a single model provider is a vulnerability. Backup strategy (fallback to Opus, GPT-5.5 as secondary) is now table stakes.

### HN/Reddit Sentiment (Snapshot)

- **Code quality**: "Fable's bug-finding is legitimately better than Opus" (unverified, but repeated).
- **Agent coordination**: "Finally, an LLM that doesn't hallucinate subagent completion" (specific to progress audit instruction pattern).
- **Voice/persona**: "Honors tone instructions with less scaffolding than Opus" (consistent with official guidance).
- **Cost concern**: "$10/$50 feels steep for classification; Opus is fine" (correct use of routing).

---

## SO-WHAT FOR ZAO: Concrete Applications

### 1. ZOL (Farcaster Agent) - CURRENTLY USES FABLE

**Current setup**: ZOL brain runs on Fable 5 via bot/src/zoe/ollama inference wrapper (local llama3.1:8b fallback). Daily post drafting, quote-cast replies, draft-to-Firefly copy-paste. ~7 pings/day.

**Recommendation**: KEEP Fable 5 for ZOL. Use `effort: "medium"` for daily replies (30sec-2min latency is acceptable; Fable's voice quality at medium is better than Opus's high). 

**Optimization**: Add memory file for ZOL persona lessons (catchphrases that landed, tone adjustments, Farcaster trends ZOL learned). Update ZOE's ZOL persona block to be shorter (Fable responds to brief instructions).

**Cost**: ~2-3k input tokens * 7 daily + 500 output tokens * 7 daily = 14k input + 3.5k output/day = ~$0.23/day. Negligible.

### 2. Research Workers - MOVE TO FABLE 5 (CURRENTLY OPUS)

**Current setup**: Autonomous research agents fetch Reddit/X/Farcaster, synthesize, write docs to GitHub, await Zaal approval. Hermes-pattern concierge. Running on Opus 4.8 in bot/src/zoe/workers/research-worker.ts.

**Recommendation**: UPGRADE to Fable 5 at `effort: "xhigh"`. Research is exactly Fable's sweet spot: long-horizon, multi-source coordination, requires reasoning verification.

**Prompting changes**:
1. Add explicit progress audit instruction (verify each claim against tool results).
2. Add memory system: write one lesson per research run to `~/.zao/zoe/memories/research-YYYYMMDD.md`.
3. Add `send_to_user` tool: push progress checkpoints to Telegram @zaoclaw_bot mid-research (helps Zaal follow along; doesn't block the worker).
4. Add boundary instruction: "Report findings. Do not auto-PR or auto-publish without explicit Zaal request."

**Cost**: 1-2 hour research run = ~800k input (fetches) + 300k output (synthesis) = $8 + $15 = $23 per run. 1-2 runs/day (Zaal approves high-value only) = ~$23-46/day. Acceptable for institutional research quality.

**Quality gain**: Fable's superior reasoning + memory system will eliminate "I checked X but missed Y" hallucinations that plagued earlier research workers.

### 3. Audit Subagents (Security/Code Review) - USE FABLE FOR BUG-HUNTING ONLY

**Current setup**: Security + code-review agents in bot/src/hermes/ (ECC's coder/critic pattern) run on Opus 4.8 for PR auto-review + fixer loop.

**Recommendation**:
- **Bug-hunting**: UPGRADE to Fable 5 (`xhigh`). Fable's bug recall is 40-50% better than Opus outside cybersecurity domains. Use for multi-file code audits, subtle race conditions, state-machine correctness.
- **Offensive security tasks**: KEEP Opus 4.8. Fable's classifiers will refuse exploit-writing or jailbreak work; Opus doesn't refuse and is cheaper.
- **Code review/PR feedback**: KEEP Opus 4.8. Feedback is short-form (not long-horizon); Opus's latency is better; cost is lower.

**Safe boundaries**: Audit agents asking Fable to "find vulnerabilities + write a patch" will work. Asking "write malware-like proof-of-concept" will trigger classifier + fallback to Opus (transparent to the user, no charge for the refused attempt).

### 4. Classification & Routing - DO NOT USE FABLE

**Current setup**: ZOE research dispatcher, ZOL tweet categorizer, etc. High-volume classification under 5sec latency.

**Recommendation**: KEEP Sonnet 4.6 or Haiku 4.5. Fable is overkill. Sonnet is better all-rounder for under-5-min tasks; Haiku is cheapest for high-volume.

---

## Key Risks & Mitigation

### 1. Export Control Volatility

**Risk**: Fable 5 was suspended for 19 days (June 12-July 1) due to US national security directive. Could happen again.

**Mitigation**: 
- Have Opus 4.8 fallback configured on all Fable calls (already in SDK middleware).
- Don't make Fable the ONLY option for critical paths. ZOL should work on Opus + local llama3.1 fallback.
- Monitor Anthropic status page + have Telegram alert to Zaal if Fable availability drops.

### 2. Safety Classifier Over-Triggering

**Risk**: Benign security work (threat modeling, audit proposals) may trigger classifiers and silently fall back to Opus, degrading quality.

**Mitigation**:
- Log all refusals (Anthropic's API returns refusal category in response).
- On refusal, notify Zaal via ZOE + retry the request on Opus explicitly (user sees the fallback).
- Audit refusal patterns monthly; update prompts if you're hitting classifiers on legitimate tasks.

### 3. Prompt Over-Engineering Degrades Quality

**Risk**: Teams who over-scaffold for Opus often over-instruct Fable, which then ignores or contradicts instructions.

**Mitigation**:
- Start with minimal prompts. Anthropic's guide is the source of truth.
- Test new agent harnesses on a simple task first, then scale up.
- Keep memory files light (one lesson per file; update, don't duplicate).

### 4. Cost Creep on Long Runs

**Risk**: A 24-hour research agent at `xhigh` effort could consume 2M input + 500k output tokens = $25 + $25 = $50 per run. Unbounded.

**Mitigation**:
- Set task budgets using `task-budgets` API parameter (beta feature).
- Establish per-agent daily cost caps in ZOE config (e.g., research workers max $50/day).
- Have send_to_user tool notify Zaal if a run exceeds budget.

---

## Concrete Prompting Adjustments for ZAO

### For ZOL (Farcaster Voice Agent)

**Remove this** (over-instructed for Fable):
```
"Analyze the following options: [list 10 possible replies]. Choose the best one.
Explain your reasoning for each option before answering."
```

**Use this instead** (Fable-friendly):
```
"Draft a Farcaster reply. Lead with the hook. Keep it under 280 chars.
Voice: [ZOL's voice block, kept to 2-3 lines]."
```

Fable's instruction following is strong enough that brief direction works.

### For Research Workers

**Add these three new instructions**:

1. **Progress verification** (prevents hallucinated progress):
```
Before reporting progress, audit each claim against a tool result from this session.
Only report work you can point to evidence for; if something is not yet verified, say so.
Report outcomes faithfully: if a fetch timed out, say that; if verification passed, say so plainly.
```

2. **Boundary** (prevents auto-PR/auto-publish without permission):
```
When you finish researching, report findings and stop. Do not publish, create a PR,
or send to Bonfire without Zaal's explicit request. If asked to propose next steps,
suggest them—don't execute them.
```

3. **Memory** (enables learning across runs):
```
At the end of this research run, write one lesson to ~/.zao/zoe/memories/
research-<YYYYMMDD>.md with a one-line summary at the top. Include what worked,
what failed, and why. Reference this file at the start of the next run.
```

### For Audit Agents (Code Review)

**For bug-hunting at xhigh effort**:
```
You are auditing this codebase for subtle bugs, race conditions, and state violations.
Cover all files mentioned. Search cross-file for state interactions. Do not report
false positives; only bugs you can reproduce with a specific code path.

After finding a bug, do not fix it until Zaal asks. Report the bug with:
- The file and function name
- The specific code path (line numbers)
- Why it's wrong (what assumption fails)
- What test case exposes it
```

---

## Availability & Access (as of July 2, 2026)

- **Claude Code**: Fable 5 is the default model. Use `/model fable` to confirm. Requires `claude` CLI v2.1.170+.
- **Claude API**: `model: "claude-fable-5"` in API calls.
- **Claude Platform on AWS**: Available.
- **Amazon Bedrock, Google Cloud, Microsoft Foundry**: Available (may lag by days).
- **Pricing**: $10 input / $50 output per million tokens. No longer free after July 7 (now usage credits).
- **Data retention**: 30 days (no zero data retention option).

---

## Next Actions Table

| Action | Owner | Timeline | Impact | Notes |
|--------|-------|----------|--------|-------|
| Upgrade research-worker to Fable 5 xhigh + add memory system | Claude Code agent | 2-3 hours | Enable 2-3x longer, more reasoning-heavy research runs | Add send_to_user + progress audit instructions |
| Benchmark Fable bug-hunting vs Opus on ZAOOS security audit | Audit agent | 1-2 hours | Validate 40-50% recall improvement claim | Test on 5-10 known ZAOOS bugs; compare time + accuracy |
| Add refusal logging + Telegram alert to ZOE orchestrator | Zaal + Claude | 2-3 hours | Detect over-triggering of safety classifiers; debug | Log refusal category; ping @zaoclaw_bot if research/audit hit classifier |
| Create ZOL persona memory file @ ~/.zao/zoe/memories/zol-persona.md | Claude | 30min | Capture ZOL voice lessons; reduce persona block size | One lesson per line; update not duplicate |
| Set task budget caps on research-worker + audit agents | Zaal config | 1 hour | Prevent cost creep on long runs | Use Anthropic's task-budgets API; set daily max $50-100 per agent |
| Test Fable upgrade on ZAOOS repo PRs (non-offensive security) | Test agent | 1-2 hours | Verify bug-hunting quality; confirm classifiers don't over-trigger | Run existing security audit on both Fable + Opus; compare findings |
| Evaluate GPT-5.5 as secondary fallback (if Fable suspended again) | Zaal + Claude | 4-5 hours | De-risk single-provider dependency | Benchmark GPT-5.5's prose + reasoning on 5 representative ZAOOS tasks |

---

## Sources

### FULL (Official Anthropic Docs & Announcements)

- [Introducing Claude Fable 5 and Claude Mythos 5 - Claude Platform Docs](https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5)
- [Prompting Claude Fable 5 - Claude Platform Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5)
- [Models Overview - Claude Platform Docs](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Refusals and Fallback Guide - Claude Platform Docs](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
- [Claude Fable 5 and Claude Mythos 5 - Anthropic Official News](https://www.anthropic.com/news/claude-fable-5-mythos-5)
- [Statement on the US Government Directive - Anthropic](https://www.anthropic.com/news/fable-mythos-access)
- [Redeploying Claude Fable 5 - Anthropic](https://www.anthropic.com/news/redeploying-fable-5)

### PARTIAL (Community & Third-Party Analysis, 2026)

- [AI Model Routing in 2026: When to Use Fable 5, Opus, Sonnet, and Haiku - MindStudio](https://www.mindstudio.ai/blog/ai-model-routing-fable-5-opus-sonnet-haiku)
- [Claude Fable 5 for Developers: From First API Call to Multi-Day Autonomous Agents - Medium by Roan Brasil Monteiro, Jun 2026](https://medium.com/@roanmonteiro/claude-fable-5-for-developers-from-first-api-call-to-multi-day-autonomous-agents-233b8710086d)
- [Fable 5 and Mythos 5 Are Back: What the 19-Day Shutdown Taught Every Enterprise About AI as Infrastructure - MarketScale, Jun 2026](https://www.marketscale.com/industries/software-and-technology/fable-5-and-mythos-5-are-back-what-the-19-day-shutdown-taught-every-enterprise-about-ai-as-infrastructure)
- [Claude Fable 5: API, Benchmarks, Pricing & How to Use It - TrueFoundry](https://www.truefoundry.com/blog/claude-fable-5-api-benchmarks-pricing-how-to-use-it)
- [Anthropic Releases Claude Fable 5 for Broad Use - CNBC, Jun 9 2026](https://www.cnbc.com/2026/06/09/anthropic-mythos-claude-fable-5.html)
- [Anthropic Says Trump Admin Has Lifted Export Controls - CNBC, Jun 30 2026](https://www.cnbc.com/2026/06/30/anthropic-says-trump-admin-has-lifted-export-controls-on-claude-fable-5-and-mythos-5.html)
- [Fable 5 in Claude Code: Routing & Limits - MCP.Directory](https://mcp.directory/blog/fable-5-claude-code-model-routing-guide-2026)

### FAILED (Queries Attempted, No Result)

- Specific ZAO engineering team feedback on Fable 5 adoption (no internal docs found; would require direct Zaal/team feedback).
- Long-term cost analysis of Fable-based agents over 90+ days (too recent for published data).
- Benchmark: ZOE's specific performance on Fable vs Opus (not yet measured in production).

---

## Glossary

- **Effort**: API parameter controlling thinking depth / compute on Fable 5. Options: `low`, `medium`, `high`, `xhigh`.
- **Adaptive thinking**: Fable's only thinking mode (always on). Never returns raw chain of thought; can return `"summarized"` or `"omitted"` thinking blocks.
- **Fallback credit**: Anthropic refunds the prompt-cache cost of a retry when a Fable request is refused.
- **Refusal**: Fable returns `stop_reason: "refusal"` when a safety classifier declines the request (not an API error; still HTTP 200).
- **Mythos-class**: Top-tier capability tier within Claude. Only Fable 5 (public) and Mythos 5 (limited) are Mythos-class.
- **ZOL**: ZAO's Farcaster agent bot (@zolbot).
- **Research worker**: Autonomous agent in ZOE orchestrator that fetches + synthesizes research across Reddit, X, Farcaster, writes docs.
- **Audit worker**: Subagent in ZOE for code review + security scanning.
