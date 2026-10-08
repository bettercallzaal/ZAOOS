---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-10-08
superseded-by:
related-docs: "dev-workflows/2205-nickysap-oss-ecosystem-for-zao, agents/2204-cross-family-verification-99darwin-orchestrator, business/792-nicky-sap-juke-founder-worldview-farcaster-strategy"
original-query: "https://x.com/nicky_sap/status/2107837807083569183?s=46 We gotta deep research Nicky and then use this as the step forward to use his githubs as thing awe can clone and use"
tier: DEEP
---

# 2643 - Nicky's (99darwin) GitHub as a clone list: what is new since doc 2205, what is licensed, and the top three

## Summary

1. The post Zaal sent is one link and nothing else: `github.com/99darwin/nexus`, an AI news feed Nicky open-sourced.
2. ZAO already knows Nicky well: doc 2205 (August) mapped his open source for ZAO, and doc 2204 adopted ideas from his orchestrator skill. This doc covers what changed since then.
3. He has 98 public repos; 63 are his own work, and 10 of those were pushed since May 2026.
4. **A correction:** two repos doc 2205 called MIT, `geo` and `juke-space-recap`, have no licence file today. Without a licence they can be read for ideas, but not copied.
5. Clearly licensed and worth taking: `complexity-gate` (MIT), `orchestrator` (MIT), `nexus` (MIT), `carapace-oss` (Apache 2.0), `farcaster-audio` (MIT), `obsidian-vault-scaffolder` (MIT).
6. The top three to adopt first: `complexity-gate` for the review lane, `cliproxy-router`'s idea for model routing (idea only, no licence), and `nexus` as a model for ZAO's own news intake, minus its paid classifier.
7. Nothing was cloned and nothing was sent to Nicky.

> **Goal:** Zaal sent Nicky's post and asked to research Nicky and use his GitHub as things ZAO can clone and use. This doc reads the post, builds on doc 2205 (published 2026-08-06), lists every public repo with its licence read from the file, and names what ZAO can legally take and where it would live.

## 1. The post (fetched raw)

`api.fxtwitter.com/nicky_sap/status/2107837807083569183`, read 2026-10-08:

| Field | Value |
|---|---|
| Author | `@nicky_sap` ("ns"), bio "dev and such", website diviswap.com |
| Posted | 2026-10-07 14:17:49 UTC |
| Text, verbatim | `https://github.com/99darwin/nexus` |
| Media, quote | none |
| Engagement at read time | 1 like, 0 reposts, 0 replies, 53 views |

## 2. Who Nicky is, from what ZAO already has

