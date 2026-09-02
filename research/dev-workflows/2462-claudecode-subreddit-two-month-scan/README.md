---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-09-02
superseded-by:
related-docs: "2459, 2460, 2448, 2282, 2317"
original-query: "lets /zao-research this add it to our log and then just review the top 50 posts in the past 2 months"
tier: STANDARD
---

# 2462 - What r/ClaudeCode actually says, measured over 60 days

> **Goal:** Mine the r/ClaudeCode subreddit for practice worth adopting, now that the browser route has unblocked reddit, and report honestly what proportion of it is signal.

**Reddit was unblocked the same day.** Every headless route is still dead -
`--selftest` on 2026-09-02 reported creds absent, token endpoint 401, public
`.json` returning `text/html`, and 0 of 3 redlib instances answering. But
Claude-in-Chrome drives a real logged-in browser, which solves the JS challenge
the way a person does. Method is recorded in the `zao-research` skill.

## Key Decisions

| # | Decision | Reason |
|---|---|---|
| 1 | **ADOPT `MISTAKES.md`.** One file, one line in CLAUDE.md, no tooling. Append what happened / root cause / consequence / the rule that prevents a repeat, newest first. | The single highest-value item in 60 days of the subreddit (1,006 points, 179 comments). It is also the exact gap ZAOOS doc 2459 named in this estate: `zao-selftest` verifies tooling and nothing verifies whether a lane's CLAIM is true. On 2026-09-02 alone this lane misdiagnosed `zao-doc-next` as unbroken, published that correction, and then found the real cause a day later - a countable pattern no file was counting. |
| 2 | **The graduation rule is the point, not the log.** When the same failure appears four or five times it stops being a mistake and becomes a law in CLAUDE.md. | The author's own line: *"MISTAKES.md is where evidence accumulates; CLAUDE.md is where it gets enforced."* Without it you have a vague sense that an area is flaky rather than a countable pattern with a fix. This also answers doc 2459's finding that our skills grow without bound - entries LEAVE the log when they graduate. |
| 3 | **Fire the check from a hook, not from hope.** | The sharpest comment (52 points) reports skills that fire via hooks after every spec, plan and implementation, checking the current work against past errors: *"has caught so many fuck ups."* The top-voted reply asks the obvious question - what would ever make Claude look at the file - and a hook is the only answer that does not depend on the model remembering. |
| 4 | **Do NOT treat this subreddit as a technique source.** Mine it for warnings, not for practice. | Measured below: 5% of 60 days of top posts carry a Tips or Tutorial flair. The modal post is a joke. |

## Findings

### Finding 1 - The subreddit is mostly not about technique

245 posts scored inside the 60-day window (oldest 2026-07-04), pulled from the
month and year top listings and deduplicated. Flair distribution:

| Flair | Posts | Share |
|---|---|---|
| Humor | 65 | 27% |
| Discussion | 62 | 25% |
| Built with Claude | 25 | 10% |
| Rant | 22 | 9% |
| Help/Question | 17 | 7% |
| News/Updates | 15 | 6% |
| Bug / Issue | 13 | 5% |
| **Tips & Workflows** | **12** | **5%** |
| Meta | 7 | 3% |
| **Tutorial / Guide** | **4** | **2%** |
| Megathread, Resource, Showcase | 1 each | - |

**Humor plus Rant is 36% of the top of this subreddit; Tips plus Tutorial is
7%.** Eight of the ten highest-scoring posts overall are jokes or complaints.
That is not a criticism of the community - it is a statement about what to
expect from it, and it means a scan like this returns roughly sixteen posts
worth opening out of 245.

### Finding 2 - MISTAKES.md, and why it is more than a diary

The setup, per the author, is trivial: a `MISTAKES.md` in the repo and one line
in CLAUDE.md instructing the agent to log mistakes there with what happened,
root cause and prevention. No plugin, no vector store.

Two effects he reports, and the second is the one that matters:

1. **The agent reaches for it.** He sees reasoning like "this approach was
   avoided because it caused XYZ before, as documented in MISTAKES.md."
2. **The knowledge leaves the log.** Repeat entries graduate into hard rules, so
   the file stops being a diary and becomes something the agent points at.

The 134-point top comment is the failure it fixes, and it is uncomfortably
familiar: an agent making the same mistake again and explaining, in the same
breath, that it had told itself not to because it broke something before - and
did it anyway.

