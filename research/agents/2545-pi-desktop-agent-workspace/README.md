---
topic: agents
type: decision
status: research-complete
last-validated: 2026-09-24
superseded-by:
related-docs: "2543"
original-query: "/zao-research https://www.opensourceprojects.dev/post/pi-desktop In vault terminal keep doing todos here 5 min grill me"
tier: STANDARD
---

# 2545 - PI-Desktop: a desktop workspace for agents, and why ZAO should not adopt it yet

> **Goal:** Decide whether PI-Desktop belongs in the ZAO agent stack, given that
> Orca already occupies the slot it targets.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Adopt PI-Desktop now | **NO** | It competes with Orca, which is already deployed, already drives every lane in this estate, and exposes 236 documented commands. Replacing a working orchestrator with a 0.15.x early preview is a downgrade dressed as an upgrade. |
| Watch it | **YES, with a dated re-look** | 5,481 stars, 473 forks, pushed today, v0.15.6 shipped yesterday. It is genuinely alive, not a README with a landing page. |
| Steal one idea from it | **YES - the plugin message bus** | `agents/2543-orca-antigravity-bridge` concluded that a true single-surface needs agents to be addressable, and Antigravity has no inbox. PI-Desktop ships a message bus as a platform service. The architecture is the lesson even if the product is not. |
| Treat the licence as settled | **NO, note it** | LGPL-3.0, read from the LICENSE file directly. Fine to run, a real question if ZAO ever links or bundles it. |

## What it is, from the README rather than the post

PI-Desktop is a local-first desktop application for AI agent workflows on macOS,
Windows and Linux. Its own repo description: *"Local-first AI coding agent
desktop: Electron + Rust host core + pi Agent Harness + user-installable
plugins"*.

The premise is that agents should not be a feature bolted onto an editor or a
shell. They get a workspace of their own, and the workflow is assembled from
plugins at three levels - agent capabilities, workspace features, and platform
services.

**The blog post is an accurate summary of the README, which is worth stating
because it did not have to be.** Every architectural claim it makes appears in
the project's own README, counted directly:

    plugin           28 mentions
    MCP               7
    subagent          4
    worker session    4
    message bus       3
    local-first       3

**That is a check on the post, not on the software.** A README is the project's
own marketing. None of these counts establish that any of it works; they
establish that the journalist did not invent the feature list.

## Is it real? Measured 2026-09-24

| Signal | Value |
|---|---|
| Stars | 5,481 |
| Forks | 473 |
| Watchers | 16 |
| Open issues | 168 |
| Language | TypeScript |
| Pushed | 2026-09-24 08:31, same morning as this doc |
| Latest release | v0.15.6, 2026-09-23, 20 assets |
| Archived | false |
| Licence | **LGPL-3.0, read from the LICENSE file** (`GNU LESSER GENERAL PUBLIC LICENSE Version 3, 29 June 2007`), not from the API's `license` field |
| Contributors filed | vastsa (owner), Tioit-Wang, muzimu217, yuxino, hui455 |

The five most recent commits are all from 08:06 to 08:09 this morning, merging
community PRs from `yuxino` and others. This is an actively maintained project,
not an abandoned one wearing a star count - which is the failure mode this
library has recorded before, where a repo showed 74,586 stars and no commit in
six weeks.

**Two things about these numbers do not sit right, and both are recorded as
questions rather than accusations:**

1. **Watchers are 16 against 5,486 stars, a ratio of 0.3%.** There is no norm to
   assert here, so instead a five-repo sample measured 2026-09-24, using
   `subscribers_count`:

   | Repo | Stars | Subscribers | Ratio |
   |---|---|---|---|
   | `vastsa/PI-Desktop` | 5,486 | 16 | **0.3%** |
   | `ComposioHQ/awesome-claude-skills` | 75,577 | 461 | 0.6% |
   | `microsoft/vscode` | 192,842 | 3,542 | 1.8% |
   | `facebook/react` | 250,680 | 6,599 | 2.6% |
   | `anthropics/anthropic-sdk-python` | 3,916 | 182 | 4.6% |

   PI-Desktop is the lowest in the sample, and the next lowest is the
   star-farmed awesome-list this library has already flagged as near-abandoned.
   Against maintained projects it is six to fifteen times below. **Five repos is
   a sample, not a norm** - the point is only that 0.3% sits outside everything
   else measured, which does not require knowing what typical is.

   **Use `subscribers_count`, not `watchers_count`.** The REST API's
   `watchers_count` is a legacy alias for stars and reads 5,486 here, identical
   to `stargazers_count`. Anyone reproducing this with the obvious field name
   gets the wrong number and sees no anomaly.
2. **The repo was created 2023-03-22**, three years before an AI agent desktop
   would plausibly have started, and the README contains **zero** mentions of a
   rename or former name. A `until=2023-06-01` commit query returned nothing. So
   either the history was rewritten or the repo was repurposed, and **the star
   count may predate this product**.

Neither is established. Both are cheap for the next reader to settle and both
change how much the 5,481 means.

## Why it does not fit ZAO, and the thing that decides it

