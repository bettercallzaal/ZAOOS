---
topic: agents
type: decision
status: research-complete
last-validated: 2026-09-09
superseded-by:
related-docs: "2456, 2152, 2434, 2473"
original-query: "Zaal, 2026-09-09 ~22:4x, verbatim fragments: 'what do we think we should actually /zaoresarch this more' about who holds the orchestrator seat, and 'lets build out more secondary and terciaitry lanses and ahve the secondary be the one that awaysecsa ll the teriaire acgents that do whatever and the prmiary orcestaryor is like zaal's assistant'. Question: how should ZAO's human-facing lane hierarchy work between now and the day Hermes Agent manages all agents (spec section 10 decision 8) - primary orchestrator as Zaal's assistant holding the seat/lock, a secondary overseeing every tertiary worker lane, and tertiary single-purpose lanes. (1) who holds zorca-lock and how the seat passes without a dead-owner stale lock; (2) whether the lock should become a lease with heartbeat, generation and expiry per spec section 13 item 3; (3) the secondary's authority over tertiaries and what stays with the primary and with Zaal; (4) how this maps onto the AGENTS.md registry columns role and escalation for a clean Hermes Agent handover; (5) the smallest change that ends the hourly selftest red honestly."
tier: STANDARD
---

# 2480 - The orchestrator seat needs a lease, not a lock, and the tiers already exist on paper

> **Goal:** Answer whether ZAO's human-facing lane hierarchy (primary orchestrator = Zaal's assistant and seat-holder, secondary = oversees every tertiary, tertiary = single-purpose workers) is the right shape between now and Hermes Agent Stage 6 (spec decision 8), and fix the concrete defect that triggered the question: `zorca-lock` read STALE for 6h21m tonight with no mechanism that would have stopped a second claimant from racing the first.

## Key Decisions (recommendations first)

