# Session Boundaries - one thread, one named session

Established 2026-08-09 after a single session opened **25 PRs across two repos**
and produced **seven confidently wrong claims**, none of which were caused by
running out of context.

## What actually goes wrong (measured, not theorised)

The failure is not length. It is **context conflict**: holding superseded state
alongside current state until the two are indistinguishable. Every wrong claim in
that session was a state or absence claim made while a stale version of the same
fact was still in context:

| Claim | Reality |
|---|---|
| "statusLine is unset" | set at USER level the whole time - only the project file was read |
| "we are not using Obsidian" | `~/zao-vault` had been edited that morning |
| "two relay daemons are running" | one. `pgrep` was matching its own command line |
| "19 VPS lanes are dead" | `comm=` shows `bash` for an idle shell AND a running script |
| "the collectible rail needs replacing" | Magnetiq stays; the retirement covered the partnership |
| "the artist and creator tracks had no submissions" | still open, and expected to fill |
| a commit message describing a revert | the revert had not been made |

The reversals cluster in the back half, after the topic had changed four or five
times. `confirm-before-claiming-absence.md` already required exhaustive
verification before any absence claim - and it did not hold, because in a 25-PR
session re-verifying everything is expensive, so verification gets economised
exactly when it is needed most. **The rule was right; the session was too long for
anyone to follow it.**

## The rule (behavior-changing)

**A new thread gets a new session. The handoff is the artifact, never the
conversation.**

- **One thread per session.** When the subject genuinely changes - different
  product, different repo, different problem - that is a new session, not a new
  paragraph. "Fix the grill" and "write the ZABAL announcement" are two sessions.
- **Name it, always.** The session name is how it is found again and how you know
  which of several open sessions you are in. The status line shows the name, and
  shows `unnamed` in amber when there is not one. Name it after the thread, not
  the tool: `zabal-finale`, `bonfire-retry`, `iman-onboarding`.
- **The artifact carries the state.** A PR, a research doc, a board task, a
  `lane_handoffs` row. All of those already exist. Each of the 25 PRs was a
  complete handoff on its own; the conversation carrying them was the liability.
- **Remote Control on** (`remoteControlAtStartup: true`, set 2026-08-09) so a
  named session is reachable from Zaal's phone. Many small sessions are only
  workable if he can jump into any of them without a laptop.

## Triggers to start fresh (concrete, not vibes)

Start a new session when ANY of these is true - do not wait for compaction:

1. **The subject changed.** The strongest and most common trigger.
2. **A fact you are holding got reversed.** A correction is the tell that stale
   state is live in context. Land the correction, then start fresh.
3. **You just shipped.** A merged PR or a published doc is a natural boundary -
   the state now lives in the artifact.
4. **You are re-reading something you already read**, or re-proposing something
   already rejected.
5. **Compaction fired.** By then the session is already degraded; treat it as a
   late alarm, not a reset.

## What this does NOT mean

- Not "compact more often." Compaction is the symptom, not the fix.
- Not a ban on long sessions on ONE thread. A six-hour session that stays on the
  Bonfire queue is fine; the problem is six hours across nine subjects.
- Not a reason to drop context that is genuinely load-bearing. Carry it in the
  artifact so the next session reads it fresh, rather than remembering it stale.

## Source

Zaal 2026-08-09, from r/ClaudeCode "What's your actual rule for starting a fresh
session instead of continuing?" - whose most useful line is a commenter's: *"It's
context conflict that causes sessions to fail. Context limit, tool calls, token
consumption - none of that shit matters."* Another describes a skill per stage
(Refine, Plan, Execute, Commit, PR) with context cleared between each. Post itself
was 1 point with negligible discussion; the value is the diagnosis, not the
consensus.

Evidence is this repo's own session of 2026-08-09: 23 ZAOOS PRs + 2 zabalgames
PRs + seven reversals. Siblings: `thread-discipline.md` (tracks threads WITHIN a
session; this governs when a session should end), `confirm-before-claiming-absence.md`
(the rule that a too-long session made unaffordable), `anti-fabrication.md`,
`state-claims.md`, `claude-usage.md`.
