---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-14
superseded-by:
related-docs: 2276, 2280, 2271
original-query: "/zao-research Sweetman and his repos, DEEP tier. IDENTIFY BEFORE YOU GO DEEP - Sweetman, sweetmantech, sweetmandm, masweetman. Once identified: what they build, the repos that matter, the stack, how active it is (commits, not stars), what is reusable versus a demo, license on anything we might adopt, and who they work with. Then the ZAO lens - what overlaps with what we already run, what is worth adopting, and whether this is someone Zaal should be talking to rather than just reading."
tier: DEEP
---

# 2281 - sweetman.eth: the closest thing to ZAO that someone else is already building

> **Goal:** Identify the right Sweetman, read what he ships, and answer whether Zaal should be reading him or talking to him.

## The one-line answer

**Talk to him.** He is an onchain-music dev shipping an artist-first product with a named artist, on our stack, packaging his engineering process as MIT Claude Code skills - and one of those skills enforces exactly the defect class doc 2276 just found on our own machine.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **ADOPT the "no dark skills" resolver check** from `sweetmantech/in_process_skills` (**MIT**) | Its `scripts/check_resolvable.py` fails the build on a skill with no route and a route with no skill. Doc 2276 found **both** classes on this machine: `learned/` (an empty skill dir) and `spawn` (in the roster with no manifest) |
| 2 | **ADOPT the `[domain]-[verb]-[noun]` skill naming convention** | Recoup names every skill `recoup-[domain]-[verb]-[noun]` *"so the `/` list clusters by domain."* Our 66-entry list clusters by nothing |
| 3 | **REACH OUT.** This is a person read, not just a code read | Onchain music, artist-first, Supabase, agent skills, ships daily. The overlap with ZAO is the highest of anyone researched this month |
| 4 | **Talk to ziad (`techeng322`) too, not only sweetman** | On `in_process_web` he has **4,075 contributions to sweetman's 148**. If the conversation is technical, the volume builder is someone else |
| 5 | **Do NOT copy from `recoupable/skills` yet** | Its license resolves to `NOASSERTION`. `in_process_skills` is cleanly MIT; the Recoup one needs a licence question before any reuse |
| 6 | **Treat `personal-agent` and `in-process-protocol` as dormant** | **0 commits** each since 2026-07-15. Named attractively, not currently built |

## Identification, done properly

Four candidates were checked by fetch, not inference. Only one is in Zaal's world, and it is not close:

| Account | Name | Bio | Followers | Repos | Verdict |
|---|---|---|---:|---:|---|
| **`sweetmantech`** | **sweetman.eth** | *"the dev for onchain music 📀 \| helping musicians get paid \| viva la música 🇨🇴"* | **247** | **273** | **This is him** |
| `Sweetman` | James Sweetman | none | 11 | 23 | No music/onchain/Farcaster footprint |
| `sweetmandm` | David Sweetman | none | 25 | 39 | Personal site, no overlap |
| `masweetman` | Michael Sweetman | none, works at **Bayer** | 8 | 20 | No overlap |

`sweetmantech` lists company *"dev for onchain music"*, blog `research.recoupable.dev`, location Colombia, account created 2016-11-04. **Not ambiguous**, so the two-plausible-candidates stop rule did not trigger.

## What he actually builds

Two live product families, both pushed the day this was written.

### In Process - "By LATASHÁ"

From `in_process_web`'s README:

> **In Process By LATASHÁ** - A timeline for artists. A protocol, an API, and multiple front-end clients including Web, Telegram, and SMS.
>
> In Process is a living archive of artistic evolution where artists, builders, and creatives can upload their work-in-progress and mint it onchain to a collective timeline. Your community, fans, and patrons can collect, comment, and support work as it unfolds.

**The product is fronted by a named artist and built by a dev.** That is ZAO's own shape, and it is the single most important structural fact in this doc.