| # | Decision | Grounded in | Grade |
|---|---|---|---|
| 1 | **`zorca-lock`'s stale-claim path is already correct in the case that matters (a dead owner does not block a new claim), and already broken in the case that doesn't get talked about (two live claimants racing the same stale window get no error, just silent overwrite).** Measured tonight: `owner=orc2 pid=73861 age=381m` - pid 73861 does not exist (`ps -p 73861` returns nothing), so `check`/`claim` already read this as free. The gap is TOCTOU: `claim()` reads the file, decides, then writes with a bare `json.dump` - no compare-and-swap, no lockfile, no atomic rename. Two sessions calling `claim` in the same second both pass the `fresh and not mine` test and both write; last write wins with no error to either side. This is unrelated to the dead-owner story everyone is telling. | `~/bin/zorca-lock` read in full; `ps -p 73861` (empty = dead); `~/.zao/orchestrator.lock` (measured 2026-09-09 21:13 EDT: `heartbeat=1788979901.54` = 2026-09-09 14:51:41, i.e. 381 real minutes stale against a 30-minute freshness window) | A |
| 2 | **USE the lease shape from Brandon's spec section 13 item 3 (generation + heartbeat + lease_expiry), and do not build it from scratch - ZOE's `packages/heart-fleet/` already IS this pattern, tested, for a different resource.** It has `acquire / renew / release / reclaim`, **fencing tokens** (exact-expiry ownership proof), a `LivenessReclaimer` that resets a dead-heartbeat instance's leased runs proactively (not on a per-run TTL wait), and 24 tests proving mutual exclusion, killed-worker recovery, and stale-fence rejection. `verifyFence` is exactly the "am I still the owner right now" check `zorca-lock check` lacks. Porting `zorca-lock` onto this package (or a 40-line clone of its `HeartFleet` interface scoped to one resource, "the orchestrator seat") is glue, not new code - it satisfies Convention 12 (`~/zao-vault/notes/orca-organization.md`: "more like glue gluing other open source projects together... a lane that wants to write more than ~100 lines names the OSS project it evaluated and why it does not fit"). | `research/agents/2152-execution-layer-architecture/README.md` (FULL, local); Kleppmann, *How to do distributed locking* (2016, still current - FULL via curl+strip): "you need to include a fencing token with every write request... a fencing token is simply a number that increases... every time a client acquires the lock" | A |
| 3 | **The secondary's authority over tertiaries is open/close/redirect and PR-approve-to-merge on non-gated work; the primary keeps the seat, the lock, and cross-lane arbitration; Zaal keeps every one-way door.** This is not a new invention - it is the estate's existing `zorca-audit-seat` / `orchestrator` split (`~/.zao/orchestrators.json`) plus the AGENTS.md two-way/one-way door line, made explicit for the tier language Zaal used tonight ("the secondary be the one that oversees all the tertiary agents that do whatever"). Concretely: secondary may dispatch a tertiary lane, close it, redirect its brief, and merge a two-way-door PR (a vault note, a research doc, a non-production repo change) after the coordinator-verification step already in `lane-supervision-playbook.md`. Secondary may NOT: touch money/on-chain/publishing/production merges/permission or hook edits (`zao-vault/AGENTS.md` "Authority and gates" - unchanged, this spec does not relax it), or claim/release the orchestrator lock on the primary's behalf. | `~/.zao/orchestrators.json` (`zorca-audit-seat` "top", `orchestrator`/`vault`/`zj` "domain"/"lag"); `~/zao-vault/AGENTS.md` lines 39-43; `~/zao-vault/notes/lane-supervision-playbook.md` sections 1-3 | A |
| 4 | **Map the tiers onto AGENTS.md's existing `role` and `escalation` columns with three literal values, not new columns.** `role` becomes one of `primary` \| `secondary` \| `tertiary` (today's seed already has ad hoc values: "top", "domain", "lead", "lag" - collapse those onto the three-tier vocabulary now so the column reads the same the day Hermes Agent takes it over). `escalation` for every `tertiary` row reads "secondary lane in `role=secondary`, or Zaal if the secondary is down"; every `secondary` row reads "primary lane, or Zaal if the primary is down"; the `primary` row reads "Zaal" and nothing else - which is the literal test for whether a lane is actually primary. The AGENTS.md header note ("owner zj lane until Hermes Agent Stage 4") already assumes exactly this handover; the column values are the part that has to be Hermes-Agent-readable now, because Hermes Agent Stage 4 (spec 9) is "agent registry" read against this same file. | `~/zao-vault/AGENTS.md` (registry header, generated table, columns `role`/`escalation`); spec section 9 decision "Stage order is Brandon's: discovery, identity, blackboard, **agent registry**, read-heavy operation, then bounded work packets" | A |
| 5 | **The smallest change that ends the hourly selftest red honestly is a heartbeat cron on the orchestrator seat, not a bigger fix to the lock.** One line: `*/15 * * * * ~/bin/zorca-lock heartbeat` run from inside whichever session holds the seat (or a `zj` wrapper that runs it as a side effect of any lane command, since `zj` already "walks tmux globally"). This does not require the lease rewrite (decision 2) to land first - it makes today's `fresh`-window check honest by keeping a *live* owner's heartbeat inside 30 minutes, which is the actual, cheap fix for "the hourly selftest reads red because nobody has called `heartbeat` since 14:51." The lease/fencing rebuild (decision 2) is the correctness fix for the race; this is the availability fix for the false alarm, and they are different bugs with different urgency. | Measured: no cron, launchd job, or lane convention found calling `zorca-lock heartbeat` on any interval (`crontab -l`, `launchctl list \| grep -i zorca`, grep of `~/zao-vault` and `~/zaal-dotfiles` for `zorca-lock heartbeat`); `notes/green-results-that-cannot-go-red.md` rule 4: "prove the subprocess ran before interpreting silence" - a selftest reading STALE for 6+ hours because nobody heartbeats is the mirror case, a real red caused by a missing call, not a broken check | A |

---

## 1. Who holds `zorca-lock`, and how the seat passes without a dead-owner stale lock

**Measured tonight, 2026-09-09 21:13 EDT:**

```
$ ~/bin/zorca-lock status
STALE owner=orc2 pid=73861 age=381m claimed=2026-09-08 17:04

$ cat ~/.zao/orchestrator.lock
{"owner": "orc2", "pid": "73861", "cwd": "/Users/zaalpanthaki/zao-vault",
 "claimed": "2026-09-08 17:04", "heartbeat": 1788979901.543384}

$ ps -p 73861
  PID  PPID ELAPSED COMMAND        # <- no row: pid 73861 does not exist
```

`1788979901.543384` decodes to `2026-09-09 14:51:41` local - so `orc2` was
heartbeating fine for most of a day (`claimed` is 2026-09-08 17:04, the last
heartbeat six and a quarter hours before this check) and then stopped, most
likely the session ending at a handoff or crash rather than the "since
2026-09-08 17:04" framing in the original query, which appears to describe an
earlier read of the same lock before its last live heartbeat.

**Reading `~/bin/zorca-lock` line by line answers "does a dead owner block the
next claimant" directly: no.**

```python
if cmd=='claim':
    if d and fresh and not mine: print(f"REFUSED: held by {d['owner']}"); sys.exit(3)
    save({...}); print(f"claimed by {owner}"); sys.exit(0)
```

