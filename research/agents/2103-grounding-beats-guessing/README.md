---
topic: agents
type: guide
status: research-complete
last-validated: 2026-07-28
related-docs: 928, 2094, 2095
original-query: "Grounding beats guessing - the verify-not-trust discipline that keeps an AI assistant useful vs confidently wrong. This session's wins all came from verification: reading PRs against actual diffs not summaries, catching a sibling terminal's false '0 unbranded' claim (56 still were), catching a Craig recording that duplicated an existing doc, refusing to invent an entity's identity until confirmed. Research the practice and fold into ZAO's anti-fabrication rules."
tier: STANDARD
---

# 2103 - Grounding Beats Guessing - the verify-not-trust discipline

> **Goal:** Codify why an AI assistant's real value is verification against source truth (not fluent output), with the ZAO session evidence + the external literature, and fold it into the existing anti-fabrication rules.

## Key decisions (do this)

1. **Never report a claim you have not checked against its source.** A PR is judged by its diff, not its summary. A "done" is judged by the artifact, not the report. A sibling agent's status is judged by the live DB, not its message.
2. **Separate drafting from verifying.** Generate the answer, then independently fact-check it with narrow questions - this is Chain-of-Verification, and it measurably cuts hallucination (F1 +23%, 0.39 -> 0.48 on closed-book QA). The draft is a hypothesis; verification is a separate act.
3. **Close the loop with objective ground truth wherever it exists.** typecheck, test, build, a live DB query, a `gh` diff, a file read. Anthropic's rule: "the more you can close the loop with automated, objective verification, the more reliably your agent will perform."
4. **Grade down under uncertainty, never up.** If a source is PARTIAL or an owner is ambiguous, say so. A plausible-sounding fabrication is worse than a blank because it reads as fact later.
5. **A stale local view is not ground truth.** The working tree, a cached doc, a summary from three turns ago - re-fetch origin/main / re-read the file before acting on it.

## The ZAO case study (first-party evidence, 2026-07-28 session)

Every win this session came from verifying instead of trusting - and each would have shipped a confident error otherwise:

| What was claimed | What verification found | How it was caught |
|---|---|---|
| Sibling cowork terminal: "0 unbranded tasks, default applied" | 56 tasks still unbranded - the default never ran | Queried the live Supabase `tasks` table directly |
| Iman's 4 PRs (via screenshots/summaries) | Read each diff - 2 merge-ready, 1 needed a follow-up, 1 was a draft | `gh pr view --json` on the actual diffs, not the summaries |
| "Process the Jose Craig recording as a new meeting" | It duplicated an already-merged doc (2061) | Grepped `git log` + research/ before spending 800MB of transcription |
| "Who is James / jim_ccc?" | Unknown - refused to invent an identity | Entity cross-check returned no hit; waited for Zaal to confirm (Meme for Trees, COC member) |
| Aziz transcript ready to commit | Contained a board password Zaal read aloud | Standalone secret scan on the staged diff before commit -> redacted |
| Local working tree said "next doc = 2061" | origin/main was at 2102; 2061 would collide with the Jose doc | Scanned origin/main in a fresh worktree, not the stale checkout |

The through-line: the assistant's edge is not fluent output (the model is always fluent). It is **being right**, and being right comes from checking the source, not from confidence.

## Why this works (the literature)

- **Chain-of-Verification (CoVe, Dhuliawala et al. 2023).** Four steps: draft a baseline answer, plan verification questions, answer each question *independently*, regenerate the final answer from the verified facts. The mechanism: "the individual verification questions are answered more accurately than in the original long-form answer" - narrow focused questions elicit more reliable responses than one big generation. Separating the draft from the fact-find prevents the draft's bias from contaminating the check. Measured: F1 +23% on closed-book QA; beats zero-shot, few-shot, and chain-of-thought on list generation. Caveat: reduces, does not eliminate, hallucination - especially in reasoning steps.
- **Anthropic, Building Effective Agents.** "During execution, it's crucial for the agents to gain 'ground truth' from the environment at each step (such as tool call results or code execution) to assess its progress." The verification loop is the reliable feedback signal that lets an agent self-correct rather than guess. Reserve agents for tasks you can't hardcode but *can verify* (coding agents with tests, computer-use with screenshots). Add human checkpoints + stopping conditions (max iterations) to bound compounding error.
- **Grounding = connecting output to external data.** Fact-checking against verifiable sources instead of internal guesses; the strongest implementations extract structured claims and produce tiered accept/flag/reject decisions with evidence chains.

## How this folds into ZAO's existing rules

This is not new - it names and reinforces discipline already in the repo:

- **`.claude/rules/anti-fabrication.md`** (7 rules): subagents don't write repo files; findings need evidence or an UNVERIFIED label; the orchestrator re-checks high-stakes claims; grade down; never invent numbers/URLs; distinguish done-from-planned. This doc is the *why* behind that rule.
- **`.claude/rules/agent-loops.md`**: rule 1 (ground truth over confidence - done only when typecheck/build/tests are green), rule 3 (read live code before building - "code is ground truth; docs are aspirational"), rule 26 (`git fetch origin main` before a worktree - a stale ref caused a false-fail), rules 33-36 (verify subagent claims; a verifier that can't run its checker has NOT verified - a missing tool is not a pass).
- **`feedback_research_recs_are_not_facts`**, **`feedback_no_synthesis_from_titles`**, **`feedback_no_sub_agent_context_fabrication`** in memory: the same discipline at the memory layer.

The one behavioral addition: **verification is cheap relative to being wrong.** A `gh pr view`, a DB query, a `git log` grep costs seconds; a confidently-wrong report costs Zaal's trust and a cleanup. Default to the check.

## Also See

- [Doc 928](../928-agent-loop-best-practices/) - agent loop operating rules (rule 1/3 are the seed of this)
- [Doc 2094](../../security/2094-integrity-audit/) - integrity audit where verification turned "1 critical + 3 high" into 0+1
- [Doc 2095](../../security/2095-security-audit/) - security sweep, same verify-down pattern

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add a "Grounding beats guessing" section to `.claude/rules/anti-fabrication.md` citing CoVe + the ground-truth rule | @Zaal | PR | 2026-08-04 |
| Build the ZOE auto-review loop (read Iman's PR diff -> board verdict, no prompt) - the verify-then-report pattern as a standing loop | @Zaal | Bot task | 2026-08-08 |
| Adopt "channel-first, board-first, verify-always" as the standing operating default (memory: feedback_board_first_channel_first) | @Zaal | Done | 2026-07-28 |

## Sources

- [Chain-of-Verification Reduces Hallucination in LLMs (Dhuliawala et al., arXiv 2309.11495)](https://arxiv.org/pdf/2309.11495) [FULL - abstract + method + results]
- [Chain-of-Verification (CoVe) - Learn Prompting](https://learnprompting.org/docs/advanced/self_criticism/chain_of_verification) [FULL - 4 steps, separation rationale, F1 +23% (0.39->0.48)]
- [Building Effective AI Agents - Anthropic](https://www.anthropic.com/engineering/building-effective-agents) [FULL - ground-truth-from-environment, verification loop, checkpoints, stopping conditions]
- [Demystifying evals for AI agents - Anthropic](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) [PARTIAL - verifiers from exact-match to Claude-as-judge, via search result]
- First-party: this repo's `.claude/rules/anti-fabrication.md`, `.claude/rules/agent-loops.md` (rules 1, 3, 26, 33-36), 2026-07-28 session [FULL]
