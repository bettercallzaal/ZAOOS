---
topic: identity
type: audit
status: research-complete
last-validated: 2026-08-25
original-query: "Reconcile the ZID migration comment (1-99 OGs, 100+ public), Zaal-is-0, the reserved-tier reversal and the seniority roster; spec what the ZAO social signup flow needs from the ZID system"
tier: STANDARD
related-docs: [005, 158, 271, 191, 1200, 1201]
---

# 2418 - The ZID system: measured live state, the four-way conflict, and what signup needs

> **Nothing was assigned.** No ZID was created, changed, or reserved by this pass.
> `assign_next_zid` was never called; the one probe that touched it used a
> deliberately invalid parameter name so PostgREST would reject it before
> execution. Every number below was read from a live system on 2026-08-25 unless
> it is explicitly labelled a prediction.

## Executive summary

Five things were unknown when this started. Four are now measured.

1. **The migration IS applied.** `users.zid` exists on the live ZAOOS application
   database and `assign_next_zid` is registered as a callable RPC. This closes
   conflict 3 in `~/zao-vault/projects/zao-token-holders-zids.md`, which recorded
   it as unverified because the app database is a different Supabase project from
   the cowork tracker.
2. **Three ZIDs exist, and they are 1, 3 and 4.** Zaal already holds **ZID 1** in
   production. **ZID 2 is a hole** - it is recorded in the vault note as Candy's,
   and it is not in the database.
3. **The admin "Assign ZID" button has never successfully run.** Zero
   `user.assign_zid` rows out of 38 total security audit events.
4. **Predicted: the first press of that button will fail.** The sequence was
   almost certainly never advanced past 1, and 1 is taken, so `nextval` returns a
   value that violates the `UNIQUE` constraint. One-line check and one-line fix in
   section 1.4. This is an inference from three pieces of evidence, not an
   observation - it was not triggered on purpose.
5. **Still genuinely open and still Zaal's:** who is ZID 0, how large the reserved
   block is, and what orders it. Section 2 narrows the second one by arithmetic
   and leaves the other two.

And one correction that changes the shape of the remaining work:

> **The "54.4% of Respect is held by people this estate cannot name" figure is an
> ENS artifact, not a naming gap.** Measured against the actual `users` table
> rather than against on-chain ENS records, the genuinely unnameable share is
> **18.2%** - 83 addresses holding 6,986 of 38,484 Respect. Three of the five
> "largest unnamed holders" named in the vault note are already named rows in the
> users table.

## Method

Every claim in this doc carries the way it was obtained.

| Claim | How it was measured |
|---|---|
| `users.zid` exists | `GET /rest/v1/users?select=zid&limit=1` against the live app project with the service key. HTTP 200 with a `zid` field. A missing column returns PostgREST error 42703. |
| `assign_next_zid` exists | The PostgREST OpenAPI document at `/rest/v1/` lists 27 RPC paths; `/rpc/assign_next_zid` is one of them. |
| ZID roster | `GET /users?select=zid,fid,username,display_name,created_at&zid=not.is.null&order=zid.asc` |
| Row counts | `Prefer: count=exact` with `Range: 0-0`, reading `content-range` |
| Audit events | `GET /security_audit_log?action=eq.user.assign_zid` with an exact count |
| Holders | Blockscout v2, `optimism.blockscout.com/api/v2/tokens/0x34cE.../holders`, three pages, 122 rows, browser user-agent |
| Holder-to-user overlap | Local set intersection of every EVM address in `primary_wallet`, `respect_wallet`, `custody_address` and `verified_addresses` against the 122 holder addresses, lowercased |
| `team_members.wallet` | `select count(*), count(wallet) from team_members` on the cowork Supabase project |
| Code facts | Read from `scripts/archive/old/add-zid-column.sql`, `src/app/api/admin/users/route.ts`, `src/lib/db/audit-log.ts` at commit `98b825df` |

The one thing NOT measured is the current value of `zid_seq`. PostgREST does not
expose sequences and reading it any other way would have meant either DDL or
calling the function, both of which were out of scope. Section 1.4 states the
one-line query that settles it.

## 1. Measured state of the live system

### 1.1 The migration is applied, both halves of it

`scripts/archive/old/add-zid-column.sql` sits in an archive directory, which is
why every prior pass recorded its status as unknown. It is live. The column
answers, and the function is in the schema cache. Nothing needs to be applied,
and nothing should be re-applied.