`fresh` is `now - heartbeat < 30*60`. Tonight's lock is 381 minutes stale, so
`fresh` is `False`, so the `REFUSED` branch never triggers regardless of who
`owner` is or whether `pid` is alive. **Any session can claim right now.** The
dead-owner-blocks-the-seat story in the original query is not what the code
does - it is what the *symptom* (a STALE line sitting unclaimed for hours)
looks like from outside, because nothing is currently claiming it, not because
anything is stopping a claim.

**What actually is missing, and it is a different bug: no compare-and-swap.**
`claim()` does a plain read, an in-memory decision, then a plain
`json.dump(d, open(L,'w'))`. Two sessions racing to claim inside the same
tick - which is exactly the scenario the estate has hit before (three
orchestrators running at once, 2026-08-27, `notes/orca-organization.md`
Convention 11) - both read the same stale-or-absent state, both decide
"free", both write, and whichever write lands last wins with **no error
returned to the loser.** The loser believes it holds the seat. This is the
failure mode Convention 11 built `zorca-lock` to prevent, and the specific
mechanism (`claim`) still has it, five weeks later, because freshness-checking
and atomicity are two different properties and only the first was built.

**How the seat should pass, concretely, without a rewrite:**

1. `check` before every claim attempt (already the convention: "the
   orchestrator-tick automation and any pane briefed as orchestrator run
   `zorca-lock check` first and exit on 3" - Convention 11).
2. A departing primary calls `release` explicitly as its last act (already
   supported), rather than letting staleness be the only signal.
3. **A stale lock should be claimed, not just re-armed silently** - the
   claiming session should print (and log to `~/.zao/orca-board.log` per the
   estate's own "log every send" convention) that it took over a stale lock
   from a specific dead owner, so the takeover is auditable the way a
   `zorca-audit-seat` handover already is in `~/.zao/orchestrators.json`'s
   `succeeded` field. `zorca-lock` today prints `claimed by {owner}` on
   success either way - it does not distinguish "claimed a free lock" from
   "claimed over a stale dead one." That distinction is one `if` and one
   extra log line, not a redesign.

**This does not require decision 2's lease rewrite to be correct today** - it
requires closing the TOCTOU gap, which the lease rewrite happens to also fix
as a side effect (see below).

## 2. Should the lock become a lease with heartbeat, generation and expiry (spec 13.3)?

**Yes, and the estate has already built the exact pattern once, for a
different resource, tested.** Brandon's proposal (spec section 13, item 3,
received via Zaal 2026-09-09 ~20:1x):

> "Give the desktop and Pi leases/heartbeats. 24/7 shouldn't mean the
> Blackboard says they're alive... Plan 2 adds a machine row shape to
> SYSTEM_MAP and ACTIVE AGENTS: runtime_id, generation, heartbeat,
> lease_expiry, capabilities, current_workload. A returning old process with
> a stale generation is refused as a writer (generation fencing)."

`~/Documents/ZAO OS V1` (ZAOOS) already has this shape built, in
`packages/heart-fleet/` (doc 2152, `research/agents/2152-execution-layer-architecture/README.md`,
read FULL, local):

| Heart-fleet primitive | What it does | Maps onto `zorca-lock` as |
|---|---|---|
| `acquire / renew / release / reclaim` | the four verbs a lease needs | `claim / heartbeat / release` already exist; `reclaim` (proactive, not per-run-TTL) does not |
| **fencing tokens** ("exact-expiry ownership proof") | monotonic token issued on acquire, checked before any effect | `zorca-lock` has no token at all - `owner` is a string, not a number, and nothing downstream checks it before acting |
| `guardIrreversible + verifyFence` | "the atomic 'am I still the owner right now' check before any irreversible effect" | exactly the missing piece from decision 1 - no lane currently re-verifies it still holds the seat before doing something the seat authorizes |
| `LivenessReclaimer` | "proactive recovery - a dead-heartbeat instance's leased runs reset at once (vs waiting per-run TTL)" | this is a real answer to "how does the seat pass without a dead-owner stale lock" that is *better* than waiting out the 30-minute freshness window |
| 24 tests: "mutual exclusion, killed-worker recovery, stale-fence rejection (incl. the pre-reclaim zombie window), retry-dedup" | proof the pattern is race-safe | `zorca-lock` has zero tests of any kind (measured: no `*_test*` or `--selftest` in the file) |

**This is the textbook fencing-token pattern**, not a ZAO invention. Martin
Kleppmann, *How to do distributed locking* (2016-02-08, still the standard
citation a decade later - read FULL via `curl` + HTML strip,
`martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html`):

> "The fix for this problem is actually pretty simple: you need to include a
> fencing token with every write request to the storage service. In this
> context, a fencing token is simply a number that increases... every time a
> client acquires the lock."

> "If you are using ZooKeeper as lock service, you can use the zxid or the
> znode version number as fencing token, and you're in good shape."

Google's Chubby (Burrows, OSDI 2006, read FULL via `pdftotext` off the OSDI
PDF, `static.googleusercontent.com/media/research.google.com/en//archive/chubby-osdi06.pdf`)
is the origin of the session-lease shape Brandon is describing, in production
for two decades:

