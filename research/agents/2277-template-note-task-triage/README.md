# Doc 2277 - Template-note tasks, re-audited: 104 still open, and the `Both` bug is gone

**Date:** 2026-08-14
**Deliverable:** this triage. **No task was edited, closed, or reassigned.** Zaal
decides what closes.
**Source:** `public.tasks`, Supabase project `etwvzrmlxeobinrlytza`, read-only.

Re-runs the 2026-07-27 audit against the board as it stands today.

## The answer in one table

| Question asked | Answer |
|---|---|
| How many template-note tasks are still open? | **104** |
| How old is the oldest open one? | Created **2026-07-03**, 42 days |
| How many carry owner `Both`? | **Zero. `Both` no longer exists anywhere on the board.** |

## Three corrections to the brief

**1. The template is not one template, it is four.** Matching only the exact
meeting string finds 58 rows, 9 open. The real population is the family sharing
the trailing sentence "Reply to Claude in next session if blocked.":

| Family | Note opens with | Created ever | **Open now** | Oldest open |
|---|---|---|---|---|
| B - forwarded email | `Action item captured from forwarded email.` | 115 | **76** | 2026-07-03 |
| D - bare boilerplate | *(the sentence alone)* | 18 | **18** | 2026-07-10 |
| A - meeting recap | `Action item from /meeting recap.` | 60 | **9** | 2026-07-03 |
| E - other | mixed | 2 | **1** | 2026-07-03 |
| C - doc/PR review | `Reference: https://github.com/...` | 158 | **0** | - |
| | | **353** | **104** | |

**2. The 98 were not meeting tasks.** Only **60** meeting-recap tasks were ever
created, so 98 of them could not have existed on 2026-07-27. The audit was
counting the family, and the dominant member is the `/inbox` forwarded-email
template, not `/meeting`.

**3. The meeting pipeline is the one that got fixed.** Family A is 60 created and
9 open - **85% closed**. Family B is 115 created and 76 open - **34% closed**.
Family D is 18 created and 18 open - **nothing has ever been closed**. Pointing
remediation at `/meeting` would be aiming at the part that already works.

## `Both` is gone, but its replacement is live

`Both` appears **zero** times in `metadata->>'owner_label'` and zero times in
`metadata->>'next_owner'`, on open or closed tasks. Whatever fixed it, it is fixed.

The same failure mode has reappeared as **case-split labels**. If
`effectiveAssignees` matches the roster exactly - which is what made `Both`
resolve to nobody - then every lowercase variant resolves to nobody too:

| Label | Total | **Open** |
|---|---|---|
| `Zaal` / `zaal` | 394 / 60 | 190 / **44** |
| `Iman` / `iman` | 25 / 10 | 4 / **6** |
| `Jose` / `jose` | 2 / 5 | 1 / **5** |
| `Samantha` / `samantha` | 2 / 1 | 2 / 0 |
| `Open` | 1 | **1** |

**56 open tasks carry a label that differs from the canonical one only by case**,
plus one literal `Open`. Within the 104 template tasks specifically, 22 are
lowercase-owned. This is unconfirmed as a live defect - it depends on whether
`effectiveAssignees` lowercases before matching, which is a code question, not a
data one, and it was not read for this doc. If it does not normalise, these are
invisible in my-work, digests and mentions exactly as `Both` was.

## Why the notes are empty: the schema kept the pointer and dropped the reason

Every one of the 104 open tasks has a `why` key that is **empty on all 104**. Same
for `url`. What survived is `ref` and `source_slug`, on 102 of 104.

An earlier pass of this audit read `metadata->>'url' is not null` and concluded
102 tasks carried a link. They do not - the key exists with an **empty string**,
which is not null. Treating empty as absent is the difference between "102
recoverable" and "0 recoverable from metadata alone".

So no task is recoverable from its own row. Recovery depends entirely on whether
the artifact the slug names still exists.

## Group 1 - recoverable from a linked artifact that exists (8)

The source is on disk; a writer script could reconstruct the why without Zaal.

**Meeting recap present (1)**

