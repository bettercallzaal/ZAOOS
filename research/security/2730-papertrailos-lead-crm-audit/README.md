---
topic: security
type: audit
status: research-complete
last-validated: 2026-11-02
related-docs: "events/2326-zaostock-sponsor-leads-tiers, infrastructure/413-zaostock-dashboard-notion-replacement, agents/1235-cowork-lead-reengagement-skill, agents/973-hyperagent-hosted-offload-decision"
original-query: "https://github.com/papioshu/papertrailOS go /zao-research this then open a lane and lets audit the repo"
tier: STANDARD
---

# 2730 - papertrailOS audit: a member's lead CRM, read-only

> **Goal:** Read-only security and product audit of `github.com/papioshu/papertrailOS`, the
> lead research, grading, outreach and CRM app that Papi Oshu (a ZAO member, GitHub
> `papioshu`) offered to share. Answer three things: is it safe, how much of what the README
> promises is built, and does it fit any ZAO need. It is also a note Zaal can pass to Papi
> Oshu. Nothing was run, installed, pushed or filed on his repo.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Do not run, host or copy this code for ZAO.** | No LICENSE file, so all rights are reserved (seat `gh api`, 2026-11-02). ZAO may learn from the patterns only (`.claude/rules/credit-attribution.md`). |
| 2 | **ZAOstock does not need it.** | ZAOstock 2026 was on 3 Oct 2026. Its sponsor CRM already exists (the `sponsors` table, per `events/2326-zaostock-sponsor-leads-tiers`; the `stock_sponsors` design in `infrastructure/413-zaostock-dashboard-notion-replacement`). That need was relationship tiers worked by teammates, not scraping plus cold email. |
| 3 | **Only a hosted instance run by Papi Oshu could ever serve ZAO, and not before finding F1 is fixed.** | F1 is a fixed login in public source that gives super-admin on any deployment. Cold outbound from a ZAO mailbox is also outbound and public, so it is Zaal's call. |
| 4 | **Pass three findings to Papi Oshu, kindly, through Zaal:** F1, F3, F2. | They are the ones a deployment would hit first. The rest are low and are listed for his own pass. |
| 5 | **Learn two patterns, write no code:** a pure, tested send guard (`sendGuard.ts`), and "editing a draft cancels its approval" (`p/[slug]/actions.ts:113-125`). | Both are good design and both are small. Re-derive them if ZAO ever needs them; do not copy them. |

## What was read

- The repo was cloned to a scratch directory on 2026-11-02 at `1c0d837` (17 commits, full
  history, `git rev-parse --is-shallow-repository` = false). Every commit is by one author.
  Commit dates run from 2026-06-25 to 2026-06-28 (-05:00). The seat's "last push 2026-07-09"
  is the API's push time; no commit in the history is newer than 2026-06-28.
- Every server entry point was read: `src/app/actions.ts`, `src/app/landing-actions.ts`,
  `src/app/p/[slug]/actions.ts`, `src/app/p/[slug]/export/route.ts`, all four `src/app/api/**`
  routes, `src/middleware.ts`, `src/auth.ts`, `src/auth.config.ts`, and the guard chain
  (`src/lib/guard.ts`, `access.ts`, `rbac.ts`).
- The whole send path was read: `sendGuard.ts`, `sendRunner.ts`, `followupRunner.ts`,
  `complianceChecker.ts`, `replySync.ts`, `automation/leadTrail.ts`, `gmail/gmail.ts`,
  `gmail/message.ts`. Also `csv.ts`, `leads.ts`, `audit/runAudit.ts`, `audit/auditEngine.ts`
  (fetch section), `outreach/draftEngine.ts`, and parts of `prisma/schema.prisma` and `README.md`.
- **Not read (BLOCKED):** this session's permission layer denied a grep of
  `src/lib/providers/modelProvider.ts`, a grep of `prisma/seed.ts`, and a history grep for
  committed `.env` paths. All three are marked UNVERIFIED below. The denials were not
  routed around.

## Findings

Severity is graded to the lowest level the code supports. "Deployment" means anyone running
this code as written.