### 1.2 The roster is three rows, with a hole at 2

| ZID | fid | username | row created |
|---|---|---|---|
| 1 | 19640 | zaal | 2026-03-15 17:25:52 |
| 3 | none | (wallet-only row, display name `0x64a1...b3e1`) | 2026-03-15 17:25:52 |
| 4 | 436428 | hurric4n3ike | 2026-03-15 17:25:52 |

Three facts fall out of that table and each one matters.

**Zaal is ZID 1 in production, right now.** Not 0. Making him 0 is not a naming
decision any more, it is an `UPDATE` on a live row, and it opens the question of
whether ZID 1 is then reassigned to the first OG or left permanently empty as a
scar. Both are defensible; neither is this lane's call.

**The gap at 2 is itself evidence.** A sequence never skips. These three ZIDs were
written by hand, not handed out by `assign_next_zid` - which section 1.3 confirms
independently.

**ZID 3 resolves a question another lane logged as unresolved.** The whitepaper
lane recorded on 2026-08-21 that the number-two OREC submitter,
`0x64A15b1D...BB3e1` with 11 votes, "has no ENS match and isn't documented
anywhere in the repo." It is documented. It is ZID 3, and it has been a row in
the users table since March. Who the person is remains Zaal's to confirm - a
wallet in a table is still not a name - but the address is not undocumented.

### 1.3 The button has never been pressed

`src/app/api/admin/users/route.ts` logs `user.assign_zid` to `security_audit_log`
on every successful assignment. That table holds 38 rows. **Zero** are
`user.assign_zid`.

So the entire ZID mechanism - the column, the sequence, the atomic function, the
admin flag, the audit trail, the tests - has been built, shipped, and never once
exercised in production. This is the sharpest reading of where the work actually
is: not "build a ZID system", not even "wire the last 10%", but **"press the
button once and find out what happens."**

### 1.4 The latent collision (PREDICTED, not observed)

`assign_next_zid` does this:

```sql
assigned_zid := nextval('zid_seq');
UPDATE users SET zid = assigned_zid WHERE id = target_user_id AND zid IS NULL;
```

`zid_seq` is declared `START 1`. Three pieces of evidence say it has never been
advanced: the function is the only caller of `nextval` in the repo, the function
has never run successfully (1.3), and the assigned values skip 2, which a
sequence cannot do.

If the sequence is still at 1, the first assignment computes `zid = 1`, and
`zid INTEGER UNIQUE` already holds 1 for Zaal. The `UPDATE` raises a unique
violation, the function has no exception handler, the route's `zidErr` branch
fires, and the admin sees `500 Failed to assign ZID` with no indication why. The
second press returns 2 and succeeds, which makes it look like a transient glitch
rather than a design gap - the worst kind of bug to leave in place.

**Check it, one line, read-only:**

```sql
SELECT last_value, is_called FROM zid_seq;
```

**Fix it, one line, and it is the correct fix regardless of what the reserved
block turns out to be:**

```sql
SELECT setval('zid_seq', (SELECT COALESCE(MAX(zid), 0) FROM users));
```

That is idempotent and safe to run before every reserved-block decision below,
because it only ever moves the sequence to just past the highest number actually
in use. It is a write to a live database, so it is Zaal's to run or to approve,
and it is deliberately not run here.

### 1.5 The users table is 60 rows, and signup is not producing new ones

| Measurement | Value |
|---|---|
| rows in `users` | 60 |
| with a `primary_wallet` | 60 (all) |
| with an `fid` | 37 |
| with a `username` | 37 |
| with an `ens_name` | **0** |
| `member_tier = respect_holder` | 39 |
| `member_tier = community` | 21 |
| rows created 2026-03-15 (the seed) | 45 |
| rows created after 2026-04-07 | **2** (one in June, one in June) |

Two things to take from this. **The wallet is the identity anchor, not the FID** -
every row has a wallet, only 37 of 60 have a Farcaster account. And **the signup
path is effectively dormant**: two new rows in four and a half months. Whatever
the ZAO social signup flow turns out to be, it is not currently feeding this
table, so there is no live traffic to break.

The `ens_name` column being empty across all 60 rows is worth noting on its own.
The ENS names in the on-chain roster exist nowhere in the application database.
Doc 158's ENS subname work and the ZID roster are, today, entirely disconnected.

