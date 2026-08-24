---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-24
superseded-by:
related-docs: "2391, 2397"
original-query: "Can we /zao-research other solutions to this challenge - programmatic editing of an existing Google Doc from an agent, beyond a service account or a bound Apps Script web app"
tier: STANDARD
---

# 2402 - Editing an existing Google Doc from an agent

> **Goal:** The ZAOstock organizing doc needs updating repeatedly by an agent, in
> place, keeping its link and tabs. Browser automation failed at this today. The
> Drive connector cannot do it. This is what the real options are, and which one a
> small team should pick.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **INSTALL `taylorwilsdon/google_workspace_mcp`.** 3,057 stars, MIT, last pushed 2026-08-18. | It has **19 Google Docs tools including explicit tab support** - the exact feature the ZAOstock doc depends on and the exact thing browser automation kept fumbling. Drop-in MCP, no custom code to maintain. |
| 2 | **The GCP project is a one-time ~5 minute cost, and it is worth paying.** | Its own quick-start says five minutes. The same OAuth client then unlocks Sheets, Calendar, Gmail and Slides for later, so the cost amortises rather than repeating per-tool. |
| 3 | **RETIRE the hand-built `~/bin/gdoc` once the MCP is verified working.** | It was written this morning because nothing else was reachable. Keeping two paths to the same doc is the duplicate-source problem this estate keeps paying for. Delete it, do not leave it as a "backup". |
| 4 | **If the GCP project is genuinely refused, use `sam-ent/google-automation-mcp`** (MIT, clasp-based, no GCP project, ~2 min). | It is the only credible zero-GCP option found. But it has **10 stars against 3,057** and was last pushed 2026-07-16, so it is a single-maintainer dependency. Accept that trade knowingly. |
| 5 | **Do NOT wait for an official Google MCP.** | Two HN submissions in 2026 report Google Workspace CLI *removing* MCP support. Community servers are the path. |

## The problem, stated precisely

Three things were tried on the ZAOstock doc (`1B78AVon...`) today:

1. **Browser automation** (`mcp__claude-in-chrome__*`). Worked, badly. Coordinate-based
   clicking put a meeting recap into the wrong tab, "Add subtab" was hit instead of
   "Rename" because the menu shifts for nested tabs, and the `cmd+z` that fixed it
   over-reverted and truncated a section. On a live doc shared with a team.
2. **The claude.ai Drive connector.** It created a new doc from markdown in one call -
   clean, formatted, correct. But its `update_file` changes **title and parent folder
   only**. There is no update-file-content operation in the exposed tool surface, so it
   cannot edit a document that already exists.
3. **Docs API directly.** No `gcloud`, no credentials on disk, no
   `google-api-python-client` installed at the time. Nothing to authenticate with.

So the real constraint is narrow: **we can create and read Google Docs today, and we
cannot edit one.**

## The options

| Option | Auth | Setup | Docs editing | Maturity | Verdict |
|---|---|---|---|---|---|
| **taylorwilsdon/google_workspace_mcp** | OAuth 2.1, your own client | ~5 min, GCP project | **19 tools: edit, style, tables, tabs, comments, export** | **3,057★**, MIT, pushed 2026-08-18 | **PICK THIS** |
| a-bonus/google-docs-mcp | OAuth | GCP project | Docs, Sheets, Drive, Gmail, Calendar | 643★ | Viable second |
| piotr-agier/google-drive-mcp | OAuth | GCP project | Drive, Docs, Sheets, Slides, Calendar | 206★ | Viable third |
| **sam-ent/google-automation-mcp** | **clasp, no GCP** | **~2 min** | Gmail, Drive, Sheets, Calendar, Docs, Forms, Tasks | 10★, MIT, pushed 2026-07-16 | Fallback only |
| Service account + Docs API | SA JSON key | ~5 min GCP + share doc | Whatever you build | n/a | Superseded by the MCP |
| Bound Apps Script web app | Script runs as you | ~3 min, no GCP | Whatever you write | n/a | Superseded - see below |
| `~/bin/gdoc` (built today) | Either of the above | already done | replace/append/rename/sub | n/a | **Retire it** |

## The finding that matters most

**The Apps Script web app I hand-built this morning is the same mechanism
`sam-ent/google-automation-mcp` automates.** Its README describes the clasp router as:
*"Deploys an Apps Script Web App per user; tool calls routed via HTTP POST."* That is
precisely the architecture of `~/.zao/private/gdoc-appsscript-to-paste.js` - a bound
web app, gated by a secret, called over POST.

The mechanism was right. Hand-rolling it was not, because `clasp` is Google's own
official CLI and does the deployment step automatically.

Its own comparison table, verbatim:

