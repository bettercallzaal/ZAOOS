---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-10-23
superseded-by:
related-docs: "dev-workflows/2649-rules-history, security/2093-silent-failure-sweep"
original-query: "Take ZAOOS issue #4151 (evidence and claims need a claims check: anti-fabrication, research-grounding, measurement-traps, confirm-before-claiming-absence, credit-attribution). SCOPE it as a short research note or doc: the narrowest mechanism per rule, what it would catch, and false-positive risk, measured on October MISTAKES. Don't build yet. lane-quality owns the rule files, so don't edit them. (messenger-69 relay, 23 Oct 2026)"
tier: QUICK
---

# 2706 - Scoping a claims check for issue #4151: the narrowest mechanism per rule

> **Goal:** Issue #4151 groups five rules with no enforcer and proposes one check on PR bodies, docs and reports. Measure, on the vault's October MISTAKES entries, what each rule's narrowest mechanism would have caught and how often it would fire on a correct claim. Nothing is built here and no rule file is edited (lane-quality owns them).

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **SKIP the single text-scanning "claims check" the issue proposes.** Build per-rule mechanisms at the point each claim is made. | `confirm-before-claiming-absence.md` already records that a regex over prose was tried on 2026-08-10 and "fired only on false positives and missed the real case". Measured again here: the placeholder-time regex `\b\d{1,2}:\d[x]\b` matched 12 October entries, of which 4 are entries about a typed time (33 percent); the list is under "Typed-time shortlist" below. Prose is the wrong surface. |
| 2 | **EXTEND `sendmessage-sha-check` with a placeholder-time refusal** (`\b\d{1,2}:\d[x]\b`, as in "11:5x") for measurement-traps and anti-fabrication. | The tool is already a PreToolUse hook on SendMessage and already refuses one kind of fabricated identifier. It would have caught 3 of the 6 typed-time entries. A placeholder digit is never a real reading, so expected false positives are near zero. It cannot catch a full time typed by feel ("13:30 EDT"). |
| 3 | **Anti-fabrication rule 6 (claim before the result): use process gates, not text.** The narrowest are: a verdict is not posted while the head's CI is unfinished; and SendMessage refuses a PR number or branch named as merged or pushed that the remote does not show. | This is the biggest bucket (9 entries) and no text check sees it: "pushed" reads the same whether or not the push landed. The second gate is a PR-number existence check on `sendmessage-sha-check`, queued by quidli as a follow-up to dotfiles #601 (not yet built or claimed elsewhere). |
| 4 | **Confirm-before-claiming-absence: do NOT build a hook.** Require the `zao-assert none` output line next to any absence claim in a verdict or doc, as skill text in zao-evaluate and zao-research. | 9 entries. The tool exists and exits 2 on an empty or unreadable path set. Every miss was a search that could not see the thing (a stale clone, a truncated `head`, a grep that could not match optional chaining, the wrong search words), which is the input `zao-assert` refuses. The rule bans the regex-hook route. |
| 5 | **Credit-attribution and licence claims: add `zao-verify license <owner/repo>`** (reads the LICENSE file, never the API field) and point the rule at it. Not a gate. | 2 entries: "OpenFilm has no license" (it is MIT), and a credit name built by splitting a GitHub handle when the fetched LICENSE named the author. A lookup tool is zero false positives because it only answers when asked. |
| 6 | **Research-grounding: DEFER.** The candidate is a CI step that `curl -I`s every URL in a changed `research/**/README.md` and warns, never fails. | 0 October entries are fabricated citations; the scout incident behind the rule is from August. Paywalls and 403s would make a failing check noisy. |

## What was measured

Source: vault `MISTAKES.md` on origin/main, read 2026-10-23; the counts reproduce at vault commit b95b1fc8 (`## 2026-10-` headings; one heading appears twice, so 142 counts headings, not unique entries). It holds 331 entries, of which **142 are dated October 2026**. The top shapes are trusted-my-own-unexamined-input (33), unmeasured-prediction-in-a-record (29) and surface-cannot-report-state (23).

