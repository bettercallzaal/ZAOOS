---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-28
superseded-by:
related-docs: "2036, 2352, 2319, 2423, 2434, 689"
original-query: "https://x.com/shmidtqq/status/2092999845531308151?s=46 also research this."
tier: STANDARD
---

# 2436 - The 4,000-token bounded memory file vs our memory stack

> **Goal:** Find the primary source behind @shmidtqq's "permanent memory for $0.40 a year" post, check its cost arithmetic against current Anthropic prompt-caching prices, map its six fields onto the files we already run (measured in tokens), and decide whether a rewritten, budgeted prefix file belongs in the vault.

> **PRIMARY SOURCE: FAILED.** The post says "a developer figured out" and never names one. The attached video is 97 seconds of the author's own "Cache Engineering on Kimi K3" dashboard render with a music track and no narration (six frames read, audio transcribed: "(upbeat music)"). The post quotes the author's own 2026-08-24 long-form article, which is about prefix caching on Kimi K3 and contains no memory-file section. Nine searches (WebSearch x3, exa x3, grep.app regex, `gh search code` x2, `gh search repos`, HN Algolia x4, the author's public Telegram preview) found no repo, gist, or post carrying the six-field IDENTITY/STATE/DECISIONS/CORRECTIONS/PEOPLE/GRAVEYARD schema. **Everything below treats the tweet as a secondhand description of a pattern, not as a documented system.**

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **ADOPT the discipline, NOT a new file.** Verdict: `ADOPT-DISCIPLINE-NOT-FILE`. Put per-section token budgets and a "prune by moving, never by deleting" rule onto the two vault files that are ALREADY rewritten in place (`handoffs/grill-next.md`, the handoff `TEMPLATE.md`), and convert `IN-FLIGHT.md` from append to replace-per-lane. Do not create `~/zao-vault/PREFIX.md`. | We already have every one of the six fields, spread across files that are measured below. A seventh file is a second copy of the same facts (`feedback_always_extend_over_rebuild`). The one file in the stack that already has the tweet's shape - rebuilt every tick, small, decisions-only - is `grill-next.md` (1,728 tokens, rewritten 6 times between 06:16 and 08:12 on 2026-08-28). The pattern is right; the file exists. |
| 2 | **The tweet's cost claim is wrong for its own design.** $0.0004/turn = 4,000 tokens x $0.10/M, the cache-HIT price. A file that is REWRITTEN every turn is a cache MISS every turn. On Claude Opus 5 the same 4,000 tokens cost $0.002 cached, $0.020 as plain input, and **$0.025 as a 5-minute cache write** - 12.5x the number the post advertises. On Fable 5 (the model this session runs) double each: $0.004 / $0.040 / $0.050. | Read from `~/.claude/skills/claude-api/shared/prompt-caching.md` on 2026-08-28: reads ~0.1x base input, 5-minute writes 1.25x, 1-hour writes 2x; base input Opus 5 $5/M, Fable 5 $10/M, Sonnet 5 $2/M. The author's own article says it in one line: "The cache does not pay you for what you write. It pays you for what you refuse to change." A file rewritten per turn is the thing you refuse to keep. |
| 3 | **In Claude Code "every turn" means "every session start".** CLAUDE.md, `.claude/rules/*.md` and MEMORY.md are read once at boot and stay byte-stable for the session, which is exactly why `agent-spend.md` measured 81% of spend as cache reads. The rewrite cadence that fits our harness is the tick (orchestrator) and the handoff (lane), which is what already happens. | A per-turn rewrite inside a Claude Code session is not even possible without a hook, and a hook that edited the loaded prefix would invalidate the cache the whole fleet runs on. |
| 4 | **Our always-loaded prefix is ~52,800 tokens, not 3,000.** User CLAUDE.md 990 + project CLAUDE.md 3,378 + `.claude/rules/` 43,507 + MEMORY.md 4,956. The bounded-file idea is aimed at a stack seventeen times smaller than ours. The size problem, if there is one, is the rules directory (174,030 chars), not the memory file. | Measured `wc -c` / 4 on 2026-08-28. This is the number the doc-2365 rules-duplication audit card (tracker, due 2026-08-25, still todo) exists to shrink. |
| 5 | **DECISIONS lines carry date + source or the file is a fabrication hazard.** A rewritten file has no history except git, and git only has it if every rewrite is committed. `grill-next.md` is committed on every tick (good). The CLAUDE.md "Retired - do not reference" section was lost once precisely because it lived in an uncommitted working tree (`git log -S` returned nothing). | `state-claims.md` "a claim carries its DATE as well as its source"; the Joseph Goats glossary row already does it ("confirmed by Zaal 2026-08-24"). Every line in a rewritten field gets `(who YYYY-MM-DD HH:MMx)` or it does not go in. |
| 6 | **Prune by moving, never by deleting.** A line leaves a bounded field only by landing in the append-only layer first: `grill-next.md` -> `GRILL-DONE.md`, a brief's "tried and did NOT work" -> the daily, IN-FLIGHT -> the daily. | OptMem (the nearest named design, 1,479 stars) gets this right structurally: `LOG.txt` is append-only and never edited, `TREE/` summaries are "a cache, rebuildable from the log alone". Our daily notes are the LOG; the rewritten files are the TREE. Never let the TREE be the only copy. |

## Findings

### 1. What the post actually is

- Author `@shmidtqq` ("shmidt", 10,812 followers, "predicting the future with code / ai x finance / tg: shmidtqq"). Post 2026-08-27 15:37 UTC, 28,315 views, 237 favs, 28 replies, as fetched 2026-08-28 via `zao-fetch-x.sh` tier 0 (raw text).
- It quote-posts the author's own X article of 2026-08-24, "Cache engineering: the new skill that divides your bill by 10. Worked out on Kimi K3" (107,185 views, 177 lines / 24,690 chars fetched in full). That article is about prefix caching, has eight rules, and mentions no memory file, no six fields, no $0.40. Rule 3 in it is "Append to history, never slide it" and it warns that "inserting that summary mid-conversation invalidates the cache from the insertion point onward. So compress rarely and in big steps, not every turn." That is the opposite of a file rewritten every turn.
- The video is the article's dashboard (session ids, hit-rate graph, "THE BILL $0.257 / $1.867 / $1.133 / $0.434" across frames at 3 s, 25 s, 70 s, 95 s). No memory file appears in any frame. Audio track is music.
- The six budgets (300/400/800/600/500/400 = 3,000 working, 4,000 ceiling) exist only in the tweet text. Who built it, on which model, with what prompt: UNVERIFIED.

### 2. The arithmetic, against prices we can read

Prices from the claude-api skill (`shared/prompt-caching.md`, cached 2026-06-24, read 2026-08-28). Cache read ~0.1x, 5-minute write 1.25x, 1-hour write 2x of base input.

| 4,000-token file, per turn | cached read | plain input | 5-min write (rewritten) | 1-hour write |
|---|---|---|---|---|
| tweet's implied rate ($0.10/M hit) | **$0.0004** | - | - | - |
| Claude Sonnet 5 ($2/M) | $0.0008 | $0.008 | $0.010 | $0.016 |
| Claude Opus 5 ($5/M) | $0.002 | $0.020 | $0.025 | $0.040 |
| Claude Fable 5 ($10/M, this session) | $0.004 | $0.040 | $0.050 | $0.080 |

- $0.40/year at $0.0004/turn is **1,000 turns a year**, under three a day. Claude Code sessions here run thousands of turns (agent-spend.md: one session of 14,021 turns).
- $0.10/M is nobody's Claude cache-hit price. Sonnet 5 hits at $0.20, Opus 5 at $0.50, Kimi K3 at $0.30 (the author's own article). It is in the DeepSeek range.
- **Minimum cacheable prefix** is model-dependent and non-monotonic: 512 tokens on Opus 5 / Fable 5, 1,024 on Opus 4.8 / Sonnet 5, 2,048 on Opus 4.7, **4,096 on Opus 4.6 / Opus 4.5 / Haiku 4.5**. A 3,000-token working file caches on the newest models and silently does not on Haiku 4.5 - "no error, just `cache_creation_input_tokens: 0`". If the cheap fleet loops (Haiku-tier or OpenRouter) ever adopt this, they get none of the discount.
- Independent confirmation, fetched raw: nihardaily, "Agent memory without wrecking your prompt cache" (2026-08-19): "Common culprits are a timestamp in the system prompt, a reordered tool list, and a memory block rewritten every turn." Their worked example: a 40,000-token prefix costs ~2 cents/turn cached and ~25 cents/turn "rewritten every turn because you keep updating a memory block near the top."
- On Max the marginal dollar is zero; the unit that matters is the weekly cap and turns (`agent-spend.md`: cost = turns x ~$1.01, 81% cache reads). The file's size is not what moves that number. Its STABILITY is.