Features that map onto things ZAO has debated: onchain timeline, "Moments" (sketches, demos, journals, footage), flexible/backdated timestamping, a collective feed, per-moment pricing paid **directly to the artist's wallet**, and explicit "Web2 + Web3" support for creators new to onchain.

The repo family is a real architecture, not one app: `in_process_web`, `_api`, `_database`, `_mono`, `_docs`, `_skills`, `_indexer`, `-protocol`, plus several event indexers.

### Recoup - "a record label in a box"

The `recoupable` org (34 public repos, created 2025-06-21, `recoupable.com`) is the company behind his blog. Its `skills` repo README:

> AI agent skills for the music industry - a record label in a box. One install gives your agent the whole Recoup platform: artist setup & API access, research, catalog deals, content, song analysis, and releases.

Active repos pushed within the last day include `skills`, `chat` (11 stars, the most-starred thing in either org), `api`, `tasks`, `database` (*"Supabase migrations for Recoup"*), `docs`, `marketing`, `recoup-playbook`, and two Apache-2 plugins.

**`database` = Supabase migrations.** Same database as ZAOOS.

## Activity measured in commits, not stars

Stars are near-zero across everything - `in_process_web` has 2, `recoupable/chat` has 11. By stars this looks abandoned. It is the opposite.

Commits since **2026-07-15**:

| Repo | Commits | Read |
|---|---:|---|
| `in_process_web` | **≥100** (page cap - the true figure is higher) | The hot path |
| `in_process_api` | **71** | Also hot |
| `in_process_skills` | 3 | Stable, small, deliberate |
| `in-process-protocol` | **0** | Dormant |
| `personal-agent` | **0** | Dormant |

**This is the clearest case yet for the brief's own instruction.** A star count would have ranked this person as irrelevant; a commit count shows two repos under heavy daily development.

## Who he works with

`in_process_web` contributors, by contribution count:

| Contributor | Contributions | Who |
|---|---:|---|
| `techeng322` | **4,075** | **ziad** (`ziadtech.eth`) - *"software engineer, the dev of onchain"* |
| `sweetmantech` | 148 | sweetman.eth |
| `a-kurt` | 67 | Atakan Kurt |
| `0xgonzalo` | 19 | Gonzalo, Argentina |
| `0xSolcroot` | 17 | - |
| `true-eye` | 8 | - |
| `Web3Knight` | 6 | - |
| `cursor[bot]` | 3 | An agent |

**Correcting the brief's framing:** these are sweetman's *repos*, but they are largely ziad's *code* - by 27x on the flagship. Plus LATASHÁ as the artist principal. So "Sweetman and his repos" is really a small team of at least seven humans and one bot, with sweetman as the namespace owner and connector.

For an outreach decision that matters: **sweetman is the person to talk to about collaboration; ziad is the person to talk to about the code.**

## The thing worth adopting today

`sweetmantech/in_process_skills`, **MIT, "Copyright (c) 2026 Sweets Sweetman"**. Its README frames it unusually well:

> Agent skills for building In Process - **the engineering process, not the product.** One install teaches your agent how user feedback becomes a high-signal GitHub tracking issue, and how that issue gets delivered documentation-first and test-first across the `in_process` submodules.

It ships one skill (`inprocess-dev`), a `RESOLVER.md`, and three enforcement scripts: `check_resolvable.py`, `portability_lint.py`, `validate_manifests.py`.

### RESOLVER.md - a dispatch table with a build check behind it

> The dispatch table for this plugin. Every skill in `skills/` must have a row here, and every skill named here must exist - `scripts/check_resolvable.py` fails the build otherwise (**"no dark skills"**).
>
> Match on **intent**, not keywords. When two rows could fit, **the more specific row wins**.

That last line is `first-handler-wins.md` rule 1, arrived at independently, for skills instead of message handlers.

`check_resolvable.py`'s own docstring names the two fatal cases:

