# 1230 - Cal.com MCP → ZOE wiring plan (turnkey once the key lands)

**Tier:** STANDARD
**Date:** 2026-07-17
**Status:** Design/plan. Live wiring is GATED on `CALCOM_API_KEY` (Zaal, step 1).
**Owner:** builder loop (plan), Zaal (key), then any loop (build once unblocked)

## Why this doc exists

The board task "Wire Cal.com MCP into ZOE" (from calendar-mgmt research doc 1117) is
**blocked on step 1: Zaal generates a Cal.com API key → `~/.zao/private/calcom.env`.**
This doc does everything that does *not* need the key, so the moment it lands the build
is turnkey: the exact MCP config location, the phased rollout, and — the part worth
pinning now — **ZOE's focus-block enforcement rules**.

Grounding (doc 1117): Cal.com is the most agent-manageable calendar — official MCP at
`mcp.cal.com/mcp` (~34 tools), an availability API, and it syncs with Google Calendar
(which already holds Zaal's meeting rhythm).

## Prereq (GATED — Zaal, ~2 min, blocks everything below)

1. Generate a Cal.com API key → write `~/.zao/private/calcom.env` (chmod 600, never committed):
   ```
   CALCOM_API_KEY=cal_live_...
   ```
   Follows the same off-repo-secret convention as `~/.zao/bonfire.env` (pii/secret-hygiene).

## Wiring plan

**Where:** ZOE loads MCP servers in its bot config (`bot/src/zoe/` MCP config, alongside
the existing context7/Serena-style entries). Add a `calcom` MCP server pointing at
`mcp.cal.com/mcp`, authenticated with `CALCOM_API_KEY` from the env file (loaded at boot,
never hard-coded — TS env-validation rule: read into a const, throw at boot if missing).

**Phase 1 — read-only (ship first, lowest risk):**
- ZOE answers availability questions: `/zoe my availability Wed?` → calls the Cal.com
  availability API (read) → suggests open slots, cross-checked against the focus blocks below.
- No writes. Purely informational. Verifiable + safe to trust before granting write scope.

**Phase 2 — create/reschedule (after Phase 1 proves out):**
- ZOE books / reschedules via the Cal.com API, but **refuses any booking that lands on a
  focus block** (below) — it proposes the nearest non-blocked slot instead.

## Focus-block enforcement rules (pin these — they don't need the key)

ZOE must **refuse to book** (and warn if asked to) any slot overlapping Zaal's protected time.
Store as structured data ZOE reads (the task says `bot/src/zoe/human.md`; keep it as a small
explicit block there so both the brief and the calendar guard read one source):

| Protected block | When (ET) | Rule |
|-----------------|-----------|------|
| Daily build time | **4pm–7pm every day** | Hard no-book |
| Tuesday nights | **Tue evening** | Hard no-book (protect the Tue 6–9pm rhythm) |
| Saturday mornings | **Sat 9am–12pm** | Hard no-book (protect the Sat rhythm) |

Established meeting rhythm (already on Zaal's Google Cal, do **not** double-book):
**Tue 6–9pm ET + Sat 9am–12pm ET.** These are *kept*, not offered as free.

Behaviour: on a booking request, ZOE checks the requested slot against (a) live Cal.com
availability and (b) these focus blocks; if it hits a block, ZOE declines + suggests the
nearest clear slot. This is the durable "you can manage my calendar" capability, with the
guardrail that it can never eat build time.

## Build order (once the key lands)

1. Add `calcom.env` loader + the MCP server entry in the ZOE MCP config; boot-verify.
2. Phase-1 read-only availability command + the focus-block guard (pure, unit-testable:
   `isBlocked(slot)` against the table above — test it before any write scope).
3. Phase-2 create/reschedule behind the guard.

Each is a separate PR, boot-verified (rule 21/30). The focus-block guard is the piece to
get right + fully tested first, since it's what protects build time.

## Also see

- Doc 1117 (agent calendar-management research — Cal.com selection + the 34 MCP tools)
- `.claude/rules/pii-hygiene.md` + `secret-hygiene.md` (the `~/.zao/private/` key convention)
- `bot/src/zoe/human.md` (where the focus blocks live for ZOE to read)
