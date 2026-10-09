# Capture Quality - no card born without WHO / WHY / DONE-WHEN

History (card b8cba711): `research/dev-workflows/2649-rules-history/archive/capture-quality.md`.

1. **ZOE capture (phone end):** a DM capture with no why/who context does not board silently. ZOE holds it and asks ONE button question - "Add a why" / "Board it bare". The gate prompts, never blocks. Code: `splitCapturesByQuality` in `bot/src/zoe/team-tracker.ts` + the `capq:` callback in `bot/src/zoe/index.ts`.
2. **Any lane routing cards to the board:** a card carries WHY + DONE-WHEN synthesized from its source context. A card where neither is derivable goes to GRILL-QUEUE.md, not the board.
3. **Tooling floor:** use `zao-tracker` create's `--why` and `--done-when` on every card a session creates. A card without them is the exception a human chose, never the default a pipeline produced.

Guards: this gates BOARD writes, not capture - capture stays frictionless. Never DROP a capture for missing context: enrich, board bare on purpose, or grill-queue.