**Method.** Each October entry was read by title and its "What happened" line and placed in at most one bucket below, by one reader (quidli). A keyword regex was used only to shortlist; every placement was then read by hand. An evaluator spot-checked 18 placements against entry titles on 2026-10-23 and found them consistent. It also noted two CI-timing entries (6 and 9 Oct) that would fit the claim-before-the-result bucket, so that bucket's count is low. Beyond that, the counts are one reader's, not a measurement two readers agree on.

| Bucket (rule) | October entries | Examples (entry titles, shortened) | Narrowest mechanism | Would have caught | False-positive risk |
|---|---|---|---|---|---|
| Typed clock time (measurement-traps; anti-fabrication 5) | 6 | 'measured at 11:5x' (1 Oct); 'Measured, 22:30 EDT' in dotfiles PR 515 (12 Oct); '13:30 EDT' in the zoe brief (18 Oct); card notes at 10:0x (22 Oct); seat ruling times '20:2x' (22 Oct); 'clears around 11:00' (23 Oct) | Placeholder-time refusal in `sendmessage-sha-check` | 3 of 6 (the `x` forms) | Near zero: an `x` digit is never a reading |
| Claim before the result (anti-fabrication 6) | 9 | branch reported pushed, push refused (22 Oct); entry reported logged, push rejected (19 Oct); comment id sent before the post returned it (13 Oct); CLEAN before CI reported, CI went red (7 Oct); test count before the run printed it (6 Oct); merged before CI reported (4 Oct); a check reported before it ran (18 Oct); a cause named before reading the failing job (11 Oct); 'does not say interim' while the grep printed 1 (23 Oct) | (a) verdict not posted on an unfinished head; (b) SendMessage refuses a named PR or branch the remote does not show | (a) 2 (the two CI-timing entries); (b) 1 to 2 (the push and the comment id), others not text-visible | (a) none: it reads CI state; (b) low, a branch pushed seconds before the send may lag |
| Absence claimed from a search that could not see (confirm-before-claiming-absence) | 9 | 'nothing calls updateTrackInfo' from a grep that could not match optional chaining (18 Oct); 'no later ruling' after searching the wrong words (12 Oct); a search cut with `head`, reported whole (11 Oct); 'no ack mechanism exists' from a stale clone (1 Oct); 'none pending' from a filling check list (13 Oct); 'not on record' while the own grep had matched (23 Oct, quidli) | `zao-assert none` output required beside the claim (skill text) | Partial: the stale-clone and empty-path cases exit 2; wrong search words still pass | None from the tool; the skill line can be skipped |
| Licence or credit claim (credit-attribution; research-grounding) | 2 | 'OpenFilm has no license' (19 Oct, it is MIT); credit name split from a handle (17 Oct) | `zao-verify license` | 1 (the licence); the name split needs the LICENSE read, which the tool would print | None (a lookup) |
| Another lane's number written without its command, cwd or ref (anti-fabrication 8) | 1 | a subagent's 210/2 written into a review note; reproduced 212/0 (22 Oct) | none narrower than the rule; skill text in zao-evaluate | 0 automatically | n/a |
| Fabricated citation (research-grounding) | 0 | none in October | URL liveness warning in CI (deferred) | 0 | Medium if it fails rather than warns |

27 of the 142 October entries fall in these buckets. The rest belong to other rules and other issues (chain commits, routing, permissions, private content).

### Typed-time shortlist

**Correction.** An earlier version of this doc said "a keyword regex for typed clock times matched 13 October entries, of which 6 were typed times (46 percent)". It gave neither the regex nor the 13 entries, and the 13 could not be reproduced. On 2026-10-25, over October entries at b95b1fc8, the candidate patterns matched: `\b\d{1,2}:\d[x]\b` 12, `\b\d{1,2}:\d[0-9x]\b` 42, `\d{1,2}:\d[0-9xX]` 47, and a full time followed by a zone 30. None matched 13. The numbers below use the first pattern, the one Decision 2 proposes.

The 12 entries matching `\b\d{1,2}:\d[x]\b`, by heading date and short title. **About a typed time** marks the 4 entries whose mistake is a time typed without the clock.

