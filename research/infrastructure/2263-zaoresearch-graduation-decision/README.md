---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-08-11
superseded-by:
related-docs: 836, 2258
original-query: "Then research github.com/ZAODEVZ/ZAOresearch itself and the PDF at ~/Downloads/ZAOresearch-for-zaal.pdf"
tier: STANDARD
---

# 2263 - The research library graduated, and the two calls are still open

> **Goal:** Answer IMan's two questions about the ZAOresearch migration, and verify the claims in the handover PDF against the live repos rather than accepting them.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Fix the fail-open in `research-dedupe.ts` BEFORE moving anything.** | This is the sequencing IMan's PDF does not state. The silent failure he identified is real - verified at `bot/src/zoe/research-dedupe.ts:107` - and **the move is what triggers it.** Fix first, move second, or the first symptom of the move is an invisible bill. |
| 2 | **Sibling clone.** Agree with IMan. | Submodule reintroduces the identical silent-empty failure through a different door: a clone that skips one command gets an empty folder, and the VPS loops and codex agents clone without that step today. |
| 3 | **Make it public - yes.** | The content is already public inside ZAOOS. Keeping it private hides nothing and blocks the GEO objective (owning "what is The ZAO") that memory marks TOP PRIORITY. The history was checkable before release, which was the reason for the delay, and that check is done. |
| 4 | **Then delete `research/` from ZAOOS**, per the graduation rule already written. | CLAUDE.md's monorepo-as-lab model: "On graduation: own repo, own DB, own domain. Code is **deleted** from ZAOOS so there's no drift." Duplication is the pre-decision state, not the destination. Drift has already started - see below. |
| 5 | **Do not merge the copy back.** ZAOresearch carries a doc ZAOOS reverted. | Doc 2260 exists in ZAOresearch and is absent from ZAOOS because Zaal reverted it on 2026-08-10 as "wrong recording". A naive sync in the wrong direction restores content that was deliberately pulled. |

## What the PDF says, and what checks out

The PDF (`~/Downloads/ZAOresearch-for-zaal.pdf`, 4 pages, by IMan, dated migrated 2026-08-10 /
update 2026-08-11) is a progress report on moving the research library out of `bettercallzaal/ZAOOS`
into `ZAODEVZ/ZAOresearch`, framed around two decisions that are Zaal's to make.

Every load-bearing claim in it was re-checked against the live repos on 2026-08-11. It holds up.

| PDF claim | Verified? | What the check showed |
|---|---|---|
| Library moved with full history, "2,138 commits, verified identical" | **YES, at migration time** | The PDF prints matching tree hashes `633496ab...`. Both repos have moved since - see the divergence section |
| "Four places in `bot/src/` read the library by path, and one of them fails *silently*" | **YES, and understated** | A grep found **six** path-reading sites. The silent one is exactly the one he named |
| ZOE's dedupe would find zero docs and re-research things we already have | **YES** | Confirmed at source. `research-dedupe.ts:107-108` and `index.ts:1758-1761`, both fail-open |
| "286 files outside the library reference it" | **CLOSE - measured 283** | `grep -rln "research/"` excluding `.git`, `node_modules` and `research/` itself. Different exclusion sets explain the gap; the order of magnitude is his |
| "Nothing in ZAOOS has been touched" | **TRUE of the migration; no longer true of the library** | ZAOOS `research/` took 8 commits on 2026-08-10 alone. That is normal work continuing, not the migration touching anything |
| 215 doc numbers used by more than one doc | **CONSISTENT** with `research/COLLISION_TOLERANCE.md`, which grandfathers 30+ named collisions and exists to stop the count growing |
| Secret scanner catches AWS key IDs but not AWS secret keys | **NOT INDEPENDENTLY VERIFIED** - flagged by IMan, not re-checked here. Treat as an open security item, not a closed one |

## The silent failure, quoted

This is the whole reason the decision matters, so it should not be paraphrased.

`bot/src/zoe/research-dedupe.ts`, lines 103-109:

```typescript
    // List all category directories in research/
    let categories: string[] = [];
    try {
      categories = await readdir(researchDir);
    } catch {
      return false; // research dir doesn't exist or can't be read
    }
```

`false` here means "this URL has not been researched". A missing directory and a genuinely new URL
are the same value. The function's own docstring documents the behaviour as intentional, at line 81:

