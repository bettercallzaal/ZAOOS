---
topic: events
type: guide
status: research-complete
last-validated: 2026-05-23
related-docs: "712, 713, 714, 715"
original-query: "all this - recap of the 2026-05-23 session: cowork tracker operational pack, brand filters, bot roster -> Supabase, ping-on-assign, /ping command, /meeting -> Supabase, NL-extractor bug fix, ZOE-as-agent-builder seed"
tier: QUICK
---

# 726 - Session recap: cowork tracker operational pack (2026-05-23)

> **Goal:** Record the 2026-05-23 work session - the cowork tracker went from a working-but-shallow tool to a full operational system. Seven PRs landed, the original 2026-05-23 sync bug was closed at the root, and the auto-test-task pattern was locked in as standing behavior.

Direct follow-on to [doc 715](../715-session-2026-05-22-meeting-skill-diarization/) (yesterday's session recap - meeting skill upgrade + Tyler capture).

## Key Outcomes

| # | Outcome | Where | State |
|---|---------|-------|-------|
| 1 | Brand tags - multi-brand schema, filter chip, bot hashtags | ZAOcowork PR #4 | merged |
| 2 | Cross-source visibility - read all tasks, write by UUID | ZAOcowork PR #5 | merged |
| 3 | Ping-on-assign - DM the new owner on Telegram | ZAOcowork PR #6 | merged |
| 4 | Bot prefers Supabase team_members for tg_id -> owner | ZAOcowork PR #7 | merged |
| 5 | Multi-select brand filter pills + filter persistence | ZAOcowork PR #8 | merged |
| 6 | `/ping <name> [#id] [msg]` - DM teammate via bot | ZAOcowork PR #9 | open |
| 7 | NL add carries due/priority/notes; strip stray code fences | ZAOcowork PR #10 | open |
| 8 | `/meeting` -> Supabase tracker (doc 713 step 1) | ZAOOS PR #638 | open |

## What shipped

### Brand-filter operational pack (PRs #4, #5, #8)

The tracker only knew 2 "projects" (`zaodevz`, `wavewarz`) and `category` was internal task-type, not brand. Added a first-class `brands text[]` column with a GIN index, a 20-brand canonical vocab (`brands.ts` in both web + bot, kept in sync), and a multi-select toggle-pill row that shows only brands actually in use. Backfilled from `metadata.brand` so the 9 Tyler-meeting tasks immediately carried `ZAOstock` / `ZABAL Games`. Bot `/add #zaostock book the parklet` parses the hashtag and tags the brand at capture. Filter state persists per-user via localStorage so the board picks up where you left off.

Cross-source visibility (PR #5) closed the gap where meeting-captured and bug-fix tasks lived in Supabase but were hidden by `legacy_source = 'cowork-actions.json'` filters. The fix piped the row UUID through as `ActionItem.dbId` and switched update/delete to target by UUID instead of `legacy_source + legacy_id`. Result: the board grew from ~213 to ~226 visible tasks and every task is editable from the web regardless of source.

### The sync-bug root-cause arc (PRs #6, #7, #9, #10)

Iman reported tasks not syncing. First diagnosis (team.json migration to the new repo) was a real architectural fix but wasn't the actual cause. Second diagnosis traced the real problem: the bot resolved `ctx.from.id -> Owner` via GitHub `data/team.json` only, and when that lookup failed silently the bot wrote `owner_id = NULL`, which then vanished from Iman's mine-only mine-only view, which looked like sync was broken, which made him re-add - which generated the duplicate `$70 food money` task we cleaned up.

The fix was a stack:
- **PR #7** added `team_members.telegram_id` (schema + Iman + Zaal seeded) and a `tgIdToOwnerSupabase` lookup the bot hits before falling back to GitHub team.json.
- **PR #6** added `pingOwnerAssigned` to the web's `patchField` / `createItem` / `quickCreate` / `updateItem` so every web-driven assignment DMs the new owner from `@ZAOcoworkingBot` (best-effort, silent skip without `TELEGRAM_BOT_TOKEN`).
- **PR #9** added `/ping <name> [#id] [msg]` - Iman or Zaal can flag urgent attention from inside the bot. Resolves target via Supabase (PR #7's column) first, GitHub fallback, declines on `Both` / `Open` sentinels.
- **PR #10** closed the related NL-extractor bug: when the user said "add task with these properties," the LLM mis-routed Due / Priority / Notes onto a random existing task id (#43 Onboard Candy) because the `add` op schema only allowed `title / owner / category`. The fix extended `NewActionInput` + `makeActionItem` + `cmdAdd` to accept full metadata, taught the LLM via memory.ts examples, and added a `stripCodeFences()` pass for ugly ``` blocks leaking into Telegram replies.

### `/meeting` -> Supabase (PR #638, open)

doc 713 step 1. Replaced the `/meeting` skill's `gh api PUT` to the dead `cowork-zaodevz/data/actions.json` with a Supabase REST POST so every future meeting auto-writes onto the live board. Reads `team_members` to resolve owner names to UUIDs, tags `legacy_source = meeting:<slug>-<date>` so every meeting is traceable + revertable. Needs `~/.zao/cowork-tracker.env` on the runner.

### Standing pattern locked: auto-PR-test-task

After PR #4 shipped, Zaal asked for two things on every future PR: a test-plan PR comment + a Supabase tracker task for the right tester. Captured as `feedback_pr_auto_test_task.md` memory. From PR #5 onward every PR I shipped this session posted a structured test comment AND inserted a task in the cowork tracker (`legacy_source = pr-test:<repo>#<N>`). The session generated `test-pr-4` through `test-pr-10` + `test-pr-638` - 8 verification tasks queued for Iman + Zaal.

### Restored data after the NL-editor bug

Re-mapped the Fractal-promo metadata onto its rightful task #220 (P1, due 2026-05-24, full notes) and reset #43 "Onboard Candy" to P2 with no due / no notes after the bot's misroute. No data loss.

## Open Items

- **Bot restart on Iman's VPS** is required for PR #7, #9, #10 to take effect (process memory holds the system prompt + the new commands).
- **Vercel env var `TELEGRAM_BOT_TOKEN`** on za-ocowork is required for PR #6 pings to actually fire. Without it the writes still work; the DM step skips silently.
- **`~/.zao/cowork-tracker.env`** (chmod 600) on Zaal's mac is required for PR #638 (`/meeting` -> Supabase). Without it the script hard-fails with a clear message.
- **PR #638, #9, #10** still open. Merge order does not matter (no overlap).
- **Named saved views** for the brand filter - deferred from PR #8, tracked as `followup-saved-views` in Supabase, P3.
- **Roster allowlist + admin + chats migration to Supabase** - the deeper roster move still pending; PR #7 only moved tg_id -> owner. Tracked as a follow-up.
- **ZOE-as-agent-builder spec** - Zaal raised this mid-session; conflicts with the Hermes-canonical lock (project_hermes_canonical, 2026-05-05). Deferred to its own session via a self-contained seed in `/tmp/clipboard.html` - 8 open questions to grill, hard constraint surfaced. No code touched.

## Also See

- [Doc 712](../../business/712-zao-crm-coworking-app/) - ZAO CRM research (the original "make the tracker more operational" thread)
- [Doc 713](../../dev-workflows/713-zao-ops-meeting-tracker-crm-bonfire/) - combined meeting/tracker/CRM/Bonfire system (PR #638 was step 1)
- [Doc 714](../714-tyler-zabal-zaostock-may22/) - Tyler meeting, the trigger for the cross-source visibility fix (his 9 todos were the invisible ones)
- [Doc 715](../715-session-2026-05-22-meeting-skill-diarization/) - yesterday's session recap

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Set `TELEGRAM_BOT_TOKEN` on Vercel za-ocowork | @Zaal | Manual | Before testing PR #6 |
| Create `~/.zao/cowork-tracker.env` with Supabase keys | @Zaal | Manual | Before testing PR #638 |
| Restart bot on VPS | @Iman | Manual | After #7, #9, #10 merge |
| Walk Iman through the 7 test plans (PR #4-#10 + #638) | @Iman | Test | This week |
| Complete the deeper roster migration (allowlist + admin + chats to Supabase) | @Zaal | Build | Follow-up |
| Build named saved views for the brand filter | @Zaal | Build | Polish backlog |
| ZOE agent-builder spec - new session, no code | @Zaal | Research doc | When ready |

## Sources

- [ZAOcowork PR #4 - brand tags](https://github.com/ZAODEVZ/ZAOcowork/pull/4) [FULL - merged]
- [ZAOcowork PR #5 - cross-source visibility](https://github.com/ZAODEVZ/ZAOcowork/pull/5) [FULL - merged]
- [ZAOcowork PR #6 - ping-on-assign](https://github.com/ZAODEVZ/ZAOcowork/pull/6) [FULL - merged]
- [ZAOcowork PR #7 - bot roster to Supabase](https://github.com/ZAODEVZ/ZAOcowork/pull/7) [FULL - merged]
- [ZAOcowork PR #8 - multi-select brand pills](https://github.com/ZAODEVZ/ZAOcowork/pull/8) [FULL - merged]
- [ZAOcowork PR #9 - /ping command](https://github.com/ZAODEVZ/ZAOcowork/pull/9) [FULL - open]
- [ZAOcowork PR #10 - NL add fix + code-fence strip](https://github.com/ZAODEVZ/ZAOcowork/pull/10) [FULL - open]
- [ZAOOS PR #638 - /meeting -> Supabase](https://github.com/bettercallzaal/ZAOOS/pull/638) [FULL - open]
