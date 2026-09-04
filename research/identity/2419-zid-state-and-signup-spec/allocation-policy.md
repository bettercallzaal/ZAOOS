---
topic: identity
type: decision-brief
status: awaiting-zaal
last-validated: 2026-08-26
original-query: "ZID allocation policy: new joiners get a ZID at signup; the first 1000/500/100 reserved for people already in ZAO. Needs a Zaal decision on tier size."
tier: STANDARD
parent-doc: 2419
related-docs: [2419, 005, 158]
---

# ZID allocation policy - sizing the reserved block, filling it, and what it costs

> **Nothing was assigned and nothing was written.** No ZID created or changed, no
> `setval`, no sequence read, no Supabase mutation, nothing pushed. Every gated
> item is raised in section 6 rather than taken.

Companion to [`README.md`](./README.md) (doc 2419), which measured the live state.
That doc ended with six decisions for Zaal. This one takes the two that block
other work - **how big the reserved block is** and **how it gets filled** - and
makes them decidable: the option set, the arithmetic, the mechanics, and the
consequences of each. The size itself is Zaal's and is not decided here.

## Executive summary

Four things came out of reading the live code that change the shape of this
decision.

1. **The tier-size decision is not blocking anything yet.** The block can be
   filled starting at 1 under any `N` at or above the eventual fill. `N` is only
   required at one moment - `setval('zid_seq', N)`, the step taken immediately
   before the first public signup. So member write-ups can proceed now, and the
   number can be chosen later. This corrects the task's own framing that
   allocation "blocks member write-ups."
2. **The block has to hold 142 people, not 122 or 188.** The enumerable cohort is
   the union of the users table and the on-chain holders, not either alone.
3. **ZIDs are already displayed publicly** - in the chat feed and on the Respect
   leaderboard, in shipped code. Ordering the block is a visible act, not
   internal bookkeeping. And the chat surface keys its lookup on **FID**, so a
   wallet-only member's ZID never renders there - which is most of the reserved
   cohort.
4. **Pre-seeding a reserved ZID before the person ever signs up works natively,
   and this was verified rather than assumed.** All four code paths that write
   `users.primary_wallet` lowercase it, and both auth paths upsert on that column
   without touching `zid`. So a row seeded with a wallet and a ZID survives that
   person's first login intact. The one missing piece is a way to set a specific
   ZID at all, and that is a schema field, not a system.

**The one recommendation, and it is Zaal's to overrule: 500.** Reasoning in 2.3.

## 1. The population the block has to hold

Doc 2419 tested three candidate populations against the four proposed sizes.
It did not combine them, and combining them is what produces the real floor.

| "People already in ZAO" | Count | Source |
|---|---|---|
| rows in the app `users` table | 60 | live database, 2026-08-25 (doc 2419 s1.5) |
| holders of the ZAO Respect Token | 122 | Blockscout, Optimism, 2026-08-25 (doc 2419 s1.7) |
| holders that match a `users` row | 39 distinct addresses, across 40 rows | doc 2419 s3.1 |
| holders matching nothing in `users` | 83 | doc 2419 s3.1 |
| the membership number ZAO states publicly | 188 | `CLAUDE.md`, project memory |

**The union is what needs numbering.** A holder with no `users` row is still a
person the reserved block is for, and a `users` row that holds no Respect is too
(21 of the 60 are `member_tier = community`). So:

> 60 rows + 83 unmatched holders = 143 rows, but **142 distinct identities**.
> The two `users` rows sharing one holder address are confirmed to be one person,
> not two - so the enumerable cohort is **142**.

**Updated 2026-08-26.** That conditional is now resolved. The duplicate was
measured against the live table and the person is confirmed as one individual in
the brand glossary (Zaal, 2026-08-24). The rest of this doc states its arithmetic
against 143; nothing in it moves at that precision - 500 clears 142 by 3.5x and
1000 by 7.0x either way, and the dead-space figures shift by one slot. The
conclusions and the recommendation are unchanged.

