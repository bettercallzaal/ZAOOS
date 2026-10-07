---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-06
superseded-by:
related-docs: "agents/2239-zoe-capability-map, agents/2623-zaal-manual-task-handoff-map, agents/2622-dreamnet-hardening-phase0-ground-truth-and-verification, agents/601-agent-stack-cleanup-decision"
original-query: "lets do a new agent not zol but somethgin that can help us always its our mainpoint of contact (Zaal, 2026-10-06, typed in the dreamnet pane; then picked Grow ZOE and Telegram + Orca)"
tier: STANDARD
---

# 2625 - ZOE as the always-on main point of contact: design, on what already exists

> **Goal:** Zaal wants one agent that is always there and is his main point of contact. He ruled it is ZOE grown into that role, not a new bot, and that he reaches it on Telegram and in Orca. This doc designs that from ZOE's measured state and the existing Orca bridge design, names every step as a gated release, and builds nothing.

**The ruling, as recorded.** Zaal typed in the dreamnet pane on 2026-10-06: "lets do a new agent not zol but somethgin that can help us always its our mainpoint of contact". Offered three options, he picked **"Grow ZOE"**, which means no new bot and ZOE becomes the always-on main contact. For the surface he picked **"Telegram + Orca"**. The orchestrator logged it at zao-vault `cb0ae055` (`decisions/grill-2026-10-06-icm.md`).

**Rules this doc keeps:**
- PR only.
- No bot code, no flag flips, no restart of the live ZOE. It is one instance, and nothing imports its entrypoint (`agent-loops.md` rules 9 and 21).
- Money, on-chain and public posts stay Zaal's unless he rules otherwise.

---

## 1. Executive summary

ZOE is already most of what Zaal described:
- It lives in Telegram on the VPS.
- It holds tasks, memory, briefs and the grill.
- It runs 28 scheduled jobs (`grep -c` of the cron calls in `scheduler.ts`).

There are three gaps:
1. It cannot see or act on the Mac.
2. Its outbound channel drops most low-priority sends.
3. Several of its autonomy features are built but switched off.

The Orca half is also already designed: `zorca/docs/DESIGN-bridge.md` (2026-08-26) turns a Telegram `/lane <request>` into a real Orca lane through a queue file. Its Mac half, `zorca-actuator`, is written and tested. It waits on two settings that are Zaal's.

So "grow ZOE" is four moves, in this order:
1. Fix the two things that break ZOE as the single route: the token rotation, and the send cap that drops status messages.
2. Turn on the existing bridge for the Orca half.
3. Settle which account ZOE posts as.
4. Move the handoff releases from doc 2623 into ZOE one at a time. Each one is a `dreamnet.dreamloop.v1` manifest that starts as a rehearsal with receipts.

## 2. Why this matters

Doc 2623 found fourteen hand-done tasks in one day, and they arrived through many surfaces: lane panes, clipboard pages, the grill, Telegram. A single main contact is what makes handing work off possible, because there is one place where requests come in and receipts go out. The risk is the opposite failure: making ZOE the single route while it still drops 79 percent of sends (doc 2239, Findings 4) turns one front door into a locked one.

## 3. Before vs after

**Before:**
- On his phone, ZOE handles tasks, memory and the grill.
- At the Mac, about 16 lane panes handle everything else.
- ZOE cannot see the panes. The Mac pushes it a snapshot (`bot/src/zoe/lanes-board.ts:4-8`), and it cannot act on them.

**After:**
- ZOE is the one door, from Telegram or from an Orca pane.
- It can open and steer a lane through the bridge.
- It carries each released chore as a permission-scoped dreamloop with receipts.
- Every send, sign or publish still waits for his tap.

## 4. What ZOE is today (from doc 2239, re-checked 2026-10-06)

