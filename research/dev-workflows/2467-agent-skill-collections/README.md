---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-09-25
related-docs: "dev-workflows/507-claude-skills-1116-ecosystem-zao-picks, dev-workflows/312-claude-skills-marketplace-ecosystem, dev-workflows/154-skills-commands-master-reference, agents/2431-ali-tiknazoglu-github-watch-glue-first"
original-query: "http://x.com/alex_verem/status/2095920078231625991 please research this /zao-research more agentic things like this that can help us"
tier: STANDARD
---

# 2467 - Agent-skill collections at scale: what to take, what to refuse

> **Goal:** Zaal sent a viral X post about a 47K-star marketing-skill repo and asked for more agentic things like it. Decide what the ZAO estate should install, and answer the prior question of whether it should install anything at all.

**Updated 2026-09-25:** central verdict confirmed, no reversal, and the
skill-budget argument is now WORSE than the 2026-09-06 version knew to check
for. `marketingskills` kept growing (47,256 -> 51,523 stars) as expected.
`~/.claude/skills` itself did drop (84 -> 67), but that count was never the
whole picture: the 5 plugins installed on this Mac add **207 more skill-shaped
entries** on top of it, 183 of them from the single `everything-claude-code`
plugin alone. **Total invocable skill surface in a live session, measured
2026-09-25: 274** - not down from 84, up from it by more than 3x, against a
rule that said "no more than 3 skills total." The doc's own Next Action to
re-validate doc 507 (due 2026-09-13) was never done - it is still dated
2026-05-21, now 127 days stale. See "What changed" below.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Install `coreyhaines31/marketingskills` (50 skills) | **NO, more firmly than 2026-09-06** | The user-skill count dropped (84 -> 67), but the total invocable surface in a session is **274** once the 5 installed plugins are counted - `everything-claude-code` alone supplies 183. Doc 507 (2026-05-21, still not re-validated) set the rule: *"no more than 3 skills total without measurable lift"*. Adding 50 more to a surface already 91x over that budget is not a close call. |
| Take its three ideas instead | **YES** | Shared-context file, simulated council, scheduled loops. All three we can implement in files we already own, with zero added context tax. |
| Install `ComposioHQ/awesome-claude-skills` (75.6K stars) | **NO - LEGALLY CANNOT** | **Still no LICENSE file** - re-fetched 2026-09-25, `gh api repos/ComposioHQ/awesome-claude-skills/contents/LICENSE` returns 404. Per `.claude/rules/credit-attribution.md`, absent licence is all-rights-reserved, not public domain. Repo is active (pushed 2026-09-18, 1,529 open issues), not abandoned - the licence gap is a choice, not neglect. |
| Adopt `SawyerHood/dev-browser` (6.6K, MIT) | **NO** | We already run `claude-in-chrome`, `/browse`, `/gstack` and Playwright MCP. Four browser paths is already three too many. |
| Measure our own skill load before adding anything | **YES - still not done, and the miss was bigger than it looked** | `~/.claude/skills` dropping 84 -> 67 read as progress; counting plugin-supplied skills too puts the real total at 274, the widest this doc has ever measured the gap between the estate and its own 3-skill rule. |

## What changed since 2026-09-06

- **`coreyhaines31/marketingskills`:** 47,256 -> **51,523 stars**, 7,367 -> **7,783
  forks**, **119 open issues**, last push **2026-09-05** - re-fetched via `gh api`
  2026-09-25. License file re-read: still verbatim MIT, `Copyright (c) 2025 Corey
  Haines`. Growth continued as expected; the repo has had no new commit in the
  20 days since the last measurement, which is worth naming even though it does
  not change the verdict.
- **`ComposioHQ/awesome-claude-skills`:** 74,575 -> **75,646 stars**, **1,529 open
  issues**, last push **2026-09-18** (active, not abandoned). LICENSE fetch
  re-run 2026-09-25: still 404, still no file. The "cannot use" verdict is
  unchanged and now double-confirmed - this repo is not a passive relic, someone
  is actively maintaining a 75K-star repo with no licence.
