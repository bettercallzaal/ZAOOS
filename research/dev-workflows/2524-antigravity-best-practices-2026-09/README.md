---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-09-20
superseded-by:
related-docs: dev-workflows/notes/antigravity-tips-2026-09-15 (vault, not ZAOOS - see Also See), infrastructure/2520-google-ai-workspace-antigravity-2026-09
original-query: "Antigravity best-practices research - dimensions: a sane security-mode default, workspace/folder scoping, git worktree isolation, reviewing Artifacts before trusting a run"
tier: STANDARD
---

# 2524 — Antigravity best practices: security mode, scoping, worktree isolation, Artifact review

> **Goal:** Give ZAO a concrete, current (Antigravity 2.0) recommended configuration for the four dimensions that matter for letting it touch ZAO infrastructure without repeating a known incident class - not a general feature tour.

## Key Decisions

| # | Recommendation | Why |
|---|---|---|
| 1 | **Security preset: `Default`, with Sandbox Mode enabled and `Proceed in Sandbox`.** Never `Turbo mode` (unrestricted terminal + full filesystem). `Full machine` is also a no - it keeps terminal review but grants full filesystem file access, which is the half of Turbo mode that caused the documented drive-deletion incident (doc 2520). | `Default` is the only preset where BOTH terminal commands and file access outside the project stay bounded (sandboxed exec, workspace+temp only) per the official preset table. `Full machine` and `Turbo mode` both set outside-of-folder file access to `Allow`. |
| 2 | **Workspace/folder scoping: use the 2.0 "Project" model (folders, not the legacy single-workspace model), and never grant `read_file(*)`/`write_file(*)`.** Add explicit `write_file(src/)`-style scoped rules instead of widening to the parent directory. | Antigravity 2.0's own docs describe this as a deliberate move away from "Agent is strictly confined to one folder structure" toward configurable multi-folder Projects - the boundary is now a setting you choose, not a given, so it has to be set deliberately per project rather than assumed. |
| 3 | **Git worktree isolation: pick "New Worktree Mode" (not "Local Mode") whenever more than one agent conversation will touch the same checkout, and never let a human open a `git checkout -b` in a shared working tree while an agent conversation is active in the same folder.** | This is the one dimension ZAO's own existing note (`notes/antigravity-tips-2026-09-15.md`) does not cover, and it is not hypothetical: this same session hit the identical failure class today in a *different* tool (a shared ZAO OS V1 checkout) - see Finding 3. Antigravity's own users report the same shape when they skip worktree isolation (Finding 2). |
| 4 | **Artifact review policy: `Request Review` (the documented default and Google's own recommended setting), never `Always Proceed`.** Treat the Walkthrough artifact as a catch-up mechanism for absent-mindedness, not as the primary review point - the Implementation Plan, reviewed *before* files change, is the actual control. | `Always Proceed` is described in Google's own docs as bypassing the pause "immediately" with no manual verification - functionally the Artifact-review analogue of Turbo mode, and the same shape as [[never-self-grant-trust]]: whoever configures the review-skip is the one who stops being checked. |

## Findings

### 1. The permission model, current as of Antigravity 2.0 (macOS/Linux)

Every sensitive agent action is `action(target)` - `read_file`, `write_file`, `read_url`, `execute_url`, `command`, `mcp` - evaluated across three lists with a fixed precedence: **Deny > Ask > Allow**. A conflicting `Ask` rule always wins over an `Allow` rule, which is the safe direction for a mistake (over-scoping an Ask is annoying; over-scoping an Allow is dangerous).

Three presets, one file access column and one terminal column, and they move together in a way worth stating plainly because it is easy to misread "Full machine" as a moderate middle option:

| Preset | Sandbox | Terminal Commands | File Access | MCP & Web |
|---|---|---|---|---|
| Default | Enabled | Allowed in sandbox; ask outside | Workspace + temp dirs | Ask |
| Full machine | Disabled | Require Review | Allow (full filesystem) | - |
| Turbo mode | Disabled | Always Proceed (unrestricted) | Allow (full filesystem) | Allowed |

"Full machine" still asks before running a command, but has already granted itself the filesystem half of the drive-deletion incident's blast radius. It is not a safer middle ground - it is Turbo mode's file-access grant with the terminal grant withheld, and the terminal grant is one settings click away.

A concrete starter rule set for a ZAO checkout, adapted from Google's own documented example:

```
{
  "permissions": {
    "allow": [
      "command(git)",
      "command(regex:npm run (build|lint|test))",
      "read_url(github.com)"
    ],
    "deny": [
      "command(rm -rf)",
      "command(sudo)",
      "write_file(.git/)",
      "write_file(~/.ssh)",
      "write_file(~/.zao/private)"
    ],
    "ask": ["command(*)", "execute_url(*)", "mcp(*)"]
  }
}
```

### 2. Workspace/folder scoping and the Project model

Antigravity 2.0 replaced the "one workspace = one folder, settings inherited globally" model with **Projects**: a Project is a configuration of one or more folders, with its own settings and its own permission overrides on top of global ones. The default file-access boundary is your Project's folders plus the app's own local data directory (`~/.gemini/antigravity/`, verified present on this machine, containing `user_settings.pb`) - "Enforcing this boundary protects your local sensitive data. Enable non-workspace access with caution," in Google's own words.

For ZAO specifically: this is the dimension zj's 09-15 note already got right (checklist item 1: "confirm the file-access boundary does not reach `~/.zao` or the dotfiles") - the update here is that the underlying model it describes (single workspace) is the one Google has since layered Projects on top of, not replaced. The checklist's substance holds; the vocabulary ("workspace") is now one layer down from "Project."

### 3. Git worktree isolation - the gap, and why it is not hypothetical

Antigravity's Project model has a **worktree selector** on every new conversation: **Local Mode** (works directly in your active folders/checkouts - "best for quick, interactive edits") or **New Worktree Mode** (provisions an isolated Git worktree per conversation - explicitly documented as the choice for "Isolating Concurrent Agents... avoiding conflicts between agents").

Real users confirm what happens when this is skipped. A thread on r/google_antigravity (`1qtg4vd`, fetched in full via Arctic Shift, score 11, 14 comments) opens with exactly the failure mode worktree isolation exists to prevent:

> "If I start a new conversation (Conversation B)... then I go back to another conversation (Conversation A), **the diffs from Conversation B will show up in Conversation A**... if you switch conversations... the diff will then have completely disappeared from both conversations!"

The author confirmed with Google support that this is a known IDE bug, not a prompting problem. The thread's own converged advice, from multiple independent commenters, is worktrees:

> u/aredna: "I have landed on using worktrees with each worktree running in its own workspace. Once I'm finished with the worktree I kill the workspace."
> u/SiliconeOX: "Figure out git worktrees somehow if you want to make sure they don't overlap."

**This is not an abstract lesson for ZAO - this session hit the identical failure class today, in a different tool, in the exact way this recommendation predicts.** Writing an earlier doc this session (2523), a `git checkout -b` was run in the shared `~/Documents/ZAO OS V1` working tree while another lane had a different branch (`ws/research-2522-poidh-live-bounty-market`, live PR #3599) checked out in that same tree. The new branch silently inherited that lane's uncommitted history, and the resulting PR carried three commits that were not this session's own - caught only because the repo's doc-collision-guard CI check happened to fire on the resulting number collision. A worktree per concurrent task (`git worktree add`, which ZAO's own `dev-workflows/459-parallel-workspace-isolation-zao-os` already recommends for Claude Code sessions) is exactly the fix Antigravity's own docs and its users independently converged on for the same shared-checkout hazard, one layer up.

A second r/google_antigravity thread (`1qys493`, exa search, PARTIAL - title/comments only, not independently re-fetched) confirms native worktree support exists via the CLI but that UI-level tooling for it was, as of Feb 2026, thin enough that a community member built a third-party VS Code extension (`lumi-ops`) specifically to add "physical workspace isolation" on top of it - independent evidence that the feature is real but not yet a smooth default.

### 4. Artifact review before trusting a run

Two policies govern the review checkpoint, both documented plainly:

- **Request Review (Recommended, Google's own label):** the agent halts and requests explicit approval before proceeding with a proposed Implementation Plan or code diff. You can attach inline, line-level comments to steer it before anything touches disk.
- **Always Proceed:** the agent never halts; it bypasses the pause and executes immediately.

The **Walkthrough** artifact (generated after a task completes, with screenshots/recordings for browser tasks) is explicitly framed by Google as a catch-up tool - "in case you were not strictly following it the whole time" - not the primary control. Treating a Walkthrough as sufficient review is a fail-open substitution of "read what happened" for "approve what is about to happen," the same shape as this account's own [[green-results-that-cannot-go-red]] memory: a review that only ever looks backward cannot stop the thing it's reviewing.

The CLI's Artifact Picker gives per-file approve/reject (`y`/`n`) plus bulk approve/reject (`Shift+A`/`Shift+R`) - worth naming because `Shift+A` (approve all) exists precisely to be reached for under time pressure, which quietly converts a per-file review into the functional equivalent of Always Proceed if used by habit rather than by actually having read the batch.

## Comparison: preset choice vs. blast radius

| Preset | Terminal | File access | Recommended for ZAO |
|---|---|---|---|
| Default + Sandbox | Ask outside sandbox | Workspace + temp only | **Use this.** |
| Full machine | Ask (Require Review) | Full filesystem | No - file grant alone matches half the Turbo incident. |
| Turbo mode | Always Proceed | Full filesystem | Never - this is the documented drive-deletion preset (doc 2520). |

## Sources

- [Sandbox — Google Antigravity Docs](https://antigravity.google/docs/sandbox/) [FULL - fetched via exa web_fetch]
- [Permissions — Google Antigravity Docs](https://antigravity.google/docs/permissions/) [FULL - fetched via exa web_fetch]
- [Projects — Google Antigravity Docs (archived copy)](https://archive.ph/yalQI) [FULL - fetched via exa web_fetch; live URL redirects through app-gated routing, archive copy used instead]
- [Agent Settings — Google Antigravity Docs](https://antigravity.google/docs/agent-settings/) [FULL - via exa web_search highlights, content matches doc structure]
- [Artifact Review — Google Antigravity Docs](https://antigravity.google/docs/artifact-review/) [FULL - via exa web_search highlights]
- [Reviewing Artifacts (CLI) — Google Antigravity Docs](https://www.antigravity.google/docs/cli/artifacts) [FULL - via exa web_search highlights]
- [How do you run multiple conversations in parallel on the same project? — r/google_antigravity](https://www.reddit.com/r/google_antigravity/comments/1qtg4vd/how_do_you_run_multiple_conversations_in_parallel/) [FULL - fetched via `zao-fetch-reddit.sh` / Arctic Shift, 14 comments read]
- [Using Git Worktrees With Antigravity? — r/google_antigravity](https://www.reddit.com/r/google_antigravity/comments/1qys493/using_git_worktrees_with_antigravity/) [PARTIAL - exa search highlights only, not independently re-fetched; escalation not pursued further since the CLI-native-worktree-support fact is independently confirmed by the official Projects doc above]
- Local: `/Users/zaalpanthaki/.gemini/antigravity/user_settings.pb` (binary; confirms the documented settings-storage path exists on this machine) [FULL - path verified, contents not parseable as text]
- `zao-vault/notes/antigravity-tips-2026-09-15.md` (75 lines, zj, 2026-09-15) [FULL - read in full for dedup; worktree isolation confirmed absent from its coverage]

## Also See

- [Doc 2520 - Google AI for The ZAO: Workspace Gemini, API, Antigravity](../../infrastructure/2520-google-ai-workspace-antigravity-2026-09/)
- `zao-vault/notes/antigravity-tips-2026-09-15.md` - the broader tips catalogue this doc narrows and updates on one dimension (worktree isolation) and one vocabulary shift (workspace -> Project)
- [Doc 459 - Parallel Workspace Isolation for Claude Code Sessions in ZAO OS](../459-parallel-workspace-isolation-zao-os/) - the same `git worktree` recommendation, independently arrived at for a different tool

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm Antigravity's active preset is `Default` + Sandbox Mode enabled (not `Full machine`) in Settings -> General - shipped criteria: a screenshot or settings export confirming the preset | @Zaal | Check | 2026-09-27 |
| Add a line to `notes/antigravity-tips-2026-09-15.md` (or a superseding note) pointing at this doc for the worktree-isolation gap, so the two don't drift apart | @Zaal | Vault edit | 2026-09-27 |
| Adopt "New Worktree Mode" as the default choice whenever starting a second concurrent Antigravity conversation against a ZAO checkout - shipped criteria: no repeat of the diff-bleed or shared-tree-contamination failure class in the next month | @Zaal | Practice change | 2026-10-20 (re-check) |