### 1.6 The artist data model already exists, and it is larger than expected

The stated goal behind this work is "distribute artist details out in a
database." The `users` table already carries 52 columns, and the artist-relevant
ones are already there:

- **Identity:** `zid`, `fid`, `username`, `display_name`, `real_name`, `ign`, `ens_name`, `zao_subname`, `bio`, `pfp_url`, `location`
- **Wallets:** `primary_wallet`, `respect_wallet`, `custody_address`, `solana_wallet`, `verified_addresses`, `hidden_wallets`, `preferred_wallet`
- **Music and platform:** `soundcloud_url`, `spotify_url`, `audius_handle`, `website_url`
- **Social:** `x_handle`, `instagram_handle`, `bluesky_handle`, `github_handle`, `hive_username`, `discord_id`, `lens_profile_id`, `xmtp_address`
- **Membership:** `member_tier`, `role`, `tags`, `is_active`, `respect_member_id`, `community_profile_id`, `neynar_score`

This is `code-restraint.md` rung 2 in its purest form. The artist data model does
not need designing. It needs **a public/private split decided** (section 4.4) and
it needs **filling in** - most of those columns are empty for most rows.

## 2. The four-way conflict, reconciled

The four positions are usually stated as if they disagreed with each other. They
mostly do not. They sit on **three separate axes**, and once separated, two of
them stop conflicting at all.

| Source | Who is zero | How big is reserved | What orders it |
|---|---|---|---|
| Migration comment (`add-zid-column.sql`) | silent; sequence starts at 1 | **1-99 OG, 100+ public** | **seniority** - "lower number = earlier member = more OG" |
| Doc 005 (2026-05-21) | **"ZID #1 = Zaal, #2 = Candy"** | silent | sequential minting |
| Memory `project_four_pillars` | **"ZID 1 = Zaal"** | silent | silent |
| Live database (2026-08-25) | **Zaal = 1** | silent | hand-assigned, gap at 2 |
| Zaal, 2026-08-25 (vault note) | **"This is all for me zid 0"** | silent | silent |
| Zaal's reversal, 2026-08-25 (queue item 4) | silent | **first 1000 / 500 / 100** | **not** by fractal-Respect recency |

### 2.1 Axis A - who is zero (Zaal's, unresolved, but now a write not a naming)

Four records say ZID 1 is Zaal: doc 005, the memory, the live row, and the
sequence's own starting point. One statement, the most recent and from Zaal
himself, says 0.

Zero is technically safe. The column is `INTEGER UNIQUE` and 0 is outside
`zid_seq`'s range, so it can never be handed out by accident and can never
collide. The cost is conceptual: **ZID 0 is a founder marker, not a membership
number.** Every ZID above it becomes "the Nth member"; ZID 0 becomes "the one who
started it," which is a different kind of object living in the same column.

What was previously framed as a naming question is now an operational one,
because the live row already says 1:

- Does Zaal's existing row change from 1 to 0?
- If so, is ZID 1 reassigned to the first OG, or held empty permanently?
- Either way, `project_four_pillars` says "ZID 1 = Zaal" and doc 005 says
  "ZID #1 = Zaal, #2 = Candy". Both need correcting whichever way this lands,
  and doc 005 needs it regardless because of section 2.4.

### 2.2 Axis B - how big the reserved block is (arithmetic removes two of the four options)

The migration says 99. The reversal offers 1000, 500 or 100. These are the same
question asked twice, and the second answer supersedes the first.

The block has to be at least as large as the population it reserves. Three
candidate populations, all measured:

| "People already in ZAO" means | Count | Source |
|---|---|---|
| rows in the app `users` table | 60 | live database, 2026-08-25 |
| holders of the ZAO Respect Token | 122 | Blockscout, Optimism, 2026-08-25 |
| the membership number ZAO states publicly | 188 | `CLAUDE.md`, project memory |

**99 is already too small** for the Respect holders alone, before anyone new
joins. **100 clears 60 but not 122 or 188.** So the arithmetic eliminates the
migration's 99 and the reversal's own smallest option, and the real choice is
**500 or 1000**.