> Setup time: **~2 min** (browser sign-in + one toggle + one Allow click) vs **~15 min**
> (GCP project + enable APIs + OAuth consent screen + credentials)

Note it estimates the GCP route at 15 minutes where taylorwilsdon estimates five. Both
are guesses by the authors; the real number is somewhere in that range and it is a
one-time cost either way.

## Why the 3,057-star one wins anyway

**Tabs.** The ZAOstock doc uses Google Docs *tabs* - Meetings, Run of Show, Team and
Roles, Start Here, Standup Aug 24, plus a nested subtab. Tabs are the newest part of
the Docs API and the part most likely to be missing from a small server.
`taylorwilsdon/google_workspace_mcp` lists tab support explicitly in its Docs tool
count. `sam-ent` does not mention tabs at all.

**Maintenance asymmetry.** 3,057 stars and a push six days ago against 10 stars and a
push five weeks ago. For something that will edit a document a team relies on, that
difference is the whole argument.

**Safety features that matter for an agent with write access:** a read-only mode,
three progressive tool tiers, and per its README, `validate_file_path()` blocking
`.env*` and `~/.ssh/`, `~/.aws/` even when the allowed directory list is widened.

## Honest caveats

- **The five-minute claim is the author's, not measured.** Nobody here has run the
  setup yet. Treat it as an estimate.
- **120+ tools is a lot of tool surface** to add to a session. It has tool tiers for
  exactly this reason - start at the smallest tier that includes Docs, not the full set.
- **Community signal is thin.** The two HN items on Workspace CLI dropping MCP support
  scored 2 points each with zero comments. They are checkable claims about a product
  change, not a discussion worth weighting. Recorded because the direction matters, not
  because the threads do.
- **Star count is not an audit.** Nobody has read this server's source. It will hold an
  OAuth token with write access to Gmail and Drive, so scope it down to the Docs and
  Drive scopes actually needed rather than accepting the full set.

## Also See

- [Doc 2391](../../events/2391-zaostock-run-of-show-oct3-v2/) - the run of show that lives in the doc this is about
- [Doc 2397](../../infrastructure/2397-coworking-stack-zaostock-priority/) - the coworking stack audit, same "which surface holds the truth" question

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Create the OAuth client and install `taylorwilsdon/google_workspace_mcp` - shipped when `gdoc tabs` equivalent lists the ZAOstock doc's tabs through the MCP | @Zaal | Setup | 2026-08-26 |
| Scope the OAuth client to Docs + Drive only, not the full Workspace set - shipped when the consent screen lists only those scopes | @Zaal | Setup | 2026-08-26 |
| Delete `~/bin/gdoc` and `~/.zao/private/gdoc-appsscript-to-paste.js` once the MCP edits the ZAOstock doc successfully - shipped when both files are gone and the dotfiles commit is pushed | @Zaal | PR | 2026-08-31 |
| Re-validate this doc if the MCP is not installed by then - shipped when `last-validated` is refreshed or the doc is marked superseded | @Zaal | Doc | 2026-09-24 |

## Sources

- [taylorwilsdon/google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp) - 3,057 stars, pushed 2026-08-18, not archived, Python. README read in full (283 lines). Docs tool count and tab support quoted from it. **[FULL, via `gh api` contents endpoint, base64-decoded - raw file, not a summary]**
- LICENSE file for the same repo, read directly rather than the API's license field per `credit-attribution.md`: **MIT License, Copyright (c) 2025 Taylor Wilsdon** **[FULL, `gh api .../contents/LICENSE`]**
- [sam-ent/google-automation-mcp](https://github.com/sam-ent/google-automation-mcp) - 10 stars, pushed 2026-07-16, MIT (LICENSE file read directly). README read in full (211 lines); the clasp-router description and the 2-min-vs-15-min table quoted verbatim **[FULL, same method]**
- GitHub repository search, two queries, `gh api search/repositories` sorted by stars - the eight-result and eight-result listings that produced the options table **[FULL, official API]**
- [Hacker News Algolia API](https://hn.algolia.com/api/v1/search?query=google%20workspace%20mcp) - 40 hits. Two relevant: "Google Workspace CLI Removes MCP Support" (2026-03-07, 2 points, 0 comments) and "Google Workspace no longer supports MCP" (2026-03-31, 2 points, 0 comments) **[PARTIAL - the submissions exist and the titles are as quoted; the linked articles behind them were NOT fetched, and at 2 points with no comments there is no discussion to read. Flagged rather than leaned on.]**
- Local: `~/bin/gdoc` and `~/.zao/private/gdoc-appsscript-to-paste.js`, both written 2026-08-24, are the hand-built implementations this doc recommends retiring **[FULL, own work]**
