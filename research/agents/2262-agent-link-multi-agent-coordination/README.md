---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-11
superseded-by:
related-docs: 2246, 928, 2127, 601
original-query: "/zao-research the Reddit post https://www.reddit.com/r/claudeskills/comments/1vlm3t1/i_made_whatsapp_for_claude_code_sessions_in_my/ then the repo it points at (github.com/Riccardo8888/agent-link). The best idea in that thread is a COMMENT, not the post: deussumergo describes a file-claim registry. Do not adopt T3 Code, only study it."
tier: STANDARD
---

# 2262 - agent-link, and the comment that beat the post

> **Goal:** Decide whether ZAO adopts agent-link for cross-machine agent coordination, and extract the one idea in that thread worth building.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **DO NOT adopt agent-link.** | It solves transport. ZAO's transport is already solved twice over - native `SendMessage` (shipped 2026-08-07) for Claude-to-Claude on one machine, and the zao-bus for cross-machine. `agent-loops.md` rule 36 already codifies which to use. Our coordination failures are not transport failures. |
| 2 | **BUILD the file-claim registry** that `deussumergo` describes in the comments. | It is the only idea in the thread that addresses a failure ZAO actually has, twice recorded: `agent-loops.md` rule 20 (two file-writing subagents in one clone race on PR creation) and rule 25 (HEAD moves between `checkout -b` and `commit`). agent-link does NOT have this feature. |
| 3 | **STEAL agent-link's crypto design and its transport docstrings, not its code.** | `link/crypto.py` splits one `(name, secret)` pair into three values with no path back between them. That is a better key model than the bus's shared-token auth. |
| 4 | **DO NOT point any git transport at a repo whose CI runs on push.** | The presence heartbeat commits every 45 seconds. A workflow with `on: push` and no branch filter fires on every one. ZAO already lost ~2 days of production to a deploy-config edge case (`workflow-discipline.md` rule 3). |
| 5 | **T3 Code: studied, NOT adopted, per Zaal's explicit instruction.** | See the T3 Code section. It is a coding-agent tool with a live third-party ecosystem. Nothing wired in. |

## What the post actually is

`plynx_mod` posted to r/claudeskills on the strength of a real observation. Score **1**, zero
top-level engagement beyond five one-vote comments. The author states up front "We're the two
authors", which is the honest disclosure that most self-promotion skips.

The claim: two devs on two machines, both on Claude Code, coordinating by hand. They put the
agents in an encrypted room and "we barely message each other directly anymore". The secondary
claim is better than the primary one - because both ends are language models, **the room has no
language**. One author writes Italian, the other reads English, and there is no translation code
in the project. That is a real property of putting two LLMs on the ends of a pipe, and it is not
something you would design; it falls out.

The top comment is `parallelizeit` asking the only question that matters and not getting an
answer they could act on:

> "that just makes the message available - like a gmail inbox. But how is it being read by an
> idle codex session? can you point me to specific code in your repo that does this? i haven't
> found it yet, still looking at your code."

**The answer, which the thread never supplies: `link/transport_git.py`.** The reason it was hard
to find is that the file is not named after the mechanism, and the mechanism is not a poller in
the way the commenter was looking for.

## How the no-server transport actually works

Verified by reading the source, not the README (cloned 2026-08-11):

- The channel is an **orphan branch** - a root commit with no parent - so pointing it at a repo
  that also holds code adds a branch beside the history and never fetches that history.
- Everything lives under one subtree: `claude-link/<room_id>/out/<sender>/<recipient>/<ts>-<id>.json`
  plus `presence/<device_id>.json`.
- `GitTransport` is deliberately `FileTransport` (the shared-folder transport) pointed at a local
  clone, plus a loop that commits, fetches, rebases and pushes. The docstring is explicit that
  this is inheritance rather than a rewrite, because "the three-member fan-out invariant... the
  first time took a rewrite."
- Conflicts are rare by construction: every device writes only paths it exclusively owns and
  deletes only frames addressed to it, so two devices touch disjoint paths.
- When a conflict happens anyway there is a **defined outcome instead of an exception**: copy
  recent outbound frames aside, `reset --hard` to the remote tip, put them back, commit. Frames
  already consumed reappear in that reset and are swallowed by a `_seen` set, with `msg_id`
  admission in `room.py` as a second net. Recovery costs a redundant read, never a duplicate and
  never a loss.