Doc 2239 (re-researched 2026-10-04, ZAOOS #3712) is the newest map, and it holds. This lane re-ran an inventory of all non-test modules in `bot/src/zoe` at `e2645d428` and found 180 files. Doc 2239 counted 179 at `e19245fed`. The capability groups match:

| Group | Examples, with where they are wired |
|---|---|
| capture and tasks | `tasks.ts` (index.ts:70), `team-tracker.ts` (index.ts:75, scheduler.ts:81), `inbound-media.ts` (index.ts:44) |
| memory and recall | `memory.ts` (index.ts:89), `recall.ts` (index.ts:99), `reflexion.ts` (index.ts:95), `afferent-digest.ts` (scheduler.ts:28) |
| grill and decisions | `grill.ts` (index.ts:36, scheduler.ts:61), `backlog-grill-runner.ts` (index.ts:46), `approvals.ts` (index.ts:156) |
| briefs | `brief.ts`, `recap.ts`, `needs-zaal-digest.ts` (scheduler.ts:24, 27, 30) |
| outbound | `drafts.ts` (index.ts:184), `outbox.ts` (index.ts:177), `caster/index.ts` (index.ts:204) |
| coding | `dispatchHermesRun` (index.ts:179, called at 2223 and 2972) |
| scheduling | `scheduler.ts` (index.ts:97): 28 cron calls, plus 4 in `posts/scheduler.ts` |

**Where doc 2239 is now stale:**
- Its section 2 says "INVESTIGATE whether any of [the Farcaster caster pipeline] is wired in `index.ts`; this pass did not trace imports." It is wired: `caster/index.ts` is imported at index.ts:204 and `farcaster/event-stream.ts` at index.ts:205.
- Two modules have no importer outside tests: `caster/mention-listener.ts` and `farcaster/wiki.ts`.
- The Mac-side bridge files that doc 2239 does not mention live in `~/zaal-dotfiles/bin`, not in `zorca` as the design says (`gh api repos/bettercallzaal/zorca/contents/bin` returns 404).

**What it cannot do today (each cited):**
- It cannot act on the Mac: "ZOE cannot see the Mac's terminals, so the Mac pushes a snapshot" (`lanes-board.ts:6`).
- It cannot send what Zaal approves for his own accounts. The [Post] button queues the cast for **@zolbot** (`index.ts:1052-1070`, "queued for @zolbot"). Its outbox says "ZOE cannot actually send it yet: the ZOL signer lives on the Pi" (`outbox.ts:4-6`). That is card 10257.
- Most autonomy is off by default:
  - `ZOE_ORCHESTRATOR_ENABLED` and `ZOE_RELAY_TG_ENABLED` (`orchestrator-tick.ts:7, 23, 450`)
  - `ZOE_LOOP_LEASES` and `ZOE_REPO_IMPROVER_LEASES` (`scheduler.ts:131, 151`)
  - `ZOE_HEART_FLEET_CANARY`
- Live values on the VPS are UNKNOWN from this session. Doc 2239 records ssh as BLOCKED.

## 5. The two blockers to making it the single route (doc 2239, carried, not re-measured)

1. **Bot token rotation (cards 9809 and 9371).** A token value was pasted into a public ZAOOS PR comment on 2026-09-16. Doc 2239 calls the rotation open and 18 days overdue. A single main contact cannot run on a token that may be compromised.
2. **The send cap drops the `status` class.** The VPS send log, read on 2026-09-27, shows 3,415 of 4,347 sends dropped (79 percent), at 3 per class per day. `status` is the default class for an untagged send (`send-budget.ts:605-613`), and `status` drops rather than defers. As the main contact, ZOE would silently lose most of what lanes route through it.

## 6. The Orca half: finish the bridge that exists, do not design a second one

`bettercallzaal/zorca` `docs/DESIGN-bridge.md` (design, 2026-08-26, read via `gh api` today) defines it:
- Telegram `/lane <request>` goes to a webhook on the VPS.
- The VPS appends to a **queue file**.
- The Mac polls the queue and opens the lane. "If the Mac sleeps, the queue waits." (section 12)

Status:
- **Built and tested, Mac side:** `~/zaal-dotfiles/bin/zorca-actuator` ("the Mac-side half of ZOE v2 lane control ... the only piece that can touch Orca", lines 3-8) and `zorca-lane-enqueue` ("ZOE's webhook handler calls this after Zaal confirms", line 5). The design says 16 test cases exist (section 14).
- **Not built:** the ZOE side. Nothing in `bot/src/zoe` mentions `zorca`, `lane-send` or a `/lane` command. The only `zorca` hit is a comment at `send-budget.ts:47`.
- **Waiting on Zaal (section 14, "both Zaal's"):** the SSH direction (`queue.mode`, which defaults to neither) and the missing config file `~/.zao/zorca-actuator.json`.
- **One open evidence point:** the design's runtime choice (OpenMatter, with the VPS warm as fallback) was "confirmed via orchestrator relay ... not observed as Zaal's own typed text" (section 12). It needs his confirmation before any runtime work.

Naming: the bridge doc calls this "ZOE v2". The CLAUDE.md do-not-propose list retires "ZOE v2 / Agent Zero", a different, decommissioned plan. To avoid confusing the two, this doc calls the work "ZOE's Orca half".

## 7. The releases from doc 2623, each as its own gated step

Each step lands as a `dreamnet.dreamloop.v1` manifest (the schema `bettercallzaal/zol` runs 72 of). It sets `blocked_actions` to money, on-chain, publish, send, delete and settings, starts at `rehearsed`, and is promoted only after Zaal reads its receipts. This is Brandon Ducar's DreamNet pattern applied to ZOE.

| Step | What ZOE does | Where in ZOE it lives (existing code) | Ruling it needs | Stays Zaal's |
|---|---|---|---|---|
| R1 grill triage | sort each incoming item gated or not per `lane-autonomy.md:14-20`; auto-proceed non-gated items with a logged default; send him only gated ones | `grill-queue.ts`, `backlog-grill-runner.ts`, `grill.ts` | doc 2623 release 1 | every gated item |
| R2 email drafts | write thank-yous and follow-ups as Gmail drafts | the **Orca half** (Gmail is a claude.ai connector the VPS bot does not have); ZOE posts "N drafts ready" on Telegram | doc 2623 release 2 | send |
| R3 camera-card copy | receives the copy script's receipt and tells him "copied N files, checksums match" | a Mac script (launchd, copy-only); ZOE only reports | doc 2623 release 3 | plugging in; clearing the card |
| R4 payout packets | delivers the finance lane's packet with a [Mark paid] button that writes the ledger row | `questions.ts` / `approvals.ts` button pattern | doc 2623 release 4 | the transfer |
| R5 fork-PR merges | lists merge-ready PRs in the Needs-Zaal digest, with the fork-PR red-Vercel label | `needs-zaal-digest.ts` (scheduler.ts:30) | doc 2623 release 5 | the merge |
| R6 open a lane from the phone | `/lane <request>` through the bridge in section 6 | new `lane` command module (bridge section 5) | D1 below | confirming each `/lane` |
| R7 post as the right account | settle what [Post] means | `drafts.ts`, `outbox.ts` | D3 below (card 10257) | every public post |

## 7b. Design decisions (sent to the grill)

- **D1, the Orca half.** A (rec) finish the existing zorca bridge: Zaal sets `queue.mode` (the Mac dials out) and writes the config file, then a ZAOOS PR adds ZOE's `/lane` module. ZOE can open and steer Orca lanes from the phone. / B a "zoe" Orca pane only, with no Telegram-to-lane bridge. / C Telegram only for now.
- **D2, order.** A (rec) close the token rotation (9809, 9371) and rule the `status` send class to defer instead of drop, both before ZOE becomes the single route. / B do them in parallel with R1. / C accept the current channel.
- **D3, posting account (card 10257).** A (rec) [Post] stays ZOL-only; Zaal's and The ZAO's posts stay his, through Firefly, until a separate ruling. / B add a ZAO-account signer behind a per-post tap. / C remove the [Post] button from non-ZOL drafts.
- **D4, first release.** A (rec) R1 grill triage, all inside ZOE's existing grill code, as the first `rehearsed` dreamloop. / B R2 email drafts through the Orca half first. / C R4 payout packets first.

## 8. Risks

- Making ZOE the single route before blocker 2 is fixed silences lanes. Fix the cap first.
- Two brains: an Orca "zoe" pane with its own memory would split ZOE. The Orca half must share ZOE's queue and memory; it is hands, not a second concierge.
- The bridge has the Mac dial out to the VPS. That is a new standing connection, so it gets its own rotation entry in the security brief that `zao-rotate` needs (doc 2623, row 10).
- Doc 2239 notes the live bot handle is UNKNOWN (`@zaoclaw_bot` or `@zaoos_bot`). Settle it before any surface names it.

## 9. Explain it to a 12-year-old

Zaal already has a helper on his phone called ZOE. Today ZOE can't reach his computer, and it loses a lot of the messages it is supposed to pass on. The plan is to fix the message-losing, give ZOE a way to work on the computer when he asks, and then hand it chores one at a time. It practises each chore first, and Zaal checks its work before it does that chore for real.

## 10. Confidence

| Conclusion | Confidence | Unknown |
|---|---|---|
| Growing ZOE needs no new bot: the parts exist | 85% | the live VPS env and flags, unread from here |
| The two blockers must come first | 80% | the current send-log numbers, carried from 2026-09-27 |
| Finishing the zorca bridge is cheaper than a new Orca design | 75% | the actuator has not run against a live Orca |

## 11. Translation layer

- **Engineer:** one webhook, one command module and a config file finish the bridge. A cap ruling and a rotation unblock the channel.
- **Architect:** ZOE becomes the organism's single afferent and efferent port. Dreamloop manifests give each new reflex its blocked actions and receipts.
- **Founder:** one place to ask, one place that reports, and nothing is spent, signed or posted without your tap.
- **Investor:** a single accountable agent front door, with receipts, is what lets one founder run many products.

---

## Sources

| Source | Method | Status |
|---|---|---|
| Doc `agents/2239-zoe-capability-map` (2026-10-04) | read sections 1-6 | FULL |
| `bot/src/zoe/*` at `e2645d428` | module inventory by a read-only subagent; this lane re-read `lanes-board.ts:1-8`, `send-budget.ts:155, 598-613`, `grill.ts:86`, `orchestrator-tick.ts:7, 23, 450`, `index.ts:1052-1070`, `drafts.ts:1-12` | FULL for re-read lines |
| `bettercallzaal/zorca` `docs/DESIGN-bridge.md` | `gh api` raw read; sections 1, 5, 12, 14 | FULL |
| `~/zaal-dotfiles/bin/zorca-actuator`, `zorca-lane-enqueue` | `sed -n 1-10` | FULL |
| Zaal's ruling | his typed line and two picker answers in this pane, logged at zao-vault `cb0ae055` | FULL |

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Rule on D1-D4 (sent to the grill) | Zaal | Decision | next grill window |
| Close the token rotation (cards 9809, 9371) and the send-cap ruling (doc 2239 decisions 1 and 2) | Zaal + the VPS lane | Fix | before R1 |
| Set `queue.mode` and write `~/.zao/zorca-actuator.json` (bridge section 14) | Zaal | Setup | when D1 is A |
| R1 as the first `rehearsed` dreamloop, receipts for one week | ZAOOS lane, PR only | Build | after D4 |