- **ZAO's own skill count, narrow measure:** the 2026-09-06 version measured 84
  entries in `~/.claude/skills` + "6 plugins" and projected a "2.6x growth, never
  measured" trend from doc 507's ~32. **Re-measured 2026-09-25: 67 entries** - a
  drop of 17, not a further rise. `~/.claude/skills/.trash/` (5 items) and
  `~/.claude/skills/synced/` (3 items) exist in the dotfiles working tree,
  consistent with an in-progress cleanup rather than a formal, recorded
  measurement of lift. `~/.claude/plugins/installed_plugins.json` is now a
  marketplace-keyed manifest with **5 entries** (`superpowers@claude-plugins-official`,
  `oh-my-mermaid@oh-my-mermaid`, `caveman@caveman`,
  `everything-claude-code@everything-claude-code`,
  `connect-apps@awesome-claude-plugins`) - not the flat count of 6 the prior
  version cited, and not a number comparable to it either way.
- **ZAO's own skill count, the measure that actually matters - CENTRAL CLAIM
  CHANGE:** counting only `~/.claude/skills` was always undercounting what a
  session can actually invoke. Counted on disk 2026-09-25: `everything-claude-code`
  ships **183** skill directories
  (`~/.claude/plugins/cache/everything-claude-code/everything-claude-code/1.10.0/skills`),
  `superpowers` ships **15**, `caveman` ships **5**, `oh-my-mermaid` ships **3**,
  and `connect-apps` adds 1 more command-as-skill entry. **67 (user) + 207
  (plugins) = 274 total skill-shaped entries available in a session** - matching
  the "well over 200 available skills" a live session flagged around the same
  time as this re-research. That is not a decline from 84; it is a **more than
  3x increase**, and it means the "no more than 3 skills total" rule from doc 507
  has been breached by two orders of magnitude, not one. The 2026-09-06 version's
  84 -> "over-budget" framing was already generous; the 2026-09-25 real number
  is worse, and the drop in `~/.claude/skills` alone would have read as good news
  if this doc had not counted plugins.
- **Doc 507 re-validation, the Next Action this doc set for 2026-09-13:** did
  **not** ship. `dev-workflows/507-claude-skills-1116-ecosystem-zao-picks`
  still carries `last-validated: 2026-05-21` - now 127 days stale against the
  library's 30-day SLA. No newer doc in `zao-research-index "skill audit"` /
  `"skill stocktake"` / `"skill count reduction"` records a lift measurement for
  any installed skill.
- **The X post, re-fetched 2026-09-25 via `zao-fetch-x.sh` tier 0:** still live,
  still the same text and numbers claimed (46,800 stars / 7,300 forks for
  `marketingskills`, both since surpassed). Engagement kept climbing: **892
  favourites / 217,825 views**, up from 799 / 187,830 measured 2026-09-06 (+93
  favs, +29,995 views in 19 days).

## What the post actually said, and whether it holds up

Alex Veremeyenko, 2026-09-04, 799 favourites / 187,830 views. Claimed
`marketingskills` by Corey Haines sits at **46,800 stars / 7,300 forks**.

**Verified on the wire 2026-09-06:** `coreyhaines31/marketingskills`,
**47,256 stars, 7,367 forks**, MIT (read from the LICENSE file, not the API
field). The numbers were accurate and are now slightly higher. The post is
honest. Note the account in the URL is `coreyhaines31`, not `coreyhaines` -
guessing the obvious handle 404s, which is the same class of error that made
`@dr_bruce` the wrong person this week.

Its three genuinely interesting mechanics, in its own framing:

1. **A shared-context skill.** One skill, `product-marketing`, holds product,
   audience and positioning. Every other skill reads it first. So copywriting and
   pricing work from the same understanding.
2. **`marketing-council`** - spins up a simulated board of advisors so one
   question gets several expert takes instead of one answer.
3. **`marketing-loops`** - recurring workflows an agent runs on a schedule
   without re-prompting.

## The field, re-measured 2026-09-25 for the two repos with live decisions riding on them

Full 2026-09-06 field table preserved below (not re-swept row by row this pass -
that would be a fresh [DEEP] survey, not a re-validation); the two rows that
carry a Key Decision were re-fetched live.

