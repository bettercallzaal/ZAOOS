---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: "2459, 2460, 2448, 2282, 2317, 2373"
original-query: "lets /zao-research this add it to our log and then just review the top 50 posts in the past 2 months"
tier: STANDARD
---

# 2462 - What r/ClaudeCode actually says, measured over 60 days

> **Goal:** Mine the r/ClaudeCode subreddit for practice worth adopting, now that the browser route has unblocked reddit, and report honestly what proportion of it is signal.

**Updated 2026-09-25: the central claim holds, and the top recommendation
already shipped.** `~/zao-vault/MISTAKES.md` exists (196KB, actively written to
as of today), the graduation rule is live in `~/.claude/CLAUDE.md` ("that shape
has graduated, so a new entry prints REPEAT AFTER GRADUATION"), and the
mechanism is documented as its own living doc,
[dev-workflows/2373-zao-mistakes-log](../2373-zao-mistakes-log/). This is not a
small update - the log has grown into the estate's primary failure-tracking
surface, cited directly in CLAUDE.md's global rules. Decisions 1 and 2 below are
confirmed, not just recommended.

**The fetch route in this doc's own text is now dead.** Claude-in-Chrome, the
method this doc was built on, now **refuses reddit.com outright** ("This site is
not allowed due to safety restrictions") - confirmed by the `zao-research` skill
as of 2026-09-19. The working route today is Arctic Shift
(`~/bin/zao-fetch-reddit.sh`, keyless, no browser). Headless credentialed OAuth
is still dead: `--selftest` on 2026-09-25 again reports creds absent, token
endpoint 401, public `.json` walled, 0/3 redlib instances answering - unchanged
from 2026-09-02.

**What could and could not be re-verified this pass:** Arctic Shift's search API
has no score-sort parameter (`sort_type` accepts only `default` or
`created_utc`), so the original 245-post "top of month/year" curated pull
cannot be reproduced by that route, and the browser route that built it is now
blocked. The flair-distribution numbers in Finding 1 and Finding 4 are therefore
**not independently re-measured against the same 60-day window this pass** -
they stand as originally measured, carried forward rather than re-confirmed.
What WAS re-verified: the single highest-value post (MISTAKES.md) is still live
and unchanged in substance (score now reads 780 vs the 1,006 originally
recorded, and 151 comments vs 179 - both explained by Arctic Shift's own
documented archive lag, not a retraction), and two of the three
previously-PARTIAL posts are now fetched FULL (see Sources).

**A genuine fresh spot-check, over a different but real window, confirms the
trend and finds nothing that overturns it.** Since `sort_type=score` does not
exist, this pass built its own top-N by paginating Arctic Shift's
`created_utc`-ordered search across 2026-09-19 through 2026-09-25 (11 pages,
1,096 raw posts, every submission not just Reddit's curated "top") and sorting
client-side. Result: **Tips & Workflows is 1 of the top 40 posts by score in
that window (2.5%)** - if anything thinner than the original 60-day pull's 5%.
The top of the subreddit this week is dominated by **Anthropic's release of
Opus 5.5 around 2026-09-22** (7 of the top 20 posts are News/Updates or
Discussion about it, headed by 2,266-point Humor post "Chad 5.5" and a
1,454-point News/Updates post) - a real event, not a shift in what kind of
content the community rewards. See Finding 5.

## Key Decisions

| # | Decision | Reason |
|---|---|---|
| 1 | **ADOPT `MISTAKES.md`.** One file, one line in CLAUDE.md, no tooling. Append what happened / root cause / consequence / the rule that prevents a repeat, newest first. | The single highest-value item in 60 days of the subreddit (1,006 points, 179 comments). It is also the exact gap ZAOOS doc 2459 named in this estate: `zao-selftest` verifies tooling and nothing verifies whether a lane's CLAIM is true. On 2026-09-02 alone this lane misdiagnosed `zao-doc-next` as unbroken, published that correction, and then found the real cause a day later - a countable pattern no file was counting. |
| 2 | **The graduation rule is the point, not the log.** When the same failure appears four or five times it stops being a mistake and becomes a law in CLAUDE.md. | The author's own line: *"MISTAKES.md is where evidence accumulates; CLAUDE.md is where it gets enforced."* Without it you have a vague sense that an area is flaky rather than a countable pattern with a fix. This also answers doc 2459's finding that our skills grow without bound - entries LEAVE the log when they graduate. |
| 3 | **Fire the check from a hook, not from hope.** | The sharpest comment (52 points) reports skills that fire via hooks after every spec, plan and implementation, checking the current work against past errors: *"has caught so many fuck ups."* The top-voted reply asks the obvious question - what would ever make Claude look at the file - and a hook is the only answer that does not depend on the model remembering. |
| 4 | **Do NOT treat this subreddit as a technique source.** Mine it for warnings, not for practice. | Measured below: 5% of 60 days of top posts carry a Tips or Tutorial flair. The modal post is a joke. |
| 5 | **SKIP `fast-jev-compaction` / `jev-pruner` as a compaction tool.** Do not adopt it in this estate. | The promoting post's own comment section (Finding 5, 2026-09-25 spot-check) reports an independent eval where the tool kept zero of 9,471 tool calls at its default cutoff, with dropped calls disappearing from context with no reliable marker. A tool that can silently drop content from an agent's working context is the opposite of what `~/zao-vault/MISTAKES.md` (Decision 1) exists to prevent. |

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

### Finding 5 - A fresh 6-day spot-check (2026-09-19 to 2026-09-25) confirms the trend and surfaces one new caution

Reddit's own score-sorted "top" listing has no working route right now (browser
route blocked since 2026-09-19, Arctic Shift's search has no score sort). So
this pass built a top-N a different way: paginated Arctic Shift's
`created_utc`-ordered search across r/ClaudeCode for the six days since this
doc's last-validated date, in 11 pages of up to 100, deduplicated by post id -
**1,096 raw posts** (every submission, not Reddit's curated "top" subset - a
different and noisier universe than Finding 1's 245), then sorted client-side
by score.

| Flair (top 40 by score) | Posts | Share |
|---|---|---|
| Discussion | 10 | 25% |
| Built with Claude | 8 | 20% |
| Humor | 7 | 18% |
| News/Updates | 7 | 18% |
| Help/Question | 4 | 10% |
| Meta | 1 | 3% |
| **Tips & Workflows** | **1** | **3%** |
| Anthropic Official | 1 | 3% |
| Bug / Issue | 1 | 3% |

**Tips & Workflows is 1 of the top 40 by score in this window - thinner than
Finding 1's 5% across the full 60-day pull, not richer.** The trend in Key
Decision 4 holds under a genuinely fresh, independently-gathered sample.

**What changed since 2026-09-02: Anthropic shipped Opus 5.5.** The top of the
window is dominated by the launch, first stealth-tested under the codename
`claude-opus-5-5` per a 418-point 2026-09-21 post, officially announced
2026-09-22 (211-point "Anthropic Official"-flaired post, id `1wnecru`). Of the
top 20 posts by score, 7 are News/Updates or Discussion about the release
(headed by 2,266-point Humor post "Chad 5.5", id `1wnwi9s`, and a 1,454-point
News/Updates post at 1,454/187, id `1wnt4d3`). This is an event, not a shift in
what the community rewards - it displaces the same categories (Humor,
Discussion, News) that already dominated the original 60-day pull, it does not
introduce a new one.

**The one Tips & Workflows post in the top 40 is itself a caution, not a
technique to adopt.** "Instant Claude Code compaction is my favorite use of Jev
so far" (438 points, 111 comments, id `1wkjnrz`, fetched FULL via Arctic Shift
2026-09-25) promotes a third-party context-compaction tool
(`github.com/tamaratran/jev-pruner` / `fast-jev-compaction`) that strips tool-call
output from context before Claude Code's own compaction runs. The top comments
are exactly the early-warning signal Finding 4 already named the subreddit's
real value: one commenter reports an independent eval of 9,471 tool calls at
the tool's default keep-cutoff (0.5) that **kept none** of them, and that
dropped calls vanish from context silently, marked only in the output that
survives; several others call the results unreliable ("this works terribly",
"it breaks context"). No comment reports the eval or its claims were
retracted or rebutted. See Key Decision 5.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| DONE - `~/zao-vault/MISTAKES.md` exists and is actively written to (196KB as of 2026-09-25); CLAUDE.md names it | @Zaal | PR to zao-vault | Shipped by 2026-09-04 (confirmed 2026-09-25) |
| DONE - graduation rule is live: CLAUDE.md enforces "REPEAT AFTER GRADUATION" once a shape hits 4 occurrences | @Zaal | PR to zao-vault | Shipped by 2026-09-04 (confirmed 2026-09-25) |
| Fetch the hooks post ("Hooks are the one feature worth learning", ~190 pts, 2026-08-08) FULL via Arctic Shift title search - shipped when it reads FULL in this doc's Sources | @Zaal | Research | 2026-10-09 |
| Decide whether a PreToolUse hook should check MISTAKES.md before destructive actions, per the 52-point comment - shipped when the hook exists or the decision is recorded against it | @Zaal | Decision | 2026-10-09 |
| Re-run the flair-distribution scan (Finding 1 / Finding 4) once a working score-sorted "top" route exists (browser route is now blocked; Arctic Shift has no score sort) - shipped when the 60-day flair table is refreshed with a live source | @Zaal | Research | 2026-10-09 |
| DONE - confirmed no lane has adopted `fast-jev-compaction`/`jev-pruner`: `grep -rl "jev-pruner\|fast-jev-compaction"` across ZAOOS, zaal-dotfiles and zao-vault returns zero hits (2026-09-25); a positive control (`grep -rl "MISTAKES.md" ~/zao-vault`) confirms the grep itself works, so the zero is real, not a broken pattern | @Zaal | Grep + note | Shipped 2026-09-25 |

## Also See

- [Doc 2373](../2373-zao-mistakes-log/) - the living MISTAKES.md doc this scan's top recommendation produced; status confirmed shipped 2026-09-25
- [Doc 2459](../2459-handoff-artifacts-that-get-consumed/) - named the verification gap this doc's Decision 1 fills
- [Doc 2460](../2460-obsidian-dual-reader-vault/) - the render-time rule
- [Doc 2282](../../business/2282-reddit-as-oss-outreach-channel/) - the doc that recorded reddit as unreachable; the browser route superseded its conclusion for READING as of 2026-09-02, and is itself now blocked again as of 2026-09-19 - see the `zao-research` skill's Reddit section

## Sources

- [r/ClaudeCode top listings, 60-day window](https://www.reddit.com/r/ClaudeCode/top/?t=month) `[FULL - METHOD: Claude-in-Chrome real browser, /top.json?t=month and t=year paginated, deduplicated by post id, filtered to created_utc within 60 days]` 245 posts. All counts in Finding 1 and Finding 4 are from this 2026-09-02 pull and were **not re-measured on 2026-09-25** - the browser route is now blocked (Claude-in-Chrome refuses reddit.com as of 2026-09-19) and Arctic Shift's search API has no score-sort parameter, so the curated "top" pull cannot currently be reproduced by any working route. Carried forward, not re-verified.
- [MISTAKES.md post, id 1vn6d5r](https://www.reddit.com/r/ClaudeCode/comments/1vn6d5r/i_make_claude_code_keep_a_mistakesmd_file_heres/) `[FULL - METHOD: Arctic Shift, 2026-09-25, re-fetched]`. Title: "I make Claude Code keep a MISTAKES.md file. Here's what actually happened." by u/thabxi. Re-fetch on 2026-09-25 reads **780 points, 151 comments (100 of 151 retrieved by Arctic Shift's 100-comment cap)**, vs. 1,006 points / 179 comments recorded on 2026-08-13/09-02. Selftext content is unchanged verbatim. The number drop is almost certainly Arctic Shift index lag against live reddit (the skill's Reddit section notes "scores are as the index last saw them and can lag reddit"), not a real vote reversal - flagging rather than asserting either way. Top comments now visible include direct pushback worth carrying forward: one 1-point reply argues the log should be split (an agent that broke something writes the entry; a separate cold-session QA pass decides promotion to a rule) and that an unenforced rule "doesn't exist."
- [The sqlit workflow post, id 1w51sws](https://www.reddit.com/r/ClaudeCode/comments/1w51sws/) - 19 points, 4 comments. `[FULL - same browser method, 2026-09-02, not re-fetched this pass - low-stakes, no claim rests on its score]` The thread Zaal sent that opened this scan; written up separately in `zao-vault/notes/sqlit-vibe-coding-workflow-2026-09-02.md`.
- [10k-token tip, id 1w2ja43](https://www.reddit.com/r/ClaudeCode/comments/1w2ja43/) "Tip: Instantly save 10k tokens on every new session" `[FULL - METHOD: Arctic Shift, 2026-09-25 - upgraded from PARTIAL]`. Now 1,007 points, 124 comments. Body read in full: disabling the `Artifact` tool definition (`enableArtifact: false` in settings.json, `--disallowed-tools Artifact`, or `CLAUDE_CODE_DISABLE_ARTIFACT=1`) saves ~10k of the ~20k-token default system-tool overhead. No contradiction with this doc's prior treatment; content confirms it belongs in Finding 3 as read, not just scored.
- [Multi-agent workflows guide, id 1vphazv](https://www.reddit.com/r/ClaudeCode/comments/1vphazv/) "A humble guide to the multi-agent workflows I use every day" `[FULL - METHOD: Arctic Shift, 2026-09-25 - upgraded from PARTIAL]`. Now 190 points, 31 comments (down from the 208/34 read off the listing on 2026-09-02 - same lag caveat as above). Body read in full: driver/reviewer pairing of Claude Code + Codex, a per-task folder with Sources-of-Truth files and a shared "Room" where agents post timestamped .md reports - the same shared-context-file pattern [dev-workflows/2467-agent-skill-collections](../2467-agent-skill-collections/) independently recommended adopting from the marketingskills repo. Worth a cross-link if that doc is revisited.
- Hooks post, "Hooks are the one feature worth learning" (~190 pts per the 2026-09-02 listing) `[FAILED - METHOD: Arctic Shift title-keyword search attempted twice on 2026-09-25 (`title=hooks`), one call timed out ("Timeout. Maybe slow down a bit"), the retry returned two hits and neither title-matched. No post ID was ever recorded for this source in the original scan, so it cannot be looked up directly. Still unread; carried to Next Actions.]`
- [r/ClaudeCode, 6-day sample (2026-09-19 to 2026-09-25)](https://arctic-shift.photon-reddit.com/api/posts/search) `[FULL - METHOD: Arctic Shift `posts/search`, `created_utc`-ordered, paginated 11x in up to 100-post pages, deduplicated by post id, sorted by score client-side - 2026-09-25]` 1,096 raw posts (every submission, not Reddit's curated "top"). Backs Finding 5's flair table and the Opus 5.5 dominance claim.
- [Instant Claude Code compaction is my favorite use of Jev so far, id 1wkjnrz](https://www.reddit.com/r/ClaudeCode/comments/1wkjnrz/instant_claude_code_compaction_is_my_favorite_use/) `[FULL - METHOD: Arctic Shift, post body plus 100 of 111 comments with scores, 2026-09-25]` 438 points. Backs Finding 5 and Key Decision 5 (SKIP `fast-jev-compaction`).
- `zao-fetch-reddit.sh --selftest`, re-run 2026-09-25 `[FULL]` - the OAuth/redlib/public-json ladder is still dead, unchanged from 2026-09-02. Arctic Shift (no selftest coverage yet) is the route that actually worked this pass.
