---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-13
superseded-by:
related-docs: 2271, 1527, 928, 2127, 2239
original-query: "Doc 2271 found that bot/src/zoe/work-loop.ts deletes failed work - no retry, no evidence, no way to ask afterward what happened - and doc 1527 flagged the same thing in July with nothing changed since. Write the spec for preserving failed work as a resumable packet, grounded in the actual code, naming what Peter does that we do not."
tier: STANDARD
---

# 2272 - Failed work must survive: a resumable packet for the work-loop

> **Goal:** Specify the smallest change that makes a failed work item **answerable
> afterwards** - what was it, where did it die, what did it say - without
> reintroducing the retry storm the current code was written to avoid.

Doc 2271 established that Peter keeps failed work and we delete it. This doc is
the build spec, plus one failure mode 2271 did not name and which is worse than
the one it did.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Park, do not retry.** A failed item leaves the active queue and lands in an append-only park file. It never re-enters on its own. | The existing comment "Remove from queue even on error to avoid infinite retry loop" is **correct**. Dequeuing is right; deleting the evidence is the bug. Peter's `blocked` is never ready and only an operator's `open` re-enters it. |
| 2 | **Fix the silent path first.** Empty research output currently deletes the item with **no report and a `success` receipt**. | This is a false green, not just data loss. It is strictly worse than the error path, which at least sends a Telegram message. Not named in 2271. |
| 3 | **Append-only JSONL, fold per id.** Reuse the shape `runs.ts` already uses; add fold-per-id so a later status append cannot shed earlier fields. | Peter states the fold rule as a correction of its own design: latest-record-wins made every live run shed fields. We get that lesson free. |
| 4 | **A parked item carries the STAGE it died at.** | "It failed" is not resumable. "It failed after research returned, before the doc committed" is. |
| 5 | **`needs-input` is a first-class park reason.** | ZOE has no handed-back-to-human state at all. This is the cheapest half of Peter's model to adopt and the one Zaal will actually use. |
| 6 | **No auto-resume, ever - not on boot, not on drain.** Resume is an explicit operator call. | Peter: "re-dispatching would retry the same wall unbounded." Loopback counts reset each session, which is exactly why auto-re-entry is unsafe. |
| 7 | **Do NOT adopt `criteria[]`-at-filing in this change.** | It is the right idea (bars before work, per 2271 decision 2) but it changes what `enqueueWork` demands of every caller. Separate change, separate review. |

## Where work disappears today - three paths, all verified in source

`bot/src/zoe/work-loop.ts` on `origin/main`, read 2026-08-13.

### Path 1 - a thrown error (line 278)

```ts
} catch (e) {
  const errMsg = (e as Error)?.message ?? String(e);
  console.error('[zoe/work-loop] tick failed:', errMsg);
  await emitReceipt({ ..., resultType: 'error', approvalClass: 'auto' }).catch(() => {});
  await reportFor(item, deps)(`Work-loop error: failed to process "..." - ${errMsg.slice(0, 120)}`)
  // Remove from queue even on error to avoid infinite retry loop
  await writeQueue((await readQueue()).filter((x) => x.id !== item.id));
}
```

What survives: a `console.error` line, a truncated Telegram message, and a receipt.

What the receipt does **not** carry: the item id, the input, or the error text. Its
fields are `capability: 'research'`, `tool: 'work-loop'`, `action: 'work_tick'`,
`resultType: 'error'`. So "which topic failed?" cannot be answered from the receipt
trail - only from a Telegram message that scrolls away and a log line on a VPS.

Also note `bumpToday` is **not** called here. A failing item does not count against
`DAILY_CAP`, so the daily counter cannot be used to reconcile attempts either.

### Path 2 - empty research output (lines 250-260). This is the bad one.

```ts
const firstOutput = await runResearch(item.input);
if (firstOutput.trim()) {
  // ... judge, verify-replan, commitResearchDoc, reportFor(...) ...
}
await writeQueue((await readQueue()).filter((x) => x.id !== item.id));
await bumpToday(deps.currentDate);
await emitReceipt({ ..., resultType: 'success', evidenceUrl, approvalClass: 'auto' })
```

`reportFor` is **inside** the `if`. When `runResearch` returns an empty string:

- no doc, no PR
- **no Telegram message at all**
- the item is deleted
- `bumpToday` charges it against the daily cap
- and a receipt is emitted saying **`resultType: 'success'`**, with `evidenceUrl` still `null`

Doc 2271 says the failure "is reported to Telegram and the item is gone." That
describes Path 1. Path 2 is not reported anywhere and is recorded as a success. It is
`silent-failure-guard.md`'s exact shape - a green report over an accomplished
nothing - inside the loop we point at when we talk about honesty.

### Path 3 - the doc failed to commit (line 246)

`doc.ok === false` reports `Work-loop: doc save failed - ${doc.error}` and then falls
through to the same unconditional delete. Research that succeeded and merely failed
to land is discarded identically to research that never happened, and the receipt
still says `success`.

## What Peter does that we do not

Doc 2271 covers the full comparison. Restricted to *this* problem - keeping failed
work answerable - four things, in order of how much they matter here:

1. **A terminal `blocked` state that is durable and not ready.** Peter appends
   `blocked` with `note: gates: <failing clauses>`. The record is the durable trace.
   ZOE has two outcomes - PR, or error-and-dequeue - and the second leaves nothing.

2. **`needs-input: <question>`, re-asked verbatim on resume.** ZOE has **no
   handed-back-to-human state**. Today the only way ZOE asks Zaal something about a
   failed item is a Telegram line that is gone once scrolled. Peter's operator answer
   *is* the reopen: append the answer as a note, append `open`, continue.

3. **Fold-per-id, not latest-record-wins.** Records for an id apply in file order: a
   later field overwrites, an absent field inherits, an explicit `null` clears. Peter
   documents this as a retirement of its own earlier design because "every live run
   shed fields under it." A naive implementation picks latest-wins and then a
   status-only append silently drops the input you needed.

4. **Re-entry is operator-only.** "Only an `open` record the operator asked for
   re-enters it - the drain and the resume check never do on their own." This is what
   makes keeping the work safe rather than a retry storm.

**What we have that Peter does not**, and should not give up: `DAILY_CAP` and the
atomic `tick-lock` are enforced in TypeScript. Peter's equivalents are prompts a model
may drift from. The port makes Peter's *design* enforced rather than requested - which
is the point doc 2271 makes about the whole repo, and the reason this is worth doing
in code rather than adopting as a skill.

## The design

### New file: `~/.zao/zoe/work-parked.jsonl`

Sibling of `work-queue.json`, same directory resolver (`dir()`), append-only, one JSON
object per line. Chosen over a second JSON array because appending must never require
rewriting the file - a crash mid-rewrite is how you lose the thing you were preserving.

`runs.ts` already writes append-only JSONL to `~/.zao/zoe/runs/YYYY-MM-DD.jsonl`, so
this is an established shape in this codebase, not a new concept.

### Record

```ts
export type ParkReason =
  | 'error'          // the tick threw
  | 'empty-output'   // research returned nothing
  | 'doc-failed'     // research succeeded, the doc/PR did not land
  | 'needs-input';   // a human has to answer before this can proceed

export interface ParkRecord {
  /** The work item's id. Records FOLD on this - later fields overwrite, absent inherit. */
  id: string;
  ts: string;
  status: 'blocked' | 'open';
  reason?: ParkReason;
  /** The original item, so a resume needs nothing else. */
  item?: WorkItem;
  /** Where it died. "It failed" is not resumable; the stage is. */
  stage?: 'research' | 'verify' | 'commit' | 'unknown';
  /** Error text, untruncated - the Telegram message is truncated to 120 chars. */
  error?: string;
  /** For needs-input: the question, re-asked verbatim on resume. */
  question?: string;
  /** Operator's answer, appended as its own record. */
  answer?: string;
  attempts?: number;
}
```

### Fold

```
readParked() -> Map<id, ParkRecord>
  for each line in file order:
    existing = map.get(rec.id) ?? {}
    for each key in rec:
      if value === null -> delete key      (explicit clear)
      else               -> set key         (overwrite)
    absent keys inherit
```

Explicitly **not** latest-record-wins. A `{id, status:'open'}` append must not erase
`item` - that is the exact failure Peter documents.

### API surface