**As first written this figure was derived arithmetic on doc 2419's measured
numbers. It has since been measured directly** (2026-08-26, read-only): the
intersection returns 39 distinct holder addresses across 40 `users` rows, 83
unmatched, reproducing doc 2419 section 3.1 exactly. The Respect ledger has been
static since 2025-12-20 and the users table gained two rows in four and a half
months, which is why the derivation held.

Two things follow.

**188 is not a floor, because it is not a list.** You cannot hand a ZID to a
stated count. The 188 figure has never been reconciled against either the users
table or the holder roster, and until it is, the enumerable cohort is 142. Sizing
the block against 188 is sizing it against a number nobody can currently
enumerate into rows.

**99 and 100 were already eliminated in doc 2419, and 143 eliminates them
again from a third direction.** They cannot hold the cohort.

## 2. The four options

### 2.1 Scored

Assume the block fills to 143 (every enumerable identity gets a reserved number)
and then closes.

| Option | N | Headroom over 143 | Slots never issued | First public ZID |
|---|---|---|---|---|
| **A** | 100 | none - **cannot hold the cohort** | n/a | eliminated |
| **B** | 500 | 3.5x | ~357 | 501 |
| **C** | 1000 | 7.0x | ~857 | 1001 |
| **D** | fill + stated buffer (e.g. 250) | ~1.7x | ~107 | 251 |

Option D is not in Zaal's original set of three. It is included because the
option set as posed forces a round number, and a round number is what creates
the dead space in the first place. D says: fill the block, then close it just
above the fill, with a buffer large enough to absorb the people we know exist but
have not enumerated yet.

### 2.2 The asymmetry that makes this cheaper than it looks

**`N` can be raised at any time before the first public assignment. It can never
be lowered after.**

`nextval` is monotonic. Once the sequence is set to N and public signups begin,
every unassigned number below N is unreachable through the normal path forever -
reaching them again means a specific-value write per number, which is exactly the
out-of-band path the reserved block uses. So:

- Choosing too small, early, is recoverable: raise N before opening public signup.
- Choosing too large is not: the gap becomes permanent.
- **Therefore the decision has a natural deadline, and it is not today.** It is
  the moment before the first public signup, which cannot happen until the signup
  wiring in section 5.3 step 5 exists, which does not exist.

This is the finding that unblocks the dependent work. Filling the reserved block
from 1 upward is correct under every one of B, C and D. Nothing about writing up
members and giving them low numbers requires knowing where the block ends.

### 2.3 The recommendation, and the argument against it

**500.** Three reasons.

- It clears the enumerable cohort of 143 by 3.5x and the stated 188 by 2.7x, so
  it survives the 188 figure turning out to be real and enumerable.
- It bounds the permanent dead space at roughly 357 slots rather than 857.
- A low ZID is only scarce if the block is small enough that filling it is
  visibly finite. At 1000, the reserved block is larger than any plausible
  near-term ZAO, so "reserved" stops meaning anything - every member for years is
  inside it, and the distinction the block exists to draw never gets drawn.

**The honest argument for 1000**, which doc 2419 made and which stands: it is
exactly the 188-to-1,000 growth multiple named in the L6 gate of
`~/zao-vault/notes/zao-decentralization-scale.md`. Choosing 1000 means the whole
journey to L6 happens inside the reserved block and the first genuinely public
ZID is not issued until ZAO has 5x'd. That is a real position. It is a bet that
the reserved block should mean "everyone from before we were big" rather than
"the founding cohort."

**The argument for D**, which is the one nobody has made: the reserved block's
whole job is to hold people who already exist, and we can count them. 143 is a
measurement. Anything above it is a guess about a future the block was not
designed to cover, and public ZIDs starting at 251 instead of 1001 is a smaller
lie for a 200-person organisation to tell about itself.

**This is Zaal's call.** It is a fact about what he wants the number to mean, and
`lane-autonomy.md` puts that squarely in the gated column. The contribution here
is that A is arithmetically dead, that the decision has a later deadline than
assumed, and that D exists.

## 3. What an unfilled block actually costs

Dead space is not neutral, and two shipped surfaces already show why.

