---
topic: business
type: decision
status: research-complete
last-validated: 2026-08-25
superseded-by:
related-docs: "2408, 2411, 2412, 2153"
original-query: "review our repos and see what makes the most sense on how to put this into a ZAAL timeline and also zaal current teams, i wnana update the bettercallzaal website with all the info of all of what we have done"
tier: STANDARD
---

# 2415 - The timeline already exists. It has 598 entries and the website does not read it.

> **Goal:** Zaal wants a ZAAL timeline plus current teams on bettercallzaal.com.
> Checking what is already built answers most of it and changes the job from
> "build" to "connect".

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Do not build a timeline. Generate it from ZM.** | `zao-media` already holds **598 logged entries** back to October 2023, each with a date, a `class` of earned or produced, brands, URLs, a summary and clip candidates. That is a timeline with a schema. |
| 2 | **The BCZ site should CONSUME ZM's JSON, never copy it.** | ZM's own README states the design: source of truth is `content/*.json`, everything else is generated. A hand-maintained second copy on the website is the drift machine (`icm-grounding.md`, same failure). |
| 3 | **The site already has the pattern to copy.** | `brands.json` is `version 1.1.0` with a `generated` field. A `media.json` built the same way is an extension of an existing convention, not a new system. |
| 4 | **Fix `metrics.json` BEFORE adding surfaces.** | It calls itself *"CANONICAL METRICS - single source of truth. Every surface must match these numbers."* It is stamped **`_updated: 2026-06-11`** - 2.5 months old - and the site's promise is **"Receipts, not vanity."** More surfaces multiply a stale number. |
| 5 | **"Current teams" needs a publishing decision first, not a build.** | The roster now exists (`zao-vault/projects/TEAMS.md`, 52 `people/` notes) but the vault is **private** and full of things that should not be published. Which parts are public is Zaal's call, not a derivable fact. |

## What already exists, measured 2026-08-25

### `zao-media` (ZM) - the timeline, already built

| | |
|---|---|
| Entries in `media-log.md` | **598** |
| Earliest | **2023-10-28** (a COC space) |
| Source of truth | `content/*.json` |
| Generator | `build.mjs` |
| Outputs | `media-log.md`, `index.html`, `feed.xml`, one page per appearance |
| Live at | `bettercallzaal.github.io/zao-media/` |
| Also holds | `media-crm.csv`, `appearances/`, `docs/` |
| Last push | 2026-08-08 |

Its header says it plainly:

> `# ZM - ZAO Media log (GENERATED - edit content/*.json, then node build.mjs)`

**Every field a timeline needs is already there.** A sample entry carries title,
`Class: earned`, `Date: 2026-07-30 (live)`, host, brands, a ZM page URL, three
external URLs, a summary, and four timestamped clip candidates.

The `class` field is the important one: **it already separates EARNED media from
PRODUCED media**, which is exactly the distinction Zaal asked about.

### `bettercallzaalwebsite` - what it has and has not

| Has | Does not have |
|---|---|
| `index.html` (108KB, single page) | any timeline |
| `brands.json` (35KB, v1.1.0, generated) | any media feed |
| `data/metrics.json` (canonical metrics) | any teams data |
| `llms.txt`, `kit.html`, `nexus.html` | any link to ZM |
| POIDH pages, claims, leaderboard JSON | |

Last push 2026-08-20, so the site is live and maintained - it simply has no
connection to the media system.

### `bcz-journal` - a third surface, quiet since May

Public Jekyll journal, "building The ZAO, WaveWarZ, and ZABAL in public", with
`journal/`, `projects/`, `research/`, `ecosystem/`. **Last push 2026-05-22.**
Three months quiet. Worth a decision: revive, redirect, or archive.

## The recommended shape

**One build step, not a new system:**

```
zao-media/content/*.json   (598 entries, source of truth)
        |
        |  build step in the BCZ site
        v
bettercallzaalwebsite/data/media.json
        |
        v
a timeline section in index.html, filterable by class + brand
```

Why this and not anything else:

- **ZM stays the only place anything is logged.** Its whole design is
  log-once-generate-outward. This adds one more outward target.
- **The filters come free.** Every entry already has `class` and `brands`, so
  earned-vs-produced and per-brand views need no new data.
- **It matches `brands.json`.** Same repo, same generated-data convention, same
  update path.

## The receipts problem, which is the real risk

`data/metrics.json` opens with its own rule:

> *"CANONICAL METRICS - single source of truth. Every surface (index.html,
> resume/, brands.json, kit, OG card) must match these numbers... Conflicting
> receipts undermine the 'Receipts, not vanity' promise."*

It is stamped **2026-06-11**.