> "Each session has an associated lease - an interval of time extending into
> the future during which the master guarantees not to terminate the session
> unilaterally... The master advances the lease timeout... on creation of the
> session, when a master fail-over occurs, and when it responds to a
> KeepAlive RPC from the client." (Chubby paper, section 4)

> "At any time, a lock holder may request a **sequencer**, an opaque
> byte-string that describes the state of the lock immediately after
> acquisition. It contains the name of the lock, the mode in which it was
> acquired... and the **lock generation number**." (Chubby paper, section 2.4)

Chubby's "sequencer" is Brandon's "generation" by another name, from the same
lineage Kleppmann's fencing token comes from. Apache ZooKeeper's own recipes
doc (read FULL via `curl` + HTML strip,
`zookeeper.apache.org/doc/current/recipes.html`) implements the same idea with
ephemeral sequential znodes: session expiry (a heartbeat-backed TTL) plus a
monotonically increasing sequence number doubling as the fencing token -
architecturally the same three parts Brandon asked for (heartbeat, generation,
expiry), independently converged on by three different systems across twenty
years.

**A live, small, 2026 demonstration of exactly what happens without fencing:**
Show HN "Crash-safe job queue - lease-expiry race and fencing fix"
(`kritibehl/faultline`, posted 2026-02-23, HN item 47129394, read FULL via the
Algolia API; repo read FULL via `curl` on the raw README, 5 stars/MIT licence
per the repo's own LICENSE file - not the `gh api` license field, which reads
`NOASSERTION` for this same repo, confirming Hard Requirement 13's warning
that the field is a wrong classifier): a worker pauses mid-commit
(`SIGSTOP`), a second worker gets the redelivered job and commits with token
2, the first worker resumes and tries to commit with its stale token 1.
Without fencing: `committed effects = 2`, the invariant fails. With fencing
(a monotonic token checked at commit time): `stale rejections = 1`,
`committed effects = 1`, invariant holds. This is `zorca-lock`'s exact
untested gap, reproduced as a runnable demo by an unrelated project the same
year.

**Recommendation: yes to the lease, sourced from `packages/heart-fleet/`
rather than written fresh.** A `zorca-lock` v2 needs: `generation` (int,
incremented on every successful claim - the fencing token), `heartbeat`
(already exists), `lease_expiry` (replaces the hardcoded 30-minute `FRESH`
constant with a value the claiming session can set, since a `[STANDARD]`
research lane and a live orchestrator seat do not need the same lease length),
and a `verifyFence`-shaped check any lane can call before an irreversible
write to prove it is still the current generation. This is a genuine port,
not a copy-paste - `heart-fleet` is scoped to app resources with a Postgres
backing store; `zorca-lock` is a single JSON file on one Mac - but the
interface and the four safety properties transfer directly, and skipping that
prior art would be writing the same 24 tests over from a blank page.

## 3. What is the secondary's authority over tertiaries, and what stays with the primary and Zaal

Zaal, 2026-09-09 ~21:1x, verbatim (recorded in `~/.zao/orchestrators.json`
`proposed`): *"lets build out more secondary and terciaitry lanses and ahve
the secondary be the one that awaysecsa ll the teriaire acgents that do
whatever and the prmiary orcestaryor is like zaal's assistant."* Read as
intended: the secondary **oversees** all the tertiary agents, doing
whatever work they do; the primary orchestrator is Zaal's assistant.

This is not a new hierarchy to design from scratch - the estate already runs
one, and the proposal is asking to make it the *named, permanent* shape
rather than a role that keeps moving between lanes. `~/.zao/orchestrators.json`
today:

- **top** (`zorca-audit-seat`): "main orchestrator for Orca... cross-lane
  coordination, lane dispatch, Zaal's verdict relay" - this is the primary.
- **domain** (`orchestrator`, `zaostock`, `zabalgamez`): "reports_to:
  zorca-audit-seat" - these already behave like secondaries scoped to one
  brand/event.
- **lead/lag** (`zj`/`vault`, added 2026-09-09): a narrower two-lane version
  of the same split, scoped to one project (the agentic-infra spec) rather
  than the whole estate.
