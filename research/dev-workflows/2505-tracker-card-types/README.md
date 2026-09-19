---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-09-19
related-docs: dev-workflows/765-coordination-layers-agent-human, dev-workflows/2193-board-hierarchy-intake-control, dev-workflows/763-kanban-async-team-best-practices, dev-workflows/764-zaocowork-next-improvements, dev-workflows/1035-cowork-audit-lss-agile, agents/801-zoe-cowork-systems-audit-consolidation, dev-workflows/983-zao-assistant-todo-workflow
original-query: "can we first /zao-research how we should manage types of cards like these and just reimagine the whole structure and workflow (2026-09-19 grill)"
tier: STANDARD
---

# 2505 - Tracker card types: a closed set of six, not a new hierarchy

> **Goal:** Every card in the ZAO tracker (Supabase project `etwvzrmlxeobinrlytza`, table `public.tasks`, read/written by `~/bin/zao-tracker`) carries the same status set (todo/in_progress/blocked/done) and gets the same grill treatment, whether it is "review this research doc," "sign a DocuSign," "ask Iman," or "decide X." Decide the smallest typed structure that lets the grill and the closers differ by what the card actually needs, without rebuilding the hierarchy work docs 765 and 2193 already did.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Adopt six card types: decision, hand, ask, review, build, record.** Definitions and closers below. | Matches the six named in the 2026-09-19 grill ask directly, and each one maps onto a legacy_source prefix already in live use (measured below) - this is naming what exists, not inventing new work. |
| 2 | **Store the type in `metadata.card_type`, a JSON key, not a new column.** | The `tasks` table already has four columns that look like typing and are not it: `kind` is `"task"` on **2,166 of 2,166** rows (100%, zero variance), `category` is hardcoded to `"Other"` by every `zao-tracker` write (998/2,166, 46%) and its non-"Other" values (`Site / Tech`, `ZAO Devz`, `Ops`, `engineering`, `COC #7` ...) are a **different, pre-existing area/department axis** from a different writer - reusing it collides two questions onto one selector, exactly the failure AGENTS.md rule 10 names ("the same selector cannot answer two questions"). `service_class` (Kanban class-of-service: Standard/FixedDate/Expedite/Intangible) and `phase` (DMAIC) are real columns doc 1035 recommended and doc 2193's Also See calls "now measured as decorative" - both are orthogonal to type (a decision can be Standard or Expedite service class) and both are already close to dead (95.4% Standard, 82.8% no phase, measured below). None of the four existing candidate columns is the right place. `metadata` is jsonb, already populated per writer, already filterable via PostgREST (`metadata->>card_type=eq.decision`), and setting it is a code change to `bin/zao-tracker`, not a schema migration. |
| 3 | **Do NOT add a `type` column via migration in this doc.** | The vault's own convention treats DDL as a one-way door requiring Zaal's hand (cards 9870, 9873, both literally "DDL, your hand" in the 2026-09-19 grill queue) and the last proposed tracker migration (027, from doc 2090) sat unrun for weeks per doc 2193's own account. A metadata key ships without asking for that door; a real column is the target state once Zaal rules on decision 1, not a precondition for starting. |
| 4 | **Do NOT reuse `legacy_source` for type either.** | Doc 765 (2026-05-27) and doc 2193 (2026-08-04) already spent a full decision on `legacy_source`/`source` as the **provenance** taxonomy - who or what wrote the card (`inbox`, `research-doc`, `handoff`, `pr-auto`, `meeting`, `escalated`). Overloading the same field with "what kind of resolution does this need" breaks every existing `--source` filter this skill and `zao-desk-sync` already depend on, and is the identical mistake doc 2193 decision 6 diagnosed in the `source` field ("Doc 765's entire provenance taxonomy is defeated by one mislabeled writer"). Type is a second, independent axis; it needs a second field. |
| 5 | **The grill reads type and branches the action set; it does not ask the same five verbs of every card.** | Measured below: `zao-grill-cards` and `zao-tracker ruling` currently offer the identical decision menu (done/keep/work/park[/skip or /reopen]) to every card regardless of source. A `hand` card ("sign the DocuSign") does not have a "keep" or "park" answer that means anything different from "not yet" - GTD's Waiting For and Next Action lists get materially different review treatment for exactly this reason (Sources: gettingthingsdone.com; r/gtd), and Linear's Triage inbox offers a categorically different action set (accept/duplicate/decline/snooze) than an accepted issue's workflow states (Source: linear.app/docs/triage). |
| 6 | **`build` and `record` types are excluded from Zaal's grill entirely.** | `build` closes when a PR merges or an artifact exists - that is what `zao-tracker ready` already stamps for prep-done work, and Linear's own guidance is that engineering work flows through cycles, not a triage inbox, once accepted. `record` cards (handoffs, park notes, meeting minutes) are log entries, not questions; a park handoff superseded by a newer one of the same slug is definitionally closed. Grilling either wastes a decision-maker's attention on something that was never a question - the same point Kanban's Intangible class and doc 2193 decision 8 both make about not gating every action on human review at this team size (Source: theagentpractice.com). |

