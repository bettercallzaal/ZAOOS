---
topic: agents
type: audit
status: research-complete
last-validated: 2026-09-28
superseded-by:
related-docs: "agents/2293-andrew-ng-graph-engineering-evaluation, agents/2068-ai-graph-frameworks-borrow-not-adopt, agents/2131-loop-vs-graph-engineering, agents/798-bonfire-graph-quality-audit"
original-query: "Can u /zao-research https://x.com/res1dualedge/status/2104300857928098075/video/1?s=46"
tier: STANDARD
---

# 2573 - The "Andrew Ng graph engineering course" is the 2024 LangGraph short course, re-cut

> **Goal:** Find out what the viral "Andrew Ng just dropped the best 2-hour course on Graph Engineering" video actually is, correct doc 2293 which stated it as fact, and say what The ZAO should take from the real course.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **The video is NOT a new Andrew Ng course.** It is the DeepLearning.AI short course "AI Agents in LangGraph" (instructors Harrison Chase of LangChain and Rotem Weiss of Tavily; Ng hosts the intro), published 2024-06-05, re-cut with a "GraphsCourse" watermark, an Ng talk clip in front, and invented chapter titles. | The course page lists it at 1h42m and 9 lessons. The transcript of the downloaded video names the course at 0:03:13: "Welcome to AI Agents in [LangGraph], built in partnership with Langchain and [Tavily]". Frames show the LangChain and DeepLearning.AI slide branding. |
| 2 | **Doc 2293 is superseded by this doc.** It stated "Andrew Ng gave a 2-hour Stanford course (July 2026)" at Confidence 1.0 and graded the video FULL. | It quotes the same five chapter timestamps as this post (9:14, 33:11, 1:02:46, 1:30:15, 1:49:05), and those titles do not match the content (table below). Its own Sources show X reposts and blog summaries; nothing records a transcript. The one "Stanford" in 18,154 transcript words is Ng saying he once gave a demo while "speaking at Stanford". |
| 3 | **USE a mechanism, not a note: a video or audio source may be graded FULL only when its Sources row names a transcript of the source itself, and the check asserts that file exists and is non-empty** (the `zao-assert none` shape: exit 2 on a missing or 0-byte path). | 2293 is the failure `.claude/rules/research-grounding.md` exists to stop: a doc written from what other people said about a source. A rule already existed and did not hold; a refusal in the zao-research gate would. |
| 4 | **SKIP adopting LangGraph. BORROW four patterns from the real course** (checkpoint per step, interrupt before sensitive nodes, a revision cap, a written routing table). | Doc agents/2068 already ruled borrow-not-adopt. The course content is sound and maps onto what the lanes already run; the gaps are small and specific (section "What to borrow"). |

## Findings

### What the post claims vs what is in the video

Post text (fetched with `zao-fetch-x.sh`, fxtwitter tier, 2026-09-28): "Andrew Ng just dropped the best 2-hour course on Graph Engineering: from single agent to full automation", with five chapter marks. Counts at fetch time: 3,393 likes, 32 replies, 1,438,229 views. Posted 2026-09-27 20:03 UTC by @res1dualedge.

The video file (1,125,504,033 bytes, 6,746 s = 1h52m26s) was downloaded from the post's own media URL and transcribed locally with whisper-large-v3-turbo.

| Post's chapter | What the transcript says at that mark |
|---|---|
| 9:14 "your first agent" | End of the course intro ("from deeplearning.ai ... we don't want to keep those agents waiting"), then the LangGraph components lesson. The from-scratch agent lesson starts later, at 44:13. |
| 33:11 "loop engineering" | Human-in-the-loop code: an input box asking whether to proceed, "try adding different places to interrupt". |
| 1:02:46 "graph engineering" | The Persistence and Streaming lesson opening: "two really important concepts, persistence and streaming". |
| 1:30:15 "agents that rewrite themselves" | Essay-writer prompts: the critique prompt and the research-query prompt passed to Tavily. |
| 1:49:05 "full graph system" | The LangChain Resources lesson: the supervisor pattern and "flow engineering" from the AlphaCodium paper. |

