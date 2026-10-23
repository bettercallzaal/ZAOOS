---
topic: agents
type: audit
status: research-complete
last-validated: 2026-10-22
superseded-by:
related-docs: "agents/2551-dreamnet-brandon-census-built-vs-written-stack, agents/2621-zaal-dreamnet-protocol-hardening-phase0-discovery, agents/2622-dreamnet-hardening-phase0-ground-truth-and-verification, agents/2138-spore-phase3-cross-runtime-conformance, agents/2176-dreamnet-canary-reality-board, agents/2184-dreamnet-tenant-organism-stage0, agents/2030-dreamnet-public-core-organism-contract, agents/2124-spore-interop-federation-v0.2"
original-query: "can we research dreamnet in one of the lanes" (Zaal, 2026-10-22, relayed by the seat with four questions: what DreamNet is today grounded in zorca's live code and README; what changed since 18 Oct; where The ZAO and DreamNet connect and what Brandon and Zaal are each building; the three most useful next steps with cost and what each unblocks)
tier: STANDARD
---

# 2702 - DreamNet on 2026-10-22: what it is, what moved since 18 Oct, and the three next steps

> **Goal:** One grounded snapshot of the DreamNet relationship (Brandon Ducar, github.com/BrandonDucar) as of 2026-10-22, read from code and git rather than from earlier docs, with the next three steps for The ZAO.

**Credit:** DreamNet, Spore, the dreamloop format, the protocol-hardening spec and the playable-environments thesis are Brandon Ducar's. This is Brandon **Ducar**, not Brandon Beckwith.

**Measured against:** ZAOOS `origin/main` at `e86864932` (2026-10-22 22:27Z); zorca cloned at `d3eb5b2`; vault `origin/main` after a fetch on 2026-10-22; `gh api` reads of Brandon's public repos the same evening. Nothing was sent to Brandon and nothing was written to any live system.

## Key Decisions

| # | Recommendation | Why | Cost | Unblocks |
|---|---|---|---|---|
| 1 | **RE-RUN the Spore conformance checks against the SDK head `f230dd0`, and stop advertising the old pin until it passes.** | `https://zaoos.com/api/spore/verify` still says "PHASE 3 CONFIRMED - 47/47" against SDK commit `4072102a` with hash `sha256:dreamnet-sorted-json:v0`. The SDK is 2 commits and 41 files past that pin. One of the two commits is "Spore Federation Protocol v1.0.0 RFC 8785 JCS" (2026-09-10), and Brandon's 2026-10-09 hash profile is SHA-256 over RFC 8785. | One agent session: new fixtures plus a test run. No gate, because it is read-only and test-only. | Agreeing Brandon's hash profile (his item 4). The WaveWarZ receipt adapter (card 1289). The "public-safe receipt layer" in the 18 Oct map (concept 5). |
| 2 | **CORRECT three stale records in one pass:** the zorca README, the 18 Oct map's "Phase 1 held" line, and the capability card's placeholder values. | The zorca README calls the federation contract "Named, not started" (README.md:41, :94, :116), but `federation/` was merged on 2026-09-27 (federation/README.md:3). The 18 Oct map says Phase 1 waits on Brandon's 5 answers (note lines 16, 42). He answered on 2026-10-09 (handoffs/dreamnet.md:107-108), and three Phase 1 builds merged on 10-11. | Two small PRs (zorca README, vault note) plus one line on the card. | Anyone reading zorca, Brandon included, gets a true picture. Relays stop asking Brandon for answers he already gave. |
| 3 | **FIND OUT whether `FARCASTER_SIGNER_PROVENANCE_INGEST=1` is set in production. If not, set it after the wellbeing week.** | It is the first Phase 1 build that writes real data. Zaal said "merge and turn on" (Grill item 128, handoffs/dreamnet.md:29). No record after 2026-10-11 says it was set. This lane cannot read Vercel and does not try. | About 10 minutes of Zaal's time: one env var, a redeploy and one SQL check pasted back. | The first real provenance run. Brandon's test vectors (same-FID A to B, revoke, backfill). The later decision on the retrieval filter. |

## 1. What DreamNet is today, in plain words

DreamNet is Brandon Ducar's design for an "actor-neutral" operating system for organisations. Identity, a capability registry, bounded authority leases, receipts and governance come first, and AI is one kind of participant among humans, software and machines (vault `inbox/2026-09-16-brandon-dreamnet/README.md:12-14`, his three laws at lines 24-27). Brandon writes the concepts as specs and public repos. The ZAO's side is code that speaks parts of those specs.

**What runs, measured 2026-10-22:**

| Piece | Where | State | Evidence |
|---|---|---|---|
| Spore verify endpoint | `src/app/api/spore/verify/route.ts` | **LIVE** and public. GET returned 200 with 840 bytes | Fetched 2026-10-22: `"status":"PHASE 3 CONFIRMED - 47/47 bidirectional vs the DreamNet spore-sdk","sdkCommit":"4072102ace9c4ccf1dda40302f685ac5d8e01268"` |
| Signer provenance (Phase 1 hardening) | `src/lib/farcaster/signer-ingest.ts:50`, wired at `src/app/api/webhooks/neynar/route.ts:126-131` | Merged and wired. The flag is OFF unless set to exactly `1`. Production value UNKNOWN | code read |
| Retrieval filter, second-hub check, write check, hidden casts | `signer-authority-filter.ts:41`, `signer-ingest.ts:65`, `write-authority.ts:45`, `hidden-casts.ts:24` | Merged, every flag default OFF | code read |
| Tenant-organism layer and Proof Drops | `src/lib/dreamnet/` | Built. A grep of `src` and `bot` found no caller outside `src/lib/dreamnet`, so it is **reachable by nothing** whatever the flags say | `src/lib/dreamnet/README.md:9-11`, and the grep this run |
| ZOE receipts | `bot/src/zoe/receipt-envelope.ts`, `receipts.ts` | Built (`dreamnet.receipt.v1`). Not re-verified live this run | file list from `git grep -il dreamnet` |

**zorca, the repo Zaal named as the DreamNet repo** (vault `decisions/zorca-is-the-dreamnet-repo.md`, 2026-09-19). zorca has 33 tracked files and no running code path. Its contents are:
- `PLAYBOOK.md` (284 lines) and the README.
- The board GUIs under `gui/`.
- A `federation/` directory: a capability card, an envelope mapping and four JSON schemas, one of them `dreamloop-manifest.v1`. It came from Brandon's PR #9 and was merged on 2026-09-27 as "DRAFT SPEC, NOT LIVE" (`federation/README.md:3`).

The 2026-09-19 decision asked Brandon to build dreamloops into zorca. What arrived is a schema for a dreamloop manifest and no runtime. The working dreamloops are still in `bettercallzaal/zol/loops/`: 73 entries, read with the contents API this run.

**The capability card is not usable as an identity yet.** Its two `input_schema_hash`/`output_schema_hash` pairs include `e3b0c442...b855`, the SHA-256 of the empty string, and `ca978112...48bb`, the SHA-256 of `"a"`. Both were computed this run. They are placeholders, not hashes of real schemas. The Ed25519 key's provenance is unconfirmed, as the card's own README says (`federation/README.md:4`). A check of the key against published example keys was attempted this run and blocked by the session's permission layer, so whether it is a published example key is UNVERIFIED. Confirm before anything is signed with it. The payout address is the zero address (`federation/README.md:6`).

## 2. What changed since 18 Oct

| Date | Change | Source |
|---|---|---|
| 2026-10-18 | Brandon's private ask to Zaal (paraphrased here): apps as playable operational environments, plus one multi-platform agent gateway. The ecosystem map was written the same day | vault `notes/dreamnet-ecosystem-map-2026-10-18.md`, merged as vault #193 on 2026-10-19 |
| 2026-10-18 | Zaal said yes to building a WaveWarZ receipt adapter to Brandon's schema (card 1289). The board note marks its state "unverified" | vault `notes/board-burn-2026-10-22.md:168` |
| 2026-10-18 to 10-20 | Brandon created **WikiREA** (MIT, created 2026-10-18T19:00Z, 10 commits since 10-18). The 18 Oct map listed WikiREA as "no web hit (FAILED)" (note line 17). It now exists and links a page on "how runtime findings can feed DreamNet" | `gh api repos/BrandonDucar/WikiREA`, LICENSE file read |
| 2026-10-20 | Grill sweep closed the dreamnet lane's old grill questions with evidence | vault #220, `e5d50fcd` |
| 2026-10-22 | `dreamnet-whale-league` pushed (Apache-2.0). The commits API shows 0 default-branch commits dated since 10-18, so the push was to another branch or carries older dates. Content not read | `gh api` |
| none | zorca: no commit since #12 on 2026-10-17. dreamnet-zao (private record): no commit since #6 on 2026-10-14. dreamnet lane status: last entry 2026-10-11 ("IDLE") | `git log`, `gh api`, vault `handoffs/status/dreamnet.md:147` |

**One contradiction this doc resolves:** the 18 Oct map (lines 16 and 42) and the seat's status (`handoffs/status/orchestrator2.md:407`) both say Phase 1 waits on Brandon's five answers. The dreamnet brief says he answered by email on 2026-10-09 (`handoffs/dreamnet.md:107-108`), and #3904, #3905 and #3906 then merged on 10-11. The brief is the newer, measured record. **Phase 1 is not held. It is waiting on flags and on Brandon's golden vectors.**

## 3. Where The ZAO and DreamNet connect, and who builds what

```
 Brandon (DreamNet)                       The ZAO
 ------------------                       -------
 dreamnet-spore-sdk (f230dd0) --hash/receipt--> /api/spore/verify (pinned 4072102a, LIVE)
 hardening spec + FC-EVAL-001 --------------> signer-ingest / filter / 2nd hub (flags OFF)
 schemas (dreamnet-zao #1) ----------------> dreamnet-zao record; did:zao owned by The ZAO (#6)
 federation PR (zorca #9) -----------------> zorca/federation (DRAFT, nothing reads it)
 dreamloop format -------------------------> zol/loops (73 entries), zorca schema only
 playable-environments thesis (10-18) -----> 18 Oct map: battle-replay pilot (not started)
```

- **Brandon builds** specs, schemas and public repos: SDK hardening (2026-09-28), WikiREA (from 2026-10-18), whale-league (pushed 2026-10-22). His PRs on ZAO repos are zorca #9 (merged) and dreamnet-zao #1 (merged 2026-10-13).
- **Zaal's lanes build** the ZAO half: ZAOOS #3852 to #3906 (signer tables, ingestion, filter, second hub; all flags OFF), the dreamnet-zao record, and the ruling that `did:zao` is owned by The ZAO with Brandon credited as co-designer (dreamnet-zao #6, 2026-10-14).
- **Organ map** (`.claude/rules/dreamnet-communication-standard.md`): the verify endpoint is the **Eyes** (it checks evidence from outside), signer provenance is the **Spine** (who may act), and zorca/federation is the **Control-Plane** boundary. Like a cell membrane, it decides what crosses without exposing what is inside.

## 4. Evidence split

- **Proven this run:** the live verify endpoint text; the SDK is ahead of our pin (`compare` API: `ahead_by=2`, 41 files); every signer flag defaults off in code; the tenant layer has no outside caller; zorca's federation directory exists while its README says it does not; the placeholder hashes; WikiREA's creation date and licence.
- **Hypothesis:** our conformance probably breaks against `f230dd0`, because the canonicalisation changed to RFC 8785. Not tested.
- **Not tested:** the production values of any flag; whether ZOE's receipts still verify; the content of whale-league's 10-22 push; the origin of the capability card key.

## 5. Four lenses

- **Engineer:** the code is built and switched off. The one live public surface advertises a conformance pin that is two upstream commits stale.
- **Architect:** the boundary (zorca) is a draft spec that nothing reads. The organism's working parts are in ZAOOS and zol, not in zorca.
- **Founder:** the next value comes from switching on what is built and proving it, not from building more.
- **Investor:** being an independent conformant node is the hard-to-copy asset, and it stays true only while it is re-run as the SDK moves.

## Also See

- [Doc 2551](../2551-dreamnet-brandon-census-built-vs-written-stack/) - the census, last validated 2026-09-24
- [Doc 2621](../2621-zaal-dreamnet-protocol-hardening-phase0-discovery/), [Doc 2622](../2622-dreamnet-hardening-phase0-ground-truth-and-verification/) - Phase 0
- [Doc 2138](../2138-spore-phase3-cross-runtime-conformance/) - the 47/47 run this doc says to repeat
- [Doc 2176](../2176-dreamnet-canary-reality-board/), [Doc 2184](../2184-dreamnet-tenant-organism-stage0/), [Doc 2030](../2030-dreamnet-public-core-organism-contract/), [Doc 2124](../2124-spore-interop-federation-v0.2/)
- Board cards 1289 (WaveWarZ receipt adapter) and 9076 (tenant Stage 0, parked by ruling)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Re-run Spore conformance against `BrandonDucar/dreamnet-spore-sdk@f230dd0`. Shipped when a ZAOOS PR lands new fixtures and the endpoint's `conformance` block names the new commit, or says FAILED with the failing checks | dreamnet lane | PR | 2026-10-29 |
| zorca README: replace "Named, not started" (lines 41, 94, 116) with the true state of `federation/`, and mark the card's hashes as placeholders. Shipped when a zorca PR is merged | dreamnet lane | PR | 2026-10-26 |
| Vault: append a dated correction to `notes/dreamnet-ecosystem-map-2026-10-18.md` saying Phase 1 is not held (Brandon answered 2026-10-09). Shipped when a vault PR is merged | dreamnet lane | PR | 2026-10-26 |
| Say whether `FARCASTER_SIGNER_PROVENANCE_INGEST=1` is set on Vercel Production. If not, set it, redeploy and paste the SQL check. Shipped when the check result is in `handoffs/status/dreamnet.md` | Zaal | Env change | 2026-10-30 (after the 22-29 Oct wellbeing week) |

## Sources

- [FULL] ZAOOS code at `origin/main` `e86864932`: `src/lib/dreamnet/README.md`, `src/lib/farcaster/*.ts`, `src/app/api/webhooks/neynar/route.ts`, `src/app/api/spore/verify/route.ts` (git show/grep)
- [FULL] [github.com/bettercallzaal/zorca](https://github.com/bettercallzaal/zorca) - `git clone` at `d3eb5b2`; README.md, federation/README.md, federation/capability-card.json, LICENSE (MIT) read
- [FULL] [zaoos.com/api/spore/verify](https://zaoos.com/api/spore/verify) - curl, HTTP 200, 840 bytes, 2026-10-22
- [FULL] [github.com/BrandonDucar/dreamnet-spore-sdk](https://github.com/BrandonDucar/dreamnet-spore-sdk) - `gh api` commits and compare `4072102a...HEAD`
- [FULL] [github.com/BrandonDucar/WikiREA](https://github.com/BrandonDucar/WikiREA) - `gh api` repo metadata, README and LICENSE file (MIT)
- [PARTIAL - metadata only, contents not read] [github.com/BrandonDucar/dreamnet-whale-league](https://github.com/BrandonDucar/dreamnet-whale-league) - Apache-2.0 per its LICENSE file
- [FULL] Community, GitHub: [zorca PR #9](https://github.com/bettercallzaal/zorca/pull/9), Brandon's federation PR. Its comment thread is empty (`gh api .../issues/9/comments` returned nothing)
- [FULL, negative] Community, Hacker News: [Algolia search "dreamnet"](https://hn.algolia.com/api/v1/search?query=%22dreamnet%22&tags=story) returned 0 stories, against a control of 45 for "farcaster". The 18 any-type hits are unrelated. No public HN discussion of this DreamNet exists
- [FAILED - HTTP 403] Community, Reddit: search.json, the known IP block. Not retried
- [FULL] Vault `origin/main` (private, cited by path): `handoffs/dreamnet.md`, `handoffs/status/dreamnet.md`, `decisions/zorca-is-the-dreamnet-repo.md`, `decisions/grill-2026-10-06-dreamnet-evening.md`, `notes/brandon-dreamnet-protocol-hardening-mission-2026-10-06.md`, `notes/dreamnet-ecosystem-map-2026-10-18.md`, `inbox/2026-09-16-brandon-dreamnet/README.md`, `notes/board-burn-2026-10-22.md`, `handoffs/status/orchestrator2.md`