---

## The measured state, 2026-09-19

### Total board, by status

Read from `GET /rest/v1/tasks` with `Prefer: count=exact` (Content-Range header), then paginated in three 1,000-row Range requests to pull every row (`0-999`, `1000-1999`, `2000-2165`) - the CLI's own `--limit` argument is capped server-side at 1,000 regardless of the value passed, confirmed by requesting `--limit 5000` and getting exactly 1,000 rows back.

| Status | Count | Share |
|---|---|---|
| done | 1,604 | 74.0% |
| todo | 372 | 17.2% |
| in_progress | 183 | 8.4% |
| blocked | 7 | 0.3% |
| **Total** | **2,166** | |

### By `legacy_source` prefix (top 12 of 105 distinct prefixes, all 2,166 rows)

| Prefix | Total | todo | in_progress | blocked | done |
|---|---|---|---|---|---|
| cowork-actions.json | 594 | 5 | 1 | 1 | 587 |
| inbox | 336 | 78 | 72 | 1 | 185 |
| meeting | 189 | 58 | 33 | 1 | 97 |
| research-doc | 184 | 30 | 5 | 0 | 149 |
| handoff | 144 | 46 | 24 | 0 | 74 |
| (none) | 105 | 14 | 15 | 1 | 75 |
| escalated | 94 | 80 | 0 | 0 | 14 |
| pr-auto | 62 | 0 | 0 | 0 | 62 |
| wwtracker-build-loop | 36 | 0 | 0 | 0 | 36 |
| zaal-old-list | 30 | 1 | 0 | 1 | 28 |
| zaal-master | 27 | 4 | 0 | 0 | 23 |
| `inbox:iman-desk-*` (sub-slug of inbox) | 20 | 9 | 3 | 0 | 8 |

