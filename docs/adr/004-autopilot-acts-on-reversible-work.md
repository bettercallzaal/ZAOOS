# ADR-004: Autopilot acts on reversible work and stops at the one-way doors

**Status:** Accepted (by selection from a four-option prompt; scope wording is the seat's, see below)
**Date:** 2026-09-17
**Deciders:** Zaal, relayed by the seat (dotfiles lane); recorded by the antigravity-automation lane
**Tags:** autonomy, agents, autopilot, escalation

## Context

Antigravity's infrastructure review (2026-09-17) proposed that unattended lanes resolve reversible decisions themselves and escalate only one-way doors. Two things were missing before that could run:

- a list of the doors that is data rather than each lane's judgement;
- a record of every decision a lane makes on its own.

ZAOOS #3542 built both: `scripts/autopilot/doors.json` holds the list, and `scripts/autopilot/door-check.mjs` looks facts up in it and appends a JSONL line per verdict. What was still missing was permission to act on a two-way verdict.

## Decision

Zaal ruled on 2026-09-17 by **selecting one option of four** in a prompt the seat wrote. He did not type a sentence.

- **Label, the only words that are his** (by choosing them): "Turn it on for reversible work only".
- **Description, written by the seat and accepted by his selection:** "Lanes stop asking about copy edits, formatting and non-breaking refactors. Money, outbound messages, deletes, deploys and settings changes still stop dead. Every auto-decision writes what it chose and why."
- **The alternatives he passed over:** turn it on after the festival; keep every decision coming to him; write his own. He chose this over "keep every decision coming to me", so it was not a default.

A selected option is stronger than a relay and weaker than his own sentence. Because the scope wording is the seat's, a lane must not stretch it past the description. The canonical record, vault `decisions/autopilot-acts-on-reversible-work-2026-09-17.md`, keeps the status RELAYED, NOT DIRECTLY CONFIRMED and carries a NEEDS-ZAAL line to confirm the wording in his own words.

In practice:

- A two-way verdict from door-check means the lane **acts**, then says so.
- A one-way verdict means the lane **stops** and writes a NEEDS-ZAAL line.
- door-check records **every** verdict before giving it.

## What this decision does NOT cover

- **Widening doors.json.** Turning a one-way door into a two-way one, or adding a grant, is a new decision.
- **The three entries no source names:** merges, service restarts and `git reset --hard`. They stay one-way on the list's own reading. Merges stay with the seat.
- **ADR-003's AlarmSink proposal.** It is unrelated and stays Proposed.
- **autopilot.md's "anything irreversible" catch-all.** It cannot be encoded as data, and a two-way verdict does not excuse a lane from it.
- **Existing grants beyond their scope.** The Venus email grant is unchanged.

## Consequences

- Positive: lanes stop spending Zaal's attention on copy edits and formatting. Every auto-decision can be audited line by line afterwards.
- Negative: the list catches only facts a lane declares. A lane that runs a command it did not declare bypasses the check. Closing that gap takes a PreToolUse hook, which is a settings change, so it is its own one-way-door decision.
- Neutral: until Zaal confirms the wording in his own words, this ADR and the vault record both say the ruling came by selection.

## Alternatives Considered

- **Keep asking on everything.** Rejected by the ruling.
- **Act on everything except an explicit denylist, with no decision log.** Rejected by the ruling's last clause: an autopilot whose reasoning is not recorded cannot be audited after it gets one wrong.

## References

- ZAOOS #3542: doors.json and door-check.mjs
- vault `decisions/autopilot-acts-on-reversible-work-2026-09-17.md` (the canonical record)
- vault `decisions/autopilot-may-email-venus-only.md` (an existing standing grant, unchanged)
- `~/zaal-dotfiles/claude/autopilot.md` (the rulebook; its door-check step is the seat's)
- ADR-003 (separate, Proposed)
