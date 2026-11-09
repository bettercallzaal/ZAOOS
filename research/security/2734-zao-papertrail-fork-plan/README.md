---
topic: security
type: plan
status: plan-awaiting-zaal
last-validated: 2026-11-09
related-docs: "security/2730-papertrailos-lead-crm-audit"
original-query: "i sent it to him we should revie wit and make a zao version of it and make a repo and make a vercel and test it out (Zaal, 2026-11-03)"
tier: QUICK
---

# 2734 - zao-papertrail: plan for a ZAO version of papertrailOS (no code yet)

> **Goal:** Write down, before any code moves, how a ZAO version of Papi Oshu's
> papertrailOS (lead research, grading, outreach CRM; audited in doc 2730) would be
> forked, licensed, fixed, previewed on Vercel with sending switched off, and tested by
> Zaal. This note is the deliverable. The fork starts only after Zaal says go on it.

## Status as of 2026-11-09 - the fork is BLOCKED on the licence

Measured with `gh` on 2026-11-09 23:10 UTC (`date -u` in the same command):

- `gh api "repos/papioshu/papertrailOS/contents/LICENSE?ref=master"`: 404. `LICENSE.md`,
  `LICENSE.txt` and `license` also 404 (measured 2026-11-07).
- Recursive tree on `master` (185 paths): 0 paths match `licen|copying|notice`. Control:
  `README.md` matched 1, so the filter works (measured 2026-11-07).
- `README.md:741-743` still reads "## License / Private project unless otherwise specified."
- Branches: `master` at `1c0d837a428b0273f9238c895b571b25fc58d06e` (2026-06-29) and
  `add-mit-license` at `bb81c73cf9932c38837d8166f6da3ad06f9682b6`.