| # | Severity | Finding | Evidence |
|---|---|---|---|
| F1 | **CRITICAL** | **A fixed username and password in source logs in as super-admin.** The check runs before the zod parse, upserts a real user with `isSuperAdmin: true`, and super-admin passes every permission on every profile. The comment says to gate it before public exposure, but the repo is public, so anyone can read the pair. | `src/auth.ts:20-31` ("dev backdoor ... Gate behind an env flag (or delete) before this is exposed publicly"); zod at `:32`; `src/lib/rbac.ts:57,71` |
| F2 | MEDIUM | **A `profile_member` can approve and send even though members lack `approve_send`.** `runLeadTrailAction` only needs `run_leadgen`, which members have, and it passes the form's `autoApprove` through. The trail then approves every compliant email draft in the profile as `"automation"`. If the profile is in `controlled_send` mode, the next stage sends them. `dispatchDraftAction` also only needs `create_drafts`. The checkbox is shown to every role. | `src/app/p/[slug]/actions.ts:156-180`, `:148-151`; `src/lib/rbac.ts:39-46`; `src/lib/automation/leadTrail.ts:79-103`; `src/components/automation/RunLeadTrail.tsx:54` |
| F3 | MEDIUM | **Opt-out and Do Not Contact are not checked on a first send.** Suppression is hardcoded to `false`. `dispatchDraft` never reads `lead.status`. The trail's Send stage picks every approved email draft without a status filter. The stop list exists only in the follow-up runner. So a lead marked "Do Not Contact" or "Opted Out" whose draft was approved still gets the first email. The README promises "suppression list is checked" and "lead is not marked do-not-contact". | `src/lib/outreach/sendRunner.ts:64` ("suppression list lands in Phase 6"); `:32-68`; `src/lib/automation/leadTrail.ts:92-95`; `src/lib/outreach/followupRunner.ts:6-9`; `README.md:215-216` |
| F4 | MEDIUM | **Gmail OAuth tokens are stored in plaintext. `ENCRYPTION_KEY` is declared but never used.** The refresh and access tokens go straight into `GmailConnection`. The scopes include send and read-only mailbox access, so a database read becomes mailbox read plus send. | `prisma/schema.prisma:201-202`; `src/app/api/auth/gmail/callback/route.ts:19-34`; `src/lib/gmail/gmail.ts:9-14,117-120`; a grep of `src/`, `prisma/` and `next.config.ts` for `ENCRYPTION_KEY` found 0 lines (control: `GOOGLE_PLACES_API_KEY` found 3 in `leadCollector.ts`) |
| F5 | LOW | **The OAuth `state` is only the profile slug, with no nonce.** A signed-in profile admin who opens a crafted callback link would bind someone else's Gmail account to their profile. Later sends would then go out through, and be copied in, the other person's mailbox. This needs the admin to click the link. | `src/lib/gmail/gmail.ts:39-51`; `src/app/api/auth/gmail/callback/route.ts:10-14` |
| F6 | LOW | **The automation endpoint compares the bearer token with `!==`, which is not constant-time.** The body is not validated with zod. The one shared token reaches every profile and can set `autoApprove`. It fails closed (503) when unset, and the token is not logged. The middleware skips `api/automation` on purpose. | `src/app/api/automation/run-lead-trail/route.ts:11-17`, `:19-35`, `:41-47`; `src/middleware.ts:9` |
| F7 | LOW | **Website audits fetch any URL a user enters, server-side, follow redirects and block no private ranges.** Lead websites come from manual entry and CSV import. The page body is not returned, but findings derived from it are stored. | `src/lib/audit/auditEngine.ts:173-182`; `src/lib/audit/runAudit.ts:35-36` |
| F8 | LOW | **The CSV export does not neutralise formula cells.** A cell starting with `=`, `+`, `-` or `@` (for example a scraped business name) is written as-is. | `src/lib/csv.ts:60-63`; `src/app/p/[slug]/export/route.ts:5-21` |
| F9 | LOW | **Mail headers are built by string concatenation.** `To` and `Subject` are not stripped of line breaks, the CSV parser keeps newlines inside quoted fields, and imported emails are not validated. The input comes from the profile's own users, so this is LOW. | `src/lib/gmail/message.ts:11-19`; `src/lib/csv.ts:15-25`; `src/lib/leads.ts:49-56` |
| F10 | LOW | **`campaignId` comes from the client and is not checked against the profile when a lead is written.** Reads stay scoped by `profileId`, so no other profile's data leaks. This is an integrity issue only. | `src/app/p/[slug]/actions.ts:41,57,62,73`; `src/lib/leads.ts:69-74` |
| F11 | LOW | **The daily cap counts and then sends with no lock**, and "today" uses the server's local timezone. Two runs at once can go past the cap. | `src/lib/outreach/sendRunner.ts:9-19,65` |
| F12 | LOW | **Follow-ups die silently under auto-approve.** Only the `email` channel is auto-approved, so the `followup1` and `followup2` drafts stay unapproved. When they come due, the guard blocks them and the runner marks them `skipped` for good. A Gmail draft (`drafted`) is also counted as `sent`. | `src/lib/automation/leadTrail.ts:82`; `src/lib/outreach/followupRunner.ts:42-51` |