| Repo | Stars (2026-09-06) | Stars (2026-09-25) | Licence (from file, re-read) | Verdict |
|---|---|---|---|---|
| `ComposioHQ/awesome-claude-skills` | 74,575 | **75,646** | **NONE** - 404 on LICENSE, re-checked | **Cannot use.** Still all-rights-reserved by default |
| `coreyhaines31/marketingskills` | 47,256 | **51,523** | **MIT**, re-read verbatim | The subject. See above |
| `alirezarezvani/claude-skills` | 25,594 | not re-checked this pass | MIT (2026-09-06) | 380 skills. Volume, not curation |
| `travisvn/awesome-claude-skills` | 14,978 | not re-checked this pass | not checked - list repo | Discovery feed only |
| `nidhinjs/prompt-master` | 12,417 | not re-checked this pass | not checked | Single skill, prompt writing |
| `Jeffallan/claude-skills` | 11,341 | not re-checked this pass | MIT (2026-09-06) | 67 full-stack skills |
| `BehiSecc/awesome-claude-skills` | 10,101 | not re-checked this pass | not checked - list repo | Third list of the same thing |
| `SawyerHood/dev-browser` | 6,592 | not re-checked this pass | MIT (2026-09-06) | Browser skill. We have four already |
| `davepoon/buildwithclaude` | 3,419 | not re-checked this pass | not checked | Hub/index |
| `SnailSploit/Claude-Red` | 3,035 | not re-checked this pass | not checked | Offensive security |
| `elementalsouls/Claude-OSINT` | 2,548 | not re-checked this pass | not checked | OSINT recon |

**Three of the top ten (as of 2026-09-06) were the same "awesome-" list**, at
74.5K, 15.0K and 10.1K stars. The ecosystem's most-starred artifact is a list of
links, and the biggest one is still unlicensed on 2026-09-25.

## The finding that decides it, and it is ours already

Doc 507, 2026-05-21, on a 1,116-skill catalog:

> *"Each skill is a permanent context tax on every conversation. Doc 312 already
> cites RoboRhythms: install no more than 3 skills total without measurable lift.
> ZAO already runs ~32 user skills + ECC plugin (200+); we are over-budget
> already."*

**Measured 2026-09-06: `~/.claude/skills` held 84 entries.** In the 108 days
since doc 507 that was a **2.6x increase** from ~32, with no lift measurement
recorded anywhere.

**Re-measured 2026-09-25: `~/.claude/skills` holds 67 entries** - down 17 from
84. `~/.claude/skills/.trash/` and `~/.claude/skills/synced/` both exist in the
dotfiles tree, which is consistent with a cleanup pass having happened, but no
research doc records it as a deliberate, measured "which skills earn their
place" review - `zao-research-index` turns up general skill-audit docs (552,
2113, 1485) but none dated between 2026-09-06 and 2026-09-25 that ties to this
specific count. The honest statement is: the number moved, the reason it moved
is not recorded, and "measured lift" still has not happened for any individual
skill.

That is still the honest answer to "more agentic things like this that can help
us." The constraint was never supply - supply is 75,646 stars of free markdown.
The constraint is that nobody has measured whether a skill earned its place, and
the correct response to a 50-skill repo is therefore **no**, independent of how
good those 50 skills are.

Doc 507 is **127 days old** against a `last-validated` SLA of 30 (was 108 days
on 2026-09-06; this doc's own Next Action to fix that by 2026-09-13 was not
done). It should be re-validated, not quoted forever.

## What to take, concretely

Three ideas, all implementable in files we already own. None requires installing
anything.

| Their mechanic | Our version | Where it goes |
|---|---|---|
| `product-marketing` shared-context file every skill reads first | We already have this and did not name it: `people/handles.csv`, `handoffs/ORCHESTRATOR.md` and the vault-mention rule that protects and surfaces people in both directions. The gap is that our **skills** do not read it, only lanes do | Point `/socials`, `/newsletter` and `zaal-voice` at one shared brand-context file |
| `marketing-council` simulated advisory board | `/autoresearch:predict` already does exactly this - 3-5 expert personas, structured debate, mandatory Devil's Advocate, anti-herd check. **Better than theirs, and unused.** Zero invocations found | Use it before the next material decision instead of building anything |
| `marketing-loops` scheduled recurring workflows | `/loop`, `CronCreate`, the `organizer-tick` automation, `zao-tick`. We have four. One of them went dark for four days without anyone noticing | Job 3 of `zao-orchestrator-2026-09-05` - assert the positives - matters more than a fifth |

`cleanup-branch-noise` from the GPL repo reviewed in
`zao-vault/notes/zao-orchestrator-2026-09-05.md` remains the single most relevant
outside skill to our live problems, and that verdict is unchanged: read it, do
not vendor it.

## Sources