### Finding 3 - The other twelve worth opening

| Score | Comments | Date | Post |
|---|---|---|---|
| 1,112 | 133 | 08-30 | Tip: instantly save 10k tokens on every new session |
| 1,007 | 179 | 08-13 | MISTAKES.md - the one adopted above |
| 542 | 101 | 08-12 | My Claude Code workflow after months of daily use |
| 406 | 114 | 08-23 | Why every AI-coded site looks the same, and how to fix it |
| 280 | 29 | 08-13 | A two-page printable Claude Code cheat sheet |
| 222 | 68 | 08-13 | Fixing Claude's communication style |
| 208 | 34 | 08-15 | A guide to the multi-agent workflows I use every day |
| 190 | 25 | 08-08 | Hooks are the one feature worth learning |

The 208-point multi-agent guide and the 190-point hooks post are the two most
relevant to this estate after MISTAKES.md, and neither was read in full here -
see Sources.

### Finding 4 - What the Bug/Issue and Rant flairs are for

Thirteen Bug/Issue posts and 22 Rants in 60 days, and the highest-scoring
non-humor posts across the whole window are failures rather than techniques:
`rm -rf` destroying a machine (3,271 points, 483 comments) and a data-loss
thread (1,790 points, 683 comments).

**That is the subreddit's real value to us: it is an early-warning surface, not
a workshop.** A destructive-action report with 483 comments is worth more to an
estate with a `no-rm-rf` rule than any workflow post.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Create `MISTAKES.md` in zao-vault seeded with the three failures measured on 2026-09-02, and add the one-line instruction to CLAUDE.md - shipped when the file exists and CLAUDE.md names it | @Zaal | PR to zao-vault | 2026-09-04 |
| Add the graduation rule to the vault README: a failure appearing 4+ times leaves MISTAKES.md and becomes a rule - shipped when the README states the threshold | @Zaal | PR to zao-vault | 2026-09-04 |
| Read the two unread posts in full (multi-agent workflows 1vphazv, hooks 1vh...) and fold anything real into the lane docs - shipped when both are marked FULL in a follow-up | @Zaal | Research | 2026-09-09 |
| Decide whether a PreToolUse hook should check MISTAKES.md before destructive actions, per the 52-point comment - shipped when the hook exists or the decision is recorded against it | @Zaal | Decision | 2026-09-09 |

## Also See

- [Doc 2459](../2459-handoff-artifacts-that-get-consumed/) - named the verification gap this doc's Decision 1 fills
- [Doc 2460](../2460-obsidian-dual-reader-vault/) - the render-time rule
- [Doc 2282](../../business/2282-reddit-as-oss-outreach-channel/) - the doc that recorded reddit as unreachable; the browser route supersedes its conclusion for READING, not for posting

## Sources

- [r/ClaudeCode top listings, 60-day window](https://www.reddit.com/r/ClaudeCode/top/?t=month) `[FULL - METHOD: Claude-in-Chrome real browser, /top.json?t=month and t=year paginated, deduplicated by post id, filtered to created_utc within 60 days]` 245 posts. All counts in Finding 1 are from this pull, 2026-09-02.
- [MISTAKES.md post, 1w51... id 1vn6d5r](https://www.reddit.com/r/ClaudeCode/comments/1vn6d5r/) - 1,006 points, 179 comments, 2026-08-13. `[FULL - METHOD: same browser route, thread .json parsed in page, selftext and top 4 comments read]`
- [The sqlit workflow post, id 1w51sws](https://www.reddit.com/r/ClaudeCode/comments/1w51sws/) - 19 points, 4 comments. `[FULL - same method]` The thread Zaal sent that opened this scan; written up separately in `zao-vault/notes/sqlit-vibe-coding-workflow-2026-09-02.md`.
- 10k-token tip (id 1w2ja43), multi-agent workflows guide (1vphazv), hooks post - `[PARTIAL - METHOD: title, score, comment count and date read from the listing JSON; bodies NOT read. The in-page fetch was blocked mid-scan by a cookie/query-string guard and I did not work around it.]` Listed in Finding 3 with their scores so a follow-up knows exactly what is unread.
- `zao-fetch-reddit.sh --selftest`, 2026-09-02 `[FULL]` - the headless ladder is still dead; this doc's access came from the real browser only.
