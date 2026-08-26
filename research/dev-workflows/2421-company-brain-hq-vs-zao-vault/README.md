---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-26
superseded-by:
related-docs: "2317, 2318, 2036, 2319"
original-query: "/zao-research on https://x.com/VibeMarketer_/status/2092243372929151135 - Zaal wants to learn more about Obsidian from it. Pull the thread and whatever it references, then assess against our actual stack: ~/zao-vault is live per doc 2317 - the doc should extract what is genuinely NEW to us versus what we already run, and land concrete adoptable items, not a tool tour."
tier: STANDARD
---

# 2421 - The "company brain" article: what is genuinely new for the ZAO vault

> **Goal:** Read the VibeMarketer_ long-form piece Zaal sent, assess it against `~/zao-vault` + ZAOOS as they actually exist today, and land the two or three things we do not already run. Not a tool tour.

## Lead correction: the article contains zero Obsidian content

Zaal sent this to learn more about Obsidian. **The word "Obsidian" does not appear in it.** Neither does Notion, markdown, wikilink, or vault. Verified by grep over the full 184-block article body pulled from FxTwitter (`grep -in "obsidian|notion|markdown|vault"` -> no match on the first three).

What it actually is: a well-built content-marketing essay for **HQ** (`hqforwork.com`), a commercial product whose own homepage describes it as "HQ Core - the file-based memory system and AI harness" plus HQ Cloud, HQ Agents and HQ MCP. The article ends on a referral link (`/r/vibe-marketer`). J.B. / @VibeMarketer_, posted 2026-08-25, 802 favourites / 25 replies / 313,939 views as of today.

That does not make it worthless - the first six sections are a genuinely good statement of a problem we have, and section 6 contains one artifact we should copy. But the framing matters: **the recommended fix is "buy our product", and the folder structure in section 4 is the free sample.** Read it as competitive intelligence on a design we are already most of the way through, not as instruction.

## Key decisions

| # | Decision | Why |
|---|---|---|
| 1 | **ADOPT the correction-routing table.** Six correction types, each with one named destination, written down where sessions read it. | This is the one artifact in the article we do not have in explicit form. We route corrections well by habit (`agent-loops.md` rule 6, the `feedback_*` memories) but nowhere states *which store owns which kind of correction*, so the routing lives in the model's judgement rather than in the repo. |
| 2 | **ADOPT a source-order rule in the vault README.** Grepped `~/zao-vault/README.md` for `conflict\|source order\|newest\|precedence` on 2026-08-26: **no match.** The README says beautifully what each folder is *for*, and says nothing about what to believe when two of them disagree. | We run **four** knowledge stores (vault 561 md, research 2,137 numbered docs, 418 agent memories, 36 rules). Four stores with no precedence order is how a superseded decision wins an argument. |
| 3 | **SKIP HQ itself.** Do not trial it, do not pay for it. | It is a hosted home for a file-based company brain. We already have one: a private git repo the whole fleet reads and writes, synced by git only, on a machine we own. Doc 2317 already decided git-only sync and warned that mixing a second sync layer is the #1 reported failure mode - HQ Cloud would be exactly that second layer. Rung 1-2 of `code-restraint.md`. |
| 4 | **SKIP the 9-folder structure as a restructure.** We already have 7 of its 9 folders under different names, holding 561 files. | Moving a working 561-file vault to match a marketing diagram is the opposite of what the article itself advises ("Do not spend a month designing the perfect brain"). |
| 5 | **KEEP the map-file idea, but as an EDIT to `~/zao-vault/README.md`, not a new file.** | The README already *is* the map - it has the folder table and the fast-maps list. It is missing the two paragraphs the article gets right: source order, and the four behavioural rules. One edit beats a second front door. |

## Findings

### 1. Their nine folders vs what we actually have (measured 2026-08-26)

| Article's layer | Ours | Where | Size |
|---|---|---|---|
| `company-brief.md` | `notes/bio.md`, `notes/zao-affiliations.md`, the ICM boxes | vault + useicm.com | 24+ live boxes |
| `priorities.md` | `project_brand_priority_stack` memory + the cowork board | memory + Supabase | locked 2026-08-18 |
| `decisions/` | `decisions/` | vault | 6 md |
| `people/` | `people/` + `handoffs/people/` | vault | 50 md |
| `projects/` | `projects/` | vault | 10 md |
| `policies/` | **`.claude/rules/*.md`** | ZAOOS repo | **36 rules** |
| `skills/` | **`~/.claude/skills/`** | dotfiles | **75 skills** |
| `workers/` | ZOE modules, the ZORCA/Orca task lanes, cron | `bot/src/zoe/`, VPS | ~98 ZOE modules |
| `learnings.md` | **`feedback_*.md` memories** + the rules | memory dir | **154 feedback memories** |