Phrase counts in the full transcript: "graph engineering" 0, "loop engineering" 0, "rewrite themselves" 0. The lesson order is also shuffled against the course outline (the from-scratch lesson is second on the course page, at 44:13 in the re-cut).

The first 3m13s is an Andrew Ng talk ("Here's why I'm so optimistic about AI"), not part of the course, spliced in front. That clip is why the post can say "Andrew Ng".

Andrew Ng's own announcement of the course is [x.com/AndrewYNg/status/1798378861337723039](https://x.com/AndrewYNg/status/1798378861337723039), posted 2024-06-05 15:38 UTC: "This short course, taught by LangChain @langchain founder Harrison Chase @hwchase17 and @tavilyai founder @weiss_rotem". He announced it; he did not teach it. (Found by the Vault lane, re-fetched here.)

### Why doc 2293 got through

- **It carried Confidence 1.0 while quoting the finding that Confidence 1.0 means nothing.** 2293 cites doc 798's audit, "Every answer in a live session was stamped Confidence: 1.0, including three factually wrong claims", and then rates its own unwatched source at Confidence 1.0. The doc shows the failure while describing it. (Vault lane, 2026-09-28.)
- **Its error was not in the analysis.** Its recommendations about Bonfire provenance tiers stand whether or not Ng made the video. A wrong provenance attached to sound reasoning is the hardest kind to catch, because nothing downstream fails.
- **Its evidence was write-ups ABOUT the video, graded as the video.** X reposts and blog summaries were marked FULL. The refusal in Decision 3 therefore asks for a transcript of the source itself, and checks that the file exists and is non-empty, not just that a path was typed.

### The real course (DeepLearning.AI page, raw HTML, 2026-09-28)

| Field | Value |
|---|---|
| Title | AI Agents in LangGraph |
| Instructors | Harrison Chase (co-founder and CEO, LangChain), Rotem Weiss (co-founder and CEO, Tavily) |
| datePublished | 2024-06-05 |
| Length | 1h42m, 9 video lessons, 6 code examples, 1 graded quiz |
| Level | Intermediate, free to enroll |
| Lessons | Introduction 6m; Build an Agent from Scratch 12m; LangGraph Components 19m; Agentic Search Tools 5m; Persistence and Streaming 9m; Human in the loop 14m; Essay Writer 18m; LangChain Resources 2m; Conclusion 4m |

LangGraph itself, snapshot 2026-09-28 via `gh api`: 42,419 stars, 7,181 forks, last push 2026-09-28. Licence read from the LICENSE file: MIT, "Copyright (c) 2024 LangChain, Inc."

### Community read

Hacker News, "We chose LangGraph to build our coding agent" (83 points, 2025-03-25). The split in the comments is the same as doc 2068's: several commenters call LangChain "a meaningless abstraction" with breaking changes, while others keep LangGraph for one thing, a state machine for human-in-the-loop with time travel ("go back to the way it was before and try again"). One commenter asks what these frameworks add over a durable orchestrator like Temporal. Nobody in the thread argues that graphs replace prompting.

### What to borrow (mapped to the lanes as they run on 2026-09-28)

