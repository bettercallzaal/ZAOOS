---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-05-20
related-docs: 684
tier: STANDARD
---

# 687 - Claude Code Workflow + Context-Engineering Patterns (Community, May 2026)

> **Goal:** Identify the cross-cutting practice that makes Claude Code reliable at scale, by synthesizing 5 independently-discovered community findings.

## Key Decisions (DO THIS)

| # | Decision | Why |
|---|----------|-----|
| 1 | ADOPT the multi-file context system (CLAUDE.md + STATE.md + journal + backlog) in ZAOOS root | Anurag's 4-file system reduced context-reset overhead from 15-20min per session to 0. Apply at project level, per-session, across agent loops. Already in ZAOOS CLAUDE.md (partial). |
| 2 | ADD "Fail Loud" (Rule 12) to ZAOOS CLAUDE.md explicitly | Silent failures + incomplete migrations buried bugs 11 days. Mandate: surface uncertainty, don't hide it. Add to API routes + agent output validation. |
| 3 | ENFORCE "Checkpoint after every significant step" (Rule 10) in QuadWork agent loop + Hermes fix-PR pipeline | 6-step refactor broke on step 4; agent completed steps 5-6 on broken state. Add checkpoint verification between phases. |
| 4 | USE html/presentation-layer artifacts instead of markdown/text-only for final deliverables | 117 upvotes consensus: markdown is draft-ready; html is delivery-ready. Apply to bot outputs, ZOE post previews, Hermes PR summaries. |
| 5 | ADD "Read Before Write" (Rule 8) gate to symbol insertion in Serena workflows | Duplicate function precedence via import order broke 6-month-old source of truth. Mandatory: search exports + callers before adding. |
| 6 | ADOPT 12-rule CLAUDE.md ceiling at 200 lines total; compliance drops past it, errors drop from 11% to 3% | Karpathy's 4 rules achieved 41->11% error reduction; 12 rules achieves 11->3%. More rules = lower compliance. Hard cap at 200 lines. ZAOOS is at ~120 lines; add 7-12, 8, 10, 12 by Sept. |

## Source Items (from ZOE inbox)

1. **r/ClaudeCode "built a claude code plugin for capturing ideas"** (2 upvotes, 1 comment)
   - Core claim: Mid-task context switching loses ideas; solved with `claude-stash` plugin that formalizes the manual note-file pattern
   - URL: https://www.reddit.com/r/ClaudeCode/comments/1thh501/built_a_claude_code_plugin_for_capturing_ideas/

2. **r/vibecoding "stop rebriefing your AI every session - the 4-file system"** (67 upvotes, 33 comments)
   - Core claim: Context resets cost 15-20min per session. Fix: CLAUDE.md + STATE.md + journal + backlog in repo. Non-technical founder (Anurag, 50) built OTTASIA (33-market streaming platform) entirely via Claude Code using this system
   - URL: https://www.reddit.com/r/vibecoding/comments/1tg3182/stop_rebriefing_your_ai_every_session_the_4file/

3. **r/ClaudeCode "the biggest Claude Code workflow upgrade I made"** (117 upvotes, 29 comments)
   - Core claim: Shift from markdown/CSV/text outputs to polished standalone HTML deliverables. Transforms AI output from draft-ready to delivery-ready
   - URL: https://www.reddit.com/r/ClaudeCode/comments/1tf4exz/the_biggest_claude_code_workflow_upgrade_i_made/

4. **GitHub cuzzo/clear "how to vibe-code something that actually works"** (15 stars, Ruby)
   - Core claim: LLMs write code "sort of works." Need signal diversity: design docs + code + unit tests + integration tests + fuzz tests + mutation tests + tooling + multi-LLM review/convergence. 7 layers minimum
   - URL: https://github.com/cuzzo/clear/blob/master/docs/retrospective/how-to-vibe-code-something-that-actually-works.md

5. **r/AskVibecoders "Karpathy's CLAUDE.md cuts Claude mistakes to 11%. Here are the 8 rules that get it to 3%"** (1126 upvotes, 70 comments)
   - Core claim: 4 original rules (Karpathy) achieved 41->11% error reduction across 30 codebases in 6 weeks. Adding 8 more (Rules 5-12) drops errors further to 3%. Hard ceiling at 200 lines or compliance drops
   - URL: https://www.reddit.com/r/AskVibecoders/comments/1ta7yr8/karpathys_claudemd_cuts_claude_mistakes_to_11/

## Findings

### Cross-Cutting Pattern: "Context Discipline" (NOT Better Models)

All 5 items independently agree: **The bottleneck isn't AI capability. It's context architecture.** Better results come from:

1. **Persistent, checked-in context** (not session-transient): CLAUDE.md + STATE.md + journal survive context resets
2. **Explicit rules that fit in memory**: 12 rules at 200-line ceiling beats 30 scattered guidelines
3. **Fail-loud, not silent**: Surface uncertainty instead of hiding bugs or skipped rows
4. **Signal diversity for verification**: 7 test layers + design + code + multi-LLM convergence beats single-pass trust
5. **Artifact-level hygiene**: Final deliverable format (html vs markdown) matters as much as the content

### Finding Table