- **Identity, checked both ways.** GitHub `99darwin` is "Nick Saponaro", with `twitter_username: nicky_sap` and site diviswap.com; the X account `nicky_sap` lists diviswap.com as its website. Same person.
- **Prior ZAO docs:** doc 792 (Nicky as Juke's founder, his worldview and Farcaster strategy); doc 2205 (his open-source ecosystem for ZAO: `farcaster-audio` to self-host for Zuke, `juke-space-recap`, `geo`, `obsidian-vault-scaffolder`); doc 2204 (cross-family verification, adopted from `99darwin/orchestrator`, MIT). He is also cited in docs 2214, 2423, 2427, 2431, 2435, 2444, 2483 and 2532 (`git grep` of `research/`).
- **Already in use:** the `obsidian-vault-scaffolder` skill is installed in this estate (it appears in the skill list as `obsidian-vault (obsidian-vault-scaffolder)`). `credit-attribution.md` names "nickysap/99darwin" as its example of crediting a source.
- **Vault:** 44 files mention him (`git grep -l` of zao-vault origin/main, 2026-10-08), mostly lane handoffs, daily notes and research-lane briefs.

## 3. His GitHub (`gh api`, 2026-10-08)

98 public repos: **63 original, 35 forks** (forks are mostly Divi and bitcore wallet code from earlier years, plus front-end starters). No public organisations.

Original repos pushed since 2026-05-01. Licence is read from the repo's LICENSE file, because the API field is often wrong (`zao-research` hard requirement 13):

| Repo | What it is | Stars | Language | Last push | Licence (from the file) |
|---|---|---|---|---|---|
| `nexus` | "A Jev-powered AI news feed": ingests arXiv, Hacker News, GitHub, X and RSS, dedupes, classifies each item with one call to TypeSafe's Jev model, serves a filtered feed and a guarded search box | 2 | TypeScript | 2026-10-07 | **MIT** ("Copyright (c) 2026 Nexus Contributors") |
| `carapace-oss` | "Give AI agents access to your secrets without giving them your secrets": a credential-injecting proxy inside a hardware enclave (GCP Confidential Space), per-secret host allowlist, signed receipts. "Status: beta. Not independently audited" | 1 | Python | 2026-10-02 | **Apache 2.0** |
| `cliproxy-router` | Model-routing policy for CLIProxyAPI in "one declarative file instead of four places"; installs agents and a `routing` skill into `~/.claude`, never edits `settings.json` itself | 0 | Python | 2026-09-14 | **None** (no LICENSE file) |
| `complexity-gate` | A cyclomatic-complexity bar "enforced in three places from one config file": a Claude Code `PostToolUse` hook, a diff-scoped CI gate, and a refactoring skill | 0 | Python | 2026-09-03 | **MIT** ("Copyright (c) 2026 Nick (99darwin)") |
| `orchestrator` | "The orchestrator skill I use for long-running tasks" (doc 2204) | 8 | - | 2026-08-06 | **MIT** |
| `juke-space-recap` | Recording to recap video (doc 2205) | 1 | TypeScript | 2026-06-08 | **None** (no LICENSE file; doc 2205 said MIT) |
| `obsidian-vault-scaffolder` | Project spec to an Obsidian vault (doc 2205; installed here) | 4 | Python | 2026-06-05 | **MIT** |
| `rowdy-moms-media-kit` | A client's media kit | 0 | HTML | 2026-05-21 | None |
| `farcaster-audio` | "Fully OSS Farcaster client, including audio spaces (also known as Juke Audio)" (doc 2205) | 1 | TypeScript | 2026-05-21 | **MIT** |
| `geo` | GEO SaaS (doc 2205) | 0 | TypeScript | 2026-05-14 | **None** (no LICENSE file; doc 2205 said MIT) |
| `suede-finance-demo` | A demo | 0 | JavaScript | 2026-05-13 | None |

## 4. Fit, repo by repo

| Repo | What ZAO would use it for | Can we clone and adapt it? |
|---|---|---|
| `complexity-gate` | The review lane and lanes that write code. Its own measurement is the reason: "a whole-tree run reports 326 findings across 90 files ... Scoring only the changed files asks a question with an achievable answer of zero: did this change add complexity?" A mechanical check fits `code-over-inference.md` and `loop-evals.md` gate C (the anti-bloat pass), which is prose today | **Yes**, MIT, with attribution |
| `orchestrator` | Already adopted in part (doc 2204: cross-family verification, write-set parallel safety, model by role) | **Yes**, MIT |
| `nexus` | A model for ZAO's own intake of outside news (the research radar, ZOE's daily brief). Its dedup step (URL, then title, then arXiv id, then Jaccard plus entity fingerprints) is reusable on its own | **Yes**, MIT. But its classifier needs a paid `TYPESAFE_API_KEY`, and its X adapter needs `X_BEARER_TOKEN`. ZAO would swap Jev for its own model and use its keyless X fetcher |
| `carapace-oss` | The idea the estate keeps circling (doc 2244: "the agent never holds the credentials"): agents ask for a request to be made with a secret they never see | **Yes**, Apache 2.0 (keep the NOTICE). But it needs a GCP project with Confidential Space and billing, and it says "Not independently audited". Too heavy to run now; worth reading |
| `cliproxy-router` | One routing file for which model each lane may use: the "cheaper models for mechanical work" change in doc 2636 | **No licence: read for ideas only.** The idea (one declarative policy file, every tool reads it) is not copyrightable; the code is |
| `farcaster-audio` | Zuke, as doc 2205 said | **Yes**, MIT |
| `obsidian-vault-scaffolder` | Already installed | **Yes**, MIT |
| `geo`, `juke-space-recap` | GEO and recap video, per doc 2205 | **Read for ideas only** until a licence is added. Doc 2205's "MIT" for these two is corrected here |

