---
topic: agents
type: decision
status: research-complete
last-validated: 2026-09-23
superseded-by:
related-docs: "2342, 2475, 2432"
original-query: "Can Orca be used as a two-way message channel between a Claude Code session and Antigravity, or can Antigravity spawn/drive a Claude Code session so Zaal talks to both agents from one terminal? Cover: Orca CLI terminal primitives, the existing agent-msg.py drop box, Antigravity's own IDE automation surface, and what a single-terminal multi-agent surface would actually require."
tier: STANDARD
---

# 2543 - Orca as the bridge to Antigravity, and the primitives nobody read

> **Goal:** Decide whether Zaal can talk to Claude Code and Antigravity from one
> terminal, and name what already exists versus what would have to be built.

## Key Decisions

| Question | Answer | Why |
|---|---|---|
| Can Orca carry messages TO Antigravity? | **NO** | Antigravity ships no CLI. `command -v agy` and `command -v antigravity` both return nothing, and the app bundle has no `bin` directory. Orca drives terminals; Antigravity has no terminal to drive. |
| Can Antigravity drive a Claude Code session through Orca? | **YES, today, with no new code** | Antigravity runs shell commands. `orca` is a shell command with 236 documented subcommands. The direction works because the asymmetry runs that way. |
| Does that need the auto-send ruling overturned? | **NO, and this is the important part** | `decisions/orca-auto-send-stays-off.md` forbids an unattended watcher TYPING INTO live lanes. Creating a terminal Zaal types in himself is a different act. |
| Do the "missing" safety primitives have to be built? | **NO. They already exist.** | `orca terminal wait --for tui-idle` and `orca terminal send --wait-submit` are first-class Orca commands. A 2026-09-23 analysis called both of them infrastructure that "must be built and approved". |
| Should the estate keep screen-scraping for readiness? | **NO** | `~/bin/orca-board` scrapes ANSI text for `[WAITING FOR YOU]`. Orca exposes a deterministic idle condition. The wrapper is strictly worse than the thing it wraps. |

## The finding this doc exists for

On 2026-09-23 the Antigravity lane was asked whether it could drive Claude Code
sessions. It read `~/bin/orca-board` (879 lines), `~/bin/zorca` and
`~/bin/zorca-lock`, and concluded that driving sessions safely would require
building three things, the first two being:

> **Deterministic TUI State Protocol:** Replacing screen scraping with a reliable
> liveness check.
>
> **Send:** a mechanism that ... asserts receipt in the session transcript JSONL file.

Both already ship in the Orca CLI. Measured 2026-09-23 from `orca terminal --help`
and the per-command help:

```
orca terminal wait [--terminal <handle>] --for exit|tui-idle [--timeout-ms <ms>] [--json]
    Wait for a terminal condition

orca terminal send [--terminal <handle>] [--text <text>] [--enter] [--interrupt]
                   [--wait-submit <seconds>] [--retry-request <id>] [--json]
    Send input to a live terminal
```

`--for tui-idle` IS the deterministic TUI state protocol. `--wait-submit` and
`--retry-request` ARE receipt assertion, including an idempotency key so a retry
does not double-send.

**The analysis was careful, well-evidenced, and looked at the wrong artifact.**
It read the estate's wrapper and reported the wrapper's limitations as the
platform's. `orca-board` screen-scrapes because it was written that way, not
because Orca makes it necessary. This is the shape where a proxy is measured
instead of the thing: the conclusion was right about `orca-board` and wrong about
what is possible.

`orca agent-context` prints "236 commands (schema v1)" and `--json` emits the full
machine-readable schema. It exists so an agent can discover the surface instead of
inferring it from a wrapper. Nobody in this estate has run it.

## What Orca actually offers, measured

| Command | What it does |
|---|---|
| `orca terminal create --worktree <sel> --command <cmd> --focus` | Spawn a terminal running a command, and reveal it in the UI |
| `orca terminal wait --for tui-idle --timeout-ms <n>` | Block until the TUI is idle. The readiness signal. |
| `orca terminal send --text <t> --enter --wait-submit <s>` | Send input and wait for submission |
| `orca terminal read --terminal <h> [--json]` | Bounded output read |
| `orca terminal list / show / close / rename / split / switch` | Lifecycle |
| `orca search` | Full-text search across agent sessions on a host |
| `orca automations create / run / list` | Scheduled automations, first-class |
| `orca host list` | Targetable machines |
| `orca agent-context --json` | The whole schema, for agents |

`orca search` is worth its own note: full-text across agent sessions means the
"what did the other lane find" question has a native answer that does not require
a drop box.

## The asymmetry, and why it decides the design

    Antigravity  ->  shell  ->  orca  ->  Claude Code terminal      WORKS
    Claude Code  ->  orca   ->  ???   ->  Antigravity               NO PATH

Antigravity has a shell and no listening surface. Claude Code has a shell and no
listening surface either, but Orca gives it terminals to be driven IN. So Orca is
a one-way bridge toward Claude Code, from anything that can run a command.

`scripts/agent-msg.py` in the vault is the current channel and it is a **drop
box, not a bus**. It writes a dated markdown file and prints the path. Its own
header says so: "It does NOT poll, watch, schedule or deliver." Measured
2026-09-23, five messages sat unread in `inbox/agents/antigravity/` while
Antigravity worked, because nothing tells it to look. Three of those were
corrections to work it had already shipped.