### What is done well (verified)

- Every server action and route calls `requireProfile` before touching data, and queries use
  the server-resolved `profile.id`, never a client id: `p/[slug]/actions.ts:25,42,63,79,86,98-100,132-134,150,161,186,197,204-206,214-218`;
  `export/route.ts:18`; `google/connect/route.ts:11`; `gmail/callback/route.ts:14`.
- **Can a `profile_member` read another profile's leads? No.** Access is checked against
  memberships for the slug (`src/lib/access.ts:25-31,38-41`), and list reads filter by
  `profileId` (`src/lib/leads.ts:69-74`). The only exception is F1.
- A database error fails closed (no access), not open: `src/lib/access.ts:32-34`.
- Compliance must pass before approval (`p/[slug]/actions.ts:137`). Editing a draft clears its
  approval (`:113-125`). Sends are idempotent (`sendRunner.ts:45-48`). The default mode is
  `draft_only` (`prisma/schema.prisma:95`, `sendRunner.ts:54`).
- The Google keys stay on the server. They are read only in `src/lib/leads/leadCollector.ts`
  (`:34` header, `:69` query), which is imported only by `src/lib/automation/leadTrail.ts`,
  marked `"server-only"` at `:1`. A grep of `src/`, `prisma/` and `next.config.ts` for
  `NEXT_PUBLIC` found 0 lines.
- **Secrets in git history: none found for two patterns.** Across all 17 commits, added lines
  matching `sk-` plus 20 or more key characters: 0. Lines matching a Google `AIza` key: 0.
  (Control: `AUTOMATION_TOKEN` matched 4 lines, so the history pipe works.) `.gitignore:5`
  lists `.env`. **Whether a `.env` was ever committed is UNVERIFIED: that check was denied.**

### The `.check.ts` files