- Plain **lanes** (65 rows in `zao-vault/AGENTS.md`, e.g. `zaofractal`,
  `poidhz`, `content`): these are the tertiaries - "reports_to" a domain
  orchestrator or the top seat directly, single-purpose, most already
  `UNMEASURED` on `role`/`escalation` because the column exists but nobody
  has filled it uniformly.

**The authority split that already exists in writing, restated for the
three-word vocabulary Zaal used tonight:**

| Action | Tertiary may | Secondary may | Primary may | Zaal only |
|---|---|---|---|---|
| Open/dispatch a tertiary lane | - | yes | yes (delegates to secondary) | - |
| Close/redirect a tertiary lane's brief | writes own `.handoffs/DONE.md` | yes | yes | - |
| Merge a two-way-door PR (vault note, research doc, non-prod repo) after coordinator verification | no (own branch/PR only) | yes | yes | - |
| Approve a one-way door (money, on-chain, publishing, prod merge, permission/hook/settings edit, SOUL.md/DOCTRINE.md edit) | no | no | no (surfaces, never runs - `ADE-OPERATING-GUIDE.md` "Only Zaal") | **yes, only** |
| Claim/release `zorca-lock` (the primary seat) | no | no (per `orchestrators.json` rule: "Whether delivery becomes a shared zorca-lock claim vs orc's with orc2 failover" is itself a Zaal-gated question) | yes | co-decides with primary |
| Arbitrate two tertiaries or two secondaries disagreeing | escalates | resolves within its tree; escalates cross-tree | resolves cross-tree; escalates to Zaal only on "we do not know" (`lane-supervision-playbook.md` section 3) | final word |

The load-bearing sentence already exists, unaltered, in
`~/zao-vault/AGENTS.md`: *"Two-way doors (a PR, a draft, a vault note, a safe
refactor): act, then say so. One-way doors always stop for Zaal."* The
secondary/primary distinction does not change which doors are which - it only
answers *who* gets to walk through a two-way door without asking a human
first, and the answer is: whichever seat is closest to the work that is not
Zaal. `ADE-OPERATING-GUIDE.md`'s "Only Zaal (gated)" list is the exact
one-way-door list restated operationally (outbound/publish/money/on-chain/
production merge; answering a content menu; permission surfaces;
`hasTrustDialogAccepted`; pushing stranded worktree branches; the zorca-lock
claim-vs-failover question itself).

**What this changes from tonight's `orchestrators.json` state:** nothing in
authority, one thing in naming. The file's own `proposed` block already has
the tiers ("primary = zj... secondary = vault... tertiary = single-purpose
worker lanes reporting to vault") sitting unconfirmed since Zaal told zj
"research it more before we lock it" the same hour it was proposed. This doc
is that research. The recommendation is: **confirm the tiers, keep the
authority table above (which is not new), and stop re-deriving "who reports
to whom" per incident** - the estate has done this dance (orcresearch ->
obsidian -> orchestrator -> zorca-audit-seat -> proposed zj, six seat moves
in nine days per the `succeeded` chain in `orchestrators.json`) enough times
that the seat-holder's *identity* churning is fine as long as the seat's
*authority* (this table) does not have to be re-litigated each time.

## 4. Mapping onto AGENTS.md's `role` and `escalation` columns for a Hermes Agent handover