**That is the real cost of the missing bridge, and it is not theoretical.** A
correction written 90 seconds after a report reached its target four hours later,
by hand.

## What a single-terminal surface would actually be

Zaal's request was "have antigrav open up claude and let me use the terminal to
talk to us from this terminal". Mechanically, today:

```bash
orca terminal create --worktree path:/Users/zaalpanthaki/zao-vault \
    --title "vault-2" --command "claude" --focus
```

Antigravity can run that. It spawns a Claude Code session, titles it, and reveals
it in Orca. Zaal then types into it himself.

**No agent types into a live lane, so `orca-auto-send-stays-off` is untouched.**
That ruling was made against a watcher that would "begin typing handoff
instructions into live lanes at 85% context, unattended". Spawning a terminal for
a human to use is not that act, and conflating the two would park a capability on
a ruling that was never about it.

What it does NOT give: Antigravity reading Zaal's replies. He would be talking to
Claude Code in that pane and to Antigravity in the IDE, in two places, with Orca
having only opened the door.

**A true single surface needs Antigravity to have an inbox, and it does not have
one.** The three options, in order of how much they cost:

1. **Antigravity polls the drop box itself.** One loop in its own harness reading
   `inbox/agents/antigravity/`. Cheapest. Needs Zaal, because GENESIS lists
   launching an autonomous loop as his escalation.
2. **A `zao-relay` terminal.** Orca spawns one long-lived terminal whose job is to
   read the drop box and print new messages. Zaal watches one pane. Still no path
   back to Antigravity.
3. **Antigravity exposes an HTTP endpoint.** The only option that makes it
   addressable. Out of scope for anything a lane can do.

## What was NOT established

- **Whether Antigravity's harness can hold a persistent loop at all.** Its
  transcripts show `Ran command:` steps inside a task, not a background process.
  Option 1 above assumes a capability nobody has checked.
- **Whether `--for tui-idle` correctly detects Claude Code specifically.** It is
  documented and it is the right shape. No one has run it against a live Claude
  Code pane. That test is one command and it should precede any design built on it.
- **Whether `orca terminal send` still suffers the estate's delivery failure.**
  The 129 dropped sends in the 25-hour run to 2026-09-10 are documented at
  `~/bin/orca-board:809` and attributed there to `run()` splitting `--text` into
  words. That is a wrapper bug. Whether raw `orca terminal send` delivers has not
  been tested, and the 129 figure says nothing about it.

## Also See

- [agents/2342-tmux-bridge-lanes-workflow](../2342-tmux-bridge-lanes-workflow/) - the tmux-era answer to the same question, resolved via `zao-research-health --resolve 2342`
- [dev-workflows/2475-research-system-internal-audit](../../dev-workflows/2475-research-system-internal-audit/)
- [agents/2432-zoe-telegram-interrupt-rule](../2432-zoe-telegram-interrupt-rule/)
- `zao-vault/decisions/orca-auto-send-stays-off.md`
- `zao-vault/scripts/agent-msg.py`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run `orca terminal wait --for tui-idle` against one live Claude Code pane and record whether it fires correctly (one command; settles the whole design) | @Zaal | Test | 2026-09-24 |
| Run `orca agent-context --json` and commit the schema to the vault so no lane infers the surface from a wrapper again | @Zaal | PR | 2026-09-25 |
| Decide whether Antigravity may run a poll loop over `inbox/agents/antigravity/` (GENESIS escalation, his call) | @Zaal | Decision | 2026-09-26 |
| Fix or retire `~/bin/orca-board`'s `run()` arg-splitting, and replace its screen-scrape readiness with `wait --for tui-idle` | @Zaal | PR | 2026-09-30 |

## Sources

- `orca --help`, `orca terminal --help`, `orca terminal wait --help`, `orca terminal send --help`, `orca terminal create --help`, `orca agent-context` - run locally 2026-09-23 [FULL, method: direct CLI invocation]
- `command -v agy`, `command -v antigravity`, `find /Applications/Antigravity.app` - run locally 2026-09-23 [FULL, method: shell]
- `~/bin/orca-board` lines 63-67 and 805-812 - read locally [FULL, method: sed on the file]
- `zao-vault/scripts/agent-msg.py` module docstring [FULL, method: file read]
- `zao-vault/decisions/orca-auto-send-stays-off.md` - existence and ruling confirmed [FULL, method: file test]
- `zao-vault/inbox/agents/antigravity/` listing, five unread messages 2026-09-23 [FULL, method: ls plus frontmatter grep]
- Antigravity's 2026-09-23 12:30 research report, `zao-vault/inbox/agents/vault/20260923-123004-antigravity-model-routing-and-orchestration.md` [FULL, method: file read]
- `zao-research-index "orca terminal agent bridge"` [FULL, method: local FTS5 index]

No community sources (Reddit, HN, GitHub Discussions) were consulted. **This is a
STANDARD-tier doc that does not meet Hard Requirement 7.** Orca is a private tool
with no public community to search, and every question here was answerable from
the local CLI. Recorded as a gap rather than padded with an unrelated thread.