| # | Date | Entry (short title) | About a typed time |
|---|---|---|---|
| 1 | 23 Oct | messenger pinned ZAOstock #486 as merge-lane | no |
| 2 | 22 Oct | board-burn typed clock times ahead of date(1) into three card notes | yes |
| 3 | 16 Oct | zcaster push line had no cd, ran in ZAOOS clone | no |
| 4 | 4 Oct | Dotfiles attached a default to a public factual claim on ZAOstock #443 | no |
| 5 | 4 Oct | Dotfiles merged zaal-dotfiles #417 before its CI had reported | no |
| 6 | 1 Oct | context lane wrote 'measured at 11:5x' in three messages | yes |
| 7 | 1 Oct | REPEAT within twenty minutes: hub emitted without block 3 | no |
| 8 | 1 Oct | REPEAT (third today): feedback-clip build asserted, chain emitted nothing | no |
| 9 | 2 Oct | x-account clip renames ran sed over the whole status file | no |
| 10 | 12 Oct | A measurement time typed by feel into a PR body (dotfiles 515) | yes |
| 11 | 22 Oct | messenger read a CI run's createdAt as its job start | no |
| 12 | 22 Oct | Seat typed ruling times from memory, ahead of the clock | yes |

The other 8 match because the entry itself writes a rough time ("about 03:3x EDT"). That is the false-positive problem with a regex over prose. It also bears on Decision 2: a refusal on SendMessage would block such approximate times in messages too. Under the clock rule they are not readings, so this doc counts that as intended, but the hook PR should say so.

## What already enforces part of this

| Tool | What it refuses today | Rule it partly covers |
|---|---|---|
| `sendmessage-sha-check` | a commit SHA that resolves nowhere (it refused one of quidli's sends on 23 Oct and named the fix) | anti-fabrication 5 |
| `zao-claims-check` | any line repeating a claim in the retracted-claims ledger | anti-fabrication, after a retraction |
| `zao-assert` | a none, count or absent check whose input is empty, missing or zero bytes (exit 2) | confirm-before-claiming-absence |
| `zao-pr-open` and `zao-merge` claims gate | a PR body naming a path the diff does not touch, unless cited | anti-fabrication 6, for paths |
| `zao-status-append` | a status entry with a hand-typed stamp | measurement-traps (clock) |

So #4151's rules are not unenforced: four tools each refuse one narrow form. The gap is the forms above that no tool sees.

## Next Actions

| Action | Owner | Type | Gate |
|---|---|---|---|
| Add the placeholder-time refusal to `sendmessage-sha-check`, with a red control on '11:5x' and a pass on '09:58 EDT' | lane-quality or quidli | dotfiles PR | it is a hook, so Zaal's merge |
| Build the PR-number and branch existence check in `sendmessage-sha-check` | quidli (queued after #601) | dotfiles PR | hook, Zaal's merge |
| zao-evaluate: no verdict on a head whose CI is unfinished; absence claims carry a `zao-assert` line | quidli | skill PR | merge-lane |
| `zao-verify license <owner/repo>` reading the LICENSE file | quidli | dotfiles PR | merge-lane |
| Comment on #4151 linking this doc, with the 27-of-142 count | quidli | issue comment | none |
| Second reader re-buckets a sample of the 27 entries | evaluator | review | none |

## Sources

- Vault `MISTAKES.md`, origin/main, read 2026-10-23 [FULL, `git show`]; 142 October entries counted by date heading. Re-read 2026-10-25 at vault commit b95b1fc8 [FULL, `git show b95b1fc8:MISTAKES.md`] for the typed-time shortlist.
- ZAOOS issue #4151 [FULL, `gh issue view`].
- `.claude/rules/confirm-before-claiming-absence.md` (the failed regex hook, 2026-08-10) [FULL].
- `~/bin/sendmessage-sha-check` and `~/bin/zao-claims-check` docstrings [FULL, read from disk].
- `zao-verify --help`, `zao-assert` usage [FULL, run].
- No web sources: this is an internal measurement.