`~/zao-vault/AGENTS.md` is machine-generated
(`scripts/build-agents-md.py` from `notes/agent-registry-seed-2026-09-09.md`,
per the file's own header comment) and already carries a `role` column and an
`escalation` column, one row per agent - 65 rows as of the 2026-09-10T01:02:54Z
generation read tonight. Measured values in `role` today are inconsistent
prose, not the three-tier vocabulary: "Coding/agent CLI running lane
sessions...", "Domain orchestrator, zao-vault; no longer top seat", "Top
orchestrator for Orca", "Lane for ZAOartizen". `escalation` is mostly the
literal string `UNMEASURED` (measured: at least 40 of 65 rows), with the
filled ones reading free text ("Reports to zorca-audit-seat", "Reports to
Zaal", "Reports to Zaal in the obsidian (grill) lane via its '## for the
grill' section").

**Why this matters for Hermes Agent specifically, not just tidiness:** spec
section 9 (decision 8, section 10) states Hermes Agent's stage order is
"discovery, identity, blackboard, **agent registry**, read-heavy operation,
then bounded work packets" - i.e. AGENTS.md's registry table *is* the input
Hermes Agent reads to learn who reports to whom, before it is trusted to
route packets to anyone. A registry whose `role` column is free prose and
whose `escalation` column is 60% `UNMEASURED` cannot be parsed into a
dispatch tree; it can only be read by a human who already knows the org
chart. Brandon's own review (spec section 13, item 5) makes the identical
point about `comms_surfaces`: *"identities should be registered. The bots
should map to persistent agent identities/communication surfaces... not
become the identities."* The same discipline applies to `role`: a lane should
map to one of three registered values, not become its own free-text
description of what it does (that description already lives in the
`capabilities` column - `role` is redundant with it today).

**Recommendation - three literal values, filled by the seed, not by the
generated table:**

- `role: primary` - exactly one row at a time (today: `zorca-audit-seat`,
  proposed: `zj`, per the still-open `orchestrators.json` decision). Its
  `escalation` cell reads literally `Zaal` and nothing else - that is the
  test for whether a row is genuinely primary.
- `role: secondary` - the domain/lead orchestrators (`orchestrator`,
  `zaostock`, `zabalgamez`, `vault`). Its `escalation` cell reads `<primary's
  row name>, or Zaal if <primary> is unreachable` (the estate already has
  this exact failover language in `ADE-OPERATING-GUIDE.md` rule 3: "Delivery
  has a failover... when orc drops to a bare shell, orc2 (or any live seat)
  takes delivery").
- `role: tertiary` - the 60-odd single-purpose lanes. Its `escalation` cell
  reads `<its secondary's row name>, or Zaal through the primary if no
  secondary owns it` - which surfaces, mechanically, every tertiary lane that
  currently reports straight to `zorca-audit-seat` with no secondary at all
  (measured: `zaofractal`, `poidhz`, `content`, `finance`, `artizen`,
  `creatorstudio`, `zaowebsite`, `bczximprovement` all read "Reports to Zaal,
  through the orchestrator seat" or "Reports to zorca-audit-seat" directly -
  zero secondaries currently sit between them and the top seat, which is
  exactly the gap Zaal's "let's build out more secondary and tertiary lanes"
  is naming).

This is a seed-file edit (`notes/agent-registry-seed-2026-09-09.md`), not a
generator change - `scripts/build-agents-md.py` already renders whatever the
seed says, per the file header ("GENERATED from notes/agent-registry-seed...
edit the seed, then regenerate"). The same three values and failover pattern
work unchanged the day Hermes Agent becomes the primary: its row simply
becomes `role: primary`, `escalation: Zaal`, and every row that pointed at
`zorca-audit-seat` is regenerated to point at `Hermes Agent` instead - a
find-and-replace on one seed file, not a schema migration, provided the
three-value vocabulary is adopted now rather than at handover time.

## 5. The smallest change that ends the hourly selftest red honestly

**The selftest is not lying about the lock's condition - the lock genuinely
is stale, per its own 30-minute rule, and has been for 351 minutes beyond
that threshold as of this measurement.** So the fix is not "make the check
more lenient" (that would be the false-green failure mode
`notes/green-results-that-cannot-go-red.md` warns against: "a green result
that could never go red is not a result") - it is "make the fact the check
reports stop being true," by having a live seat actually call `heartbeat` on
a schedule.

```bash
# Smallest concrete change: a cron line in whichever crontab the live
# orchestrator seat's machine runs, calling heartbeat every 15 minutes
# (half the 30-minute freshness window, so one missed tick does not flip red):
*/15 * * * * ZORCA_OWNER=<current-seat-name> /Users/zaalpanthaki/bin/zorca-lock heartbeat >> ~/.zao/zorca-lock-heartbeat.log 2>&1
```

Measured before recommending this: no existing cron line, launchd job, or
lane convention calls `zorca-lock heartbeat` on any interval today -
`crontab -l` on this Mac and `launchctl list | grep -i zorca` both came back
without a heartbeat entry, and grepping `~/zao-vault` and `~/zaal-dotfiles`
for the literal string `zorca-lock heartbeat` finds it named only in
`~/bin/zorca-lock`'s own header comment ("heartbeat refresh it (call each
pass)") and in Convention 11's prose description of how it is *supposed* to
be used - never in an actual scheduled invocation. The seat has been trusted
to remember to heartbeat manually, and per tonight's measurement, for at
least the last 351 minutes past the alarm threshold, nobody has.

This is the honest fix ahead of the lease rewrite (decision 2) because it
requires no code change and closes the actual gap: the selftest reads red
because the true thing it measures (is a live process renewing this lease)
is false, not because the measurement is broken. Decision 2's fencing rework
is the correctness fix for a race between two *live* claimants; this is the
liveness fix for the case where nobody is claiming at all. Do both, in this
order - the cron line ships today with zero new code; the lease/fencing port
is real engineering and should not block on the same PR.

---

## Community and outside-practice sources, escalated per Hard Requirement 11

- **Fencing tokens**: Kleppmann's post is the canonical citation and is
  current after ten years - confirmed by the fact that the 2026-02-23 HN
  submission (`faultline`) still uses "fencing" as the unglossed term of art,
  meaning the vocabulary has not shifted.
- **Lease semantics**: Chubby (2006) and ZooKeeper (current docs, 2026)
  independently converge on heartbeat + generation/sequence number as the
  same three-part shape Brandon proposed for spec 13.3 - this is not a novel
  ask, it is asking ZAO to catch up to a twenty-year-old, still-standard
  pattern that one of ZAO's own repos (`packages/heart-fleet/`) has *already
  implemented* for a different resource.
- **2026 agent-orchestration practice on supervisor trees**: "the fourth
  pattern - supervisor - is what production looks like in May 2026... For
  most cross-domain agent [work,] Supervisor is the 2026 production
  default." (digitalapplied.com, read FULL via curl+strip, dated 2026,
  verified against the live page). This corroborates - it does not
  originate - what ZAO's own doc 2456 already concluded from Anthropic and
  Google SRE sources: "ZAO is ahead of this" on supervision topology already,
  so the tiering question in this doc is about *authority and lock
  ownership*, which the outside supervisor-pattern literature does not cover
  (measured absence, confirmed by WebSearch: "the search results did not
  contain specific information about lease or heartbeat mechanisms in this
  context" for hierarchical agent supervision specifically - that gap is
  exactly why sections 1-2 above draw on distributed-systems literature
  instead of agent-orchestration literature).
- **Reddit**: `zao-fetch-reddit.sh --selftest` (run tonight) reports the same
  walled state as every 2026-08/09 measurement in this library - creds
  absent, public `.json` returns `text/html`, 0/3 redlib instances answer.
  `WebSearch` restricted to `site:reddit.com` for this exact topic (fencing
  tokens, stale locks, ZooKeeper) returned zero Reddit results (the domain is
  blocked outright for this search backend: `"reddit.com" are not accessible
  to our user agent`). Not escalated to the claude-in-chrome browse route
  given HN (47129394) and GitHub (`kritibehl/faultline`) already satisfy Hard
  Requirement 7's "at least 1 community source"; marked **FAILED - reddit
  walled, tried selftest + WebSearch site-filter, GitHub+HN already cover the
  community-source requirement.**

## Also See

- [Doc 2456](../2456-orchestrator-practice/) - the seven measured supervision
  findings ZAO already has right, and the two-playbook consolidation this doc
  assumes is done
- [Doc 2152](../2152-execution-layer-architecture/) - `packages/heart-fleet/`,
  the fencing-token lease implementation this doc recommends porting
- [Doc 2434](../2434-harness-engineering-six-layer-map/) - `zorca-lock`
  classified as the estate's Permissions-layer control, "one orchestrator,
  30-min heartbeat, refuses a second" (measured before tonight's TOCTOU
  finding)
- [Doc 2473](../2473-orchestrator-capability-audit/) - MCP-call-volume audit
  of the orchestrator seat; no lock/lease findings, cited for completeness of
  the collision scan

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Add `*/15 * * * * zorca-lock heartbeat` to the live orchestrator seat's crontab (shipped = `crontab -l` on the seat's machine shows the line and `zorca-lock status` reads fresh for 24h straight) | @Zaal | Config | 2026-09-11 |
| Confirm the primary/secondary/tertiary tiers in `~/.zao/orchestrators.json` (`proposed` block currently unconfirmed since 2026-09-09 ~21:0x) - name the primary, name at least one secondary per active domain, and update lane `reports_to` fields accordingly (shipped = `proposed` block promoted to a live field, no `_seat_log` revert entry added after) | @Zaal | Decision | 2026-09-12 |
| Edit `notes/agent-registry-seed-2026-09-09.md` so every row's `role` is one of `primary`/`secondary`/`tertiary` and every `escalation` cell names a row, not `UNMEASURED`, then regenerate `AGENTS.md` (shipped = `scripts/build-agents-md.py` run, zero `UNMEASURED` escalation cells for live lanes, guard script for hand-edits still passes) | @Zaal | PR (zao-vault) | 2026-09-15 |
| Port `packages/heart-fleet/`'s acquire/renew/reclaim + fencing-token interface onto `zorca-lock`, scoped to the single "orchestrator seat" resource, with the same 5 safety properties tested (shipped = merged zaal-dotfiles PR, `zorca-lock --selftest` exists and asserts stale-fence rejection) | @Zaal | PR (zaal-dotfiles) | 2026-09-22 |
| Log every stale-lock takeover distinctly from a fresh-lock claim, to `~/.zao/orca-board.log` (shipped = one added `if` branch + log line in `zorca-lock claim`, verified by claiming over a manually-staled lock and reading the log line) | @Zaal | PR (zaal-dotfiles) | 2026-09-15 |

