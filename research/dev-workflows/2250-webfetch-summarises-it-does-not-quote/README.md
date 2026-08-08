---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-08-08
superseded-by:
related-docs: "2246, 2247, 2248, 2249"
original-query: "https://www.reddit.com/r/ClaudeAI/s/3ZLkqxxg6T also research this"
tier: DEEP
---

# 2250 - WebFetch summarises. It does not quote.

> **Goal:** Establish whether Claude Code's `WebFetch` can be cited verbatim, and
> audit whether ZAO's recent research docs quoted from it.

## The claim, and the first-party confirmation

r/ClaudeAI, u/dink_182: *"PSA: Be careful letting Claude use WebFetch for
research."* The post body is `[removed]`, but 40 comments survive and the
subreddit's auto-generated summary states the consensus:

> "The community agrees that Claude's `WebFetch` tool is a trap. **It uses a
> smaller, less reliable model to summarize pages, and that little guy loves to
> make stuff up.** This is likely a major source of the 'Claude is giving me false
> info' posts."

And from u/Chronos79, quoting the original post:

> "So I asked Opus 'are you actually reading these papers?' and it said no - that
> WebFetch uses a smaller, cheaper model and then Opus gets a summary."

**This is not a rumour, and it does not need community consensus to establish.**
The tool's own description, as loaded into this session, says it plainly:

> "Fetches a URL, converts the page to markdown, and answers `prompt` against it
> **using a small fast model**."

So the contract is explicit: **you do not receive the page. You receive a small
model's answer about the page.** Everything downstream - every quote, number, date
and name - is that model's recall of text you never saw.

For a repo whose research rules already say "a cited source is not grounding
unless it was actually fetched and read" (`research-grounding.md`), that is a hole
big enough to drive a fabricated arxiv id through - which is exactly what happened
on 2026-08-03 with four scouts.

## The audit: did ZAO quote from it?

Checked every research doc written in the last two days, since all four contain
verbatim quotations that decisions rest on:

| Doc | Load-bearing source | How it was actually fetched |
|---|---|---|
| 2246 - cross-session messaging | the ClaudeDevs post | **fxtwitter API via curl** - raw JSON |
| 2247 - the CONTRA layer | an X Article, 71 blocks | **fxtwitter API via curl** - raw blocks |
| 2248 - DGCL 251(g) / GameStop | the statute, EDGAR, a Form 425 | **curl + HTML strip**, and EDGAR's JSON API |
| 2249 - CLI messaging vs SSH | the Reddit thread | **arctic_shift via `zao-fetch-reddit.sh`** |

**Zero WebFetch citations. Every verbatim quote came from raw text.**

That result is clean, and it would be dishonest to present it as discipline. It
was habit plus luck: `WebFetch` returned **403** on the SEC's servers, which
forced a fall back to `curl`, and the Reddit/X/Farcaster paths already run through
our own keyless fetchers because Reddit blocks the datacenter IP. **The right
thing happened for the wrong reasons, which is precisely why it needs to be a
rule rather than a habit.**

## What the thread got right beyond the headline

- **"Show your work."** Demand the raw text before any summary or reasoning. A
  model that must paste the source first has far less room to invent it.
- **The subagent version of the same trap.** A subagent asked to "research X and
  report back" returns *its* summary - structurally identical to WebFetch, one
  level up. The stronger pattern from the thread: **have the subagent write the
  raw text to a file and return only the path**, so the main model quotes from
  disk. That maps directly onto `anti-fabrication.md` rule 1 (subagents return
  content; the orchestrator writes and reads back).
- **`curl` is not universal.** It fails on JavaScript-heavy pages. Named
  alternatives: Trafilatura, Firecrawl, Apify. ZAO already has the
  `/browse` skill (Playwright) for that case.

## Where WebFetch is still the right tool

Not banned - scoped. It is genuinely good for:

- **"Does this page exist / what is it broadly about?"** - triage, not citation.
- **Pages behind our own auth** where it works and curl does not, e.g. reading a
  published artifact.
- **A first look** before deciding whether raw extraction is worth it.

The line is simple: **if a sentence in the output will be quoted, contain a
number, or support a decision, it must come from raw text.**

## Decision

1. **Never quote from WebFetch.** Its output is a summary and must be attributed
   as such, or not used.
2. **Load-bearing claims come from raw text**: `curl` plus an HTML strip, an
   official JSON API, or one of ZAO's keyless fetchers - all of which return raw
   by construction.
3. **Mark the fetch METHOD in Sources**, not just FULL/PARTIAL/FAILED. A reader
   cannot otherwise tell whether a quote is verbatim or reconstructed.
4. **Same rule for subagents.** A subagent's prose report is a summary. If its
   specifics matter, it returns a path to raw text.

## Also See

- `.claude/rules/research-grounding.md` - amended by this doc
- `.claude/rules/anti-fabrication.md` - rule 1 (subagents return content, not writes)
- `.claude/rules/state-claims.md` - the same failure applied to repo state
- [Doc 2248](../../business/2248-dgcl-251g-gamestop-holdco/) - the SEC work that got raw text only because WebFetch 403'd

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Amend `research-grounding.md` with the raw-vs-summary distinction. Shipped when the rule file on main says it. | @Zaal | PR | 2026-08-08 |
| Add a `method:` marker to the Sources section of the `/zao-research` template so every citation states how it was fetched. Shipped when the skill file carries it. | @Zaal | PR | 2026-08-12 |

## Sources

- [r/ClaudeAI post 1vim8b7](https://www.reddit.com/r/ClaudeAI/comments/1vim8b7/) - **PARTIAL**. Title and all 40 comments retrieved 2026-08-08 via `zao-fetch-reddit.sh` (arctic_shift) - **raw JSON, not a summary**. The post body itself is `[removed]`; the quotations above are from the surviving comments, including the subreddit's auto-generated consensus summary.
- The `WebFetch` tool description as loaded into this session, 2026-08-08 - **FULL**, first-party. "answers `prompt` against it using a small fast model" is verbatim.
- ZAO research docs 2246, 2247, 2248, 2249 and this session's own fetch commands - **FULL**, first-hand.

**Credit:** u/dink_182 for the original PSA, u/Chronos79 and u/PartySunday for the
model detail, u/DmitryLund for the grounding-discipline rules they shared, and the
r/ClaudeAI thread for the subagent-writes-to-file pattern.