### 3. The six fields, mapped onto files we run (measured 2026-08-28, tokens = chars / 4)

| Tweet field (its budget) | What we have | Size | Rewritten or appended | Bounded? |
|---|---|---|---|---|
| IDENTITY (300) | `memory/user_*.md` (6 files); project CLAUDE.md "What This Is"; ICM boxes | 3,068 tok; 3,378 tok (whole CLAUDE.md) | Rewritten rarely | No cap, stable in practice |
| STATE (400) | `handoffs/IN-FLIGHT.md`; handoff bundle sections C (git) + D (in-flight); lane briefs | **18,972 tok** (465 chars at first commit 2026-08-18 -> 75,890 chars 2026-08-27, 93 commits, 163x in 9 days); latest bundle 2,411 tok; 61 briefs 85-10,602 tok, 11 of them over the 200-line soft cap (zabalgames.md 766 lines) | IN-FLIGHT appended; bundles written once per handoff | **No - the one field that violates the pattern** |
| DECISIONS (800) | `handoffs/grill-next.md` "Answered today, do not re-ask"; `GRILL-DONE.md`; `orca-organization.md` conventions; bundle section B | block 118 tok inside a 1,728-tok file; 433 tok; orca-organization 9,963 tok (3,527 chars on 2026-08-25 -> 39,853 on 08-28, 11x in 3 days) | grill-next REBUILT every AFK tick (6 rewrites 06:16-08:12 today); the others append | grill-next yes by construction; the rest no |
| CORRECTIONS (600) | `memory/feedback_*.md` (154 files) indexed by MEMORY.md; CLAUDE.md glossary + "Retired - do not reference" | 74,093 tok; index 4,956 tok (19,825 chars, near the 24.4 KB read cap doc 2036 warned about, compacted 2026-07-31 and growing again); glossary 740 tok | Files appended; glossary rewritten in place | No |
| PEOPLE (500) | `memory/project_*.md` people subset (of 252 files); MEMORY.md people lines; CRM | 167,051 tok (all project files) | Appended | No |
| GRAVEYARD (400) | TEMPLATE.md "What was tried and did NOT work"; `orca-organization.md` "Known hazards"; CLAUDE.md decommissioned list + retirements; daily notes | template default "(nothing yet)"; hazards 1,107 tok; daily 7,584 / 15,134 / 7,322 tok for 08-26 / 08-27 / 08-28 | Daily append-only (the opposite of this pattern, by design) | No |
| (not a field) | Bonfire | corpus | retrieval, not prefix | n/a |
| (not a field) | Serena memories (doc 2352) | `.serena/memories` in the repo: **0 files** (dir created 2026-08-17) | - | Not a live layer; doc 2352 said upgrade before expanding |

