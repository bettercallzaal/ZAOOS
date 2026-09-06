---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-09-06
related-docs: 507, 312, 154, 2431
original-query: "http://x.com/alex_verem/status/2095920078231625991 please research this /zao-research more agentic things like this that can help us"
tier: STANDARD
---

# 2467 - Agent-skill collections at scale: what to take, what to refuse

> **Goal:** Zaal sent a viral X post about a 47K-star marketing-skill repo and asked for more agentic things like it. Decide what the ZAO estate should install, and answer the prior question of whether it should install anything at all.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Install `coreyhaines31/marketingskills` (50 skills) | **NO** | We are already 84 user skills + 6 plugins deep. Doc 507 (2026-05-21) set the rule: *"no more than 3 skills total without measurable lift"* and called us over-budget at ~32. We have since **grown 2.6x and never measured lift once.** |
| Take its three ideas instead | **YES** | Shared-context file, simulated council, scheduled loops. All three we can implement in files we already own, in an afternoon, with zero context tax from 47 unused skills. |
| Install `ComposioHQ/awesome-claude-skills` (74.5K stars) | **NO - LEGALLY CANNOT** | **No LICENSE file.** Per `.claude/rules/credit-attribution.md`, absent licence is all-rights-reserved, not public domain. The largest repo in this space is unusable, and its star count is the reason someone will try. |
| Adopt `SawyerHood/dev-browser` (5.6K, MIT) | **NO** | We already run `claude-in-chrome`, `/browse`, `/gstack` and Playwright MCP. Four browser paths is already three too many. |
| Measure our own skill load before adding anything | **YES - do this first** | It is the only action here that changes an outcome rather than adding surface. |

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

## The field, measured 2026-09-06

Searched GitHub by stars. Licence read from the **file** in every row.

| Repo | Stars | Licence (from file) | Verdict |
|---|---|---|---|
| `ComposioHQ/awesome-claude-skills` | **74,575** | **NONE** - no LICENSE file | **Cannot use.** All-rights-reserved by default |
| `alirezarezvani/claude-skills` | 25,594 | MIT | 380 skills. Volume, not curation |
| `travisvn/awesome-claude-skills` | 14,978 | not checked - list repo | Discovery feed only |
| `nidhinjs/prompt-master` | 12,417 | not checked | Single skill, prompt writing |
| `Jeffallan/claude-skills` | 11,341 | MIT | 67 full-stack skills |
| `BehiSecc/awesome-claude-skills` | 10,101 | not checked - list repo | Third list of the same thing |
| `SawyerHood/dev-browser` | 6,592 | MIT | Browser skill. We have four already |
| `davepoon/buildwithclaude` | 3,419 | not checked | Hub/index |
| `SnailSploit/Claude-Red` | 3,035 | not checked | Offensive security |
| `elementalsouls/Claude-OSINT` | 2,548 | not checked | OSINT recon |
| `coreyhaines31/marketingskills` | **47,256** | **MIT** | The subject. See above |

**Three of the top ten are the same "awesome-" list**, at 74.5K, 15.0K and 10.1K
stars. The ecosystem's most-starred artifact is a list of links, and the biggest
one is unlicensed.

## The finding that decides it, and it is ours already

Doc 507, 2026-05-21, on a 1,116-skill catalog:

> *"Each skill is a permanent context tax on every conversation. Doc 312 already
> cites RoboRhythms: install no more than 3 skills total without measurable lift.
> ZAO already runs ~32 user skills + ECC plugin (200+); we are over-budget
> already."*

**Measured today: `~/.claude/skills` holds 84 entries and `~/.claude/plugins`
holds 6.** In the 108 days since that doc we went from ~32 to 84 - a **2.6x
increase** - and there is no measurement anywhere in the library of what any of
them bought.

That is the honest answer to "more agentic things like this that can help us."
The constraint is not supply. Supply is 74,575 stars of free markdown. The
constraint is that we have never once measured whether a skill earned its place,
and the correct response to a 50-skill repo is therefore **no**, independent of
how good those 50 skills are.

Doc 507 is 108 days old against a `last-validated` SLA of 30. It should be
re-validated, not quoted forever.

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

- [alex_verem tweet 2095920078231625991](https://x.com/alex_verem/status/2095920078231625991) - **[FULL]** via `zao-fetch-x.sh` tier 0 (`api.fxtwitter.com`), raw text, 2026-09-06
- [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) - **[FULL]** via `gh api`, metadata + LICENSE file decoded, 2026-09-06
- GitHub repo search, `claude skills` sorted by stars, top 12 - **[FULL]** via `gh search repos`, 2026-09-06
- LICENSE files for 5 candidate repos - **[FULL]** via `gh api repos/X/contents/LICENSE`, base64-decoded and read, 2026-09-06
- [Doc 507 - Claude Skills 1,116 Ecosystem, ZAO Curated Picks](../507-claude-skills-1116-ecosystem-zao-picks/) - **[FULL]** local
- `~/.claude/skills` and `~/.claude/plugins` counts - **[FULL]** measured on disk, 2026-09-06
- [Doc 2431 - Ali Tiknazoglu GitHub watch, glue-first](../../agents/2431-ali-tiknazoglu-github-watch-glue-first/) - **[PARTIAL]** title and topic only; not re-read for this doc

## Also See

- [Doc 507](../507-claude-skills-1116-ecosystem-zao-picks/) - the 3-skill rule and the over-budget finding this doc rests on
- [Doc 312](../312-*/) - the RoboRhythms measurement behind that rule
- [Doc 154](../154-*/) - the ZAO custom skill inventory
- `zao-vault/notes/zao-orchestrator-2026-09-05.md` - the GPL skill repo reviewed the same day, and the three consolidation jobs

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Re-validate doc 507 against the 84-skill reality; its `last-validated` is 108 days past a 30-day SLA. Shipped when 507's frontmatter carries a 2026-09 date and a current count | @Zaal | PR | 2026-09-13 |
| Run `/autoresearch:predict` once on a real open decision, to test whether the council mechanic we already own is worth keeping. Shipped when a predict run exists in a transcript and its verdict is recorded | @Zaal | Session | 2026-09-13 |
| Point `/socials`, `/newsletter` and `zaal-voice` at one shared brand-context file instead of three copies of the voice rules. Shipped when all three name the same path | @Zaal | PR | 2026-09-20 |
| Do NOT install marketingskills or any awesome- list. Recorded here so it is not re-litigated | @Zaal | Decision | done 2026-09-06 |