One concrete, checkable drift: the WaveWarZ block reads `459 SOL` and
`~$39K`, which implies about **$85/SOL**. Fetched live on 2026-08-25, the
WaveWarZ Intelligence site shows **1 SOL = $99.65**. The same 459 SOL is
**~$45.7K** today - the dollar figure is understated by roughly 17% on price
alone, before any new volume.

A second, from arithmetic rather than a fetch: governance reads *"100+ weekly
fractal meetings (week 100 hit May 2026)"*. At roughly one a week that is now
around week 115.

**Adding a 598-entry timeline on top of a stale metrics file multiplies the
staleness across every new surface.** Fix the source first; that is the file's
own instruction.

## Current teams - what is blocked and why

The roster is now real: `zao-vault/projects/TEAMS.md` plus **52 `people/` notes**,
built over 2026-08-24/25. It covers 20+ teams and who is on each.

**It cannot be published as-is.** The vault is private and deliberately holds
things that must not go outward - one person's note exists only to explain why he
is quiet, and is marked private for that reason.

Two questions only Zaal can answer:

1. **Which teams are public?** The shared roster artifact already omits his day
   job and consulting work.
2. **Which people are named?** Naming a collaborator on a public site is
   publishing something about them, not about Zaal.

**And the public layer already exists but is thin.** ICM boxes are the canonical
AI-readable surface. Checked 2026-08-25: **`wavewarz` is the only one of four
sampled boxes with a `## Team` section, and it names one of three people** (doc
2408's correction, merged as PR #3317). If teams go on the website, the boxes are where
they should be authored, so the site and every agent read the same thing.

## Honest limits

- **The 598 count is `media-log.md` headings**, not a validated parse of
  `content/*.json`. The real entry count could differ if the generator emits more
  than one heading per entry.
- **WaveWarZ battle and volume figures were NOT verified.** The Intelligence site
  is JS-rendered and the raw HTML carries only the shell and copy. The only live
  number read was the SOL price. Treat `459 SOL` / `950+ battles` as unchecked,
  not as wrong.
- **`build.mjs` was not read.** The integration shape above assumes it can emit an
  extra JSON target; that is likely and unconfirmed.
- **No estimate of effort is given**, per standing instruction.

## Also See

- [Doc 2408](../../community/2408-zao-teams-and-collaborators-audit/) - the teams audit this would publish from
- [Doc 2411](../../dev-workflows/2411-tool-usage-audit-measured/) - the measurement habit this doc applies. merged as PR #3311
- [Doc 2412](../../infrastructure/2412-dead-mcp-servers-vault-board-integration/) - same conclusion, different subject: open the store before designing for it. merged as PR #3312

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Refresh `data/metrics.json` from live sources; done when `_updated` is today and the SOL figure matches the Intelligence site | @Zaal (Claude) | PR to bettercallzaalwebsite | 2026-08-27 |
| Add a `media.json` build step consuming `zao-media/content/*.json`; done when the file exists in `data/` and regenerates | @Zaal (Claude) | PR | 2026-08-29 |
| Add the timeline section to `index.html`, filterable by class and brand; done when earned and produced can be viewed separately | @Zaal (Claude) | PR | 2026-09-02 |
| Decide which teams and which people are public | @Zaal | Decision | 2026-08-27 |
| Add `## Team` sections to the ICM boxes for the public teams, starting by completing `wavewarz` | @Zaal | Gated publish | 2026-08-29 |
| Decide `bcz-journal`: revive, redirect or archive - quiet since 2026-05-22 | @Zaal | Decision | 2026-08-31 |

## Sources

- [FULL - `gh api`, 2026-08-25] `repos/bettercallzaal/zao-media` metadata and contents; `media-log.md` decoded and counted (598 headings, earliest entry 2023-10-28); `appearances/` listing.
- [FULL - `gh api`, 2026-08-25] `repos/bettercallzaal/bettercallzaalwebsite` contents, `brands.json` structure (keys: version, generated, title, subtitle, categories, statuses, brands), and `data/metrics.json` decoded and quoted verbatim.
- [FULL - `gh api`, 2026-08-25] `repos/bettercallzaal/bcz-journal` metadata, last push 2026-05-22.
- [PARTIAL - `curl` with browser headers, 2026-08-25] `wavewarz-intelligence.vercel.app` returned HTTP 200, 208KB. The page is JS-rendered; only the shell and marketing copy were readable. **Read: `1 SOL = $99.65`. Not read: battle count, volume, payouts.**
- [FULL - read from disk, 2026-08-25] `zao-vault/projects/TEAMS.md` and 52 notes in `zao-vault/people/`.