**A documentation contradiction worth knowing before anyone installs it:** the README says the
orphan branch is "called `agent-link`". The code says otherwise -
`transport_git.py` sets `DEFAULT_BRANCH = "claude-link"` and `REPO_SUBDIR = "claude-link"`. If you
add the README's branch name to a CI `branches-ignore` list, you will have ignored a branch that
does not exist and your CI will still fire on every heartbeat.

### The costs the README states honestly

| Cost | Number |
|---|---|
| Message latency | 10-15 seconds (author's own figure, in the post and the top comment) |
| Presence heartbeat | one commit per 45 seconds (`DEFAULT_PRESENCE_S = 45.0`) |
| Sync round | 3000 ms (`DEFAULT_SYNC_MS`) |
| History growth | unbounded; nothing truncates automatically. `agent-link git-prune` when asked |
| CI hazard | `on: push` with no branch filter runs on every heartbeat. README flags this itself |

The 45-second heartbeat is set at that value *specifically* because of commit cost: "an idle room
should not write a thousand commits a day." The shared-folder transport uses 5 seconds.

### What is genuinely good in it

`link/crypto.py` derives three values from one `(name, secret)` pair, with distinct powers and no
path from one back to another: `room_id` (what the relay routes on, and all it can correlate),
`room_auth_sk` (Ed25519, proves membership), and `room_key` (AES-256-GCM, never leaves the
machine). The relay stores only the **public** half of the auth key -

> "That asymmetry is the point: it can check that a joiner belongs to a room without gaining the
> ability to join one itself. A shared HMAC token would have handed it both."

It also refuses to let confidentiality stand in for authenticity: every member holds the room key,
so any member could forge a message from another. Ed25519 signatures over the sealed payload close
that, "which is what makes a room with more than two members mean anything."

`link/gov.py` orders its admin/removal records by `prev` hash with sibling ties broken by ascending
record hash, so the total order is a pure function of the record set - explicitly because "git
commit order is rebased on sync and cannot be trusted for this." That is the right instinct and it
is the kind of thing that gets discovered the hard way.

The project is 12,531 lines of Python across `link/` with 30 test files. It is not a toy.

## The comment that beat the post

`deussumergo`, one upvote, buried at the bottom:

> "Before any agent starts work, it registers a claim: Code That logs which files it's touching,
> what it's doing, and which agent owns it. Run `coord.mjs status` to see what's currently claimed.
> Overlaps warn both agents but don't block humans"

**This is the thing ZAO should build, and agent-link does not do it.** agent-link moves messages.
It has no notion of who owns which file. Two agents in an agent-link room can still both edit
`bot/src/zoe/index.ts`; they will simply have chatted about it first.

The claim registry maps directly onto two rules already written in this repo, both learned from
real incidents:

- **`agent-loops.md` rule 20:** never run two file-writing subagents concurrently in one clone -
  commits are atomic per-branch but **PR creation races**. The current mitigation is "sequential,
  or give each an isolated worktree", which is discipline, not a mechanism.
- **`agent-loops.md` rule 25:** on a shared clone with a concurrent writer, HEAD can move between
  your `checkout -b` and your `commit`, landing the commit on main.

Both are enforced today by a human remembering a rule. A claim registry makes the conflict
*visible* rather than *remembered*, which is the same upgrade `state-claims.md` made for state
claims and `featureRan` made for silent features.

The design constraint in the comment is the part to keep: **overlaps warn both agents but do not
block humans.** A blocking lock in this repo would be a `noisy-signal-guard.md` violation waiting
to happen - a check that fires on the normal case and gets routed around.

## Why ZAO does not need the transport

| Need | What ZAO already uses | Source |
|---|---|---|
| Claude-to-Claude, one machine | native `SendMessage` (shipped 2026-08-07) - named addressing that outlives the agent, push delivery | `agent-loops.md` rule 36 |
| Cross-machine (Mac / Windows / VPS / Pi), non-Claude agents | the relay/bus | `agent-loops.md` rule 36, doc 2246 |
| The durable record | `lane_handoffs` (doc 2092) or a PR - "a message is transport, never the record" | `agent-loops.md` rule 36 |

And the bus is not short of capacity. Verified 2026-08-11 (carried from the session brief, not
re-derived): four partners registered - zao, jim, brandon, sam - and **one message on the bus
total**, a `zao -> zao` self-test. Nothing from Jim, Brandon or Sam. Adding a second transport to a
channel nobody has sent a message on would be building the wrong half of the problem.

## T3 Code - studied, not adopted

Zaal's instruction was explicit: check it, save it, learn it properly, do not wire it in. This
section is the save.

T3 Code (`t3.codes`) is a coding-agent tool. The upstream repository did not surface in a GitHub
repo search on 2026-08-11 - what surfaces is its **third-party ecosystem**, which is itself the
most informative signal available without the source:

| Repo | Stars | What it is |
|---|---|---|
| `zortos293/t3code-copilot` | 61 | T3 Code with GitHub Copilot support, tracked against upstream |
| `maria-rcks/t4code` | 49 | Launcher exposing T3 Code over a Tailscale tailnet |
| `zortos293/T3Notch` | 28 | Mac notch UI - live agent progress, task lists, approvals |
| `maria-rcks/t3code-aur` | 25 | Arch packaging |
| `JSvandijk/t3code-mobile` | 5 | Unofficial Android companion + HTTPS/PWA proxy |
| `omarcresp/t3code-flake` | 6 | Nix flake |

**What that ecosystem tells you, treated as a signal and not as a fact about the product:** people
are packaging it for their own distros, exposing it over a tailnet, and building an approvals UI
for it. Those are things people build for a tool they use daily, and the tailnet launcher and the
mobile proxy in particular say users want to reach their agent from somewhere other than the
machine it runs on. That is the same want behind ZAO's Remote Control setting
(`remoteControlAtStartup: true`, set 2026-08-09 per `session-boundaries.md`).

Marked UNVERIFIED and deliberately not researched further: what T3 Code's model routing, pricing,
or agent loop actually do. Zaal asked for it saved, not adopted, and a deeper pass costs turns
against a decision nobody is making yet.

## Findings

1. **The transport works and the mechanism is real.** Orphan branch as channel, one writer and one
   destructive reader per directory. `link/transport_git.py` is the file the top commenter could
   not find.
2. **The README and the code disagree on the branch name** (`agent-link` vs `claude-link`), and the
   disagreement lands exactly on the CI-hazard mitigation the README tells you to apply.
3. **The crypto is better than the product.** The three-value derivation and the public-half-only
   relay storage are worth reading before ZAO next designs an auth model.
4. **The best idea in the thread is a one-upvote comment**, and it is a feature the linked project
   does not have.
5. **ZAO's coordination gap is claims, not channels.** Two collisions in this repo on 2026-08-11
   alone, both file-ownership races, neither preventable by better messaging.

## Also See

- [Doc 2246](../2246-claude-code-cross-session-messaging/) - the SendMessage / relay split that makes agent-link redundant here
- [Doc 928](../928-agent-loop-best-practices/) - rules 20 and 25, the collisions a claim registry would surface
- [Doc 2127](../2127-loop-harness-engineering-anthropic/) - the Opus-5-era restatement
- [Doc 601](../601-agent-stack-cleanup-decision/) - the no-new-bots rule this decision respects

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build the file-claim registry: agents write a claim before editing, `zao-claims status` prints what is held, overlap WARNS both and blocks neither. Shipped when a second writer in the same clone gets a warning naming the first. | @Zaal | PR | 2026-08-18 |
| Add a `Do not adopt` row for agent-link to the surfaces table in CLAUDE.md so a future session does not re-research it | @Zaal | PR | 2026-08-14 |
| Decide whether the bus stays at one lifetime message or gets retired - a transport with no traffic is a maintenance cost with no reader | @Zaal | Decision | 2026-08-18 |

## Sources

- [Reddit: "I made Whatsapp for Claude Code sessions in my working team"](https://www.reddit.com/r/claudeskills/comments/1vlm3t1/i_made_whatsapp_for_claude_code_sessions_in_my/) - **[FULL]** post body plus all 5 comments, fetched 2026-08-11 via `python3 ~/bin/zao-fetch-reddit.sh` (raw JSON, not a summary). Score 1, 0 listed comment count in the API despite 5 comments returned.
- [github.com/Riccardo8888/agent-link](https://github.com/Riccardo8888/agent-link) (MIT) - **[FULL]** cloned 2026-08-11; read `README.md`, `link/transport_git.py`, `link/crypto.py`, `link/gov.py`, `link/SKILL.md` from disk. 12,531 lines across `link/*.py`, 30 test files. Note: the README states "The repo is private for now"; the clone nonetheless succeeded on an authenticated `gh` session.
- GitHub repo search for T3 Code, 2026-08-11 - **[PARTIAL - upstream repo not located]** six third-party repos with star counts returned and cited above; the upstream `t3.codes` source did not surface in `gh search repos`. Escalation deliberately stopped here per Zaal's "save it, do not adopt" instruction.
- Credit: the file-claim registry idea is **`deussumergo`'s**, from the comment thread above. The transport design and all quoted docstrings are **Riccardo8888 and plynx_mod's** work, MIT licensed.