- PR 1 (Zaal's MIT licence PR): closed by papioshu at 2026-11-07T21:51:36Z with the comment
  "Added ", `mergedAt` null, `mergeCommit` null.

So nothing may be copied yet. No licence means all rights reserved
(`.claude/rules/credit-attribution.md`). A message for Zaal to send Papi asking where the
licence landed is on his clipboard (vault `inbox/clips/clip-20261109-181000-papi-licence-where.md`).

## Key Decisions (proposed defaults, Zaal confirms)

| # | Decision | Default | Why |
|---|---|---|---|
| 0 | Is this a lane at all now? | **Zaal decides.** It is a new project, and the lock-in rule (cash goal first, no new projects) puts it in the backlog unless he says it outranks that. | Lock-in rule, 2026-10-29 |
| 1 | Fork source | papioshu/papertrailOS **at the commit that adds the licence on master**, recorded by SHA in the fork's first commit message and README. Not `1c0d837` (no licence there). | Copying is only allowed from a licensed commit |
| 2 | Repo | `bettercallzaal/zao-papertrail`, **private**. Created by Zaal's hand, not a lane. | A new repo is Zaal-gated (misc-open-items 33) |
| 3 | Licence and credit | Keep Papi's LICENSE file unchanged at the root. README top line: "Forked from papioshu/papertrailOS by Papi Oshu at `<sha>`, under `<licence>`." If the licence is share-alike (AGPL/GPL), the fork stays under it. | `credit-attribution.md` |
| 4 | First PR in the fork | Fix F1 and F3 from doc 2730, plus a hard send kill switch. Nothing else. | F1 is CRITICAL; F3 sends to opted-out leads |
| 5 | Deploy | One Vercel **preview** on its own project, sends off, no ZAO mailbox connected. Created by Zaal's hand. | Vercel project is Zaal-gated |
| 6 | Upstream | Offer the F1 and F3 fixes back to Papi as a PR on his repo, sent by Zaal. | His repo; any word to him is Zaal's tap |

## First PR: what it fixes (in the fork, after go)

1. **F1, CRITICAL.** Delete the fixed dev login in `src/auth.ts:20-31` (it upserts a user
   with `isSuperAdmin: true` before the zod parse). No env flag to bring it back: a preview
   admin is created by a one-off seed run with a password Zaal sets, never in source.
2. **F3, MEDIUM.** In `dispatchDraft` (`src/lib/outreach/sendRunner.ts:32-68`), read the
   lead's status and refuse when it is in the stop list. Reuse `STOP_STATUSES` from
   `src/lib/outreach/followupRunner.ts:6-9` rather than a second list. The trail's Send
   stage (`src/lib/automation/leadTrail.ts:92-95`) goes through the same path, so one check
   covers both. A test proves a Do Not Contact lead with an approved draft is refused.
3. **Send kill switch.** A server-only `SENDS_ENABLED` that must equal the literal `true`
   for `dispatchDraft` to call Gmail; anything else (unset, empty, typo) refuses, logged.
   Fail closed: a missing value is a disabled send, never an open one
   (`silent-failure-guard.md` rule 8). A test proves unset means no send.

F2 (member can auto-approve) and F4 (plaintext Gmail tokens) are the second PR, before any
mailbox is connected. F5 to F12 are LOW and listed in doc 2730 for a later pass.

## What the Vercel preview needs

From papertrailOS `.env.example` and `package.json` on master at `1c0d837` (read with
`gh api`, 2026-11-09). Build is `prisma generate && next build`, Next 15, Prisma 6 on
Postgres, NextAuth 5 beta.

| Variable | Preview value | Who sets it |
|---|---|---|
| `DATABASE_URL`, `DIRECT_URL` | a **new, empty** Supabase project just for this (pooled 6543 and direct 5432). Never a ZAO production database | Zaal |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32`, typed by Zaal | Zaal |
| `NEXTAUTH_URL`, `APP_URL` | the preview URL | Zaal |
| `ENCRYPTION_KEY` | generated, even though unused today (F4) | Zaal |
| `ANTHROPIC_API_KEY` | optional. Without it drafts fall back to templates (`draftEngine.ts:77-82`); with it, spend is real money | Zaal, only if he wants AI drafts |
| `GOOGLE_PLACES_API_KEY`, `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_CX` | optional, paid per call. Leave unset for the first test; enter leads by hand or CSV | Zaal, later |
| `AUTOMATION_TOKEN` | **unset**. The route returns 503 when unset (doc 2730 F6) | nobody |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GMAIL_REDIRECT_URI` | **unset**. No Gmail connection, so no mailbox | nobody |
| `SENDS_ENABLED` (new, first PR) | **unset** | nobody |

Every secret is entered by Zaal (Vercel dashboard or `/secret`), never through a lane or a
chat. The DB schema push (`prisma db push` against the new project) is his step too: it is
a schema change.

## Test card for Zaal (after the fork, first PR and preview exist)

- **Link:** the Vercel preview URL (does not exist yet).
- **Steps:**
  1. Open the preview and sign in with the admin you seeded. Then try the old dev login
     pair from papertrailOS `src/auth.ts`: it must fail.
  2. Make a profile, add two leads by hand, mark one "Do Not Contact", draft and approve an
     email for both.
  3. Press send on both.
- **Expected:** login with the old pair is refused; both sends are refused with "sends
  disabled"; with sends on (later, a test mailbox only), the Do Not Contact lead is still
  refused.
- **One question:** is this useful enough for ZAO outreach to keep going, or is the doc 2730
  "learn the patterns, don't run it" call still right?

## What the lane does and does not do

- Does, after go: clone the fork Zaal created, write the first PR in it, run its typecheck
  and the new tests, open the PR ready for review.
- Does not: create the repo or the Vercel project, set any secret, connect any mailbox, push
  to or comment on papioshu's repo, contact Papi, copy any code before a licence is on
  master.

## Next Actions

| # | Action | Owner | By |
|---|---|---|---|
| 1 | Send Papi the clipboard message (where did the licence land, or reopen PR 1) | Zaal | when he chooses |
| 2 | Decide: lane now, or backlog under the lock-in rule (decision 0) | Zaal | with item 1 |
| 3 | When a LICENSE is on master: fill doc 2730's licence lines (drafts in ZAOOS PR 4227 comment 6601962715) as a follow-up doc PR | papertrail lane | after licence |
| 4 | On go: Zaal creates `bettercallzaal/zao-papertrail` (private) and the Supabase + Vercel projects; lane writes the first PR | Zaal, then lane | after 2 and 3 |

## Sources

| Source | Method | Status |
|---|---|---|
| papioshu/papertrailOS licence state | `gh api` contents, git trees, branches, commits, PR 1 timeline, 2026-11-07 and 2026-11-09 | [FULL] |
| papertrailOS `.env.example`, `package.json`, `prisma/schema.prisma` lines 1-20 at master | `gh api .../contents?ref=master`, base64-decoded, read only; nothing copied into ZAO code | [FULL] |
| doc 2730 findings F1, F3, F6 and file:line cites | `git show origin/main:research/security/2730-papertrailos-lead-crm-audit/README.md` | [FULL] for what doc 2730 says; the cited lines were not re-read at head this run |