| Function | Purpose | Who calls it |
|---|---|---|
| `parkWork(item, reason, detail)` | Append a `blocked` record | `runWorkTick`, on all three paths |
| `parkedWork()` | Folded list of currently-blocked items | ZOE, to answer "what failed?" |
| `resumeWork(id, answer?)` | Append `open` + push the item back on the queue | **operator only** |
| `askHuman(item, question)` | Park with `reason: 'needs-input'` | any stage that cannot proceed without Zaal |

`resumeWork` is the only path back into the queue, and nothing calls it automatically.
Not the drain, not boot, not the tick.

### Changes to `runWorkTick`

1. **Path 1 (catch):** before the existing `writeQueue(filter)`, call
   `parkWork(item, 'error', { stage, error: errMsg })`. The dequeue stays - the comment
   was right.
2. **Path 2 (empty output):** add an `else` to `if (firstOutput.trim())` that parks with
   `reason: 'empty-output'`, reports to Telegram like every other outcome, and changes
   the receipt from `success` to `error`. A tick that produced nothing must not report
   success.
3. **Path 3 (doc failed):** when `doc.ok === false`, park with `reason: 'doc-failed'` and
   carry `finalOutput` in the record so the research is not lost with the commit.
4. **Receipts** gain the item id in `inputDigest` so the receipt trail can answer *which*
   topic, which it currently cannot.

`bumpToday` behaviour is deliberately unchanged. It is a spend cap, and a failed tick
still spent the money - but changing it is a separate argument and this change should
not smuggle it in.

## Why not just retry

Because the comment on line 277 is right, and the temptation to "fix" it by retrying is
how the loop breaks. A retried item that fails deterministically - a malformed topic, a
revoked token, a permanently 404 URL - burns `DAILY_CAP` every day forever and starves
every other item behind it. Peter reaches the same conclusion from the other side:
loopback counts reset each session, so an auto-re-entering `blocked` retries the same
wall unbounded.

**Park is not retry.** The item stops costing anything the moment it is parked. The only
thing that changes is that it can still be *asked about*.

## What this does NOT do

- **No `criteria[]` at filing.** Right idea (2271 decision 2), wrong change to bundle -
  it alters the contract of every `enqueueWork` caller.
- **No DreamLoop port.** Doc 1527 has been stuck at Phase 1 since July. This is
  deliberately the small change that removes the data loss, not the architecture that
  replaces the loop. If 1527 lands later, the park file is the state it needs anyway.
- **No auto-resume.** Stated twice because it is the requirement most likely to be
  "improved" by a future pass.
- **No deletion.** Nothing prunes the park file in this change. It grows slowly (only
  failures) and pruning is a decision with a blast radius, so it stays Zaal's.

## Tests

1. A throwing tick parks the item and removes it from the active queue.
2. **Empty output parks with `empty-output`, reports, and does NOT emit a `success`
   receipt.** This is the regression test for the finding above.
3. A failed doc commit parks with the research output retained.
4. Fold: `{id, item, status:'blocked'}` then `{id, status:'open'}` yields a record that
   still has `item`. Latest-record-wins would fail this.
5. Fold: an explicit `null` clears a field.
6. `resumeWork` puts the item back on the queue exactly once, and a second call on an
   already-open id does not duplicate it.
7. Nothing in the tick calls `resumeWork` - asserted by reading the source, in the same
   style as the swallow-registry test, because "nothing auto-resumes" is a property that
   only fails silently.

## Sources

- `bot/src/zoe/work-loop.ts` @ `origin/main`, read 2026-08-13 - lines 250-260 (empty
  output), 263-278 (catch), 246 (doc failed).
- `bot/src/zoe/runs.ts` - the existing append-only JSONL precedent.
- Doc 2271 (open PR #3067) - `robertkeus/peter` comparison; decisions 1, 3 and the fold
  rule come from it.
- Doc 1527 - the DreamLoop port that flagged this in July and is still at Phase 1.
- `.claude/rules/silent-failure-guard.md` - Path 2 is its exact shape.

**Correction to the queue that commissioned this:** doc 2271 is described as "merged
today". It is **open** in PR #3067 as of 2026-08-13. The daily and weekly recaps also
describe it only as "Something that touched the collaboration with Peter", which is a
summary generated from the PR title rather than its contents - the doc itself is
specific and good, and worth reading directly.