- [alex_verem tweet 2095920078231625991](https://x.com/alex_verem/status/2095920078231625991) - **[FULL]** via `zao-fetch-x.sh` tier 0 (`api.fxtwitter.com`), raw text, re-fetched 2026-09-25 (still live; 892 favs / 217,825 views, up from 799 / 187,830 on 2026-09-06)
- [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) - **[FULL]** via `gh api`, metadata re-fetched + LICENSE file re-read, 2026-09-25 (stars 51,523, forks 7,783, open issues 119, pushed 2026-09-05)
- [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) - **[FULL]** via `gh api`, metadata re-fetched 2026-09-25 (stars 75,646, open issues 1,529, pushed 2026-09-18); LICENSE fetch re-run, confirmed 404/absent
- GitHub repo search, `claude skills` sorted by stars, top 12 - **[FULL]** via `gh search repos`, 2026-09-06 (not re-run 2026-09-25; only the two decision-bearing rows were re-checked)
- LICENSE files for 5 candidate repos - **[FULL]** via `gh api repos/X/contents/LICENSE`, base64-decoded and read, 2026-09-06
- [Doc 507 - dev-workflows/507-claude-skills-1116-ecosystem-zao-picks](../507-claude-skills-1116-ecosystem-zao-picks/) - **[FULL]** local, re-read 2026-09-25; frontmatter confirms `last-validated: 2026-05-21` unchanged
- `~/.claude/skills` and `~/.claude/plugins` counts - **[FULL]** measured on disk, 2026-09-25 (67 user skills; `.trash/` 5 items, `synced/` 3 items; `installed_plugins.json` is a 5-marketplace manifest - superpowers, oh-my-mermaid, caveman, everything-claude-code, connect-apps - not a flat plugin count of 6)
- Per-plugin skill directory counts - **[FULL]** measured on disk, 2026-09-25 (`find .../skills -mindepth 1 -maxdepth 1 -type d`): everything-claude-code 183, superpowers 15, caveman 5, oh-my-mermaid 3, connect-apps 0 skill dirs (1 command). Total plugin-supplied 207; combined with 67 user skills, **274 total invocable skill-shaped entries**
- `zao-research-index "skill audit"` / `"skill stocktake"` / `"skill count reduction"` - **[FULL]** run 2026-09-25; returned general audit docs (552, 2113, 1485, 2150) but none recording a lift measurement or the 84->67 drop
- [Doc 2431 - agents/2431-ali-tiknazoglu-github-watch-glue-first](../../agents/2431-ali-tiknazoglu-github-watch-glue-first/) - **[PARTIAL]** title and topic only; not re-read for this doc, unchanged from 2026-09-06

## Also See

- [dev-workflows/507-claude-skills-1116-ecosystem-zao-picks](../507-claude-skills-1116-ecosystem-zao-picks/) - the 3-skill rule and the over-budget finding this doc rests on; still not re-validated as of 2026-09-25
- [dev-workflows/312-claude-skills-marketplace-ecosystem](../312-claude-skills-marketplace-ecosystem/) - the RoboRhythms measurement behind that rule
- [dev-workflows/154-skills-commands-master-reference](../154-skills-commands-master-reference/) - the ZAO custom skill inventory
- `zao-vault/notes/zao-orchestrator-2026-09-05.md` - the GPL skill repo reviewed the same day, and the three consolidation jobs

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Re-validate doc 507 against the current 274-total-skill reality (67 user + 207 plugin-supplied), not just the 67-entry `~/.claude/skills` count; still carries `last-validated: 2026-05-21`, now 127 days past the 30-day SLA and 12 days past this doc's own prior deadline. Shipped when 507's frontmatter carries a 2026-09 date and cites the total, not just the user-skills subset | @Zaal | PR | 2026-10-01 |
| Record what produced the 84->67 `~/.claude/skills` drop (the `.trash/`/`synced/` reorg) as its own decision or doc, so the next re-research is not guessing at a cleanup from directory names - and pair it with a decision on whether `everything-claude-code`'s 183 skills stay installed wholesale given the 3-skill rule. Shipped when a doc or commit message names the reorg and its criteria, and states a keep/trim call on the ECC plugin | @Zaal | PR | 2026-10-01 |
| Run `/autoresearch:predict` once on a real open decision, to test whether the council mechanic we already own is worth keeping. Missed its 2026-09-13 deadline; shipped when a predict run exists in a transcript and its verdict is recorded | @Zaal | Session | 2026-10-01 |
| Point `/socials`, `/newsletter` and `zaal-voice` at one shared brand-context file instead of three copies of the voice rules. Shipped when all three name the same path | @Zaal | PR | 2026-10-08 |
| Do NOT install marketingskills or any awesome- list. Recorded here so it is not re-litigated | @Zaal | Decision | done 2026-09-06, reconfirmed 2026-09-25 |
