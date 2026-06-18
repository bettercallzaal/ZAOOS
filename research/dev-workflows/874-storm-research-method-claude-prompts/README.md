---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-06-17
superseded-by:
related-docs: "873, 693, 660"
original-query: "reconstruct the 4 prompts from the STORM repo (from the @heynavtoor X article 'The Stanford STORM Method: How to Make Claude Research Like a PhD in Minutes')"
tier: STANDARD
---

# 874 - The STORM Research Method: 4 Claude Prompts (Reconstructed from the Stanford Repo)

> **Goal:** Turn the viral @heynavtoor X article into 4 paste-ready Claude prompts, each grounded in the ACTUAL Stanford STORM source code, not paraphrased from the post. Plus an honest map of what is faithful to the repo and what the article added on top.

## TL;DR

STORM (Stanford OVAL Lab, NAACL 2024) is a real, open-source, MIT-ish research pipeline. Its core trick is **multi-perspective question asking**: instead of one prompt, you spin up several expert personas, have them interrogate the topic, then synthesize. The paper reports a **25% absolute gain in "organized" ratings and 10% better breadth** vs an outline-driven RAG baseline. The X article compresses STORM into 4 Claude prompts. Three of them (perspectives, conversation, synthesis) map cleanly onto real STORM source signatures. The 4th (peer review) is the article's own addition - STORM's paper explicitly flags that it does NOT self-critique. The reconstructed prompts below are grounded in the repo's `dspy.Signature` docstrings.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **USE the 4-prompt STORM workflow for any ZAO research task that needs depth fast** | Paper-validated: 25% more organized, 10% broader than single-pass RAG. ~5 min, no tooling. Folds directly into `/zao-research` STANDARD-tier prep and ZOE's recall/brief flow (`bot/src/zoe/`). |
| 2 | **Prompts 1-3 are faithful to the repo; trust them** | Each maps to a real STORM `dspy.Signature`: `GenPersona`, `AskQuestionWithPersona`, `WritePageOutlineFromConv` + `WriteLeadSection`. Wording adapted from "Wikipedia editor" to "researcher" but the mechanics are the source's. |
| 3 | **Prompt 4 (peer review) is an EXTENSION, not from STORM - keep it anyway** | STORM's own abstract names two unfixed weaknesses: source-bias transfer and over-association of unrelated facts. STORM does not self-critique. The article's 4th prompt patches exactly that gap. Useful, but label it honestly: it is not "the Stanford method," it is a sensible add-on. |
| 4 | **DO NOT trust STORM/the 4 prompts for verbatim facts without a source pass** | HN consensus (thread 41553875, 145 pts) + the paper agree: hallucination + citation misassociation are the real risks. The method organizes thinking; it does not guarantee true facts. Always verify claims against sources (this is why Prompt 4 exists). |
| 5 | **For one-off heavy research, the hosted tool beats the prompts** | `storm.genie.stanford.edu` is free, no signup, does the full retrieval + citation loop (70,000+ users). The 4 prompts win when you want it INSIDE a Claude thread you are already working in. |

## The 4 Reconstructed Prompts

Run in order, same Claude thread, each builds on the last. Replace `{TOPIC}`.

### Prompt 1 - Multi-Perspective Scan
*Grounded in STORM `GenPersona` (knowledge_storm/storm_wiki/modules/persona_generator.py): "select a group of editors... each represents a different perspective, role, or affiliation... for each, add a description of what they will focus on."*

```
I'm researching the topic below. Select a group of 5 expert researchers who will
work together to build a comprehensive understanding of it. Each represents a
different perspective, role, or affiliation related to the topic - for example a
hands-on practitioner, a skeptic who thinks the field is wrong, an economist who
follows the incentives, a historian who has seen the pattern before, and an
academic who has read the actual studies. Adapt the five roles to fit THIS topic.

For each expert: give a one-line summary of who they are, then have them give their
single most important take on the topic from their angle - the thing the other four
would most likely miss.

Topic: {TOPIC}
```

### Prompt 2 - Contradiction Map
*Grounded in STORM `AskQuestionWithPersona` + `ConvSimulator` (knowledge_curation.py): persona-guided question asking where each perspective interrogates the topic to surface what single-pass research misses.*

```
Using the 5 expert perspectives above, map where they DISAGREE.

For each point of conflict:
1. State the disagreement in one line.
2. Name which experts are on each side and why each believes what they do.
3. Say what evidence would settle it.

Then flag two special cases:
- Where all 5 agree (likely true, low-risk).
- Where NONE of them addressed something important (a blind spot in the whole field).

Do not smooth over conflicts into false consensus. The fights are where the real
understanding lives.
```

### Prompt 3 - Synthesis
*Grounded in STORM `WritePageOutlineFromConv` (outline_generation.py) + `WriteLeadSection` (article_polish.py): improve an outline using the information-seeking conversation; lead section is a concise sourced overview, max 4 paragraphs, with inline citations.*

```
Now synthesize everything above into a single research briefing on {TOPIC}.

Structure it like this:
1. A concise lead section (max 4 paragraphs): what the topic is, why it matters,
   the most important points, and the prominent controversies.
2. A sectioned outline of the key findings (use "#" for sections, "##" for
   subsections), each grounded in the perspectives and contradiction map above.
3. For every major claim, mark how reliable it is: [all perspectives agree],
   [contested], or [single source].
4. End with ONE specific, actionable recommendation that accounts for every angle.

Where you used a fact that came from a source, add an inline citation.
```

