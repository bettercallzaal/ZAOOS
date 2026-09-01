# Documentation lives in the repo, not in an artifact

Zaal, 2026-09-01: *"we swtiched from zaalp99 claude subscribtion to thezao one so
artifacts may not be as availible, that is why we should always just be doing
documentation in the repo itself."*

He is right, and it is worse than "may not be as available". It was measured the
same hour and one of our own cited deliverables is already gone.

## The measurement

The estate had been shipping real work as artifacts and recording the artifact id
as the deliverable. `~/zao-vault/handoffs/IN-FLIGHT.md` carries a row whose
deliverable is an ECOSYSTEM AUDIT - ten divergences where the estate reported
green and measurement found otherwise - published as
`claude.ai/code/artifact/d2acbaf0-05df-498c-a7fb-9943c513a5be` on 2026-08-22.

Read from the current account on 2026-09-01:

```
Artifact d2acbaf0-... : artifact not found - it may have been deleted,
                        or it has not been shared with you
```

The audit's findings survive only as the prose summary somebody happened to paste
into the vault row. The artifact itself is unreachable.

Counted across `~/zao-vault` the same day:

| Shape | Count | Status |
|---|---|---|
| Full `claude.ai/code/artifact/<uuid>` URLs | **30** | reachable only while the publishing account is |
| Bare 8-character ids, e.g. "Artifact ab51e009" | **3** | **not resolvable at all** - not a URL, no lookup takes them |
| ZAOOS research docs citing an artifact | 1 (doc 2191) | the library is otherwise self-contained |

Artifacts published by the CURRENT account still work - fifteen listed fine,
including today's. This is not "artifacts are broken". It is that **an artifact's
lifetime is tied to an account, and the account changed.**

The three bare ids are a second, independent failure that has nothing to do with
the switch: an 8-character prefix was written down where a UUID was needed, so
those were never retrievable by anyone, including on the day they were made.

## The rule (behavior-changing)

**Anything a future session, a teammate, or Zaal will need to read again is
written into a git repo. An artifact is a VIEW of that, never the copy of record.**

- **Research, audits, decisions, specs, state** -> `research/NNNN-slug/` in ZAOOS,
  or the relevant repo's own docs. The research library is the institutional
  memory and it is already self-contained; keep it that way.
- **Lane state, briefs, people, the why behind a decision** -> `~/zao-vault/`,
  committed and pushed.
- **Task state** -> the cowork board.
- **An artifact** is for a thing a human will LOOK at once - a rendered board, a
  deck, a page to skim on a phone. Publish it if it helps. Then make sure the
  content exists in a repo, and cite the repo path, not only the URL.

**Never let an artifact id be the only address of a deliverable.** A row that
says "shipped as artifact `<id>`" and nothing else is a deliverable that has
already been lost once here.

**If an artifact is worth citing, cite it with its full UUID and alongside a repo
path.** `artifact 576d4461` on its own is not an address. Doc 2456's Sources
section, `vault:notes/x.md`, `PR #3385` - those are.

## Why this is not just a preference

`vanishing-dependencies.md` says: if something depends on it, git must hold it.
That rule was written about scripts. This is the same failure applied to
knowledge, with an extra edge - a vanished script announces itself the next time
the cron runs, whereas a vanished artifact is silent until somebody clicks a link
months later and finds nothing. There is no failing job to notice.

`handoff-discipline.md` rule 8 already says a scratchpad holds nothing that
outlives the session. An artifact on an account we no longer use is a scratchpad
that looked permanent.

## Guards

- This does not ban artifacts. A rendered view is genuinely better than markdown
  for some things, and Zaal reads them on his phone. Publish freely; just do not
  let the artifact be the only copy.
- Do not go back and delete the 30 existing URLs. They are useful while they
  resolve, and deletion is Zaal's anyway (`no-rm-rf.md`). The fix is forward: new
  work lands in a repo, and any artifact cited as a deliverable gets its content
  mirrored into the vault or the library when it is next touched.
- Do not mirror an artifact's content somewhere it does not belong just to satisfy
  this rule. If the content has no home in a repo, that is a sign it was not a
  deliverable.

## Source

Zaal 2026-09-01, on the subscription move from zaalp99 to thezao. Measured the
same hour: `d2acbaf0` unreachable, 30 full URLs and 3 truncated ids across the
vault. Siblings: `vanishing-dependencies.md` (git must hold what is depended on),
`handoff-discipline.md` rule 7 and 8 (which store owns what; scratchpads hold
nothing durable), `state-claims.md` (a claim carries its source, and a dead URL is
not one).