**The admin dashboard already counts a missing ZID as a defect.**
`src/app/api/admin/member-health/route.ts:128` does `if (!u.zid) missing.push('zid')`
and line 182 reports `missingZid` as a headline count. With three ZIDs across 60
rows, that surface reports **57 members missing a ZID** today. Until the reserved
block is filled, that number is a permanent non-zero alarm - the exact shape
`noisy-signal-guard.md` warns about, a check that cannot reach zero and therefore
stops being read.

**The first public ZID is a public claim.** A joiner who is told they are member
1043 when ZAO has roughly 200 people is being told something by the number
itself. 501 is a smaller version of the same claim, 251 smaller still. This is
not an engineering consideration and it is precisely why the size is Zaal's.

## 4. Ordering: what the live code adds to an open question

Doc 2419 section 2.3 records the ordering question as UNRESOLVED, with two
readings of Zaal's reversal plus a third the hand-assigned data suggests. That
stands unchanged - one sentence from Zaal closes it and nothing here guesses.

Two facts from the shipped code bear on it.

**ZIDs are already rendered publicly, in two places.**

- `src/app/api/chat/messages/route.ts:192-210` selects `fid, zid` for every author
  in the feed and attaches `author.zid` to each cast.
- `src/app/api/respect/leaderboard/route.ts:28,79` returns `zid` on every
  leaderboard entry.

So a ZID is not an internal key awaiting a decision. It is a number that appears
next to a person's name in the chat and on the leaderboard the moment it is
assigned. Whatever orders the block is publicly legible on day one.

**The chat surface cannot display a wallet-only member's ZID.** That enrichment
is keyed on FID: it builds a `Map` from `fid` to `zid` and looks up
`zidMap.get(c.author.fid)`. A row with no FID has no key. Doc 2419 measured 23 of
60 rows with no FID, and all 83 unmatched holders are wallet-only by definition.

So if the reserved block is filled from the on-chain holder roster - the
seniority ordering - most of the numbers it hands out will never render on the
one surface where members see each other's ZIDs. That is a build item rather than
a decision, and a small one: key the enrichment on the row rather than the FID.
But it should be fixed **before** the block is filled, or the first visible
outcome of a seniority-ordered allocation is that the oldest members appear to
have no ZID.

## 5. Mechanics: how the block gets filled

### 5.1 Pre-seeding by wallet works, and this was verified rather than assumed

The plan that makes a reserved block possible at all is to create the row before
the person arrives: write `primary_wallet` plus the reserved `zid`, and let their
eventual first login attach to it. That only works if the login path matches the
existing row instead of creating a second one, and if it does not clobber `zid`.

Both hold, checked in source:

- `src/app/api/auth/siwe/route.ts:154-165` upserts with
  `{ onConflict: 'primary_wallet' }`. The payload sets wallet, fid, username,
  display_name, pfp_url, role and last_login_at. **It does not contain `zid`.**
- `src/app/api/auth/verify/route.ts:216-230` upserts with the same conflict
  target and `ignoreDuplicates: false`. Also no `zid` in the payload.

So a pre-seeded ZID survives first login on both paths.

**Address casing was the obvious way for this to fail silently, and it does
not.** Every path that writes `primary_wallet` lowercases first:

| Path | Line | Lowercased |
|---|---|---|
| `auth/siwe` | 114 | `siweMessage.address.toLowerCase()` |
| `auth/verify` | 195 | `(primaryWallet \|\| '').toLowerCase()` |
| `admin/users` POST | 174 | `primary_wallet.toLowerCase()` |
| `admin/users/import` | 59, 69, 108 | lowercased on every branch |

Note that `ethAddressSchema` (`/^0x[a-fA-F0-9]{40}$/`) accepts mixed case at the
boundary - the normalisation happens after validation, in the handler. It is
consistent today across all four writers, but nothing in the schema enforces it,
so a fifth writer added later could break the whole mechanism without failing a
test.

**The operational trap that follows:** Blockscout returns **checksummed** mixed-case
addresses, and the entire holder roster in
[`seniority-roster.md`](./seniority-roster.md) came from Blockscout. Any
pre-seeding script must lowercase before insert, or it creates a parallel row
that the auth upsert will never match and the reserved ZID is orphaned on a row
nobody logs into.

