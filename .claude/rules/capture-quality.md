# Capture Quality - no card born without WHO / WHY / DONE-WHEN

Adopted 2026-08-20 from card b8cba711 (approved 2026-08-19). WHY: Sparq
(closed unidentifiable), Colleen (no context), NEXUS (zero notes) each burned
a grill round on 2026-08-19. Five seconds of context at capture time beats
six weeks of amnesia and a wasted grill card.

## The rule (behavior-changing, both capture ends)

1. **ZOE capture (phone end):** a DM capture with no why/who context does not
   board silently. ZOE holds it and asks ONE button question - "Add a why" /
   "Board it bare" (the gate prompts, never blocks; bare-on-purpose is one
   tap). Implementation: `splitCapturesByQuality` in
   `bot/src/zoe/team-tracker.ts` + the `capq:` callback in `bot/src/zoe/index.ts`.

2. **Organizer / any lane routing cards to the board (terminal end):** a card
   routed to the board carries WHY + DONE-WHEN synthesized from the context it
   came from. A card where NEITHER is derivable goes to GRILL-QUEUE.md
   instead of the board - a grill question is the right home for "what even
   is this", the board is not.

3. **Tooling floor:** `zao-tracker` create subcommands already take `--why`
   and `--done-when` - use them on every card a session creates. A card
   without them should be the exception a human chose, never the default a
   pipeline produced.

## Guards

- This gates BOARD writes, not capture itself - capture stays frictionless
  (one thought, one line, never lost). The gate runs where the thought
  becomes a card.
- Never DROP a capture for missing context (feedback: never drop, always
  park) - the choices are enrich, board-bare-on-purpose, or grill-queue.

## Source

Card b8cba711; incidents of 2026-08-19 (Sparq / Colleen / NEXUS grill
rounds). Siblings: `thread-discipline.md` (capture is sacred),
`noisy-signal-guard.md` (a board full of context-free cards is a wall nobody
reads), feedback_never_drop_always_park.