| Course pattern | Where we are | Delta |
|---|---|---|
| Checkpointer keyed by thread_id; resume from any step | Each lane is a thread. `handoffs/status/<lane>.md` plus the HANDOFF-READY stamp is a hand-written checkpoint, but it is written at compaction time. On 2026-09-28 the Paragraph lane died mid-command at 08:20 with no handoff; its work survived only because it had pushed four seconds earlier. | Append a status line after each merged PR or finished card via `bin/zao-status-append` (dotfiles), so a crash loses a step, not a session. |
| interrupt_before on nodes that act on the world | Present: zao-merge-only-guard, Drafts-only email, never merge Round 5 entries, zao-trash backup-before-delete. | None. Keep every outward, money or delete step as an interrupt. |
| Essay writer: plan, research, generate, reflect, stop at max_revisions | PR fix loops have no cap. | Cap PR fix rounds, then route to Vault. The number comes from measuring how many rounds our PRs take before a clean review (set it just above the 95th percentile), not from the course's essay-writer constant. |
| Supervisor with routing edges | Vault orchestrates; lanes do the work. | One routing table (question type to owning lane) in AGENTS.md. It keys on each lane's live status file, not the registry's status column, which AGENTS.md itself flags as a 2026-09-09 snapshot. Vault owns this. |
| Time travel over state history | zao-trash (#403) now keeps a verified iCloud copy before anything reaches Trash; the vault untracked-file snapshot is built but not scheduled. | Scheduling the snapshot is waiting on Zaal. |

## Also See

- [Doc 2293 - Andrew Ng's Graph Engineering (superseded by this doc)](../2293-andrew-ng-graph-engineering-evaluation/)
- [Doc 2068 - AI graph frameworks: borrow, not adopt](../2068-ai-graph-frameworks-borrow-not-adopt/)
- [Doc 2131 - Loop vs graph engineering](../2131-loop-vs-graph-engineering/)
- [Doc 798 - Bonfire graph quality audit](../798-bonfire-graph-quality-audit/)
- Tracker task research-doc-2131 (done, due 2026-08-01) - Review research doc 2131, loop vs graph engineering

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| zao-research gate refuses a FULL grade on a video or audio source unless its Sources row names an existing, non-empty transcript of the source; shipped when a dotfiles PR adding that check to `claude/skills/zao-research` is merged | zj seat | PR | 2026-10-05 |
| Doc 2293 carries `superseded-by: 2573` and a correction banner; shipped when this PR merges | @Zaal | PR | 2026-09-29 |
| Lanes append a status line per merged PR or finished card through zao-status-append; shipped when AGENTS.md carries the rule and one lane's status file shows per-step lines | Vault | vault commit | 2026-10-05 |
| Measure fix rounds per PR before a clean review across the last 30 days of merged PRs, then set the cap; shipped when the distribution and chosen cap are in a dotfiles PR to zao-merge | zj seat | PR | 2026-10-05 |
| Routing table in AGENTS.md keyed on live lane status files; shipped when committed | Vault | vault commit | Vault reports when it lands (owner's call, 2026-09-28) |

## Sources

| Source | Grade | Method |
|---|---|---|
| [The post, @res1dualedge, 2026-09-27](https://x.com/res1dualedge/status/2104300857928098075) | FULL | `zao-fetch-x.sh`, fxtwitter tier: text, counts and the media URL |
| The post's video, 1h52m26s | FULL | Downloaded from the post's own video.twimg.com URL; transcribed locally with whisper-large-v3-turbo, 18,154 words; six frames read at the chapter marks. Transcript kept at the zj seat's scratchpad as `x-2104300857928098075.transcript.txt` |
| [DeepLearning.AI, AI Agents in LangGraph](https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/) | FULL | `curl -L` plus HTML strip: instructors, length, outline, datePublished |
| [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | FULL | `gh api` for counts; LICENSE file read |
| [HN: We chose LangGraph to build our coding agent](https://news.ycombinator.com/item?id=43468435) | FULL | HN Algolia items API, top-level comments and first replies |
| [Qodo blog post the HN thread links](https://www.qodo.ai/blog/why-we-chose-langgraph-to-build-our-coding-agent/) | FAILED | curl returned HTTP 403; not quoted here |
| [Andrew Ng's announcement, 2024-06-05](https://x.com/AndrewYNg/status/1798378861337723039) | FULL | `zao-fetch-x.sh`, fxtwitter tier |
| [Doc 2293](../2293-andrew-ng-graph-engineering-evaluation/) | FULL | Read from origin/main; its claims checked against the transcript above |