`onConflict: 'primary_wallet'` requires a unique constraint on that column, and
the POST path's handling of Postgres error `23505` as "User already exists"
(`admin/users/route.ts:247-248`) is consistent with one existing. This is
inferred from two code sites, not read from the schema - reading DDL needs
database access that was out of scope for this pass.

### 5.2 The only genuinely missing piece is one schema field

Doc 2419 called this requirement 5 and marked it "does not exist." Confirmed from
the schemas rather than inferred:

- `createUserSchema` (`admin/users/route.ts:18-26`) has no `zid`.
- `updateUserSchema` (lines 28-42) has `assign_zid: z.boolean()` and no `zid`.

`assign_zid: true` calls the sequence. There is no way, anywhere in the product,
to say "give this user ZID 47." That is why the three ZIDs that exist were
written directly to the database.

The build is small and should stay small:

- Add `zid: z.number().int().positive().optional()` to `createUserSchema` and
  `updateUserSchema`.
- Gate it on `requireAdmin()`, which already wraps both handlers - it must never
  become reachable from a signup path, because a caller-chosen ZID from an
  unauthenticated path is an identity forgery, not a feature.
- Emit a distinct audit action (`user.set_zid`) rather than reusing
  `user.assign_zid`, so the reserved block and the sequence remain separable in
  `security_audit_log`. Doc 2419's finding that zero `user.assign_zid` rows exist
  is only readable because that action is specific.
- Let the `UNIQUE` constraint reject collisions. Do not pre-check and branch;
  catch `23505` and return 409, matching what POST already does.

### 5.3 Order of operations

Steps 1, 2 and 4 are live database writes or reads and are Zaal's. They are
listed so the sequence is legible, not so anyone runs them.

1. **Read the sequence.** `SELECT last_value, is_called FROM zid_seq;` Read-only.
   Settles doc 2419 s1.4's prediction one way or the other.
2. **Fix the sequence.** `SELECT setval('zid_seq', (SELECT COALESCE(MAX(zid), 0) FROM users));`
   Idempotent, correct under every option in section 2, and it removes the
   confusing `500 Failed to assign ZID` on the first real press. **GATED.**
3. **Build the specific-value path** (5.2). Not gated - ordinary PR work.
4. **Fill the reserved block**, by explicit value, in whatever order Zaal decides,
   pre-seeding rows by lowercased wallet for people who have not signed up (5.1).
   Each write is Zaal's or Zaal-approved; identity confirmation is his.
5. **Only when public signup opens:** `setval('zid_seq', N)`. **This is the single
   moment N is required** (2.2), and it is the point of no return.
6. **Wire signup to call `assign_next_zid`** with its own audit event. The RPC is
   already idempotent and atomic (doc 2419 s4.2 requirements 1 and 2); what is
   missing is a caller outside `requireAdmin()` and an audit trail for it, or the
   `security_audit_log` develops a hole the moment public signup opens.

Steps 3 and 6 are the entire build. Everything else is a decision or a write.

### 5.4 What breaks if a reserved person signs up first

They get a public number, and it is immediately displayed (section 4). Correcting
it afterwards is an `UPDATE` on an identifier other members have already seen,
which is the one thing a membership number should never do.

Pre-seeding (5.1) is the defence, and it is available now for all 143: every
holder address is known, and the 60 existing rows already have wallets. This is
an argument for doing step 4 early rather than for deciding N early.

## 6. Asks for Zaal - raised, not taken

Per the dispatch: no live DB writes, no mutations, nothing irreversible. These go
up as asks.

