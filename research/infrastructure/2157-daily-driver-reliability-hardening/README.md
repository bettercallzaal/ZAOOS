# 2157 - Daily-Driver Reliability Hardening (the tools you type were the least safe)

**Date:** 2026-07-30
**Status:** Shipped (client fixes) + one migration pending Zaal. Grounded - every claim below traces to the code + a live observation.
**Owner:** Zaal
**Siblings:** `.claude/rules/silent-failure-guard.md` (green-while-broken), doc 2156 (toolkit catalog), doc 2145 (transactional outbox), doc 2152 (execution-layer architecture), [[project_fleet_command_center]].

---

## The principle (behavior-changing)

**The fleet has two tiers of reliability, and they were inverted relative to usage.** The execution layer is rigorous - Heart leases with fencing tokens, an exactly-once outbox with deterministic effect keys + INSERT-ON-CONFLICT claims, receipts, 5 proven safety properties, 24 tests (docs 2145/2152). The daily drivers - the tools Zaal and every lane type constantly to coordinate (`zao-relay`, `zao-inbox`) - were doing read-modify-write on a shared jsonb blob with no merge and no concurrency guard. **The hardened layer is the one nobody types; the unhardened one was the coordination substrate everything depends on.** Credit: the cowork lane surfaced this framing 2026-07-30.

Rule going forward: **the daily-driver tier deserves the discipline the execution layer already has.** When a tool becomes load-bearing for coordination, harden it to the same standard (atomic writes, no silent loss) - before it bites, not after. This is the write-side sibling of `silent-failure-guard.md` (a 200/exit-0 that hides a broken effect); here the broken effect was a successful-looking write that silently dropped another lane's data.

## What broke (both confirmed, both fixed 2026-07-30)

### 1. `zao-relay` - silent lost-update on the shared hub
The relay hub is one `tasks` row (legacy_id 9000) whose `metadata` jsonb holds `{relays: [...], holds: [...]}`. Every command did: `get_hub()` (read whole metadata) -> mutate the snapshot in memory -> `save_hub()` (PATCH the **whole** metadata back). Two lanes editing across the span of a command - or across the Mac/VPS/Pi over minutes - each held a stale snapshot, so whichever wrote last silently erased the key the other had added.

Evidence it was a lost update, not a deliberate clear (cowork lane, verified against the row): after adding holds and them vanishing, the `holds` key was **absent** - not an empty array. `hold clear` sets `holds = []` (key present); an absent key can only come from a writer that PATCHed a metadata copy that never had holds. Holds were lost this way **three times** over the debugging window - the third time because the fix was only on one node while others ran the old code.

**Fix (`zaal-dotfiles` 7441dcd -> 0613e6c), two layers:**
- Client (immediate): `mutate_hub(fn)` re-reads metadata FRESH right before writing and applies the change to the current object, then sends **only the changed top-level keys** via an atomic server-side merge (below), with a whole-object PATCH fallback if the RPC isn't present. Falling back is safe, so the new client can deploy before the migration.
- Server (the real fix): a `relay_hub_merge(p_patch jsonb)` Postgres function doing `metadata = coalesce(metadata,'{}') || p_patch` in one statement. Because a send now only patches `{relays: ...}` and a hold only `{holds: ...}`, **the cross-key clobber is impossible at the DB for any writer/version.** This is what closes the race (client re-read only shrinks it). Migration handed to Zaal - the Supabase MCP is read-only.

Honest residual: two writers to the *same* key (two simultaneous sends) can still lose one relay under `||` merge, because each computes the full new array from its own read. The client re-read shrinks that window; a fully atomic array-append RPC (`jsonb_set(... , old || new_item)`) is the follow-up if same-key contention ever matters. For the reported failure (cross-key: a send erasing holds) the `||` merge is a complete fix.

### 2. `zao-inbox` - silent wrong-lane ack
The wrapper was `exec zao-relay inbox "${1:-${ZAO_LANE:-unknown}}"`. With no arg and no `ZAO_LANE`, it passed the literal `unknown`, **overriding** `zao-relay`'s own `derive_lane()` (git remote / cwd). Result: it acked the `unknown` lane's messages while printing "inbox empty" for the real lane - a silent wrong-lane ack. Fix (`zaal-dotfiles` c406979): pass a lane only if given, else pass nothing so `zao-relay` derives it. Verified: `zao-inbox` with no arg now reads `[zoe]`, not `unknown`.

## The audit (the rest of the daily-driver tier)

Swept the other board-writing daily drivers for the same read-modify-write-on-shared-jsonb pattern:
- **`cockpit`** - GET only (renders the board). Read-only, safe.
- **`zao-agenda`** - GET only (renders the priority list). Read-only, safe.
- **`todo`** - delegates to `zao-tracker inbox`, which INSERTs a NEW capture row (unique `term-<ts>` slug). Own row, no shared-state mutation. Safe.
- **`zao-relay`, `zao-inbox`** - were the only two with the unsafe pattern. Both fixed.

Conclusion: the coordination substrate is now audited; the two unsafe tools are fixed client-side, one migration closes the relay race fully across all nodes.

## Open / gated

- **Zaal:** run the `relay_hub_merge` migration (SQL in the session clipboard). One-time, idempotent. NOTE: `tasks.legacy_id` is a **text** column, so the function filters `where legacy_id = '9000'` (quoted) - an unquoted `= 9000` errors `operator does not exist: text = integer`. (PostgREST's `legacy_id=eq.9000` query param works because it's already a string; raw SQL is not.)
- **Fleet:** VPS (cowork) + Pi (zol) copies of `zao-relay`/`zao-inbox` need updating from `zaal-dotfiles` branch `ws/keyless-fetch-trio-skills` - old copies still whole-object-PATCH until then. Cowork lane relayed to update its VPS copy.
- **Follow-up (optional):** atomic array-append RPC for same-key contention; a ZAOcowork `.claude/settings.json` commit-scan hook (cowork lane's proposal, the #266 contamination class).

## Source

The cowork lane's bug report + independent verification (2026-07-30 relay thread), the live debugging (holds lost three times), and the code in `zaal-dotfiles/bin/zao-relay` + `zao-inbox`. Principle framing: cowork lane. Fixes + audit: zoe lane.