**Nothing in their list is missing from our stack. All nine layers exist.** What is different is that ours are spread across four stores, deliberately - the vault README's "one rule" is that the vault must not duplicate what another system owns, which is a *better* rule than the article's single-folder model and was written for the same reason (fragmentation).

The cost of that choice is precisely what decision 2 fixes: with one store, precedence is implicit; with four, it has to be written down.

### 2. The correction-routing table - the one thing worth copying verbatim

The article's section 6, quoted:

> Here is where each fix should go:
> - Missing or outdated fact -> company knowledge
> - New strategic choice -> decision record
> - Repeated preference -> policy
> - Proven technique -> skill
> - Repeatable sequence -> worker
> - Dangerous action -> mechanical gate

And the loop:

> work -> correction -> route -> review -> share -> better future work

Mapped onto ZAO, this becomes a table a session can actually execute:

| Correction type | Goes to | Concretely |
|---|---|---|
| Missing or outdated fact | the vault, or the ICM box if it is brand truth | `~/zao-vault/notes/`; box wins for brand (`icm-grounding.md`) |
| New strategic choice | a decision note + memory | `~/zao-vault/decisions/`, `project_*.md` memory |
| Repeated preference | a rule | `.claude/rules/*.md`, committed - the "persist lessons to the repo" half of `agent-loops.md` rule 6 |
| Proven technique | a skill | `~/.claude/skills/<name>/SKILL.md`, git-tracked (`vanishing-dependencies.md` rule 1) |
| Repeatable sequence | a worker | a ZOE module or a cron; **no new bots without a doc** (CLAUDE.md) |
| Dangerous action | a mechanical gate | `.claude/settings.json` deny rule, or a hook - `no-rm-rf.md` is the precedent |

The last row is where we are already ahead of the article: "dangerous action -> mechanical gate" is exactly the reasoning in `no-rm-rf.md` (deny the command *shape*, not a path allowlist) and in ZORCA's danger-word hold. The article states the principle; we have shipped it three times.

**Where we are behind:** the review step. The article insists a correction is reviewed *before* it becomes shared knowledge. Our `feedback_*` memories are written by the session that learned the lesson, with no second pass. That is not a new gate we should build today - it is a known asymmetry worth naming, and the honest version is that 154 feedback memories have accumulated with no review pass ever run over them.

### 3. Their diagnosis is our doc 2344 diagnosis, from the other side

Article:

> "One teammate has a Claude chat that understands the strategy. Another has taught Codex how you ship... Multiply that across every employee and agent. Your company is creating an incredible amount of intelligence, then trapping it inside private chats and personal setups."

> "The company is learning everywhere and remembering almost nowhere."

That is the same failure `handoff-discipline.md` was written for (a lane died at 90% context with no brief) and the same one `session-boundaries.md` names (the conversation as the liability, the artifact as the state). We arrived at it from lane collapse; they arrive at it from team scale. Convergence, not proof - but it does say the vault/handoff investment is aimed at a real and general failure rather than a ZAO quirk.

### 4. The one line that is a genuine caution against our current habit

> "That matters because more context can create more confusion. Old campaigns compete with current positioning. Loose meeting notes compete with approved decisions. History starts looking like policy. The fix is not more memory in every prompt. It is better navigation."

We have 2,137 research docs, 418 memories and a `MEMORY.md` index loaded into every session. "History starts looking like policy" is a live risk in a repo whose research library keeps every superseded verdict - doc 1659's July verdict was stale as recently as this week's addendum. The vault README already handles half of it (`archive/` holds superseded material *with reasons*); the missing half is the precedence rule in decision 2.

### 5. What HQ actually is, since the article is an ad for it

`hqforwork.com`, fetched raw today: "HQ: the company brain your AI runs on." Product line is HQ Core (file-based memory + AI harness), HQ Cloud (sync/share/manage across the team), Secrets + Integrations, HQ Deploy, HQ Agents ("persistent AI teammates"), HQ MCP. Logo wall names Adobe among ~30 mostly-ecommerce brands. Pricing page exists; no figure captured (the page is JS-heavy and the number was not in the fetched HTML - marked PARTIAL below rather than guessed).