| Task id | Slug | Recap |
|---|---|---|
| `082da183-15f6-4001-a0f0-e1accc0aa317` | `meeting-ohnahji-2026-07-02` | `research/events/950-ohnahji-zaal-strat-sesh/` incl. transcript |

**Handoff bundle present in `~/.zao/handoff/` (7)**

| Task id | Slug | Bundle |
|---|---|---|
| `368fc704-fab9-4785-9506-99bd26791d36` | `handoff-zao-whitepapers` | `session-2026-07-10-zao-whitepapers` |
| `db82c6a9-15a0-4377-9823-d9ac7d6638ac` | `handoff-zao-papers-and-paperz-bot` | `session-2026-07-11-zao-papers-and-paperz-bot` |
| `128ff6e4-4b57-4231-85da-c22dbf149317` | `handoff-zao-paragraph-newsletter` | `session-2026-07-11-zao-paragraph-newsletter` |
| `34bae0ed-696a-45e5-b994-715d36c55447` | `handoff-sparkz-stage1-wizard` | `session-2026-07-16-sparkz-stage1-wizard` |
| `edf3239c-3748-4f26-a047-6baeb7c21da7` | `handoff-zaocowork-facts-cleanup` | `session-2026-07-16-zaocowork-facts-cleanup` |
| `1e8c4c60-b36d-40d3-bcc8-e2aea9760fbf` | `handoff-zao-brand` | `session-2026-07-24-zao-brand` |
| `0fafe296-362d-4a11-8a46-60ff927011c7` | `handoff-baraza-partnership-audits` | `session-2026-07-25-baraza-partnership-audits` |

## Group 2 - recoverable only from Zaal (94)

Buckets below are disjoint and sum to 104: 8 (group 1) + 94 (group 2) + 2 (group 3).

**2a. Meeting with no recap in the repo (8).** All from
`meeting-william-zaal-2026-07-21`, all created 2026-07-22, all due 2026-07-23, all
owner `Zaal`. A repo-wide search for "william" under `research/` returns nothing,
so the recap was never filed. Eight action items survive with only their titles.

`eb7f9223-d28f-45df-b545-e2b520ceed22` (livestream time with William) ·
`221ff908-0f78-44de-a565-ed5f4a113a85` (Costa Rica property link) ·
`96e025f4-ec25-41bb-99b0-dde380f80733` (CR residency website, 2027) ·
`27b66235-9aeb-49aa-9422-e1e9817a75a5` (WaveWarZ team on CR planning) ·
`3ff9579b-4b31-41cb-9780-755453e2f261` (William to read Artizen docs) ·
`6e5b3b3b-6b46-4565-aa38-bd906e36c611` (send build-a-thon recordings page) ·
`98732f68-a547-455c-86cc-5ff4f13ce1de` (Alliances Grand Table, September) ·
`c8f22728-b094-4f08-9cbb-5c83f5b5c7ae` (WaveWarZ AI-automation audit)

The September one is time-sensitive and its due date has passed.

**2b. Handoff with no bundle on disk (11).**

`ca4d2061-e0bd-43b3-9b1e-d546ceeb9488` `handoff-budget-reconcile-artizen-page` ·
`1cd90088-bae1-446a-9a41-a7565bbd3b06` `handoff-finance-hq-checkpoint` ·
`5582bf4d-cb2b-41c1-8318-2ef0ebbbfbf3` `handoff-artizen-season7-refresh` ·
`cd745593-40ac-434a-8ab9-d802b815bc85` `handoff-recap-pipeline-and-audit` ·
`5162944e-fd91-4cae-a7b5-abbbe0d8a488` `handoff-privy-to-walletconnect-hats-base` ·
`e15516d0-13b8-4a93-acf5-451daf73c692` `handoff-zao-road-to-devcon-wavewarz-hurricane` ·
`d05c175d-0a3b-415c-9325-7387ea087d5b` `handoff-wavewarz-pitch-deck` ·
`59f41bcc-2ee6-4f0a-8e8c-c39956d2ab4b` `handoff-zabal-gamez-vote-live` ·
`bcc962e0-f031-44f0-95ce-4170fc121fd9` `handoff-sparkz-rebrand-positioning` ·
`08b792f3-bc42-4b2e-8a5d-baaaeee732c0` `handoff-sparkz-prod-readiness` ·
`8028adee-23d6-470f-86e2-4314234fe2ca` `handoff-zabalgamez-priority-week`