> 1. **UNREACHABLE** - a `skills/<name>/SKILL.md` with no row in RESOLVER.md.
> 2. **BROKEN ROUTE** - an `inprocess-*` token in RESOLVER.md with no matching skill dir.
>
> A skill that exists but isn't reachable from the resolver is *"a surgeon the hospital can't find"*; a route that points at a deleted skill sends the agent nowhere.

**Doc 2276 found both classes on this machine three hours ago**, without having seen this repo:

| Our defect | His category |
|---|---|
| `~/.claude/skills/learned/` - an empty directory, no manifest, absent from the roster | UNREACHABLE, in its worst form |
| `spawn` - in the skills roster with a full description, **no `SKILL.md` found anywhere** | BROKEN ROUTE |

We diagnosed the disease and he already wrote the test. That is the adoption, and it is a small script under a permissive licence.

## The ZAO lens

### What overlaps with what we already run - checked, not assumed

| Thing | Ours | His | Read |
|---|---|---|---|
| Supabase as the database | ZAOOS, RLS throughout | `recoupable/database` | Same stack |
| Agent skills as a distributed plugin | 66 entries in `~/.claude/skills` (doc 2276) | Two marketplaces, `/plugin marketplace add` | **He packages; we accumulate** |
| Artist-first product with a named principal | The ZAO, WaveWarZ | In Process by LATASHÁ | Same shape |
| Onchain payment direct to artist | ZAO contribution circles, Sparkz | Per-moment pricing to the artist's wallet | Convergent |
| Feedback -> tracked issue -> doc-first, test-first delivery | `agent-loops.md`, `loop-evals.md`, the fix-PR pipeline in `bot/src/hermes/` | `inprocess-dev`, one skill | **We have more rules; he has fewer, enforced by a script** |
| Skill hygiene enforcement | **None** | `check_resolvable.py` + 2 more | **Genuine gap** |

### Where he is ahead of us

**He packages his process; we accumulate ours.** We have 28 rules in `.claude/rules/` and 66 skills with no dispatch table and no reachability check. He has one skill, a resolver, and a build that fails when the two disagree. Doc 2276's findings are the cost of that difference, measured.

### Where we are ahead

Our verification discipline is deeper - `loop-evals.md`'s default-FAIL evaluator, the anti-fabrication and research-grounding rules, and the collision guard that caught a doc-number clash mid-write today. His repos show no equivalent published rulebook.

## Should Zaal talk to him

**Yes, and he is unusually reachable.** He publishes openly, installs via a public marketplace, works with a named artist rather than anonymously, and his stated mission - *"helping musicians get paid"* - is ZAO's sentence with different words.

Concrete openings, in order of strength:

1. **The skills-hygiene exchange.** We have a freshly measured 66-skill estate with named defects (doc 2276); he has the check that catches them. That is a real trade, not a cold ask.
2. **Supabase + onchain-music schema.** Both of us run Supabase behind a music product. Schema and RLS lessons transfer directly.
3. **Artist-first structure.** In Process is fronted by LATASHÁ; ZAO is a community of artists. The comparison is worth an hour of conversation on its own.

**Do not open with a request to reuse his code**, particularly anything under `recoupable/skills` while its licence reads `NOASSERTION`.

## Licences, since we might adopt

| Repo | Licence | Reusable? |
|---|---|---|
| `sweetmantech/in_process_skills` | **MIT** ("Sweets Sweetman", 2026) | **Yes**, with attribution |
| `sweetmantech/in_process_web` | MIT | Yes |
| `sweetmantech/in-process-protocol`, `in_process_indexer`, `in_process_docs`, `personal-agent`, `devs_pr_bot`, `credit-card-adapters` | MIT | Yes |
| `sweetmantech/in_process_api`, `_database`, `_mono`, `_tasks` | **None** | No - all rights reserved |
| `recoupable/skills` | **NOASSERTION** | **Ask first** |
| `recoupable/recoup-research-plugin`, `recoup-platform-plugin` | Apache-2.0 | Yes, with NOTICE |