| # | Ask | Why it is gated | What this pass contributes |
|---|---|---|---|
| 1 | **Reserved block size: 500, 1000, or D (fill + buffer)** | A fact about what Zaal wants the number to mean | 100 is arithmetically dead; the floor is 142 not 122 or 188; the deadline is the first public signup, not now; D exists; recommendation is 500 |
| 2 | **Zaal stays ZID 1, or becomes ZID 0** | An `UPDATE` on a live production row | If 0: is ZID 1 reassigned to the first OG or left permanently empty? `project_four_pillars` and doc 005 both need correcting either way |
| 3 | **Does ZID 2 stay a hole** | A fact only Zaal knows - records say Candy, the database says nobody | If 2 is filled, it is the first use of the specific-value path in 5.2, and it should wait for that path rather than another hand-write |
| 4 | **Run the sequence fix** (5.3 step 2) | A write to a live database | Idempotent, one line, correct under every answer to ask 1, and it prevents a confusing 500 on the first real assignment |
| 5 | **What orders the reserved block** | Carried forward from doc 2419 s2.3, still unresolved | New: the ordering is publicly visible on day one (s4), and a seniority-ordered fill needs the chat FID-keying fixed first or the oldest members render with no ZID |

Asks 5 and 6 from doc 2419 (ordering, and the public/private field split) still
stand. Ordering is restated above because section 4 adds to it; the field split
is untouched here.

## 7. What this pass did not do

- **No ZID assigned, changed, or reserved. No `setval`. No sequence read. No
  Supabase mutation. Nothing pushed.**
- **The tier size was not chosen.** A recommendation is not a decision.
- **The cohort figure HAS since been independently re-measured** (2026-08-26, on
  orchestrator instruction, read-only). The intersection reproduces doc 2419
  section 3.1 exactly: 39 distinct holder addresses matched across 40 rows, 83
  unmatched. The duplicate row was resolved, so the floor is 142 rather than 143.
  The roster table had three cells wrong and they were corrected in the same
  commit; doc 2419's prose was right all along.
- **The unique constraint on `primary_wallet` was not read from the schema**, only
  inferred from two code sites (5.1).
- **No new doc number was taken.** This is a sibling file inside doc 2419's
  directory rather than a new numbered doc, because it extends that doc's subject
  and because reserving a number requires pushing a tag, which this run does not
  do. Logged per `lane-autonomy.md`.

## Sources

**Repo, read at `a2edfb11` (origin/main, 2026-08-26):**

- `src/app/api/admin/users/route.ts` - `createUserSchema` (18-26), `updateUserSchema`
  (28-42), `requireAdmin` (48-53), POST wallet lowercasing (174), `23505` handling
  (247-248), the `assign_zid` branch and its audit event (290-311)
- `src/app/api/auth/siwe/route.ts` - address lowercasing (114), the upsert and its
  conflict target (154-165)
- `src/app/api/auth/verify/route.ts` - wallet lowercasing (195), the upsert (216-230)
- `src/app/api/admin/users/import/route.ts` - lowercasing on every branch (59, 69, 108)
- `src/app/api/chat/messages/route.ts` - the FID-keyed ZID enrichment (192-210)
- `src/app/api/respect/leaderboard/route.ts` - `zid` in the response (28, 79)
- `src/app/api/admin/member-health/route.ts` - missing-ZID as a defect (128), the
  `missingZid` count (182)
- `scripts/archive/old/add-zid-column.sql` - the sequence, the function, the
  `setval` note
- `src/app/api/admin/users/__tests__/route.test.ts` - the only other reference to
  `assign_next_zid` in the repo

**This repo, prior work:**

- [`README.md`](./README.md) (doc 2419) - every measured figure in section 1
- [`seniority-roster.md`](./seniority-roster.md) - the 122-holder ranking, and the
  source of the checksummed-address trap in 5.1

**Vault:**

- `~/zao-vault/inbox/queue-2026-08-25.md` item 4 - the reversal and the
  1000/500/100 option set
- `~/zao-vault/notes/zao-decentralization-scale.md` - the L6 gate, which is the
  argument for 1000

**Rules leaned on:** `lane-autonomy.md` (section 6 - what is gated and why),
`state-claims.md` (every figure names its source; section 1 labels a derivation
as a derivation), `anti-fabrication.md` (the casing hazard was checked before it
was claimed, and it turned out not to exist), `noisy-signal-guard.md` (section 3,
a defect count that cannot reach zero), `code-restraint.md` (5.2 - one schema
field, not a system).