### Prompt 4 - Peer Review  *(extension - NOT in the STORM repo; fills the self-critique gap the paper names)*

```
Now act as a hostile peer reviewer of the briefing you just wrote.

Grade your own work:
1. Which claims are strong (well-supported from multiple angles)?
2. Which claims are weak (one source, or inferred, or could be wrong)?
3. Where did source bias or fact-misassociation likely sneak in?
4. What angle or perspective is still missing entirely?
5. If a real domain expert read this, what would make them roll their eyes?

Be harsh. Do not defend the work. Output an honest reliability verdict at the end:
what to trust, what to verify before using.
```

## Faithfulness Map (article prompt -> real STORM source)

| Article prompt | STORM stage | Repo file + signature | Faithful? |
|----------------|-------------|------------------------|-----------|
| 1. Multi-perspective scan | Perspective discovery | `persona_generator.py` -> `GenPersona`, `FindRelatedTopic` | YES - core mechanic |
| 2. Contradiction map | Multi-perspective Q&A / simulated conversation | `knowledge_curation.py` -> `AskQuestionWithPersona`, `ConvSimulator`, `AskQuestion` | PARTIAL - STORM asks questions to gather info; "find contradictions" is the article's reframing of the same multi-angle pass |
| 3. Synthesis | Outline-from-conversation + lead writing | `outline_generation.py` -> `WritePageOutlineFromConv`; `article_polish.py` -> `WriteLeadSection` | YES - outline format + lead-section rules are the source's |
| 4. Peer review | (none) | not in repo | NO - extension. STORM abstract explicitly lists source-bias + fact over-association as UNSOLVED. STORM has no self-critique stage. |

## Findings

- **STORM = Synthesis of Topic Outlines through Retrieval and Multi-perspective Question Asking.** Stanford OVAL Lab, presented at NAACL 2024 (Poster Session 2, June 17 2024). Repo: `github.com/stanford-oval/storm`. Live free tool: `storm.genie.stanford.edu` (70,000+ users per the README).
- **The headline numbers are real and verified in the paper abstract** (arxiv 2402.14207): "25% absolute increase in articles deemed organized" and "10% improvement in breadth of coverage," both measured against an outline-driven retrieval-augmented baseline. The X article quotes these accurately.
- **The article's stated weakness fix is accurate.** The paper names exactly two limitations from expert Wikipedia-editor feedback: source-bias transfer and over-association of unrelated facts. Prompt 4 targets these. But note: the paper offers these as OPEN problems, not as something a single "grade your own work" prompt fully solves.
- **The literal 4 prompt texts were NOT in the X Article body.** Pulled the full article via FxTwitter (81 draft-js blocks, no login - see doc 873): the prose describes what each prompt does, but the actual prompt code blocks render empty in the API payload. This reconstruction is therefore built from the STORM SOURCE CODE, which is the more reliable seed anyway.
- **Community signal is skeptical of the OUTPUT, not the method.** HN thread 41553875 (145 points, 30 comments): top concerns are hallucination ("ask an LLM what color the sky is...") and that generated articles sit in "uncanny valley" with weak citations. Nobody disputes the multi-perspective framing; they dispute trusting the result without verification. This validates keeping Prompt 4 and a human source-check.

## Also See

- [Doc 873](../../cross-platform/873-best-free-way-read-x-article/) - how the article body was pulled free (FxTwitter), the seed for this doc
- [Doc 693](../693-zao-research-fetch-quality-audit/) - fetch-quality gate; the source-verification discipline Prompt 4 mirrors
- [Doc 660](../660-x-content-extraction-v2/) - X content extraction chain

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add the 4-prompt STORM block to `/zao-research` STANDARD-tier prep (optional pre-step before fetching) | @Zaal | Skill edit | Next skill pass |
| Test the 4 prompts on one live ZAO research topic, compare depth vs current flow | @Zaal | Todo | This week |
| Consider a ZOE "/storm <topic>" shortcut that runs all 4 in sequence (`bot/src/zoe/`) | @Zaal | Bot task | If prompts prove out |

## Sources

- [Seed X Article - @heynavtoor "The Stanford STORM Method"](https://x.com/heynavtoor/status/2067194761446920264) [FULL - 81 blocks pulled via FxTwitter; prompt code blocks empty in payload, prose read in full]
- [STORM repo - persona_generator.py / knowledge_curation.py / outline_generation.py / article_polish.py](https://github.com/stanford-oval/storm) [FULL - all 4 dspy.Signature prompt files read from raw.githubusercontent main]
- [STORM README](https://github.com/stanford-oval/storm/blob/main/README.md) [FULL - venue NAACL 2024, demo URL, 70,000+ users, pipeline stages]
- [STORM paper abstract (arxiv 2402.14207)](https://arxiv.org/abs/2402.14207) [FULL - confirms 25% organized / 10% breadth + named limitations: source bias, fact over-association]
- [Hacker News thread 41553875 "STORM: Get a Wikipedia-like report on your topic" (145 pts, 30 comments)](https://news.ycombinator.com/item?id=41553875) [FULL - community source, hallucination + citation skepticism]
