---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-23
superseded-by:
related-docs: "2394, 2395, 2354"
original-query: "https://www.reddit.com/r/ClaudeCode/s/obBtg78gjO deep research this"
tier: STANDARD
---

# 2403 - Orca ADE: it solves the exact gap we measured today, and adopting it means replacing the lane system

> **Goal:** Evaluate Orca ADE against a problem measured hours earlier - ZAO has
> 64 Claude sessions and `zj` shows 6. The tool targets that gap precisely. The
> question is not whether it works; it is what we would be giving up.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **License is clean - MIT, verified at the `/license` endpoint.** | Unlike dev-house (doc 2395), where the repo object said `NOASSERTION` and the real terms were PolyForm Noncommercial. Checked the endpoint, read the text, confirmed no noncommercial clause. |
| 2 | **It is real and enormous. Not a weekend project.** | 52,017 stars in five months, 3,601 forks, pushed **two hours** before this doc was written. |
| 3 | **It targets our measured gap almost exactly.** | SSH worktrees, `orca serve` on headless Linux, a mobile companion, usage tracking, and any-CLI-agent support. That is the Mac + VPS + Pi + phone + Codex problem in one list. |
| 4 | **DO NOT adopt it this week. The decisive question is unanswered.** | Whether Orca can adopt an EXISTING tmux session, or only sessions it launches. The README never says. Everything below turns on it. |
| 5 | **4,419 open issues is the number to weigh against 52,017 stars.** | One open issue per 12 stars on a five-month-old project shipping daily. That is velocity and it is also churn. |

## Why this landed at the right moment

Hours before this thread arrived, an audit of ZAO's own estate measured:

```
ListAgents          64 peer sessions
zj (the Wall)        6
zao-agents           8   (local only, built today)
```

Across a Mac, a VPS, a Pi, a Windows desktop and 18 cloud sessions. The
thread's OP describes the same shape from the other side: *"I work in 5 repos,
with 2 to 6 sessions in each repo, across 2 computers... around 15 sessions going
at a time"*, and the feature he leads with is the one we lack: *"with Orca
remote, all sessions from both machines are in one place."*

So this is not a tool looking for a problem here. It is the problem we measured,
with a 52k-star answer already built.

## What it is, verified

`stablyai/orca` - *"the ADE for working with a fleet of parallel agents"*.

| | |
|---|---|
| Licence | **MIT** (checked at `/license`, text read, no noncommercial clause) |
| Stars / forks | **52,017** / 3,601 |
| Open issues | **4,419** |
| Created | 2026-03-17 (five months) |
| Last push | **2026-08-24T02:56Z** - two hours before this doc |
| Language | TypeScript |
| Platforms | macOS, Windows, Linux desktop + iOS/Android companion |

Features relevant to ZAO specifically:

- **SSH worktrees** - *"Run agents on a beefy remote box with full file editing,
  git, and terminals - auto-reconnect and port forwarding included."* That is the
  VPS and the Pi.
- **`orca serve`** for headless Linux servers. Same.
- **Mobile companion** - notified when an agent finishes, send follow-ups from
  anywhere. Zaal's phone is already a primary surface.
- **Account switcher + usage tracking** - Claude and Codex usage and rate-limit
  resets, hot-swap accounts. He runs into the weekly cap; `claude-usage.md` is a
  whole rule about it.
- **Any CLI agent** - Claude Code, Codex, Grok, Cursor, Copilot, OpenCode. The
  ZAO cheap-AI ladder already routes to Codex, so a manager that spans both is
  worth more here than one that only speaks Claude.
- **Orca CLI** - `orca worktree create`, `snapshot`, `click`, `fill`. Scriptable,
  which matters because ZAO's tooling is scripts.

## The decisive unknown, stated as one question

**Can Orca attach to a tmux session it did not create?**

The README does not say. `tmux` appears nowhere in it. Everything about the
adoption decision turns on the answer:

- **If YES** - Orca becomes a VIEW over the existing lane system. `zj`,
  `lane-send`, `zao-lane` and `zao-lane-boot` keep working, and Orca adds the
  cross-machine and mobile surface we lack. Low risk, high value, additive.
- **If NO** - adopting Orca means REPLACING the lane system, not augmenting it.

That second case is not a small trade. What would be given up:

| ZAO piece | What it does that a generic manager would not |
|---|---|
| `zao-lane-boot` | boots every unconsumed vault brief for this machine - the handoff-discipline contract |
| `lane-send --check` | refuses to type into a lane with no live Claude. Caught a dead lane today |
| `zj --watch` | the Wall, with needs-you / blocked / grill-ceiling semantics |
| vault briefs | one living brief per lane, git-versioned, phone-editable |
| `zao-agents` | process-list liveness, so absence is the signal and nothing needs a TTL |

None of that is generic session management. It is ZAO's succession model, and it
took a 36-decision grill (doc 2319) to arrive at.

**This is answerable in ten minutes by installing Orca and pointing it at a
running lane.** It is not answerable from the README, and it should not be
guessed.

## What the thread actually says, including the dissent

41 comments retrieved. Not a uniform rave, and the criticisms are more useful
than the praise.