## 5. Recommendation: the top three

| Rank | What | Where it would live | Credit line (`credit-attribution.md`) |
|---|---|---|---|
| 1 | **Adapt `complexity-gate`** as the anti-bloat check: the hook for lanes that write code, the diff-scoped CI job for ZAOOS and zaal-dotfiles, non-blocking at first, as its README advises | `zaal-dotfiles` (the hook and the skill), ZAOOS `.github/workflows/` (the CI job) | `Adapted from 99darwin/complexity-gate by Nick Saponaro (@nicky_sap), MIT License, https://github.com/99darwin/complexity-gate` |
| 2 | **Write ZAO's own model-routing policy file, after reading `cliproxy-router` for the idea.** One file says which lanes may use which model; tools read it. No code copied | `zaal-dotfiles` | `Pattern from 99darwin/cliproxy-router by Nick Saponaro (@nicky_sap); idea only, no code copied (the repo has no licence)` |
| 3 | **Adopt `nexus`'s dedup step and adapter shape** for ZAO's research radar, with ZAO's own classifier and keyless fetchers in place of Jev and the X API | ZAOOS `src/lib/` or a radar script under `scripts/` | `Adapted from 99darwin/nexus (Nexus Contributors, MIT License), https://github.com/99darwin/nexus` |

Not in the top three: `carapace-oss`, which is the strongest idea but needs paid cloud hardware and is unaudited. Doc 2244's credential question stays open until a lighter option exists.

Each adoption is its own PR, reviewed like any other, with the credit line in the code and the PR body. Using Nicky's code is not outreach. Whether to tell him is Zaal's call.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Choose which of the three to start | Zaal | Decision | when he wants |
| Add a dated correction to doc 2205: `geo` and `juke-space-recap` have no LICENSE file as of 2026-10-08 | a research lane | Doc correction PR | 2026-10-09 |
| If rank 1: adapt `complexity-gate` as a PR, non-blocking, credited | the skills lane | PR | after his word |

## Sources

All fetched 2026-10-08.

1. FxTwitter API, `api.fxtwitter.com/nicky_sap/status/2107837807083569183` [FULL, raw JSON]
2. `gh api users/99darwin`, `/orgs`, `/repos?per_page=100&sort=pushed` (paginated, 98 repos) [FULL]
3. LICENSE files of `nexus`, `carapace-oss`, `complexity-gate`, `orchestrator`, `obsidian-vault-scaffolder`, `farcaster-audio` (first lines read); confirmed absent for `cliproxy-router`, `juke-space-recap` and `geo` by listing each repo's root [FULL]
4. READMEs of `nexus`, `carapace-oss`, `complexity-gate`, `cliproxy-router` [FULL for nexus and complexity-gate; PARTIAL for the other two, the opening sections]
5. ZAOOS docs 2204 and 2205 (key decisions and sources), and `git grep` of `research/` and zao-vault origin/main for nickysap, nicky_sap and 99darwin [FULL for what is cited]

Not read: the code of any repo, the remaining 53 original repos pushed before May 2026 (listed in the API pull, not described here), Nicky's other X posts, and diviswap.com.

Credit: every repo described here is Nick Saponaro's (`99darwin` on GitHub, `@nicky_sap` on X), except `nexus`, whose LICENSE names "Nexus Contributors".