The shape is: our vault + our rules + our skills + a hosted sync layer and a team review flow. **The parts we lack are the team parts** - and ZAO's team surface is Telegram plus the cowork board, already decided (doc 2314). Nothing here changes that.

## Adoptable items (the deliverable)

| # | Item | Effort | Where it lands |
|---|---|---|---|
| 1 | Correction-routing table (section 2 above) added to `agent-loops.md` rule 6, which currently says "persist lessons to the repo" without saying *which* repo location per lesson type | ~20 min, one PR | `.claude/rules/agent-loops.md` |
| 2 | Source-order block in the vault README: the precedence list plus the four rules ("use the newest approved information"; "when two sources conflict, follow the source order"; "if the answer is missing, say what you could not find"; "never turn a guess into company knowledge" - the last two are `anti-fabrication.md` restated, and agreeing with it is a point in the article's favour) | ~15 min, one commit | `~/zao-vault/README.md` |
| 3 | A one-time review pass over the 154 `feedback_*` memories for contradictions and superseded entries - the "review before it becomes shared knowledge" step we skip | half a day, separate task | memory dir + a card |

Item 3 is the one with real cost and it is the one most likely to find something, since nothing has ever audited that directory.

## Also see

- [Doc 2317](../2317-obsidian-claude-personal-os-stack/) - the live decision this doc is measured against: Claude Code directly on the vault, git-only sync, frontmatter contract, skip in-app AI plugins
- [Doc 2318](../../agents/2318-elizaos-memory-vs-zao-corpus-agent/) - ElizaOS memory vs the ZAO corpus agent; the adjacent "who owns memory" question
- [Doc 2319](../2319-handoff-workflow-audit/) - handoff discipline; the same "trapped in a private chat" failure at lane scale
- [Doc 2036](../2036-context-hygiene-cost-discipline/) - context hygiene, the "more context creates more confusion" concern in our own terms

## Next actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add the correction-routing table to `.claude/rules/agent-loops.md` rule 6; PR merged | @Zaal | PR | 2026-08-28 |
| Add the source-order + four-rules block to `~/zao-vault/README.md`; committed and pushed | @Zaal | Commit | 2026-08-28 |
| Run the first review pass over the 154 `feedback_*` memories, report contradictions and supersessions found | @Zaal | Card | 2026-09-05 |
| No action on HQ - decision 3 is SKIP, recorded so a future session does not re-evaluate it cold | @Zaal | Decision | done 2026-08-26 |

## Sources

- [x.com/VibeMarketer_/status/2092243372929151135](https://x.com/VibeMarketer_/status/2092243372929151135) - "How to Build a Company Brain That Gets Smarter Every Week", J.B. / @VibeMarketer_, 2026-08-25, 802 favs / 25 replies / 313,939 views - **[FULL]** method: `~/bin/zao-fetch-x.sh` tier 0 (`api.fxtwitter.com`, article-body aware), 184 blocks of raw article text; saved to `~/.zao/private/x-vibemarketer-companybrain-20260826.txt`. All quotes verbatim from that raw text.
- [hqforwork.com](https://www.hqforwork.com/) - **[PARTIAL - pricing not captured]** method: `curl` + HTML strip, 195KB; product line and logo wall present in raw HTML, the pricing figures are behind JS and were NOT read. No price is stated in this doc rather than a guessed one.
- `~/zao-vault/README.md` + folder census - **[FULL]** method: read on disk; `find ~/zao-vault -name '*.md' | wc -l` = 561; per-folder counts in Findings 1
- `.claude/rules/` = 36 rules; `~/.claude/skills/` = 75 skills; memory dir = 418 files of which 154 `feedback_*`; `research/` = 2,137 numbered docs - **[FULL]** method: `ls`/`find` counts run 2026-08-26
- Absence check: `grep -inE "conflict|source order|newest|precedence" ~/zao-vault/README.md` -> **no match** - **[FULL]** method: grep, scope stated (that one file only; the claim is about the vault's front door, not about the whole estate)
- [Doc 2317](../2317-obsidian-claude-personal-os-stack/) - **[FULL]** method: read on disk