**Supporting, with specifics:**
- *"I've been using it recently after switching from super.engineering. Orca can
  feel a little clunky at times (there's a lot of features I don't use) but it
  definitely well-made for the task of managing agents & worktrees"*
- *"So stable. Shows me what I need to see."*
- Someone running it *"en producción con mi plan max x20"*.

**Dissenting, and worth weighing:**
- *"sounds too complicated. Herdr is usually more than enough for my needs."*
- *"I felt that if you are not using them, there's no point of installing in your
  machine."*
- *"I haven't tried this myself yet. Looks vibe-coded."*
- *"Orca is fantastic for my way of working. I just wish their plugin framework
  was more mature. So many ideas for integrating my own tooling..."*

That last one is the one that matters for ZAO. **We have a lot of our own
tooling** - 64 executables in `~/bin` - and a user who likes the product is
saying the extension surface is not ready. If Orca cannot be extended, ZAO's
tooling either lives outside it or gets rewritten.

**The OP's own answer on autonomy is worth recording**, because it matches
Zaal's position: *"It would be amazing if I could be less involved. But I find
the agents make a lot of decisions that are different from what I would want. I
do spec driven development, so initially I write a spec and let the agents rip.
After they've completed the work, I review the results and I often have to manage
sessions at that point."*

## The alternatives named in the thread

| Tool | Verified | Notes |
|---|---|---|
| **GasTown** | 17,749 stars, MIT, Go, `gastownhall/gastown` | *"multi-agent workspace manager"*. Older (Dec 2025), smaller, Go rather than TypeScript. A commenter: *"born out of the difficulty of running multiple CC instances manually."* |
| cmux | not checked | OP switched away: *"Cmux was lagging for me. The only real feature of cmux is notifications and status."* |
| herdr | not checked | The satisfied-incumbent option: *"Herdr is usually more than enough."* |
| super.engineering, T3 Code, psmux | not checked | mentioned in passing |

**GasTown deserves its own look** if the tmux answer above is NO - a Go binary
that manages workspaces may sit alongside tmux more comfortably than a full
TypeScript ADE that wants to be the workspace.

## Honest limits

- **The 52,017 stars are not independently sanity-checked.** They come from the
  GitHub API, which is authoritative for the number and says nothing about how it
  was earned. A five-month-old repo at 52k is unusual.
- **Everything about behaviour is from the README and 41 forum comments.**
  Nothing here was run. No claim in this doc should be treated as tested.
- **Comment scores are all 1** - Arctic Shift returns the score field but this
  thread has no differentiated voting, so "the top comment" is not a claim made
  anywhere here.
- **The mobile companion is an App Store binary plus an Android APK.** That is a
  different trust surface from an MIT repo, and it was not evaluated.
- 4,419 open issues was not sampled. Whether they are feature requests or broken
  builds is unknown and would change the read.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Answer the decisive question: install Orca, point it at a RUNNING tmux lane, see whether it attaches or ignores it | @Zaal (Claude) | Test | 2026-08-27 |
| If it attaches: trial it as a VIEW over the existing lanes for one week, changing nothing else | @Zaal | Trial | 2026-09-03 |
| If it does not: evaluate GasTown, which may coexist with tmux rather than replace it | @Zaal (Claude) | Research | 2026-09-03 |
| Sample 20 of the 4,419 open issues to find out whether they are requests or defects | @Zaal (Claude) | Research | 2026-08-30 |
| Do NOT migrate the lane system on the strength of this doc | @Zaal | Decision | standing |

## Sources

- [FULL - fetched 2026-08-23 via `zao-fetch-reddit.sh` v6 / Arctic Shift] r/ClaudeCode post `1vwjgyv`, *"Orca ADE is incredible"* by **u/trader_tick** - full body plus **41 comments**. All quotations above are verbatim from that fetch. First use of the v6 fetcher on a link it was not built against; it worked without intervention.
- [FULL - fetched 2026-08-23] `api.github.com/repos/stablyai/orca` - 52,017 stars, 3,601 forks, 4,419 open issues, created 2026-03-17, pushed 2026-08-24T02:56:19Z, TypeScript, not archived.
- [FULL - fetched 2026-08-23] `api.github.com/repos/stablyai/orca/license` - **MIT License**, text read, confirmed no noncommercial clause. Checked at the endpoint rather than the repo object, per doc 2395.
- [FULL - fetched 2026-08-23] `raw.githubusercontent.com/stablyai/orca/HEAD/README.md`, 16,831 bytes. Feature list, supported agents, SSH worktrees and `orca serve` all quoted from it. Grep for `tmux`: **0 matches** - the basis for the decisive-unknown section.
- [FULL - fetched 2026-08-23] `api.github.com/repos/gastownhall/gastown` - 17,749 stars, MIT, Go, created 2025-12-16.
- [FULL - measured 2026-08-23, this estate] `ListAgents` 64 peers, `zj` 6 lanes, `zao-agents` 8 local. The gap this doc is evaluated against.
- Credit: **u/trader_tick** for the post and the detailed follow-ups, **u/lgmarian** for surfacing GasTown, **u/mbsquad24** for the plugin-framework criticism that is the most load-bearing dissent for ZAO. Orca is by **stablyai**; GasTown by **gastownhall**. Neither is affiliated with The ZAO.