The difference between those two is not capacity, it is what an OG number is
worth. 500 leaves roughly 2.7x headroom over 188 and keeps a low ZID scarce.
1000 leaves 5.3x, which is exactly the growth multiple named in the L6 gate of
`~/zao-vault/notes/zao-decentralization-scale.md` - 188 to 1,000 weekly
participants. Choosing 1000 means the entire journey to L6 fits inside the
reserved block, and the first genuinely "public" ZID does not get issued until
ZAO has already 5x'd. That is either the right symbolism or a reserved block that
never fills, depending on what Zaal wants the number to mean.

**This is Zaal's call and it is not made here.** The contribution is that 99 and
100 are off the table on arithmetic, not taste.

### 2.3 Axis C - what orders the block (two readings, and they need Zaal to separate)

The migration is unambiguous: *"Lower number = earlier member = more OG."*
Seniority.

The reversal says the block is reserved for people already in ZAO, *"**not**
ordered by when they first got fractal Respect."*

There are two honest readings and they lead to different work:

**Reading 1 - the reversal is about WHO, not about ORDER.** It rejects using
Respect-recency as the *eligibility filter* (that is, "you are an OG because you
got Respect early"), and replaces it with a broader "already in ZAO." Under this
reading the internal ordering is still open, and seniority is still the natural
default. This reading is supported by queue item 5, which says Zaal writes up
community members *"earliest fractal contributors through to the most recent"* -
seniority order - and says it depends on item 4 settling the ordering.

**Reading 2 - the reversal is about ORDER.** Numbers inside the block are not
ranked by anything Respect-derived, and the block is a set rather than a ranking.

Under Reading 1, somebody has to run a first-transfer query per address on
Optimism - a query nobody has run, and one this pass did not run either, because
ordering is a Zaal decision and running it first would have implied the answer.
Under Reading 2, nobody ever needs to run it.

**Recorded as UNRESOLVED rather than guessed.** Guessing changes what is owed, and
`recap-followthrough.md` rule 5 says do not resolve an ambiguous promise by
guessing. One sentence from Zaal closes it.

There is also a third possible ordering that neither reading names and which the
live data quietly suggests: **hand-ordered by Zaal, one at a time, as he writes
each member up.** Queue item 5 is exactly that activity, and ZIDs 1, 3 and 4 were
already assigned by hand. If ordering is going to be Zaal's judgement rather than
a query's output, that is a cheaper answer than either reading, and it matches
how the three existing ZIDs actually came to exist.

### 2.4 The fourth conflict nobody has been counting - doc 005 describes a different object

This one is not on any of the three axes because it is not the same system.

`research/identity/005-zao-identity` (last validated 2026-05-21) defines a ZID as
a **string keyed to a Farcaster FID**: `id: string` in the form `"zao:12345"`,
generated as `"zao:{fid}"`, stored in a `zids` table with `fid BIGINT UNIQUE NOT
NULL`, minted sequentially on a **Base** contract.

The system that actually shipped is a **nullable integer column on `users`**,
handed out by a Postgres sequence, with **no FID requirement** (23 of 60 rows have
no FID at all) and **no contract anywhere**.

These are not two versions of one design. They are two different objects sharing
a name, and doc 005 is the one the identity index points at first. Anyone reading
the index to learn what a ZID is currently learns the wrong thing. Doc 005 needs
either a superseded banner or a correction pass, and its "ZID #1 = Zaal, #2 =
Candy" line needs to change whichever way axis A lands.

The FID-optional property is not a flaw. Section 4.3 argues it is the single most
important thing about the shipped design.

## 3. Corrections to prior records

Four records are wrong or misleading in ways that would change a decision.

### 3.1 The 54.4% unnameable figure is an ENS artifact (the big one)

`~/zao-vault/projects/zao-token-holders-zids.md` states:

> "99 of 122 addresses have no on-chain name at all, and together they hold 20,931
> respect - 54.4% of everything issued. The majority of the ZAO's reputation is
> held by people this estate cannot name."

The 54.4% is arithmetically correct and the conclusion drawn from it is not,
because "has no ENS" was used as a proxy for "cannot be named." Measured against
the system that actually does the naming:

| | Addresses | Respect | Share |
|---|---|---|---|
| Holders with an ENS name | 22 | - | - |
| **Holders matched to a `users` row** | **39** | 31,498 | **81.8%** |
| **Holders matched to nothing** | **83** | **6,986** | **18.2%** |
| of those 83, ones that do have an ENS | 9 | - | - |

Forty of the 60 user rows match an on-chain holder, covering 39 distinct holder
addresses. The naming gap is **18.2%, not 54.4%** - a third of what was recorded.

The five "largest unnamed holders" the vault note lists as the urgent case:

| Respect | Address | Actually |
|---|---|---|
| 2,512 | `0x29f5...aa34` | **`hurric4n3ike`**, fid 436428 - and this row already holds **ZID 4** |
| 2,310 | `0xfab9...6012` | **`ezincrypto`**, fid 18561, `respect_holder` |
| 1,914 | `0x8d43...ee66` | genuinely absent from the users table |
| 1,147 | `0xbc66...bfd1` | a `respect_holder` row exists, wallet-only, no fid or username |
| 1,000 | `0x9e42...4706` | **`krembeats`**, fid 349093, `respect_holder` |

Four of five are already rows. Three of five are already named Farcaster
accounts. **One** - the 1,914 holder - is genuinely unknown to every ZAO system
checked, and it is now the single largest unidentified stake rather than one of
five.

This is `confirm-before-claiming-absence.md` exactly: the earlier claim proved
that those addresses were not in the ENS records that were opened, and was read
as proving they were nowhere.

### 3.2 `team_members.wallet` is empty

The lane brief names it as one of "two lookups that would crack most of it,
neither yet run." It was run: `select count(*), count(wallet) from team_members`
returns **14 rows, 0 wallets**. The column exists and no row has ever been
populated. This lookup will resolve nothing until someone fills it in, and it
should come off the list of promising leads.

The other named lookup, Farcaster verified addresses per FID, remains genuinely
unrun and is now the only one left. Section 6 says why it did not happen here.

### 3.3 The 157-holder memory is stale; 122 reproduces independently

`reference_zao_respect_onchain_facts` records 157 holders. The vault note recorded
122 on 2026-08-25 and flagged the discrepancy without resolving it. This pass
re-fetched the holder list from scratch, paginated all three pages, and got
**122 holders, 22 with ENS, 38,484 total supply** - matching the vault note
exactly on all three figures, from an independent run.

That does not explain where 157 came from, and this doc does not claim to. It
does mean 122 is reproducible and 157 should not be cited without re-measuring.

### 3.4 ZID 2 is a hole, not Candy's

The vault note says "Candy is recorded as **ZID #2**." Doc 005 says "#2 = Candy."
The live database has no ZID 2 and no ZID 2 has ever been assigned. Whatever
record that came from, it is not the database.

## 4. What the ZAO social signup flow needs from this system

The requirement, from queue item 4: *"New joiners to the social network start by
getting a ZID."* From the L4 gate in the decentralization scale: ZIDs are the
identity layer of ZAO social. The constraint given: it has to be assignable at
signup, collision-safe, and it must work before the hypersnap research pass lands.

### 4.1 The structural requirement everything else follows from

**A single sequence cannot both hand out public numbers and hold a block open.**

`nextval` is monotonic and has no concept of a reservation. The moment the first
public signup calls `assign_next_zid`, the sequence is above 1 and climbing, and
every unassigned number below it becomes unreachable through the normal path.

The migration already anticipated this with `SELECT setval('zid_seq', 99)` - move
the pointer past the reserved block before public assignment starts. The design is
right. Only the number is wrong (section 2.2), and the sequence is currently
mis-set for a different reason (section 1.4).

So the shape is two pointers, not one:

- **Reserved block, 1..N:** assigned out-of-band with explicit values, by an
  admin, in whatever order Zaal decides. `assign_next_zid` must NOT be the path
  for these - it cannot target a specific number.
- **Public block, N+1 and up:** `assign_next_zid` and nothing else. Atomic,
  idempotent, collision-safe by construction.

**This means one thing needs building that does not exist: a way to set a
specific ZID.** The admin route today has exactly one ZID operation,
`assign_zid: true`, which calls the sequence. There is no "give this user ZID
47". Filling the reserved block by hand, in a chosen order, has no path through
the product today - which is presumably why the three that exist were written
directly to the database.

### 4.2 The seven requirements

| # | Requirement | Status today |
|---|---|---|
| 1 | Idempotent: calling twice returns the same ZID, never a second one | **Done.** `assign_next_zid` returns the existing value before touching the sequence. Verified in the source and covered by tests in `route.test.ts`. |
| 2 | Atomic under concurrent signups | **Done.** `nextval` is transaction-safe, and the `AND zid IS NULL` guard plus the `NOT FOUND` re-read handle the race explicitly. |
| 3 | Collision-safe against the reserved block | **Not done.** Needs `setval` past N before the first public signup, and needs section 1.4's fix first. |
| 4 | Assignable by the signup flow, not only by an admin | **Not done.** The only caller is `PATCH /api/admin/users` behind `requireAdmin()`. Signup needs its own server-side call to the same RPC. |
| 5 | A way to set a specific ZID for the reserved block | **Does not exist.** See 4.1. |
| 6 | Works without a Farcaster FID | **Done, and it matters.** See 4.3. |
| 7 | Audit trail on every assignment | **Done for the admin path** (`user.assign_zid` to `security_audit_log`). A signup path needs its own equivalent, or the trail silently develops a hole the moment public signup opens. |

Four of seven already hold. Requirement 4 is a small piece of server-side wiring
against an RPC that already exists. Requirement 5 is the only genuinely new
thing, and it is a specific-value admin write, not a system.

### 4.3 Why this is independent of the hypersnap decision, and why that is worth protecting

Hypersnap is undocumented anywhere on disk - no repo, no note, no research doc,
per the decentralization-scale note - and its research pass is the single biggest
unknown on the L0-to-L7 scale. Nothing in the ZID system should have to wait for
it, and as built, nothing does:

- **A ZID is a row in `users`, not a social-network account.** No Farcaster
  dependency, no hypersnap dependency, no contract.
- **The FID is optional and demonstrably so** - 23 of 60 live rows have no FID.
  The wallet is the anchor: all 60 rows have one.
- **Nothing on-chain is involved.** Doc 005's "mint sequentially on Base" was
  never built, which as it turns out is what keeps this portable.

The practical consequence: **the reserved block can be filled now, before the
hypersnap pass, and the public block can open on whatever social surface arrives.**
If ZAO social later needs a hypersnap-native identifier, it maps to a ZID rather
than replacing it.

The thing to protect is exactly this. The first design that makes a ZID require a
hypersnap account, or a Farcaster FID, or an on-chain mint, is the one that
couples an identity layer to an unresearched dependency.

### 4.4 The public/private split, which is the actual design decision

The stated goal is distributing artist details out of a database. The users table
is not currently shaped for that, in one specific way: **credential columns and
profile columns live side by side in the same row.**

`bluesky_app_password`, `hive_posting_key_encrypted`, `lens_access_token`,
`lens_refresh_token` and `signer_uuid` sit in `users` alongside `bio` and
`spotify_url`. Any `SELECT *` on that table returns all of it. The admin PATCH
route does exactly that on the assign_zid path - `.select('*')` and returns the
row to the client.

**Graded LOW, deliberately.** The route is behind `requireAdmin()`, so this is not
a public exposure, and the columns are nearly empty in practice: one row has a
`bluesky_app_password` and the other four credential columns are null across all
60 rows. It is a hazard in the shape of the table, not a live leak.

But it is precisely the hazard that a "distribute artist details" feature walks
into, because that feature's whole job is to make user rows readable by more
things. Before any of that ships, three fields need naming explicitly:

1. **PUBLIC** - safe on a profile page and in an API response to anyone.
   Candidates: `zid`, `username`, `display_name`, `pfp_url`, `bio`,
   `soundcloud_url`, `spotify_url`, `audius_handle`, `website_url`, public social
   handles, `ens_name`, `zao_subname`.
2. **MEMBER-ONLY** - visible inside ZAO, not to the open internet. Candidates:
   `member_tier`, `role`, `tags`, wallet addresses.
3. **NEVER LEAVES THE SERVER** - every credential column, `real_name` (9 rows have
   one), `notes`, `hidden_wallets`, `messaging_prefs`.

And per `credit-attribution.md` and `pii-hygiene.md`: publishing an artist's
details is publishing something about *them*. The default for anything in tier 1
that a member did not themselves enter should be off, not on. That is a Zaal
decision, listed below.

## 5. Decisions for Zaal

Nothing in this table was decided here. Each one is either a write to live data,
a fact only Zaal knows, or something that publishes information about other
people - all three are gated per `lane-autonomy.md`.

| # | Decision | What this pass contributes |
|---|---|---|
| 1 | **Zaal is ZID 0 or stays ZID 1** | It is now an `UPDATE` on a live row, not a naming choice. If 0: does ZID 1 get reassigned or stay empty? Either way `project_four_pillars` and doc 005 need correcting. |
| 2 | **Reserved block size** | **99 and 100 are eliminated by arithmetic** - 122 holders and 188 members both exceed them. Real choice is 500 or 1000. 1000 covers the entire 188-to-1,000 journey named in the L6 gate. |
| 3 | **What orders the reserved block** | Two readings of the reversal, section 2.3, plus a third option the live data suggests: hand-ordered by Zaal as he writes each member up, which is how ZIDs 1/3/4 already happened. One sentence closes this. |
| 4 | **Run the sequence fix** | `SELECT setval('zid_seq', (SELECT COALESCE(MAX(zid),0) FROM users));` - safe, idempotent, correct under any answer to 2 and 3, and it prevents a confusing 500 on the first real assignment. |
| 5 | **The public/private field split** | Section 4.4 proposes three tiers. Publishing artist details is publishing about other people, so the tier-1 list is Zaal's to approve, not an engineering default. |
| 6 | **Whether ZID 2 stays a hole** | Records say Candy; the database says nobody. |

## 6. What this pass did not do, and why

- **No ZID was assigned, changed, or reserved.** The task said assign nothing.
- **The Farcaster verified-address lookup was not run.** It is the one remaining
  promising lead for the 83 unmatched holders. The public
  `user-by-verification` endpoint now returns 401 for both `api.farcaster.xyz`
  and `client.farcaster.xyz`, so it needs the Neynar key. The command to do it
  was blocked by a permission prompt in this session and was not retried, per
  the harness rule about denied calls. It is a clean, bounded next task:
  `GET https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=...`
  over the 83 addresses in chunks, which should shrink the 18.2% further.
- **`zid_seq`'s current value was not read.** Section 1.4 gives the query. Reading
  it needed either DDL or a function call that would have burned a sequence value.
- **No first-transfer seniority query was run.** Ordering is decision 3, and
  running the query first would have implied its answer.
- **No ENS-to-person mapping was attempted.** The lane brief records two wrong
  matches from a fuzzy substring pass. An ENS name is a claim about a wallet,
  never proof of a person.

## Sources

**Live systems, all read 2026-08-25:**

- ZAOOS application Supabase project via PostgREST with the service key -
  `users`, `security_audit_log`, the OpenAPI RPC listing. Read-only; no write, no
  RPC execution.
- Cowork Supabase project via the `supabase-cowork` MCP - `team_members`.
- Blockscout v2 on Optimism, `optimism.blockscout.com/api/v2/tokens/0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957/holders`,
  paginated to all 122 holders. [FULL]
- `api.farcaster.xyz/v2/user-by-verification` and `client.farcaster.xyz/v2/user-by-verification` -
  both HTTP 401, authentication required. [FAILED]

**Repo, at commit `98b825df`:**

- `scripts/archive/old/add-zid-column.sql` - the migration, its comment, and the
  `setval` note
- `src/app/api/admin/users/route.ts` - the `assign_zid` flag, `requireAdmin()`,
  the `.select('*')` response
- `src/app/api/admin/users/__tests__/route.test.ts` - the idempotency tests
- `src/lib/db/audit-log.ts` - `security_audit_log`
- `research/identity/005-zao-identity/README.md` - the FID-keyed ZID design

**Vault, at 2026-08-25:**

- `~/zao-vault/projects/zao-token-holders-zids.md` - the three conflicts and the
  holder roster (corrected in section 3.1)
- `~/zao-vault/inbox/queue-2026-08-25.md` items 3, 4, 5 - the reserved-tier
  reversal in Zaal's own framing
- `~/zao-vault/notes/zao-decentralization-scale.md` - the L4 and L6 gates
- `~/zao-vault/handoffs/zao-identity.md` - the lane brief
- `~/zao-vault/handoffs/IN-FLIGHT.md` - the whitepaper lane's `0x64A15b1D...` note,
  resolved in section 1.2

**Rules this pass leaned on:** `confirm-before-claiming-absence.md` (section 3.1
is that rule catching a prior claim), `state-claims.md` (every claim names its
source), `anti-fabrication.md` (the 4.4 finding graded down to LOW),
`code-restraint.md` (section 1.6), `lane-autonomy.md` (section 5).