`inbox` alone spans two very different card shapes: 38 of the 2026-09-19 grill-queue cards use the sub-slug `inbox:grill-*` (Zaal-facing questions), and 20 use `inbox:iman-desk-*` (rows relayed from Iman's desk by `zao-desk-sync`). `legacy_source` names the writer, not the kind of card - the exact gap decision 4 is about.

### The four columns that look like "type" and are not

| Column | Distinct values, n=2,166 | What it actually measures |
|---|---|---|
| `kind` | `task`: 2,166 (100%) | Nothing - dead column for this purpose, hardcoded by `bin/zao-tracker` |
| `category` | `Other` 998 (46%), `(none)` 399 (18%), `Site / Tech` 209, `ZAO Devz` 142, `Ops` 74, `Social` 70, `engineering` 56, `deep` 37, `Content` 32, `COC #7` 26, plus 60+ more single-digit values | A department/area tag from a **different, earlier writer**, not from `zao-tracker`. `zao-tracker` itself hardcodes `"Other"` for every card it creates (`case "$kind" in pr) ... category="Other"`, repeated for every kind in `bin/zao-tracker`). |
| `service_class` | Standard 2,066 (95.4%), FixedDate 66 (3.0%), Expedite 33 (1.5%), Intangible 1 | Kanban class-of-service, exactly as doc 763/1035 specified - but doc 2193's own Also See calls this "now measured as decorative," and the 95.4% Standard share here confirms it is barely touched. |
| `phase` | `(none)` 1,794 (82.8%), Define 367 (17.0%), Improve 2, Control 2, Measure 1 | DMAIC phase (Doc 1035's Six Sigma instrumentation) - almost entirely unset. |
| `important` / `urgent` | `important=True` 112 (5.2%), `urgent=True` 61 (2.8%) | Eisenhower-style flags, present in schema, rarely set. |

None of these five is card TYPE. Repurposing any of them either collides with a live, different meaning (`category`, `legacy_source`) or would be reviving a near-dead field for a job it was never built for (`service_class`, `phase`).

### The 2026-09-19 grill queue (cards 9842-9879, per `~/zao-vault/handoffs/grill-queue-2026-09-19.md`)

Fetched directly by an explicit `legacy_id=in.(9842,...,9879)` list, not a `gte`/`lte` range - **`legacy_id` is stored as text, so a range filter is lexical, not numeric**, and a first attempt at `legacy_id=gte.9720&legacy_id=lte.9736` for the park-record check below also matched card `973` ("ZOE TG: /pulse + /agenda + /list bot commands", `legacy_source=tg-interaction`), because the string `"973"` sorts between `"9720"` and `"9736"`. Confirmed by reading the row: unrelated to the park records. The `in.(...)` list avoids this.

Of the 38 grill cards: 32 `todo`, 6 `in_progress`. All 38 carry `legacy_source` in the form `inbox:grill-<slug>`. Every one of them is what this doc calls a **decision** card: a question only Zaal can answer, with no build work attached (build work, when it exists, is a separate linked card - e.g. 9868/9869 are decisions about what to do with existing zol PRs, not the PRs themselves).

Card **9872**, in this same batch, asks: *"Tracker: should archived rows (`archived_at` set) be moved off status `todo`, as a bulk write you approve?"* - i.e., a card in the live grill queue is already asking the exact class of question this doc's Next Actions table proposes for cards 9720-9736 below. That is independent, same-day confirmation that "close stale record-type cards as a bulk write Zaal approves" is a pattern already in front of him, not a new one this doc invents.

### The park records, 9720-9736 (17 real cards)

| legacy_id | status | legacy_source | title (truncated) |
|---|---|---|---|
| 9720 | todo | handoff:zj-parked-maintenance | zj lane PARKED for maintenance mode |
| 9721 | done | handoff:creatorstudio-parked-guards-live | creatorstudio PARKED on Zaal's maintenance-mode order |
| 9722 | in_progress | handoff:zol-parked-measured | zol lane PARKED for zaostock |
| 9723 | todo | handoff:poidhz-parked | PARKED on Zaal's word |
| 9724 | todo | handoff:zabalgamez-parked-maintenance | zabalgamez PARKED for maintenance mode |
| 9725 | todo | handoff:session-2026-09-09-form-at-his-hands | ZAOstock: form is at Zaal's three taps |
| 9726 | todo | handoff:nyczao-parked-claims-guard | PARKED for maintenance mode |
| 9727 | done | handoff:zaowebsite-parked | zaowebsite PARKED on Zaal's order |
| 9728 | todo | handoff:budget-review-artizen-float | finances closed for now |
| 9729 | done | handoff:zaowebsite-parked | zaowebsite PARKED (duplicate slug of 9727) |
| 9730 | todo | handoff:orc2-restart-orca | orc2 watch seat closing |
| 9731 | todo | handoff:zj-lane-context-bundle-bug | zao-lane-context.sh bug |
| 9732 | todo | handoff:zabalgamez-parked-maintenance | zabalgamez PARKED again (duplicate slug of 9724) |
| 9733 | done | handoff:zaowebsite-parked | zaowebsite PARKED, bundle final (3rd of same slug) |
| 9734 | todo | handoff:zaostock-close-out | form is live, proven by a real artist |
| 9735 | todo | handoff:artizen-parked-2026-09-09 | artizen PARKED |
| 9736 | todo | handoff:zaowebsite-parked | zaowebsite PARKED + EXITING (4th of same slug) |

12 of 17 are `todo`, despite being handoff notes - a card type the tracker's own status model was never built to represent as "open work." Three separate slugs (`zaowebsite-parked`, `zabalgamez-parked-maintenance`) each recur 2-4 times as the lane parked and resumed; the newest of each slug supersedes the older ones (9736 explicitly says "0 open" where 9724/9732's "zabalgamez PARKED again" implies a prior resume happened between them). None of this is visible from status alone.

---

## The six types

| Type | What it means | Who closes it | What the grill does |
|---|---|---|---|
| **decision** | Only Zaal can answer this; nothing else is blocking. Today's `inbox:grill-*` cards, and most of what `zao-tracker ruling` already serves. | Zaal, via a ruling (`zao-tracker ruling <id> <done\|keep\|work\|park\|reopen>`). | Shows the question, a recommended option, and takes the ruling verbs as today. |
| **hand** | The only remaining step is a physical action only Zaal can take - sign, click, pay, tap, install. Not a judgment call. | Zaal, by doing the thing. | Binary: done / not yet. Never offers "keep" or "park" - those verbs have no meaning for "did you sign the form." Aligns with the existing `zao-tracker ready` stamp: a `hand` card is definitionally "ready for you." |
| **ask** | Waiting on someone else - Candy, Iman, a vendor, a reply to an email. GTD's Waiting For. | The other party's reply arrives and a lane or agent captures it and flips status; Zaal is not the closer. | Not grilled as a decision. Surfaced only past a follow-up cadence, offering "nag again" - matching how r/gtd's own practitioners manage Waiting For lists (tag the person who owes you, review on a cadence, don't re-decide it each time). |
| **review** | Someone needs to read something and either approve it or flag follow-ups - a research doc, a PR test plan, a desk row. | The reviewer (usually Zaal, sometimes Iman for `pr-auto`). | Binary: read / not yet. On "read," optionally prompts for follow-up cards, not a keep/park menu. |
| **build** | Work an agent or lane should just do; the only open question is when it is done, not what to do. | Whoever owns the lane, by shipping the PR or artifact. | Excluded from Zaal's grill. Surfaces via `zao-tracker ready` once prep is done - matching the tool's own stated reason for existing ("a 'prep' card means an agent preps and Zaal acts"). |
| **record** | A log entry, not a question - a handoff, a park note, a meeting recap. Nothing to decide. | Superseded automatically by the next record of the same slug, or closed in a batch Zaal approves (see card 9872's own version of this question). | Excluded from Zaal's grill entirely. |

---

## Migration: mapping existing sources to types

| Source | -> Type | Basis |
|---|---|---|
| `research-doc:*` (184 cards) | review | "Review the doc; add any flagged follow-ups" is the CLI's own per-kind note text for this kind, already. |
| `pr-auto:*` (62 cards) | review | CLI's own note: "Mark items off; if all pass, approve + merge." |
| `inbox:grill-*` (38 of the 9842-9879 batch) | decision | Confirmed above: every one is a Zaal-only question with no attached build work. |
| `inbox:iman-desk-*` (20 cards) | mixed - needs a per-row rule in `zao-desk-sync`, not a blanket type | Some rows are Zaal-must-act ("point ZOE at this desk" -> hand), some are Zaal-must-decide ("OK to push the leaderboard fix?" -> decision), some are waiting on Iman ("Steve Peer silent" -> ask). One prefix, three real types; `zao-desk-sync`'s row parser is the right place to classify, since it already reads the row text. |
| `handoff:*-parked*` and other pure status snapshots (park records above) | record | Confirmed above: log entries, not questions. |
| `handoff:*` carrying an explicit action (e.g. "TOP TASK: merge ZAOOS #3462 BEFORE...") | mixed - flag for manual retyping, do not auto-classify | The action inside a handoff note is often really a decision or a hand card wearing a handoff's `legacy_source`; auto-typing by regex on "TOP TASK" would guess, which doc 2193 decision 3 already found unsafe for exactly this kind of unstructured text. |
| `meeting:*` (189 cards) | leave untyped for now | Same reasoning: meeting action items are free text with no reliable auto-classifier; type them as they're touched, not in bulk. |
| `escalated:*` (94 cards, 80 still `todo`) | leave untyped - fix definition first | Doc 2193 decision 3 already measured these as **93 of 93 with zero notes and zero owner** on 2026-08-04. As of today the count is unchanged at 94 total (no new escalations since 08-04) with 80 still `todo` - the queue is frozen, not growing, and 14 more closed since 08-04's 1. Assigning a type to an undefined card produces a confidently-wrong type; 2193's order (taxonomy -> provenance -> definition -> dedup -> structure -> automation) already puts fixing `source` and adding notes/owners ahead of anything downstream, and type is downstream of definition. |

### What happens to 9720-9736

Retype all 17 as `record`. Then, as a single bulk write Zaal approves (the same shape as card 9872's own ask): close the 12 that are `todo` and the 1 `in_progress` as `done` where a newer record of the same slug already supersedes them (9727/9729/9733/9736 for `zaowebsite-parked`; 9724/9732 for `zabalgamez-parked-maintenance`), and leave the rest open only if no newer record exists for that slug. This does not delete anything - "never delete" stays intact; a `record` card closed as superseded is still on the board, just no longer misreported as open work.

---

## What NOT to build

- **No new hierarchy level.** Doc 2193 already measured `parent_task_id` at 0 of 938 tasks used and killed sub-subtasks outright; card TYPE is a flat tag on the existing row, not a new tree to navigate.
- **No large taxonomy.** Six types, closed set. Linear and Jira practitioner guidance converges on the same warning from the other direction - "creating too many workflow states... more statuses do not create better visibility" (Source: startupik.com) - and this doc's own measurement shows `category` already sprawled into 70+ near-unused values once nobody capped it.
- **No reuse of `category`, `legacy_source`, `service_class`, or `phase` for type.** Each already means something else, confirmed by measurement above; conflating them repeats the exact selector mistake AGENTS.md rule 10 documents from five other tools in this same estate.
- **No full agent approval-queue architecture** (HMAC-signed payloads, durable workflow engines, confidence-threshold routing). That pattern exists and is well-documented for teams shipping many unattended agent actions at scale (Source: theagentpractice.com, agentpatternscatalog.org) - it is the right answer to "which of many autonomous actions needs a human," not to "what kind of card is this." ZAO's own board is 2,166 rows total with 372 open `todo`s; the fault-line principle those sources state - gate the few actions that matter, don't gate everything - already describes decision 6 above (`build`/`record` skip the grill) without needing the machinery.
- **No blind auto-classification of `meeting:*` or `escalated:*` by regex.** Free-text action items do not reliably signal type; doc 2193 already found that guessing at undefined escalated cards produces plausible-looking wrong answers, not real classification.
- **No DDL in this PR.** A real `type` column is the eventual target once decision 1 is ruled; this doc proposes the metadata-key interim specifically so nothing here requires touching the Supabase schema.

---

## Also See

- [Doc 765](../765-coordination-layers-agent-human/) - decided the Project layer and the `source` provenance taxonomy (2026-05-27). Type is a second, independent axis on top of that taxonomy, not a replacement for it.
- [Doc 2193](../2193-board-hierarchy-intake-control/) - hierarchy depth (cap at 3 levels, kill sub-subtasks) and the escalator triage order (taxonomy -> provenance -> definition -> dedup -> structure -> automation). This doc's escalated-card recommendation follows that order directly.
- [Doc 763](../763-kanban-async-team-best-practices/) - the WIP-limit and continuous-flow source for `service_class`, referenced above to explain why it is the wrong field for type.
- [Doc 764](../764-zaocowork-next-improvements/) - post-763 improvements, same tracker.
- [dev-workflows/1035-cowork-audit-lss-agile](../1035-cowork-audit-lss-agile/) - the DMAIC/service-class instrumentation this doc confirms is now measured as decorative. (Doc number 1035 is ambiguous across topics; cite by path.)
- [agents/801-zoe-cowork-systems-audit-consolidation](../../agents/801-zoe-cowork-systems-audit-consolidation/) - the systems audit this doc's `zao-grill-cards`/`zao-desk-sync` measurements extend. (Doc number 801 is also ambiguous; cite by path.)
- [Doc 983](../983-zao-assistant-todo-workflow/) - the auto-tagging and delegation-lane backlog this doc's type proposal feeds.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Rule on the six-type set (decision/hand/ask/review/build/record) and the `metadata.card_type` storage decision - GRILL ruling on this doc's own tracker card | Zaal | Decision | 2026-09-22 |
| Retype cards 9720-9736 as `record` and rule on closing the superseded ones as a bulk write (same shape as card 9872) | Zaal | Decision | 2026-09-22 |
| Implement `metadata.card_type` writes in `bin/zao-tracker` for the `research`, `pr`, and `inbox --grill` creation paths, once decision 1 is ruled | Zaal | Build (PR to zaal-dotfiles) | 2026-09-26 |
| Add a per-row type rule to `zao-desk-sync`'s Iman-desk row parser (decision/hand/ask, per row content) | Zaal | Build (PR to zaal-dotfiles) | 2026-09-30 |
| Update `zao-grill-cards` to branch its action set by `metadata.card_type`, excluding `build` and `record` from the grill | Zaal | Build (PR to zaal-dotfiles) | 2026-10-03 |

## Sources

- [Some Key GTD definitions - Next Action, Waiting For, Someday/Maybe](https://gettingthingsdone.com/2010/10/some-key-gtd-definitions/) - [FULL] official GTD glossary, read verbatim via search extraction, 2026-09-19.
- [r/gtd - Best practices for Waiting for list](https://www.reddit.com/r/gtd/comments/1h253se/best_practices_for_waiting_for_list/) - [FULL] community thread, verbatim comment text on tagging by person and reviewing on a cadence rather than re-deciding, read 2026-09-19.
- [Linear Docs - Triage: manage unplanned work](https://linear.app/docs/triage-manage-unplanned-work) - [FULL] official docs, read verbatim, 2026-09-19.
- [Linear Docs - Triage](https://linear.app/docs/triage) - [FULL] official docs on the accept/duplicate/decline/snooze action set, distinct from an accepted issue's workflow states, read verbatim, 2026-09-19.
- [Kanban Classes of Service: Expedite, Fixed Date, Standard & Intangible - Solutioneers](https://www.solutioneers.co.uk/kanban-classes-of-service/) - [FULL] read verbatim, 2026-09-19.
- [ADR vs Decision Register - WhyChose](https://whychose.com/seo/adr-decision-register) - [FULL] read verbatim; used for the decision/record distinction (a decision needs a rationale record, a record does not), 2026-09-19.
- [Building a human-in-the-loop approval queue for an AI agent - The Agent Practice](https://theagentpractice.com/blog/ai-agent-approval-queue-pattern) - [FULL] read verbatim; source of the "gate the fault line, not everywhere" principle cited in What NOT to Build, 2026-09-19.
- [Approval Queue - Agent Patterns Catalog](https://www.agentpatternscatalog.org/patterns/approval-queue/) - [FULL] read verbatim, 2026-09-19.
- [How Teams Use Linear for Product Management - Startupik](https://startupik.com/how-teams-use-linear-for-product-management/) - [FULL] read verbatim; source of "more statuses do not create better visibility," 2026-09-19.
- `~/bin/zao-tracker` (this Mac) - CLI source read directly for `cmd_ruling`, `cmd_create`, and the category/kind hardcoding, 2026-09-19.
- `~/bin/zao-grill-cards` (this Mac) - CLI source read directly for the uniform verdict vocabulary, 2026-09-19.
- `~/bin/zao-desk-sync` (this Mac) - CLI source read directly for the Iman-desk row parser, 2026-09-19.
- `~/zao-vault/handoffs/grill-queue-2026-09-19.md` - read directly for the 9842-9879 batch and card 9872's own tracker-design question, 2026-09-19.
- Supabase REST API (`etwvzrmlxeobinrlytza`, table `public.tasks`, via `~/.zao/zao.env` credentials) - [FULL] read-only queries only, no writes made; all counts in this doc measured directly against live data, 2026-09-19.