## Findings

1. **`sweetmantech` is sweetman.eth**, and the other three Sweetmans have no overlap at all - identification was decisive, not a judgement call.
2. **Stars would have hidden him entirely.** 2 stars on the flagship, ≥100 commits in a month.
3. **The repos are his; the code is largely ziad's** - 4,075 to 148 on `in_process_web`.
4. **In Process is artist-fronted** (LATASHÁ), which is ZAO's own structure built by someone else.
5. **He packages his engineering process as an installable plugin.** We have more process and less packaging.
6. **His `check_resolvable.py` tests for the exact two defects doc 2276 found here**, and it is MIT.
7. **Recoup runs Supabase**, so the stack conversation is concrete rather than abstract.

## Also See

- [Doc 2276](../../dev-workflows/2276-skills-estate-audit/) - the audit whose findings his resolver check would have caught
- [Doc 2280](../2280-austin-griffith-clawdbot-autonomy/) - the other builder studied today, and the same licence-before-adoption discipline
- [Doc 2271](../2271-peter-skill-graph-loop-adoption/) - Peter, the third harness read this month

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Port `check_resolvable.py` to `~/.claude/skills` with a ZAO `RESOLVER.md`. Shipped when it exits non-zero on `learned/` and `spawn`, the two defects doc 2276 named. Credit MIT / Sweets Sweetman in the header. | @Zaal | PR | 2026-08-20 |
| Reach out to sweetman.eth, leading with the skills-hygiene trade rather than a code request | @Zaal | Outbound (gated) | 2026-08-18 |
| Adopt `[domain]-[verb]-[noun]` naming for new ZAO skills so the `/` list clusters | @Zaal | PR | 2026-08-24 |
| Ask about `recoupable/skills` licensing before any reuse | @Zaal | Outbound (gated) | 2026-08-20 |
| Compare Recoup's Supabase schema against ZAOOS's once a conversation is open | @Zaal | Research | 2026-09-01 |

## Sources

- `gh api users/{Sweetman,sweetmantech,sweetmandm,masweetman}` - **[FULL]** method: GitHub REST. All four identity rows verbatim; this is the disambiguation evidence.
- `api.github.com/users/sweetmantech/repos?sort=pushed&per_page=25` - **[FULL]** method: REST via curl. Repo names, dates, licences, stars.
- Commit counts per repo - **[FULL]** method: `repos/{r}/commits?since=2026-07-15&per_page=100`, counted from the JSON. `in_process_web` hit the 100-item page cap, so it is reported as a floor.
- `in_process_web` README + contributors - **[FULL]** method: `gh api`, README base64-decoded. Contribution counts verbatim.
- `in_process_skills` README, `RESOLVER.md`, `LICENSE`, `scripts/check_resolvable.py` - **[FULL]** method: `gh api` contents, base64-decoded. Every quote is from the decoded file.
- `orgs/recoupable` + its repos + `recoupable/skills` README and licence field - **[FULL]** method: REST.
- `users/techeng322`, `a-kurt`, `0xgonzalo` - **[FULL]** method: REST.
- `research.recoupable.dev`, `inprocess.world`, `recoupable.com` - **[FAILED]** method: not fetched this run. The GitHub evidence answered every question asked, and I would rather list this as unfetched than imply coverage I do not have. Obvious next source if this needs deepening.
- Farcaster presence - **[FAILED]** not checked. Given the brief's framing, worth a pass before any outreach.

## Credit

**In Process** is **LATASHÁ**'s product, built by **sweetman.eth** (`sweetmantech`), **ziad** (`techeng322`, `ziadtech.eth`), Atakan Kurt, Gonzalo and others. `in_process_skills` is **MIT, Copyright (c) 2026 Sweets Sweetman** - the "no dark skills" resolver pattern recommended above is his, and any ZAO port must carry that attribution. **Recoup** (`recoupable`) is the company; its `skills` repo licence is unresolved and nothing from it is copied here.