## Sources

Method stated per source, per `.claude/rules/research-grounding.md` - WebFetch was not used for any quoted line.

- [Martin Kleppmann - How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) - **[FULL - `curl` + HTML strip, 24,786 chars stripped text, HTTP 200]** Fencing tokens, why Redlock lacks them, ZooKeeper zxid/znode version as a working fencing token.
- [Apache ZooKeeper - Recipes and Solutions](https://zookeeper.apache.org/doc/current/recipes.html) - **[FULL - `curl` + HTML strip, 18,429 chars stripped text, HTTP 200]** Ephemeral sequential znodes as lease + lock; session-expiry-backed liveness.
- [Mike Burrows - The Chubby lock service for loosely-coupled distributed systems (OSDI 2006)](https://static.googleusercontent.com/media/research.google.com/en//archive/chubby-osdi06.pdf) - **[FULL - `pdftotext` on the official PDF, HTTP 200, 117,687 bytes]** Session lease + KeepAlive renewal (default 12s extension), sequencer (lock generation number) as the fencing mechanism.
- [Show HN: Crash-safe job queue - lease-expiry race and fencing fix](https://news.ycombinator.com/item?id=47129394) - **[FULL - HN Algolia items API, keyless]** Posted 2026-02-23 by kritibehl, 1 point, 1 comment ("the race is deterministic via barrier + forced TTL expiry").
- [kritibehl/faultline](https://github.com/kritibehl/faultline) - **[FULL - `curl` on raw README + `zao-research-snapshot`, 2026-09-09: 5 stars, 0 forks, 1 contributor, LICENSE file read directly = MIT (the `gh api` license field reports `NOASSERTION` for this same repo - Hard Requirement 13's exact warning, reconfirmed)]** Working demo: without fencing, a resumed stale worker double-commits (2 committed effects, invariant FAIL); with fencing, the stale commit is rejected (1 committed effect, invariant PASS).
- [Multi-Agent Orchestration: 5 Patterns That Work in 2026](https://www.digitalapplied.com/blog/multi-agent-orchestration-5-patterns-that-work) - **[FULL - `curl` + HTML strip, 35,523 chars stripped text, HTTP 200]** "The fourth pattern - supervisor - is what production looks like in May 2026, and the fifth - swarm - is where the frontier is moving." / "Supervisor is the 2026 production default."
- `~/bin/zorca-lock` - **[FULL - local file, read in full]** claim/heartbeat/check/release/status implementation, read line by line for decision 1.
- `~/.zao/orchestrator.lock` - **[FULL - local file, measured 2026-09-09 21:13 EDT]** Live lock state: `STALE owner=orc2 pid=73861 age=381m`.
- `~/.zao/orchestrators.json` - **[FULL - local file, read in full]** Seat succession history, the `proposed` tier block, `_seat_log`.
- `~/zao-vault/AGENTS.md` - **[FULL - local file, read in full]** Registry header, ownership rules, 65-row generated table, `role`/`escalation` columns as measured.
- `~/zao-vault/projects/agentic-infrastructure-spec-2026-09-09.md` sections 5, 9, 10, 13, 14 - **[FULL - local file, read in full]**
- `~/zao-vault/notes/orchestrator-charter.md`, `notes/orchestrator-organizer-split.md`, `notes/lane-supervision-playbook.md`, `notes/orca-organization.md`, `notes/green-results-that-cannot-go-red.md`, `handoffs/ADE-OPERATING-GUIDE.md`, `handoffs/VOCABULARY.md`, `handoffs/HOW-THE-LANES-CONNECT.md` - **[FULL - local files, all read this session]**
- `research/agents/2456-orchestrator-practice/README.md`, `research/agents/2152-execution-layer-architecture/README.md`, `research/agents/2434-harness-engineering-six-layer-map/README.md`, `research/agents/2473-orchestrator-capability-audit/README.md` - **[FULL - local files, this library, read this session]**
- Reddit - **[FAILED - `zao-fetch-reddit.sh --selftest` 2026-09-10T01:16Z: creds ABSENT, token endpoint 401, oauth 403 unauthenticated, public `.json` returns text/html, 0/3 redlib instances answered 200; WebSearch `site:reddit.com` for this topic returned zero results, domain blocked for this search backend]** No Reddit source cited; see community-source note above.