Read-across: five of six fields exist and are unbounded; one (DECISIONS in grill-next) already has the tweet's exact shape. STATE is the field to fix, and it is a convention fix (replace the lane's line, do not append a new one - which `handoff-discipline.md` rule 6 already says and nobody does).

### 4. Compared with the named designs

| Option | Bound | History kept where | Licence (LICENSE file read) | Verdict for us |
|---|---|---|---|---|
| Tweet's six-field file | 4,000 tok hard, prune in place | nowhere unless git | n/a, unsourced | shape yes, file no |
| Claude Code CLAUDE.md + auto-memory (what we run) | MEMORY.md ~24 KB read cap | topic files + git | - | rung 1, keep |
| VictorTaelin/OptMem (426-token prompt, `memo wake/note/nap`, 1,479 stars, created 2026-07-25) | `WAKE_LINES` reading budget (96 lines ~ 8k tok) | `LOG.txt` append-only, never edited; `TREE/` rebuildable | **no LICENSE file in the tree** = all rights reserved, cannot vendor (`credit-attribution.md`) | steal the LOG/TREE split as a convention, do not install |
| narko4u/agent-memory-playbook "hot memory" (Empire Labs Pty Ltd, MIT, 0 stars, 2026-08-09) | "a budget, not a diary"; evict to state files + FTS5 | state files + SQLite session search | MIT (LICENSE read) | same split, confirms direction |
| Hermes MEMORY.md (community guide, PARTIAL) | snapshotted at session start, frozen for the session to keep the provider cache warm | disk | - | same as our session-start read |

### 5. What breaks if we did build `PREFIX.md`

