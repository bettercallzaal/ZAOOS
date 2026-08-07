---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-07
superseded-by:
related-docs: "2092, 2174, 2239, 2245"
original-query: "https://x.com/claudedevs/status/2085817074816070014?s=46 /zao-research this"
tier: STANDARD
---

# 2246 - Claude Code cross-session messaging: the human stops being the message bus

> **Goal:** Decide what changes for ZAO now that Claude Code sessions can message each
> other natively, given we already built a relay to solve the same problem.

## The one-line answer

**The thing we hand-built a relay for is now a platform primitive.** Keep the relay for
what only it can do - crossing machines and reaching non-Claude agents - and stop using
it for the case it was really invented for, which was one human pasting blocks between
two terminals on the same laptop.

## What was announced

Verified by direct fetch, 2026-08-07:

> "New in Claude Code: your sessions can now message each other. Instead of having to
> re-explain yourself in another session, you can now tell Claude to do it. It sends a
> summary (not your history or files), and the other session picks it up mid-task."
>
> - @ClaudeDevs, 2026-08-07, 7,388 likes / 266,094 views ([source](https://x.com/claudedevs/status/2085817074816070014))

Two details in that sentence carry all the weight:

- **"a summary (not your history or files)"** - the sending session decides what to
  transmit. This is a deliberate boundary, not a limitation, and it is the same shape as
  a good handoff note: state and intent, not a transcript.
- **"picks it up mid-task"** - the receiving session does not have to be idle, and does
  not restart. The message arrives into work already in progress.

## Grounding: the tool is real and in this session's toolset

The announcement is marketing until it is a callable tool, so the load-bearing check was
first-party rather than the tweet. `SendMessage` is present in this session, and its own
description states the contract:

> "Send a message to another agent. `{\"to\": \"researcher\", \"summary\": \"assign task 1\", \"message\": \"start on task #1\"}`
> ... Your plain text output is NOT visible to other agents - to communicate, you MUST
> call this tool. Messages from teammates are delivered automatically; you don't check an
> inbox. Refer to agents by name - names keep working after an agent completes (a send
> resumes it from its transcript)."

Three properties worth naming, because they are exactly the properties our relay had to
build by hand:

1. **Addressing is by NAME, and names outlive the agent.** A send to a completed agent
   resumes it from its transcript. That is durable addressing - the thing that makes a
   handoff survive the sender walking away.
2. **Delivery is push, not poll.** "Messages from teammates are delivered automatically;
   you don't check an inbox." Our `bus-poll.py` exists precisely because the tasern bus
   has no push.
3. **Speaking is not sending.** Plain output is invisible to other agents; only an
   explicit call transmits. Coordination is a deliberate act, which is the correct
   default - it is why an agent cannot leak its whole context sideways by accident.

**Marked UNVERIFIED:** whether the `SendMessage` tool exposed here is the identical
mechanism shown in the announcement video. The tool addresses *agents/teammates* within a
session's tree; the announcement says *sessions*. They are plainly the same family and may
be the same system, but the video was not fetched and this doc does not claim they are one
implementation. What is certain: named, push-delivered, summary-only agent-to-agent
messaging is callable today from this session.

## Why this matters more to ZAO than to most users

Because we already diagnosed this exact failure and wrote it into the rulebook.
`agent-loops.md` rule 36, verbatim:

> "**Coordination is a shared surface, not the human as message bus.** Don't run a session
> on Zaal hand-relaying paste-blocks between terminals. The durable fix is a shared
> `lane_handoffs` log (doc 2092) - which is what the `relay` tools + ZOE relay-bridge now
> provide."

The rule was right about the problem and, for the specific case of two Claude Code
sessions, is now solved upstream. That is a good outcome, not a wasted build: the relay
still owns the cases the platform does not.

## What the relay still owns (do NOT rip it out)

| Case | Native `SendMessage` | ZAO relay / bus |
|---|---|---|
| Two Claude Code sessions, same machine | **yes - use this** | retire for this case |
| Claude Code to ZOE (a long-running Telegram bot) | no | **relay** |
| Across machines: Mac, the Windows desktop, the VPS, the Pi | no | **relay** |
| To a non-Claude agent (Jim's tasern coordinator, Codex, the OpenRouter fleet) | no | **bus** (`infra/bus/`) |
| A durable, auditable record of what was handed off | no - messages are transport | **`lane_handoffs`** (doc 2092) |
| Reaching Zaal on his phone | no | **ZOE on Telegram** |

The distinction that matters: **native messaging is transport between Claude sessions;
the bus is transport between systems; `lane_handoffs` is the record.** Transport and
record are different jobs, and the announcement replaces one of them in one context.

## The honest cost of adopting it

- **Summary-only cuts both ways.** The sending session chooses what to send, so a lazy
  summary loses the thing the receiver needed. This is the same failure as a bad handoff
  note, and the same fix: say the state, the intent, and the next concrete step.
- **It is not a record.** A message delivered mid-task and acted on leaves no artifact
  anyone can audit later. For anything that changes the repo or a decision, the artifact
  is still the PR or the doc.
- **Same-machine only, as far as we can verify.** Nothing here helps the Mac talk to the
  Windows desktop, which is a real part of Zaal's setup.

## Decision

1. **Adopt for session-to-session on one machine.** When work needs to move from this
   terminal to another Claude Code session, send it rather than asking Zaal to paste it.
2. **Keep the relay and the bus** for cross-machine, cross-agent, and phone delivery. No
   code is being removed.
3. **Amend `agent-loops.md` rule 36** so the rule names the native primitive as the
   preferred mechanism for the Claude-to-Claude case, and keeps the relay as the answer
   for everything else. The rule's principle is unchanged; only its implementation note
   moves.
4. **Records stay records.** A handoff that matters still lands in `lane_handoffs` or a
   PR. A message is how you tell someone; it is not how you remember.

## Also See

- [Doc 2092](../../dev-workflows/2092-lane-handoff-coordination/) - the shared handoff log this augments, not replaces
- [Doc 2174](../2174-bidirectional-relay-feedback-loops/) - the bidirectional relay build
- [Doc 2239](../2239-zoe-capability-map/) - ZOE's modules, including the relay bridge
- `.claude/rules/agent-loops.md` rule 36 - the rule this amends

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Amend `agent-loops.md` rule 36 to name native SendMessage for the Claude-to-Claude case and scope the relay to cross-machine / cross-agent / phone. Shipped when the rule file on main says so. | @Zaal | PR | 2026-08-08 |
| Use SendMessage instead of a paste-block the next time work moves between two Claude Code terminals; report whether the summary carried enough. Shipped when it has been used once for real. | @Zaal | Practice | 2026-08-12 |
| Confirm whether the announcement's session-to-session mechanism is the same as this `SendMessage`, and whether it crosses machines. Shipped when this doc's UNVERIFIED note is resolved either way. | @Zaal | Research | 2026-08-14 |

## Sources

- [@ClaudeDevs announcement, 2026-08-07](https://x.com/claudedevs/status/2085817074816070014) - **FULL** (fetched via the fxtwitter API, 2026-08-07; text, author, engagement counts confirmed). The attached **video was NOT fetched** - PARTIAL on the demo's specifics.
- `SendMessage` tool description, as loaded into this session 2026-08-07 - **FULL**, first-party, quoted above.
- `.claude/rules/agent-loops.md` rule 36 - **FULL**, quoted from the repo.