There are 10 `*.check.ts` files. They are standalone `node:assert` scripts, run by hand
(`src/lib/gmail/send.check.ts:2`: "`npx tsx src/lib/gmail/send.check.ts`"). `package.json` has
no script that runs them, and the tree has no `.github/` directory. So they are real checks,
but nothing runs them automatically. Not run here (the brief forbids running the repo's code).

## Product read: README flow against the code

The README flow is `Collect -> Enrich -> Audit -> Grade -> Draft -> Approve -> Send -> Follow Up -> Archive` (`README.md:35`).
"Unwired" below comes from a grep of `src/` for each module's name, leaving out the module
itself and its `.check.ts`. Control: `replyRadar` found its importer, `replySync.ts`.

| Stage | State | Evidence |
|---|---|---|
| Collect | BUILT | Manual `p/[slug]/actions.ts:41`; CSV `:62`; Google Places `leadCollector.ts:28-34`; event search through Google Custom Search `:65-70`; dedup `leads.ts:80-111` |
| Enrich | BUILT, NOT WIRED | `src/lib/enrich/enrichmentEngine.ts` has a fetcher (`:95-98`) and a check file, but nothing in `src/` imports it |
| Audit | BUILT | `src/lib/audit/runAudit.ts:19-56`; `auditEngine.ts:168-196` |
| Grade | BUILT | `runAudit.ts:58-63` calls `gradeLead`. The suppressed penalty exists (`gradingEngine.ts:96-98`), but nothing ever sets suppressed |
| Draft | BUILT | `src/lib/outreach/draftEngine.ts:16-124`. It falls back to a template on any provider error (`:77-82`). Which hosted model it calls is UNVERIFIED (`modelProvider.ts` read denied). `OPENAI_API_KEY` from `.env.example` has 0 references in `src/` |
| Approve | BUILT | `p/[slug]/actions.ts:131-146`, gated on compliance; auto-approve `leadTrail.ts:79-85` (see F2) |
| Send | PARTIAL | Gmail draft or controlled send with a daily cap: `sendRunner.ts:32-136`. Missing: suppression (F3), send window (`schema.prisma:98`, 0 uses in `src/`), business-days-only (`schema.prisma:99`, 0 uses), campaign cap, campaign-active check. Control: `dailySendCap` has 2 uses. `DEFAULT_SEND_CAP` from `.env.example` has 0 uses; the cap falls back to a hardcoded 25 (`sendRunner.ts:66`) |
| Reply Radar | BUILT | `src/lib/outreach/replySync.ts:11-68`; stop classes cancel follow-ups `:51-56` |
| Follow Up | PARTIAL | Scheduled 3 and 7 days out (`sendRunner.ts:140-157`), run through the same guard (`followupRunner.ts:16-59`). See F12 |
| Archive | PARTIAL | A read-only archive view that groups leads by status (`p/[slug]/archive/page.tsx:18-24,61-70`). In the trail, "Archive" is only the last stage label (`leadTrail.ts:119`) |
| Opportunity scoring | BUILT, NOT WIRED | `src/lib/opportunity/opportunityEngine.ts` has no importer in `src/` |

Overall: the core loop (collect, audit, grade, draft, approve, send, track replies) works end to
end. The safety promises in the README are ahead of the send path.

## ZAO fit

| Question | Answer | Reason |
|---|---|---|
| (a) Does the ZAOstock sponsor CRM need match this shape? | **No** | That need (`events/2326-zaostock-sponsor-leads-tiers`) was cold, warm and hot relationship tiers plus discount authority, worked by teammates, with a CRM table that already exists. papertrailOS is built for scraping local businesses, auditing their websites and sending cold email. The overlap is only CRM statuses and reply tracking, and ZAOstock 2026 took place on 3 Oct 2026. |
| (b) Would The ZAO run it? | **No, not now** | There is no licence, so there is no copy and no fork. The only route is a hosted instance that Papi Oshu runs for ZAO, and only after F1 and F3 are fixed. Sending from a ZAO mailbox is outbound, so it is Zaal-gated. The current priority is to finish open work, not start new projects. |
| (c) What would Zaal tell Papi Oshu? | **Three findings** | See below. |

### For Papi Oshu (through Zaal)

1. **Remove or env-gate the dev login in `src/auth.ts:20-31` before anyone deploys it.** The repo
   is public, so the fixed pair works as a super-admin key on any instance. Your comment
   already says this; it is the one fix that matters most.
2. **Check the lead's status at send time, not only for follow-ups.** `sendRunner.ts:64` hardcodes
   suppression to `false`, and `dispatchDraft` never reads `lead.status`. So a lead marked
   Do Not Contact still gets the first email if a draft was approved. Reusing `STOP_STATUSES`
   from `followupRunner.ts:6-9` inside `dispatchDraft` would close it.
3. **Make the auto-approve flag need `approve_send`.** `runLeadTrailAction`
   (`p/[slug]/actions.ts:156-180`) only checks `run_leadgen`, so a member can tick the box and
   approve every draft. Your role design is otherwise clean, and the pure `evaluateSend` guard
   with its check file is a really nice pattern.

## Next Actions

| # | Action | Owner | By |
|---|---|---|---|
| 1 | Read this doc and decide whether to pass the three findings to Papi Oshu (his ask; Zaal sends, never a lane) | Zaal | 2026-11-09 |
| 2 | If he wants a hosted instance for ZAO later, re-audit at his new head and confirm F1 and F3 are fixed first | papertrail-audit lane, on Zaal's ask | when asked |
| 3 | Run the three BLOCKED reads (`modelProvider.ts`, `prisma/seed.ts`, `.env` in history) from a session where they are allowed, and update the UNVERIFIED lines | any lane, on Zaal's ask | when asked |

## Backlog

- A one-page "send safety checklist" for any ZAO outbound tool: suppression at send time,
  OAuth state nonce, encrypted tokens, role-gated auto-approve. Taken from this audit. Not built.

## Sources

| Source | Method | Status |
|---|---|---|
| github.com/papioshu/papertrailOS at `1c0d837` | `git clone --depth 50` into a scratch directory (full 17-commit history); files read with `cat`/`sed`/`grep`; nothing executed | [FULL] for the files listed in "What was read" |
| `src/lib/providers/modelProvider.ts`, `prisma/seed.ts`, the `.env` history check | read attempted, denied by this session's permission layer | [FAILED] |
| Repo metadata (owner, licence, stars, created date, push date) | seat's `gh api` on 2026-11-02, quoted from the lane brief, not re-fetched | [PARTIAL] |
| `research/events/2326-zaostock-sponsor-leads-tiers/README.md` | `git show origin/main:` at `9d44b5cd8`, lines 1-60 | [PARTIAL] |
| `research/infrastructure/413-zaostock-dashboard-notion-replacement/README.md` | `git show origin/main:` at `9d44b5cd8`, grep for sponsor lines | [PARTIAL] |
| `agents/1235-cowork-lead-reengagement-skill`, `agents/973-hyperagent-hosted-offload-decision` | paths resolved with `zao-research-health --resolve` (both numbers are shared by two docs); listed as related, contents not read, nothing claimed from them | [PARTIAL] |
