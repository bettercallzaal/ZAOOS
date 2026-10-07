---
doc: 2526
title: The ZAO estate, measured - 240 repos, four CRM surfaces, and a library with no graph
topic: estate
tier: STANDARD
original-query: "review all our repos, manage the repo CRM and the ZAO CRM and the GitHub CRM together, and work out whether ZAOOS should become the public Obsidian"
created: 2026-09-20
last-validated: 2026-09-20
status: measured
---

# 2526 - The ZAO estate, measured

Everything here was counted on 2026-09-20 with the command that produced it named
beside the number. Nothing is recalled. Where a count could not be taken, it says
UNKNOWN rather than zero.

## Key decisions this doc supports

1. **ZAOOS can become the public Obsidian, and the blocker is not tooling - it is
   that 95% of its documents link to nothing.**
2. **The four CRM surfaces do not reconcile, and the field built to reconcile them
   is wrong 22 times out of 27.**
3. **WalkerEnterprise holds no work of Zaal's.** Leaving it costs nothing.

---

## 1. The repo estate: 240 repositories

`gh api users/<owner>/repos --paginate` and `orgs/<org>/repos --paginate`, all six
owners, 2026-09-20.

| Owner | Total | Forks | Archived | Original |
|---|---:|---:|---:|---:|
| bettercallzaal | 111 | 11 | 21 | **79** |
| WalkerEnterprise | 95 | 68 | 0 | 27 |
| ZAODEVZ | 20 | 1 | 0 | **19** |
| Build-Africa-DAO | 9 | 0 | 0 | 9 |
| Nouns-Dao-Africa | 4 | 2 | 0 | 2 |
| ZAO-DEVZ | 1 | 0 | 0 | 1 |

**Staleness, by last push:**

| Age | Repos |
|---|---:|
| 0-7 days | 27 |
| 8-30 days | 55 |
| 31-90 days | 20 |
| 91-365 days | 59 |
| **over a year** | **79** |

79 repositories have not been touched in a year. That is a third of the estate.

## 2. WalkerEnterprise holds nothing of ours

The question asked was whether its forks could be consolidated into one repo
before leaving the org. **They cannot, because there is nothing in them.**

    all 68 forks scanned for a commit authored by bettercallzaal  ->  0
    control: the same query against bettercallzaal/ZAOOS          ->  1 row

Of the 27 non-forks, exactly one carries a commit by him:
`Apple-Developer-26-BETA-9-WATCH-OS-iOS-`, which is **0KB**. The remainder is
another business - JohnDaWalka poker coaching, WE-CFM, WeCrypto.

The 12 open Dependabot PRs there are on repositories he has never committed to.

**Consolidation is unnecessary. Leaving is a decision, not a migration.**

## 3. The CRM: four surfaces, ~1,484 records, no reconciliation

| Surface | Records | Measured how |
|---|---:|---|
| Vault people notes | 78 | `ls ~/zao-vault/people/*.md` |
| GitHub `people.jsonl` | 67 | line count |
| `creators.csv` | 141 | line count minus header |
| Supabase `contacts` | 1,198 | **UNKNOWN as of tonight** - OAuth never completed |

The Supabase figure is carried from an earlier session and **was not
re-measured**. It is the only number in this document that is not fresh.

### The reconciliation field is wrong 22 times out of 27

`people.jsonl` already carries `in_vault`, `vault_file` and `in_creators_csv` -
the schema for exactly this job. The values do not hold:

    rows claiming in_vault: true      27
      with a vault_file that exists    5
      with NO vault_file set          22
      with a vault_file now gone       0

    rows with in_creators_csv: true    0    (against 141 rows in creators.csv)

So 22 rows assert a vault link they cannot name. **A claim with no referent is
the shape this estate has been losing time to all week** - the same form as an
empty grep read as an absence.

### The surfaces barely overlap

Of 78 vault people notes, **73 are named by no row** in the GitHub CRM. Of 67
GitHub people, only **2** have ever contributed to one of our repositories; the
rest are follow-graph (44 we follow, 12 mutual, 11 follow us).

`bettercallzaal/zao-crm` exists and its description is precisely this job -
"Reconciler for ZAO's scattered CRM surfaces... Measures before it writes."
**The local `~/zao-crm` is not that repository**: it is an unrelated Next.js
scaffold from 27 June with no `.git` directory at all.

## 4. ZAOOS as the public Obsidian

The private vault is `~/zao-vault`. ZAOOS is the public counterpart and already
holds the material: **2,362 research documents across 17 topics**, 3,691 markdown
files, 6,802 files, 180MB, public.

**It is not a vault, and one number says why.** Sampling 300 research READMEs:

| Property | Count | Share |
|---|---:|---:|
| contains `[[wikilinks]]` | 14 | 5% |
| contains a `](*.md)` link | 29 | 10% |
| has YAML frontmatter | 158 | 53% |

**95% of documents link to nothing.** An Obsidian graph over this renders 2,362
unconnected points. The value of a vault is the graph; there is no graph.

There is also no `.obsidian/` directory anywhere in the repository, and
`research/_graph` exists as an empty folder. Nothing has ever opened it as a vault.

### Doc numbers do not identify documents

**This was diagnosed on 2026-07-09 and has been waiting on a decision since
2026-07-11.** `research/estate/README.md` problem 3 records it, offers four fixes
(shared allocator, ranges per agent, date IDs, or accept collisions and key on
the slug), and ends "Recommendation pending Zaal's call."

**Work did happen after that, and it worked.** The July note's headline cases
have largely been resolved:

| Doc | July 2026 | Today |
|---|---:|---:|
| 441 | 13 documents | **1** |
| 600 | 8 | 2 |
| 051 | 7 | 1 |

**But the July total and this document's total are NOT comparable, and saying
otherwise would be the exact error this document is about.** July counted with
`git ls-files research/*/[0-9]*`, which matches any numbered path including
files inside a doc. That method returns **357** today. This document counts only
directories that contain a `README.md`, and returns **216**. Two instruments, two
answers, one library. No trend can be read from 202 to 216.


Full inventory in `doc-number-collisions.md` beside this file as a table. Counted over
2,143 numbered documents that have a README:

    colliding numbers   216
    documents affected  458   (21.4% of the library)

Worst cases:

| Number | Documents | Example collision |
|---|---:|---|
| 313 | **5** | `infrastructure/313-metaverse-3d-virtual-world-zao` vs four separate `music/313-*` docs |
| 599 | 4 | agents, business, events, infrastructure - four unrelated topics |
| 673 | 3 | `agents/673-zao-craig-spec`, `agents/673-zoe-bonfires`, `dev-workflows/673-meeting-capture-skill` |
| 1079 | 3 | agents, business, wavewarz |
| 547 | 3 | agents, business, community |

**Doc 673 is the one that proves the cost.** The `/meeting` skill instructs every
session that runs it: *"Doc 673 has full design + decisions. Read it if context is
needed beyond this file."* Three documents answer to 673. A live instruction,
followed exactly, lands on a coin flip between three files.

## 5. What this means for the build

**The link extractor is the first thing worth building**, because it does two jobs
in one pass. Every document already references others - as bare numbers, as paths,
in "Also see" sections. Converting those into real `[[wikilinks]]`:

1. turns the graph on, which is the whole point of the vault framing, and
2. must resolve each number to a path, so **every ambiguous reference surfaces as
   a list rather than staying invisible**.

Zaal's rulings, 2026-09-20:

- **Public-to-private references use an explicit `[[vault:name]]` marker**, written
  by hand, never generated. Noted at the time: this publishes the existence and
  title of a private note, which is why it is opt-in per link rather than automatic.
- **Collisions are inventoried, not renumbered.** Nothing moves without his word.
  This document and its JSON are that inventory.
- **This research lives in ZAOOS**, public.

## Next actions

- [ ] Build the link extractor: bare doc references -> `[[wikilinks]]`, emitting an
      unresolvable-reference report. Nothing renumbered.
- [ ] Commit a `.obsidian/` configuration so the repository opens as a vault.
- [ ] Normalise frontmatter across the 47% of documents that lack it.
- [ ] Fix `in_vault` in `people.jsonl` to name its file or read false; populate
      `in_creators_csv` against the 141 rows.
- [ ] **Re-measure the Supabase `contacts` count.** It is the one stale number here.
- [ ] Zaal's call: leave WalkerEnterprise. No migration required.
- [ ] Zaal's call: the six Akili PRs, four of which target a repository whose own
      README says it is superseded.

## Sources

- `gh api users/{bettercallzaal,ZAODEVZ}/repos --paginate`, `orgs/{...}/repos` - 2026-09-20 [FULL]
- `gh api repos/{owner}/{repo}/commits?author=bettercallzaal` across 95 WalkerEnterprise repos [FULL]
- `~/zao-vault/people/github/people.jsonl`, `creators.csv`, `people/*.md` [FULL]
- `Build-Africa-DAO/Akili` README, which declares itself superseded [FULL]
- `git ls-tree -r origin/main` over ZAOOS for the document census [FULL]
- Supabase `contacts` row count - **[FAILED]**, OAuth incomplete, figure carried from a prior session
