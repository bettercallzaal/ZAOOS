# Lane review - zaoos

Advisory. This lane is ZID / identity (doc 2419). None of this meeting's work is
mine, so the useful contribution is prior decisions the recording could not carry.

## 1. Corrections

- **"Jim did not know Hypersnap" is true of the call and stale by the next
  morning.** Hypersnap is now documented in this repo:
  `research/farcaster/2418-hypersnap-state-and-zao-feasibility`, merged to main
  in PR #3326 at 2026-08-26T01:04:59Z, hours before this meeting. Anyone reading
  action 7 in three weeks should be pointed at the doc, not only the video link.
  This also supersedes the line in `~/zao-vault/notes/zao-decentralization-scale.md`
  saying hypersnap is undocumented anywhere on disk.
- **UNVERIFIED, flagging rather than asserting:** action 6 names ZAO Fund curators
  as "Civil and Jose". Two ZAO records could match and I cannot tell from the
  packet which is meant - `project_marie_civilmonkey_berlin` (CivilMonkey) and
  `project_jose_acabrera` / Joseph Goats. If the recap is going to name curators,
  someone who was on the call should confirm both. Do not resolve it by guessing
  (`recap-followthrough.md` rule 5).
- No claim in the list is contradicted by the repo otherwise. Nothing here has
  already shipped as far as ZAOOS is concerned.

## 2. Missing context

- **Sparkz already is ZAO's creator-coin launcher, and it deliberately moved away
  from being one.** **23 sparkz-named
  docs** under `research/business/` (counted 2026-08-26), newest 2026-08-17.
  `2251-sparkz-rebrand-and-modular-architecture` (2026-08-08, DEEP, type
  `decision`) repositions it as OSS-monetization, "back the work, not a coin".
  `2302-sparkz-candidates-verified` (2026-08-17) is live pipeline work. A reader
  of this recap needs to know that when actions 3 and 4 talk about token
  factories, ZAO has an existing product in that space that was consciously
  steered away from coin-launching.
- **The securities question in decision 6 has a DEEP doc already.**
  `research/business/1108-sparkz-legal-framing` covers memecoin-vs-utility and
  the implications of ZAO holding locked positions across many creators. The
  subscription-report reframe should be checked against it rather than re-derived
  on a call. I am not asserting the reframe is wrong; I am saying the prior work
  exists and nobody cited it.
- **Prior token-launcher evaluation exists:**
  `research/events/953-deez-boardwalk-token-launcher` (2026-06-29). Whatever was
  concluded there should be read before the CEN launcher is treated as the first
  one considered.
- **If action 4 lands, it reaches my lane.** ZID is ZAO's membership identifier
  and it is wallet-anchored, with no FID requirement and nothing on-chain
  (doc 2419 s4.3). That doc argues explicitly that the first design binding a ZID
  to a contract or an external account couples the identity layer to an
  unresearched dependency. A community-token factory is exactly where someone
  would do that. Advisory only, and only if action 4 proceeds.
- Minor, same doc: `users` carries credential columns
  (`bluesky_app_password`, `hive_posting_key_encrypted`, `lens_access_token`)
  beside profile columns, and the admin route returns the row with `.select('*')`.
  Graded LOW, admin-gated, four of five null across all 60 rows. It only matters
  if artist-token work starts distributing artist rows outward (doc 2419 s4.4).

## 3. Actions I own

**None.** No action in this list is ZID or identity work, and none is already
done in this repo. Saying so plainly is more useful than claiming a partial.

## 4. Actions that should not exist

- **Action 4, "scope a factory-of-factories so Zaal can unlock token launching
  himself" - flag, do not delete.** This is not a clean duplicate of an open
  card, so I am not calling it dead. It is close to Sparkz's original premise,
  and doc 2251 records a deliberate move away from coin-launching toward backing
  work. Scoping a community-coin factory may run against a decision already
  taken. That is Zaal's to reconcile, and it should be reconciled before the
  action is worked, not after.
- Nothing else in the list duplicates an open card that I can see. I did not
  check the cowork board from this lane; my scope was the repo.