**Orca already holds this slot, and holds it better than a 0.15.x preview will
for some time.** Measured yesterday in
`agents/2543-orca-antigravity-bridge`: Orca exposes 236 commands, including
`orca terminal wait --for tui-idle` (a deterministic readiness condition),
`orca terminal send --wait-submit` with an idempotency key, worktree management,
scheduled automations, multi-host targeting, and full-text search across agent
sessions.

Every lane in this estate runs inside it today.

The post's own closing line is the right frame: *"PI-Desktop is in early preview
(0.15.x), so it's not the kind of thing you'd bet a production workflow on just
yet."* ZAO's agent workflow IS the production workflow. There is no low-stakes
corner of this estate to trial a replacement orchestrator in.

**What it would cost to be wrong about this is asymmetric.** Not adopting a good
tool costs a delay. Migrating the orchestration layer ten days before ZAOstock,
onto an early preview, costs the event.

## The idea worth taking

`agents/2543-orca-antigravity-bridge` established that Orca is a **one-way**
bridge: anything with a shell can drive a Claude Code terminal, but nothing can
reach Antigravity, because Antigravity exposes no listening surface. The measured
cost of that gap on 2026-09-23 was five unread messages sitting in a drop box
while the recipient worked, three of them corrections to work it had already
shipped.

PI-Desktop's answer is a **plugin message bus as a platform service** - agents
addressable inside one workspace rather than reachable only by whoever is at the
keyboard.

That is the right shape and ZAO does not need PI-Desktop to adopt it. The
question it should prompt is narrower and answerable here: **what would it take
for Antigravity to have an inbox it actually reads?** Doc 2543 lists three
options and all three are Zaal's call.

## What was NOT established

- **Whether any of it works.** Nothing was installed, launched or run. Every
  functional claim here traces to the project's own README or its release
  metadata. A 20-asset v0.15.6 release exists; whether it launches on this Mac is
  unknown.
- **Whether the 5,481 stars belong to this product**, per the 2023 creation date
  and the absent rename note above.
- **How the plugin message bus actually works.** Three README mentions is enough
  to know it is claimed, not enough to describe it. Reading
  `docs/` or the plugin development guide would settle it and was not done.
- **Community reception.** No Reddit, HN or GitHub Discussions source was
  consulted, so this doc does not meet Hard Requirement 7. The post itself
  reports 54 impressions, which is not a community signal. Recorded as a gap
  rather than padded.

## Also See

- [agents/2543-orca-antigravity-bridge](../2543-orca-antigravity-bridge/) - what Orca already does, and the inbox gap this project's architecture speaks to
- [dev-workflows/415-composio-agent-orchestrator](../../dev-workflows/415-composio-agent-orchestrator/) - prior orchestrator survey. **Note: doc number 415 is ambiguous**; `infrastructure/415-composable-os-architecture` is a different document on the same number, which is why both are cited by path.
- [agents/568-aware-brain-local-memory-knowledge-graph](../568-aware-brain-local-memory-knowledge-graph/) - prior local-first desktop tooling comparison

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Re-run `zao-research-snapshot vastsa/PI-Desktop` and record the star delta - the second look is the whole point of the first | @Zaal | Measurement | 2026-10-08 |
| Settle whether the repo predates the product (check for a rename, or the true first commit) - it decides what 5,481 stars mean | @Zaal | Measurement | 2026-10-08 |
| Decide whether Antigravity may poll `inbox/agents/antigravity/`, the ZAO-local version of the message-bus idea (GENESIS escalation) | @Zaal | Decision | 2026-09-26 |
| Re-evaluate PI-Desktop for adoption only after it leaves 0.15.x preview AND ZAOstock (3 Oct) has shipped | @Zaal | Decision | 2026-11-01 |

## Sources

- [PI-Desktop Gives Your AI Agents a Place to Actually Live](https://www.opensourceprojects.dev/post/pi-desktop), Open-source Projects, published 2026-09-22 06:59 - [FULL, method: `curl` with a browser UA plus a Python HTML strip; HTTP 200, 66,708 bytes raw, 5,790 chars of text. Not WebFetch - every quote here is from raw text.]
- [github.com/vastsa/PI-Desktop](https://github.com/vastsa/PI-Desktop) repo metadata - [FULL, method: `gh api repos/vastsa/PI-Desktop`, 2026-09-24]
- PI-Desktop README - [FULL, method: `gh api .../contents/README.md` then base64 decode, 16,822 bytes; keyword counts by `grep -ci`]
- PI-Desktop LICENSE - [FULL, method: `gh api .../contents/LICENSE` then base64 decode, per Hard Requirement 13 - the licence was read from the file, not the API field]
- Commit and release history - [FULL, method: `gh api .../commits?per_page=5` and `.../releases?per_page=3`]
- `zao-research-snapshot vastsa/PI-Desktop` - first look recorded, five creators filed to `people/creators.csv` - [FULL, method: local tool]
- `zao-research-index "agent desktop workspace plugin"` - [FULL, method: local FTS5 index]
- Orca CLI surface - [FULL, method: local `orca --help` and per-command help, recorded in doc 2543]

**No community sources.** Hard Requirement 7 is not met and this is stated rather
than worked around.