> `@returns Promise<true> if URL found in any research doc, false otherwise (including on any error)`

And the call site adds a **second** fail-open layer, `bot/src/zoe/index.ts:1758`:

```typescript
const researched = await wasResearched(url, join(repoDir, 'research')).catch((e) => {
  console.error('[zoe/index] dedupe check failed (fail-open):', (e as Error)?.message);
  return false;
});
```

So: point `repoDir` at a tree with no `research/` in it, and every URL ZOE is ever handed reads as
never-researched. There is no error. There is one `console.error` line from the outer layer only if
the promise rejects - and it does not reject, because the inner `catch` already swallowed it and
returned a clean `false`. **The outer log will not fire for the exact failure it appears to guard.**

This is `silent-failure-guard.md` rule 6 (a soft-fail must be loud) and `first-handler-wins.md` rule
4 (announce the claim) in one function. It is also expensive in a way ZAO now has a number for:
`agent-spend.md` prices a turn at about **$1.01**, so a dedupe that always says "no" spends real
money re-researching a library of 1,926 numbered docs, and the only symptom is docs you already have
arriving again.

### The other five readers

The PDF says four. The grep found six, which is worth having written down before anyone moves the
directory:

| File | What it does with the path | Behaviour if the path is empty |
|---|---|---|
| `bot/src/zoe/research-dedupe.ts:106` | `readdir(researchDir)` | **Silent fail-open.** The dangerous one |
| `bot/src/zoe/index.ts:1758` | calls `wasResearched(url, join(repoDir,'research'))` | Second fail-open layer over the same call |
| `bot/src/zoe/research-doc.ts:36,60,71,75` | `readdir` + `join` + `git add` - this is the WRITER | Writes new docs into whichever tree `REPO` points at |
| `bot/src/zoe/team-tracker.ts:647` | `git ls-tree -d -r origin/main research/` | Reads git, not disk. Would silently read ZAOOS's **stale** copy after a move |
| `bot/src/zoe/recap.ts:85` | `find <repoDir>/research -name "*.md"` piped, ends `|| true` | Returns empty. "Research docs added today: (none)" forever |
| `bot/src/zoe/meetings.ts:104` | `resolve(repoDir, 'research/events/_meetings-index.md')` | Meetings index unreachable |

`recap.ts:85` deserves its own note: the command ends in `|| true`, which is precisely the pattern
`silent-failure-guard.md` rule 4 bans on a gate. It is arguably fine here (a recap with no docs is a
legitimate result) but it means a broken path and a quiet day are indistinguishable in the recap.

`team-tracker.ts:647` is the subtlest: it reads `origin/main` via git rather than the working tree,
so after a sibling-clone move it would keep working and keep answering from the **old** library.
Working-but-stale is worse than broken, because nothing ever flags it.

## The divergence, measured

The PDF's proof-it-moved-intact section prints identical tree hashes for `HEAD:research` in both
repos. That was true when written. It is not true now, and the drift is the argument for finishing
the move rather than an argument against it.

Measured 2026-08-11 via the GitHub API on both repos:

```
ZAOOS        HEAD:research  f4b62304a94dcfe05984290615c3be52f24c1fae
ZAOresearch  HEAD:research  52aff5e3225be6dc83d8541d3e021e9d9d3c2b51
```

Divergence is small and entirely explicable - **3 files** out of ~2,535 tracked:

| Direction | File | Why |
|---|---|---|
| Only in ZAOOS | `research/_radar/2026-08-10.md` | Generated after the snapshot |
| Only in ZAOresearch | `research/events/2260-wavewarz-space-2026-08-08/README.md` | **ZAOOS reverted this**, commit `c324b934`, "revert: doc 2260 - wrong recording" |
| Only in ZAOresearch | `research/events/2260-wavewarz-space-2026-08-08/transcript.txt` | Same revert |

So the copy is not stale in the ordinary sense - it is 2 files ahead and 1 behind, and **the 2 it is
ahead by are content Zaal deliberately removed.** That is the concrete form of the drift the
graduation rule exists to prevent, and it appeared within one day. It also settles the sync
direction question before anyone asks it: any automatic reconciliation would have restored a
recording Zaal pulled.

## Why "sibling clone" is right and "submodule" is not