- **Provenance.** A rewritten file loses "Zaal typed this at 20:4x" unless every line carries it and every rewrite is committed. This week's hazards (`orca-organization.md` "relay-tagged text of unknown origin", the figure-that-will-be-published rule) are all about text whose origin was dropped. A DECISIONS field without `(Zaal 2026-08-28 12:5x)` per line is the miscited-claim failure with a nicer name.
- **Silent loss.** "When a section fills, the model prunes it" is an LLM deciding what to forget with no record. OptMem's own README: summaries are a cache, the log is truth. Our daily is the log. Pruning is a MOVE to the daily, then the line may go.
- **Cache.** In Claude Code the file would be read at boot, so the "every turn" claim is moot; in any API loop it would be a per-turn cache write at 12.5x-20x the read price.
- **Duplication.** Seven of the eight things it would hold are already in a file that another lane reads. The handoff bundle sections A-E ARE the six fields written once at handoff; `handoff-discipline.md` was adopted 2026-08-18 after a 36-decision grill. Re-litigating it costs the thing it saved.

## Proposal (glue-first, zero new code)

1. **`grill-next.md` is the DECISIONS field.** The "Answered today, do not re-ask" block gets one item per line with `(Zaal HH:MMx)`; the block's budget is UNSET until Zaal types one (the tweet's 800 is the tweet's). Items leave only into `GRILL-DONE.md`. Already rebuilt per tick, already committed per tick: nothing to build.
2. **`IN-FLIGHT.md` becomes replace-per-lane.** One line per live lane, overwritten on every session start and major ship (rule 6's own words); closed lanes move to that day's daily. Budget UNSET. Shipped when the file stops growing between ticks.
3. **`TEMPLATE.md` sections get token budgets in the section headings** (Mission, Priority order, tap stack, Cautions, tried-and-did-NOT-work, Links). Numbers UNSET - Zaal has not typed them; the existing 200-line soft cap is ~4,000 tokens at 20 chars/line, which is the tweet's ceiling by coincidence. The check is `wc -c` in `/handoff` (one line in an existing skill, not a tool).
4. **Every line in a rewritten field carries who + date.** Same rule as `state-claims.md`; the glossary already complies.
5. **No `PREFIX.md`, no per-lane `.handoffs/PREFIX.md`.** The bundle at `~/.zao/handoff/<slug>/README.md` sections A-E is that file, written at the right cadence for a harness that reads files at boot.

## Also See

- [Doc 2036](../../dev-workflows/2036-context-hygiene-cost-discipline/) - MEMORY.md near its 24.4 KB read cap; prompt caching already the biggest thing done right
- [Doc 2352](../../dev-workflows/2352-serena-version-gap-silent-failures/) - Serena 8 releases behind; do not expand usage first
- [Doc 2319](../../dev-workflows/2319-handoff-workflow-audit/) - the handoff system this proposal extends rather than replaces
- [Doc 2434](../2434-harness-engineering-six-layer-map/) - the same "map the outside pattern onto what we run" shape, one day earlier
- [Doc 689](../689-ai-agent-memory-personal-systems/) - May 2026 community patterns on agent persistence
- [Doc 2365](../../dev-workflows/2365-agent-memory-management/) + tracker task research-doc:2365 (todo, due 2026-08-25) - Rules-duplication audit: 211 MEMORY.md entries vs `.claude/rules/` - the 43,507-token rules prefix is that card's problem
- `.claude/rules/agent-spend.md` (81% cache reads), `state-claims.md` (date + source), `handoff-discipline.md` (rule 6, IN-FLIGHT one line per lane)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Grill card: approve verdict `ADOPT-DISCIPLINE-NOT-FILE` and type the three budgets (grill-next decisions block, IN-FLIGHT, TEMPLATE sections) - shipped when the numbers replace UNSET in this doc and in TEMPLATE.md | Zaal | grill | 2026-08-31 |
| grill-next.md rebuild carries `(Zaal HH:MMx)` on every "do not re-ask" item - shipped when the first rebuilt file after merge shows it | orchestrator lane (Zaal's terminal) | vault convention | 2026-08-29 |
| IN-FLIGHT.md replace-per-lane: rewrite the lane's own line on session start, move closed lanes to the daily - shipped when `wc -c` is lower after a tick than before it | orchestrator lane | vault convention | 2026-08-29 |
| TEMPLATE.md section budgets in headings + `wc -c` warn line in `/handoff` - shipped when a brief over 16,000 chars prints WARN at handoff time | Zaal (numbers) then the next lane touching `~/.claude/skills/handoff` | vault + skill edit, PR | 2026-09-04 |
| Close or re-date tracker research-doc:2365 (rules-duplication audit, overdue since 2026-08-25) - the 43.5k-token rules prefix is the real size finding here | Zaal | board | 2026-08-31 |

## Sources

Method stated per source (`research-grounding.md`). No source below was read through WebFetch.

- [FULL] X post 2092999845531308151 by @shmidtqq, 2026-08-27 15:37 UTC - `zao-fetch-x.sh` tier 0 (api.fxtwitter.com), raw text, 28,315 views / 237 favs / 28 replies at fetch. https://x.com/shmidtqq/status/2092999845531308151
- [FULL] X article 2091944893862072364 by @shmidtqq, 2026-08-24, "Cache engineering: the new skill that divides your bill by 10. Worked out on Kimi K3" - fxtwitter article body, 177 lines / 24,690 chars. No memory-file section; the seed's video is this article's dashboard. https://x.com/shmidtqq/status/2091944893862072364
- [FAILED - primary source] Seed video (19.6 MB, 97 s, aac): downloaded, six frames at 3/8/25/40/70/95 s read (Kimi K3 cache dashboard only), audio transcribed with whisper.cpp `ggml-base.en` -> "(upbeat music)" x4. No developer, repo, or file shown.
- [FAILED - primary source] Author's public Telegram preview `t.me/s/shmidtqq` fetched (9,590 bytes): no hit on 4,000 / GRAVEYARD / CORRECTIONS / 0.40 / prefix.
- [FAILED - primary source] Searches with zero hits on the six-field schema: WebSearch x3; exa `web_search_exa` x3; grep.app regex `IDENTITY.*STATE.*DECISIONS.*CORRECTIONS.*PEOPLE.*GRAVEYARD`; `gh search code` x2; `gh search repos` x1; HN Algolia x4 (queries: "4000 token memory file", "bounded memory file agent rewrite", "prefix caching memory agent 4,000 tokens", the six field names).
- [FULL] Anthropic prompt-caching reference, local: `~/.claude/skills/claude-api/shared/prompt-caching.md` (skill cache date 2026-06-24), lines 129-142: minimum cacheable prefix table and 0.1x / 1.25x / 2x economics; model prices from the skill's Current Models table.
- [FULL] NiharDaily, "Agent memory without wrecking your prompt cache", 2026-08-19 - curl + HTML strip, 88,925 bytes. https://www.nihardaily.com/posts/agent-memory-that-does-not-wreck-your-prompt-cache
- [FULL] VictorTaelin/OptMem README - `gh api repos/.../readme`, base64-decoded. 1,479 stars, created 2026-07-25, pushed 2026-07-31. Tree listing (`gh api .../contents`): `.gitignore README.md WINDOWS.md anim install.sh memo test.py` - **no LICENSE file**; API licence field null. https://github.com/VictorTaelin/OptMem
- [FULL] HN threads on OptMem: 49061311 (1 point, 3 comments, all keyboard noise "lll" / "jkglhkj" / "kjllk") and 49083167 (2 points, 0 comments) - Algolia items API. No usable discussion. https://news.ycombinator.com/item?id=49061311
- [FULL] narko4u/agent-memory-playbook README + LICENSE - `gh api`, LICENSE file read: "MIT License, Copyright (c) 2026 Empire Labs Pty Ltd". 0 stars, created 2026-08-09. https://github.com/narko4u/agent-memory-playbook
- [PARTIAL - exa highlights only, not fetched raw] OnlyTerp/hermes-optimization-guide part27 ("MEMORY.md ... snapshotted at session start ... keeps the provider's prefix cache warm") and dev.to/zeiyre "I am one process talking to itself across context resets" (2026-04-25, graveyard file with kill rationale). Used directionally only, no numbers quoted.
- [FAILED - reddit] `zao-fetch-reddit.sh --selftest` 2026-08-28: 1/3 redlib instances answered 200, "content may still be a bot challenge". Not attempted further (doc 2282 ladder).
- Local measurements (all `wc -c`, `wc -l`, `git log` on 2026-08-28): `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/` (418 files), `~/zao-vault/handoffs/*.md` (61 files), `~/zao-vault/daily/`, `~/zao-vault/notes/orca-organization.md`, `~/.zao/handoff/*/README.md` (25 bundles), `.claude/rules/*.md`, both CLAUDE.md files, `.serena/memories`.