Several of these are self-describing enough to act on from the title alone -
`handoff-zabal-gamez-vote-live` and `handoff-zabalgamez-priority-week` both refer
to work that has since happened. They are listed here rather than as dead because
that is a judgement about whether the *follow-up* landed, not the work.

**2c. Forwarded email, source off-repo (74).** This is the 76-row email family
minus the 2 broken out to group 3. Slugs are `inbox-<topic>` and are
descriptive, but the email body lives in AgentMail, not the repo, and
`pii-hygiene.md` keeps it there. Recovering the why means Zaal opening the thread.

A structural note worth more than the individual rows: **48 of the 76 email rows
have no due
date at all**, and 21 are `inbox-notes-0717-NN`, `inbox-term-<timestamp>` or
`inbox-overnight-20260719-N` - autogenerated batch slugs with no topic in them.
Those 21 are the least recoverable rows on the board: no due, no why, and a slug
that names a batch rather than a subject.

**2d. One row with no family signal (1).** `45962159-6f50-4069-8e55-ade6496b1f62`,
"Whitepaper v1.0: publish 3 docs to permaweb + mint manifesto Hat" - no slug, no
due, no owner. Legible title, no provenance.

Full email id list is in the query at the end of this doc rather than inline; the
slug is the only per-row signal and it is already summarised above.

## Group 3 - dead by their own note (2)

Both already say they are superseded, in their own notes, and were left open.

| Task id | Evidence in the note |
|---|---|
| 2 tasks, family B | `2026-08-09 SUPERSEDED by 'Deep dive on ALL socials...' (inbox-social-deep-dive-2026, due 2026-08-23). De-urgented, not closed` |

Someone made the call and recorded it; the status just never followed. These are
the only two rows where the board itself states the task is obsolete.

These 2 are carved out of the 76-row email family, which is why group 2c counts 74.

**Not called dead, deliberately:** 2 rows have no slug and no context of any kind
(`66638e35-8723-49b9-92b4-f3d9d08ad9d0` in group 2c, and
`45962159-6f50-4069-8e55-ade6496b1f62` in group 2d). They are unrecoverable from
data, but the second has a legible title describing real work. Unrecoverable is
not the same as obsolete, and only Zaal can tell the difference.

## Overdue

53 of the 104 are past their due date: 26 in family B, 18 in D, 9 in A. Only 4 are
more than 30 days overdue. 48 have no due date, so they cannot be overdue and
cannot surface in a date-driven digest either - which is its own kind of invisible.

## What this says about the writer scripts

The original diagnosis holds and is now precise: the extraction schema writes
`ref` and `source_slug` but leaves `why` and `url` as empty strings. A writer
script reading `why` gets `''` on every one of the 104, and a script checking
`url is not null` gets a false positive on 102. Both failure modes are present in
the same rows.

The fix is in the extractor, not the board: populate `why` at capture time, and
either populate `url` or omit the key rather than writing `''`.

## Method

- `public.tasks`, read-only `select` only. No `update`, `insert` or `delete` ran.
- Open = `status not in ('done','completed','closed','cancelled','archived')` and
  `archived_at is null` and `completed_at is null`.
- Family assignment by `notes like` prefix, not exact equality - that is what the
  first pass got wrong.
- Empty-vs-null handled with `nullif(trim(...),'')` throughout, after the
  empty-string trap was found.
- Artifact existence checked against `git ls-tree origin/main research/` and
  `ls ~/.zao/handoff/`.

Counts are absolute and measured 2026-08-14, not carried from the July audit.

## Caveats

- The case-split owner finding is a hypothesis about `effectiveAssignees`, not a
  confirmed defect. Confirming it means reading the resolver, which this doc did
  not do.
- "Recoverable from a linked artifact" means the artifact exists, not that it
  contains the why. Spot-checking whether the ohnahji recap actually explains its
  action item would take opening it; that was not done for all 8.
- A VPS IP address appearing in one task title was omitted from this doc: ZAOOS is
  a public repo.