| Pattern | Evidence | Quantitative Impact | Risk if Ignored |
|---------|----------|---------------------|-----------------|
| **Persistent multi-file context** | Anurag's 4-file system (CLAUDE.md + STATE.md + journal + backlog) | 15-20min context reset overhead -> 0min per session | New sessions lose domain decisions; re-briefing tax grows exponentially |
| **Standing rules in CLAUDE.md** | Karpathy: 4 rules -> 41% to 11% errors; 12 rules -> 11% to 3% errors over 30 codebases, 6 weeks | Errors drop 73% with 4 rules; 73% again with 8 more (Rule 5-12) | Compliance drops >200 lines; silent failures increase; precedent conflicts unresolved |
| **Explicit failure modes (fail loud)** | Rule 12 case: DB migration skipped 14% of records silently, found 11 days later | Silent skip -> buried bug cost = 11 days of production breakage | Incomplete work ships; logs written but not surfaced; constraint violations invisible |
| **Checkpoint gates between phases** | Rule 10 case: 6-step refactor broke step 4; steps 5-6 applied to broken state | Agent blindly continues -> cascading errors | Multi-step agents compound errors exponentially |
| **Presentation-layer investment** | 117-upvote consensus: HTML (summary+sections+expandable detail+confidence tags) vs markdown | Same content, different format = moves perception from "draft" to "delivery ready" | AI output stays internal; stakeholders need manual reformatting (time tax) |
| **Signal diversity for verification** | cuzzo/clear: 7 independent layers (design + code + unit + integration + fuzz + mutation + tooling) | Each layer catches what others miss; multi-LLM convergence = lower hallucination risk | Single-pass LLM output = untested bugs ship; metrics gaming hides real problems |

## ZAO Application

### QuadWork (Local 4-Agent Dev Team)
- **Add Rule 10 (Checkpoint)** to agent loop: after design phase, after each implementation phase, before PR. Serialize to `STATE.md` so agent 2 can pick up context
- **Add Rule 12 (Fail Loud)** to acceptance criteria: "If any step partially fails, surface it. Don't report 'done' if anything was skipped"

### ZOE (Telegram Concierge Bot)
- **Adopt html artifact output** for weekly summaries, brief output, multi-section recalls. Current markdown text-only -> render to html view with expandable sections
- **Implement STATE.md** at bot/src/zoe/ to track in-flight tasks across DM sessions. Session resets should read latest STATE.md, not re-ask

### Hermes (Fix-PR Pipeline: Coder + Critic + Auto-PR)
- **Add Rule 8 (Read Before Write)** gate: coder phase must search for existing patterns before generating new code
- **Add Rule 10 checkpoint** between coder + critic phase. Critic should validate against design doc before suggesting fixes

### ZAOOS CLAUDE.md (Root)
- Current: ~120 lines, covers API routes, components, TypeScript, tests, secret hygiene
- Add by Sept 2026: Rule 5 (judgment-calls-only), Rule 7 (surface conflicts), Rule 10 (checkpoints), Rule 12 (fail loud)
- Keep total under 200 lines. Project-specific rules in subdir CLAUDE.md files (.claude/rules/*.md already exists)
- **Example new entry**: "Rule 10 - Checkpoints: Major milestones (design done, routes shipped, tests green) must be checkpointed to STATE.md with: what works, what's verified, what's next"

### Research Library
- Link doc 687 in ZAOOS CLAUDE.md as authoritative source for "why these 12 rules"
- Keep cuzzo/clear retrospective link in /dev-workflows index - it's the canonical "how to verify LLM code actually works"

## Sources

- [r/vibecoding: Anurag's 4-file context system (67 upvotes)](https://www.reddit.com/r/vibecoding/comments/1tg3182/stop_rebriefing_your_ai_every_session_the_4file/)
- [r/AskVibecoders: Karpathy's 12-rule CLAUDE.md template (1126 upvotes)](https://www.reddit.com/r/AskVibecoders/comments/1ta7yr8/karpathys_claudemd_cuts_claude_mistakes_to_11/)
- [r/ClaudeCode: HTML deliverable outputs over markdown (117 upvotes)](https://www.reddit.com/r/ClaudeCode/comments/1tf4exz/the_biggest_claude_code_workflow_upgrade_i_made/)
- [GitHub cuzzo/clear: Signal diversity for vibe-code verification](https://github.com/cuzzo/clear/blob/master/docs/retrospective/how-to-vibe-code-something-that-actually-works.md)
- [r/ClaudeCode: claude-stash plugin for mid-task idea capture](https://www.reddit.com/r/ClaudeCode/comments/1thh501/built_a_claude_code_plugin_for_capturing_ideas/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add Rule 5, 7, 10, 12 to ZAOOS CLAUDE.md (~4 new lines per rule) | Zaal/Claude | Config | By Sept 2026 |
| Create bot/src/zoe/STATE.md template (in-flight tasks per session) | Claude | Code | By June 15 2026 |
| Implement html artifact output in ZOE post-draft + brief commands | Claude | Code | By June 15 2026 |
| Add checkpoint validation to Hermes fix-PR pipeline (coder->critic phase gate) | Claude | Code | By July 1 2026 |
| Document "Rule 10 checkpoints" as comment-block in QuadWork agent loop | Claude | Code | By July 1 2026 |
| Create docs/guides/context-discipline-playbook.md (1-pager for new contributors) | Claude | Docs | By Aug 1 2026 |