IMan's three options, with the reasoning that decides between them:

| Option | Verdict | Reasoning |
|---|---|---|
| **Sibling clone** - one configurable path, defaulting to a checkout next to ZAOOS | **TAKE THIS** | About four files plus one config line on the VPS. Crucially: the path is explicit, so it can be made to **fail closed** |
| Submodule - `research/` becomes a pointer | Reject | "Any clone that skips one extra command gets an *empty* folder, and the loops and codex agents clone without that step today." That is the same silent-empty failure, arrived at by a different route. A fix that reintroduces the bug it is fixing is not a fix |
| Mirror, do not move | Reject | Two sources of truth, which is the exact thing the router exists to prevent. Already demonstrated by the doc 2260 divergence above |

**The condition on decision 1:** sibling clone is only safe once the readers fail closed. Right now
a mistyped or unset path is indistinguishable from an empty library, and the system's response to an
empty library is to silently redo 1,926 docs of work. The move makes a wrong path possible for the
first time. Fix the guard, then move.

Concretely, `wasResearched` should distinguish three states, not two: found, not-found, and
**could-not-check**. Could-not-check must throw or return a distinct value that the call site
refuses to treat as not-found. That is a small change to one function and its one caller.

## Findings

1. **The migration is done and it is clean.** 2,138 commits, 8 author identities preserved, doc
   paths unchanged so every citation any agent ever wrote still resolves. The tree-hash proof was
   the right way to demonstrate it.
2. **The guards came across, and one worked immediately** - CI found 18 missing index rows across
   four topic folders on the first push, added them, and committed, green in 22 seconds.
3. **One improvement was made on purpose and is worth keeping:** the secret and PII scans now run
   server-side, not only as a local commit hook. They previously never ran for the VPS loops or the
   codex agents, which commit from clones with no hooks installed. That library holds meeting
   recaps and raw call transcripts, so this closed a real hole.
4. **The blocking item is a two-line fail-open in ZOE**, not the repo layout.
5. **Drift started within a day**, and the direction of it is the argument for deleting the ZAOOS
   copy rather than mirroring it.

## Also See

- [Doc 836](../836-zaoos-repo-estate-census/) - the repo estate census the PDF's file counts extend
- [Doc 2258](../../agents/2258-agent-spend-turn-economics/) - why a silent re-research is a bill, not just a bug

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Make `wasResearched` fail CLOSED: return/throw a distinct could-not-check state, and make `index.ts:1758` refuse to treat it as not-researched. Shipped when a test asserts that a missing research dir does NOT report a URL as un-researched. | @Zaal | PR | 2026-08-14 |
| Reply to IMan: sibling clone, yes to public, and the fail-open must land first. Shipped when IMan has the answer in writing. | @Zaal | Message | 2026-08-12 |
| Flip ZAODEVZ/ZAOresearch to public | @Zaal | Decision | 2026-08-14 |
| Re-verify the AWS-secret-key gap in the secret scanner that IMan flagged and did not silently edit | @Zaal | PR | 2026-08-18 |
| After the readers fail closed and the sibling clone is configured, delete `research/` from ZAOOS per the graduation rule, and redirect the 283 referencing files | @Zaal | PR | 2026-08-25 |

## Sources

- `~/Downloads/ZAOresearch-for-zaal.pdf` - **[FULL]** all 4 pages read 2026-08-11. Authored by IMan, "migrated 2026-08-10, update 2026-08-11". Every quoted figure above is from the page, and every one marked verified was re-checked independently.
- [github.com/ZAODEVZ/ZAOresearch](https://github.com/ZAODEVZ/ZAOresearch) - **[FULL]** repo metadata, root tree, `research/COLLISION_TOLERANCE.md`, and a shallow clone diffed file-by-file against ZAOOS `origin/main`, all 2026-08-11. Private at time of check, `pushed_at` 2026-08-11T22:35Z, size 62,640 KB.
- `bettercallzaal/ZAOOS` live source - **[FULL]** `bot/src/zoe/research-dedupe.ts` and `bot/src/zoe/index.ts` read from disk; tree hashes and the `research/` commit log via the GitHub REST API.
- Credit: the migration, the tree-hash verification method, the server-side scan improvement, and the three-option framing are **IMan's** work.
